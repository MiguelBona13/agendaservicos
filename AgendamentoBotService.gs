/**
 * Entidade: AgendamentoBot
 * Camada: Service — Serviço
 *
 * Responsabilidade:
 * Fornecer os dados públicos do bot, identificar o cliente pelo celular e
 * coordenar a interpretação das respostas e a confirmação de um agendamento
 * pelo fluxo oficial.
 *
 * Dependências principais:
 * - AgendamentoBotRepository.gs, Rules.gs e Validator.gs;
 * - AgendamentoBotGroqRepository.gs, para interpretar texto livre;
 * - AgendamentoService.gs, para criar o agendamento confirmado.
 */

/** @return {{servicos:Array<Object>,profissionais:Array<Object>}} Opções do bot. */
function agendamentoBotServiceInicializar() {
  const opcoes = agendamentoBotRepositoryListarOpcoes();
  return {
    servicos: opcoes.servicos,
    profissionais: opcoes.profissionais
  };
}

/**
 * Localiza o cliente pelo celular já registrado, sem devolver outros clientes.
 *
 * @param {string} telefone Celular informado pelo cliente.
 * @return {{codigo:string,nome:string}} Cadastro correspondente.
 * @throws {Error} Quando não há exatamente um cadastro correspondente.
 */
function agendamentoBotServiceIdentificarCliente(telefone) {
  const celular = agendamentoBotValidatorNormalizarTelefone(telefone);
  const cliente = agendamentoBotRepositoryBuscarClientePorTelefone(celular);
  if (!cliente) {
    throw new Error("Não encontrei um cadastro único para esse celular. Confira o número ou fale com a equipe para atualizar seu cadastro.");
  }
  return { codigo: cliente.codigo, nome: cliente.nome };
}

/**
 * Lista períodos ativos sem conflito para cliente, profissional e data.
 *
 * @param {string} data Data no formato yyyy-MM-dd recebido do campo de data.
 * @param {string} codigoCliente Código do cliente identificado no servidor.
 * @param {string} codigoFuncionario Código do profissional selecionado.
 * @return {Array<Object>} Horários disponíveis.
 */
function agendamentoBotServiceListarHorarios(data, codigoCliente, codigoFuncionario) {
  const dataValidada = agendamentoBotValidatorValidarData(data);
  const dados = agendamentoBotRepositoryObterDadosDisponibilidade();
  return agendamentoBotRulesListarHorariosDisponiveis(
    dataValidada,
    String(codigoCliente || "").trim(),
    String(codigoFuncionario || "").trim(),
    dados.periodos,
    dados.agendamentos
  );
}

/**
 * Interpreta a resposta livre de uma etapa sem delegar regras de agendamento à IA.
 * As listas vêm do Repository e horários são consultados novamente no servidor.
 *
 * @param {Object} entrada Etapa, texto e identificadores necessários à consulta.
 * @return {Object} Serviço, profissional, data ou período correspondente.
 * @throws {Error} Quando o texto for ambíguo, inválido ou não corresponder.
 */
function agendamentoBotServiceInterpretarEntrada(entrada) {
  const pedido = entrada || {};
  const etapa = String(pedido.etapa || "");
  const texto = String(pedido.texto || "").trim();
  if (!texto) throw new Error("Digite sua resposta para continuar.");

  let opcoes = [];
  let instrucao = "";
  let horarios = [];
  let registros = [];

  if (etapa === "service" || etapa === "professional") {
    const catalogos = agendamentoBotRepositoryListarOpcoes();
    registros = etapa === "service" ? catalogos.servicos : catalogos.profissionais;
    instrucao = etapa === "service"
      ? "Identifique o serviço que a pessoa escolheu."
      : "Identifique o profissional que a pessoa escolheu.";
    opcoes = registros.map(item => item.nome);
  } else if (etapa === "date") {
    instrucao = "Converta a data pedida para yyyy-MM-dd. Resolva expressões como hoje, amanhã e próxima segunda-feira usando a data de referência. Não invente datas; se estiver ambígua, retorne vazio.";
  } else if (etapa === "period") {
    const data = agendamentoBotValidatorValidarData(pedido.data);
    horarios = agendamentoBotServiceListarHorarios(
      data,
      pedido.codigoCliente,
      pedido.codigoFuncionario
    );
    opcoes = horarios.map(item => item.descricao);
    if (!opcoes.length) throw new Error("Não há horários livres para essa data. Escolha outra data.");
    instrucao = "Identifique qual horário disponível a pessoa escolheu. Considere formatos como 9h e 09:00 equivalentes.";
  } else {
    throw new Error("Esta etapa não aceita interpretação de texto livre.");
  }

  const valor = agendamentoBotGroqRepositoryInterpretarEntrada({
    etapa: etapa,
    texto: texto,
    opcoes: opcoes,
    instrucao: instrucao,
    dataReferencia: Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    )
  });

  if (etapa === "date") {
    return { etapa: etapa, valor: agendamentoBotValidatorValidarData(valor) };
  }

  const indice = Number(valor) - 1;
  if (!Number.isInteger(indice) || indice < 0 || indice >= opcoes.length) {
    throw new Error("Não consegui identificar uma opção única. Escolha um item da lista.");
  }

  if (etapa === "period") {
    return { etapa: etapa, item: horarios[indice] };
  }

  return { etapa: etapa, item: registros[indice] };
}

/**
 * Confirma a escolha, identifica novamente o cliente e delega a gravação ao
 * fluxo padrão, que repete validações e verifica conflitos sob bloqueio.
 *
 * @param {Object} pedido Dados selecionados na interface.
 * @return {{sucesso:boolean,mensagem:string,codigo:string}} Resultado final.
 */
function agendamentoBotServiceConfirmar(pedido) {
  const dados = pedido || {};
  const cliente = agendamentoBotServiceIdentificarCliente(dados.telefone);
  if (cliente.codigo !== String(dados.codigoCliente || "").trim()) {
    throw new Error("O cadastro do cliente mudou. Atualize a página e tente novamente.");
  }

  const horarios = agendamentoBotServiceListarHorarios(
    dados.data,
    cliente.codigo,
    dados.codigoFuncionario
  );
  const periodo = horarios.find(item =>
    item.codigo === String(dados.codigoPeriodo || "").trim()
  );
  if (!periodo) {
    throw new Error("Esse horário não está mais disponível. Consulte os horários novamente.");
  }

  const codigo = gerarCodigoAgendamento();
  const resultado = criarAgendamento(
    codigo,
    dados.data,
    periodo.codigo,
    dados.codigoFuncionario,
    cliente.codigo,
    dados.codigoServico
  );
  return { sucesso: resultado.sucesso, mensagem: resultado.mensagem, codigo: codigo };
}

