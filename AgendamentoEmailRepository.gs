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
 * - Utilities e Session, para formatar a data usada na pesquisa do Gmail.
 */

const AGENDAMENTO_EMAIL_PROPRIEDADES = {
  DATA_INICIAL: "AGENDAMENTO_EMAIL_DATA_INICIAL",
  PROCESSADO_PREFIXO: "AGENDAMENTO_EMAIL_PROCESSADO_"
};

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

        if (propriedades.getProperty(chaveProcessamento)) {
          return;
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

    if (propriedades.getProperty(chave)) {
      return false;
    }

    propriedades.setProperty(chave, "PROCESSANDO");
    return true;
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
