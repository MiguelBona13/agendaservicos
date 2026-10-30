/**
 * Entidade: Agendamento
 * Camada: Repository — Repositório de E-mails
 *
 * Responsabilidade:
 * Consultar mensagens recebidas no Gmail e manter o controle técnico de
 * inicialização e processamento, sem aplicar regras de negócio do agendamento.
 *
 * Dependências principais:
 * - GmailApp, para pesquisar e ler mensagens;
 * - PropertiesService, para persistir a data inicial e os IDs processados;
 * - Utilities e Session, para formatar a data e identificar a conta executora.
 */

const AGENDAMENTO_EMAIL_PROPRIEDADES = {
  DATA_INICIAL: "AGENDAMENTO_EMAIL_DATA_INICIAL",
  PROCESSADO_PREFIXO: "AGENDAMENTO_EMAIL_PROCESSADO_",
  RESERVA_EXPIRACAO_MS: 35 * 60 * 1000
};


/**
 * Obtém o endereço da conta que efetivamente executa o projeto Apps Script.
 * Em uma implantação configurada para executar como o proprietário, retorna
 * o endereço dessa conta. Um resultado vazio deve bloquear a importação.
 *
 * @return {string} Endereço de e-mail da conta executora, ou texto vazio.
 */
function agendamentoEmailRepositoryObterEmailContaExecutora() {
  return String(Session.getEffectiveUser().getEmail() || "").trim().toLowerCase();
}

/**
 * Registra uma única vez o início do monitoramento de novos e-mails.
 * A função não altera o marco inicial quando já existe uma configuração.
 *
 * @return {{inicializado:boolean, dataInicial:number}} Situação do monitoramento.
 */
function agendamentoEmailRepositoryInicializarMonitoramento() {
  const propriedades = PropertiesService.getScriptProperties();
  const dataExistente = propriedades.getProperty(
    AGENDAMENTO_EMAIL_PROPRIEDADES.DATA_INICIAL
  );

  if (dataExistente) {
    return {
      inicializado: false,
      dataInicial: Number(dataExistente)
    };
  }

  const dataInicial = Date.now();
  propriedades.setProperty(
    AGENDAMENTO_EMAIL_PROPRIEDADES.DATA_INICIAL,
    String(dataInicial)
  );

  return {
    inicializado: true,
    dataInicial: dataInicial
  };
}

/**
 * Retorna o marco inicial do monitoramento, ou null se ainda não foi configurado.
 *
 * @return {?number} Data inicial em milissegundos desde 01/01/1970.
 */
function agendamentoEmailRepositoryObterDataInicial() {
  const valor = PropertiesService.getScriptProperties().getProperty(
    AGENDAMENTO_EMAIL_PROPRIEDADES.DATA_INICIAL
  );

  if (!valor) {
    return null;
  }

  const dataInicial = Number(valor);
  return Number.isFinite(dataInicial) && dataInicial > 0
    ? dataInicial
    : null;
}

/**
 * Pesquisa mensagens novas da caixa de entrada com assunto AGENDAMENTO.
 * A data do Gmail é conferida novamente em milissegundos para não incluir
 * mensagens antigas do mesmo dia do marco inicial.
 *
 * @param {number=} limiteMaximo Quantidade máxima de mensagens retornadas.
 * @return {Array<Object>} Mensagens ainda não processadas com seus dados básicos.
 * @throws {Error} Quando o monitoramento ainda não foi inicializado.
 */
function agendamentoEmailRepositoryListarMensagensNovas(limiteMaximo) {
  const dataInicial = agendamentoEmailRepositoryObterDataInicial();

  if (!dataInicial) {
    throw new Error(
      "O monitoramento de e-mails ainda não foi inicializado."
    );
  }

  const limite = Number.isInteger(limiteMaximo) && limiteMaximo > 0
    ? limiteMaximo
    : 100;
  const dataPesquisa = Utilities.formatDate(
    new Date(dataInicial),
    Session.getScriptTimeZone(),
    "yyyy/MM/dd"
  );
  const consulta = `in:inbox subject:AGENDAMENTO after:${dataPesquisa}`;
  const mensagensEncontradas = [];
  const propriedades = PropertiesService.getScriptProperties();
  const tamanhoPagina = 100;
  let deslocamento = 0;

  while (mensagensEncontradas.length < limite) {
    const threads = GmailApp.search(consulta, deslocamento, tamanhoPagina);

    if (!threads.length) {
      break;
    }

    threads.forEach(thread => {
      thread.getMessages().forEach(mensagem => {
        const assunto = String(mensagem.getSubject() || "").trim();
        const dataRecebimento = mensagem.getDate();
        const id = String(mensagem.getId() || "").trim();
        const estaNaCaixaEntrada = mensagem.isInInbox();

        if (
          !id ||
          !estaNaCaixaEntrada ||
          !assunto.toUpperCase().includes("AGENDAMENTO") ||
          !(dataRecebimento instanceof Date) ||
          dataRecebimento.getTime() <= dataInicial
        ) {
          return;
        }

        const chaveProcessamento =
          AGENDAMENTO_EMAIL_PROPRIEDADES.PROCESSADO_PREFIXO + id;

        const registroProcessamento = propriedades.getProperty(chaveProcessamento);

        if (registroProcessamento) {
          // Registros concluídos e reservas ainda válidas não precisam voltar
          // ao Service. Somente reservas novas já expiradas podem ser retomadas.
          if (!String(registroProcessamento).startsWith("PROCESSANDO:")) {
            return;
          }

          const partesReserva = String(registroProcessamento).split(":");
          const dataReserva = Number(partesReserva[1]);
          const reservaExpirada =
            Number.isFinite(dataReserva) &&
            dataReserva > 0 &&
            Date.now() - dataReserva >
              AGENDAMENTO_EMAIL_PROPRIEDADES.RESERVA_EXPIRACAO_MS;

          if (!reservaExpirada) {
            return;
          }
        }

        mensagensEncontradas.push({
          id: id,
          assunto: assunto,
          dataRecebimento: dataRecebimento,
          remetente: String(mensagem.getFrom() || ""),
          corpo: String(mensagem.getPlainBody() || "")
        });
      });
    });

    deslocamento += threads.length;

    if (threads.length < tamanhoPagina) {
      break;
    }
  }

  return mensagensEncontradas.slice(0, limite);
}

/**
 * Registra que uma mensagem foi convertida com sucesso em agendamento.
 * Mensagens com falha não devem ser registradas, permitindo nova tentativa.
 *
 * @param {string} idMensagem Identificador único da mensagem no Gmail.
 * @param {string} codigoAgendamento Código do agendamento criado.
 * @return {void}
 * @throws {Error} Quando os identificadores obrigatórios não forem informados.
 */
function agendamentoEmailRepositoryRegistrarProcessamento(
  idMensagem,
  codigoAgendamento
) {
  const id = String(idMensagem || "").trim();
  const codigo = String(codigoAgendamento || "").trim();

  if (!id || !codigo) {
    throw new Error(
      "O ID da mensagem e o código do agendamento são obrigatórios."
    );
  }

  PropertiesService.getScriptProperties().setProperty(
    AGENDAMENTO_EMAIL_PROPRIEDADES.PROCESSADO_PREFIXO + id,
    codigo
  );
}


/**
 * Reserva uma mensagem para impedir que duas execuções a processem ao mesmo tempo.
 *
 * @param {string} idMensagem Identificador único da mensagem.
 * @return {boolean} Verdadeiro quando a reserva foi obtida.
 */
function agendamentoEmailRepositoryReservarProcessamento(idMensagem) {
  const id = String(idMensagem || "").trim();

  if (!id) {
    throw new Error("O ID da mensagem é obrigatório.");
  }

  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(10000);

  try {
    const propriedades = PropertiesService.getScriptProperties();
    const chave = AGENDAMENTO_EMAIL_PROPRIEDADES.PROCESSADO_PREFIXO + id;
    const valorAtual = propriedades.getProperty(chave);

    if (!valorAtual) {
      propriedades.setProperty(chave, "PROCESSANDO:" + Date.now());
      return true;
    }

    // Valores sem o formato novo são estados antigos ou registros concluídos.
    // Eles não são recuperados automaticamente, pois não guardam o código
    // previamente reservado e a recuperação poderia duplicar um agendamento.
    if (!String(valorAtual).startsWith("PROCESSANDO:")) {
      return false;
    }

    const partes = String(valorAtual).split(":");
    const dataReserva = Number(partes[1]);

    if (!Number.isFinite(dataReserva) || dataReserva <= 0) {
      return false;
    }

    const reservaExpirada =
      Date.now() - dataReserva > AGENDAMENTO_EMAIL_PROPRIEDADES.RESERVA_EXPIRACAO_MS;

    if (!reservaExpirada) {
      return false;
    }

    let dadosAgendamentoReserva = null;

    try {
      const jsonReserva = partes.slice(2).join(":").trim();
      dadosAgendamentoReserva = jsonReserva ? JSON.parse(jsonReserva) : null;
    } catch (erroLeituraReserva) {
      dadosAgendamentoReserva = null;
    }

    // O código sozinho não é suficiente: a conferência também compara os
    // dados do agendamento para evitar confundir uma colisão com outra criação.
    const agendamentoExistente = dadosAgendamentoReserva &&
      dadosAgendamentoReserva.codigo
      ? agendamentoRepositoryBuscarPorCodigo(dadosAgendamentoReserva.codigo)
      : null;

    const reservaCorrespondeAoAgendamento = Boolean(
      agendamentoExistente &&
      String(agendamentoExistente.data) === String(dadosAgendamentoReserva.data) &&
      String(agendamentoExistente.codigoPeriodo) === String(dadosAgendamentoReserva.codigoPeriodo) &&
      String(agendamentoExistente.codigoFuncionario) === String(dadosAgendamentoReserva.codigoFuncionario) &&
      String(agendamentoExistente.codigoCliente) === String(dadosAgendamentoReserva.codigoCliente) &&
      String(agendamentoExistente.codigoServico) === String(dadosAgendamentoReserva.codigoServico)
    );

    if (reservaCorrespondeAoAgendamento) {
      propriedades.setProperty(chave, String(dadosAgendamentoReserva.codigo));
      return false;
    }

    // Sem código reservado ou sem registro correspondente na AGENDA,
    // a criação ainda não foi concluída e a mensagem pode ser retomada.
    propriedades.setProperty(chave, "PROCESSANDO:" + Date.now());
    return true;
  } finally {
    bloqueio.releaseLock();
  }
}

/**
 * Associa o código gerado à reserva antes de iniciar a gravação do agendamento.
 * Esse vínculo permite recuperar a execução com segurança após uma interrupção.
 *
 * @param {string} idMensagem Identificador único da mensagem.
 * @param {string} codigoAgendamento Código que será usado na aba AGENDA.
 * @return {void}
 * @throws {Error} Quando a reserva não existir ou não estiver no estado esperado.
 */
function agendamentoEmailRepositoryAtualizarReservaProcessamento(
  idMensagem,
  dadosAgendamento
) {
  const id = String(idMensagem || "").trim();
  const dados = dadosAgendamento || {};
  const codigo = String(dados.codigo || "").trim();

  if (
    !id ||
    !codigo ||
    !String(dados.data || "").trim() ||
    !String(dados.codigoPeriodo || "").trim() ||
    !String(dados.codigoFuncionario || "").trim() ||
    !String(dados.codigoCliente || "").trim() ||
    !String(dados.codigoServico || "").trim()
  ) {
    throw new Error("O ID da mensagem e todos os dados do agendamento são obrigatórios.");
  }

  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(10000);

  try {
    const propriedades = PropertiesService.getScriptProperties();
    const chave = AGENDAMENTO_EMAIL_PROPRIEDADES.PROCESSADO_PREFIXO + id;
    const valorAtual = String(propriedades.getProperty(chave) || "");

    if (!valorAtual.startsWith("PROCESSANDO:")) {
      throw new Error("A reserva da mensagem não está ativa.");
    }

    const partes = valorAtual.split(":");
    const dataReserva = Number(partes[1]);

    if (!Number.isFinite(dataReserva) || dataReserva <= 0) {
      throw new Error("A data da reserva da mensagem é inválida.");
    }

    propriedades.setProperty(
      chave,
      "PROCESSANDO:" + dataReserva + ":" + JSON.stringify({
        codigo: codigo,
        data: String(dados.data),
        codigoPeriodo: String(dados.codigoPeriodo),
        codigoFuncionario: String(dados.codigoFuncionario),
        codigoCliente: String(dados.codigoCliente),
        codigoServico: String(dados.codigoServico)
      })
    );
  } finally {
    bloqueio.releaseLock();
  }
}

/**
 * Libera a reserva de uma mensagem que não gerou agendamento.
 * Isso permite corrigir o e-mail e tentar processá-lo novamente.
 *
 * @param {string} idMensagem Identificador único da mensagem.
 * @return {void}
 */
function agendamentoEmailRepositoryLiberarProcessamento(idMensagem) {
  const id = String(idMensagem || "").trim();

  if (!id) {
    return;
  }

  PropertiesService.getScriptProperties().deleteProperty(
    AGENDAMENTO_EMAIL_PROPRIEDADES.PROCESSADO_PREFIXO + id
  );
}
