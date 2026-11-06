/**
 * Entidade: Agendamento via WhatsApp
 * Camada: Service — Camada de Serviço
 *
 * Responsabilidade:
 * Coordenar o diálogo de agendamento, consultar opções e chamar o fluxo oficial
 * de criação de agendamentos depois da confirmação explícita do cliente.
 *
 * Dependências principais:
 * - AgendamentoWhatsAppRepository.gs, Rules.gs, Validator.gs e GroqRepository.gs;
 * - AgendamentoRepository.gs e AgendamentoRules.gs;
 * - consultarPeriodos(), de Consultas.js;
 * - criarAgendamento(), de AgendamentoService.gs;
 * - gerarCodigoAgendamento(), de Agenda.js.
 */

/**
 * Processa uma mensagem recebida de um telefone já identificado.
 *
 * @param {string} remetente Campo From recebido do Twilio.
 * @param {string} corpo Texto recebido do WhatsApp.
 * @return {string} Resposta do bot a ser convertida em TwiML pelo Webhook.
 */
function agendamentoWhatsAppServiceProcessarMensagem(remetente, corpo) {
  const telefone = agendamentoWhatsAppValidatorNormalizarTelefone(remetente);
  const cliente = agendamentoWhatsAppRepositoryBuscarClientePorTelefone(telefone);
  if (!cliente) {
    return "Olá! Para agendar pelo WhatsApp, seu número precisa estar cadastrado na Agenda de Serviços. Entre em contato com a equipe para atualizar seu cadastro.";
  }

  const texto = String(corpo || "").trim();
  const comando = texto.toLowerCase();
  let conversa = agendamentoWhatsAppRepositoryObterConversa(telefone);

  if (["sair", "cancelar", "cancelar conversa"].includes(comando)) {
    agendamentoWhatsAppRepositoryLimparConversa(telefone);
    return "Tudo bem, cancelei esta conversa. Quando quiser começar novamente, envie *agendar*.";
  }

  if (comando === "0") {
    conversa = agendamentoWhatsAppRulesCriarConversa(cliente);
    agendamentoWhatsAppRepositorySalvarConversa(telefone, conversa);
    return agendamentoWhatsAppServiceMontarMenuServicos(cliente.nome);
  }

  const comandosInicio = ["oi", "olá", "ola", "menu", "agendar", "bom dia", "boa tarde", "boa noite"];
  const iniciarConversa = !conversa || comandosInicio.includes(comando);
  if (iniciarConversa) {
    conversa = agendamentoWhatsAppRulesCriarConversa(cliente);
    agendamentoWhatsAppRepositorySalvarConversa(telefone, conversa);
    // Se a primeira mensagem já contém um pedido, ela também pode responder
    // à primeira etapa. Saudações e comandos continuam exibindo o menu.
    if (comandosInicio.includes(comando)) {
      return agendamentoWhatsAppServiceMontarMenuServicos(cliente.nome);
    }
  }

  try {
    const entrada = agendamentoWhatsAppServiceInterpretarEntrada(conversa, texto);
    switch (conversa.etapa) {
      case "servico":
        return agendamentoWhatsAppServiceSelecionarServico(telefone, conversa, entrada);
      case "profissional":
        return agendamentoWhatsAppServiceSelecionarProfissional(telefone, conversa, entrada);
      case "data":
        return agendamentoWhatsAppServiceSelecionarData(telefone, conversa, entrada);
      case "periodo":
        return agendamentoWhatsAppServiceSelecionarPeriodo(telefone, conversa, entrada);
      case "confirmacao":
        return agendamentoWhatsAppServiceConfirmar(telefone, conversa, texto);
      default:
        agendamentoWhatsAppRepositoryLimparConversa(telefone);
        return "A conversa foi reiniciada porque estava incompleta. Envie *agendar* para começar.";
    }
  } catch (erro) {
    return (erro && erro.message ? erro.message : String(erro)) +
      "\n\nEnvie *0* para voltar ao início ou *cancelar* para encerrar.";
  }
}

/**
 * Interpreta texto livre somente para a etapa atual da conversa.
 * Respostas numéricas e datas já no formato esperado não geram chamada à IA.
 * A confirmação do agendamento nunca é decidida pela IA.
 *
 * @param {Object} conversa Estado atual da conversa.
 * @param {string} texto Mensagem enviada pelo cliente.
 * @return {string} Opção numérica ou data DD/MM/AAAA validável pelo fluxo atual.
 */
function agendamentoWhatsAppServiceInterpretarEntrada(conversa, texto) {
  let opcoes = [];
  let instrucoes = "";

  if (conversa.etapa === "servico") {
    opcoes = agendamentoRepositoryLerCodigoNome(CONFIG.ABAS.SERVICOS)
      .map(item => item.nome);
    instrucoes = "Retorne o número da opção de serviço mencionada.";
    if (/^\d{1,2}$/.test(texto)) return texto;
  } else if (conversa.etapa === "profissional") {
    opcoes = agendamentoRepositoryLerCodigoNome(CONFIG.ABAS.FUNCIONARIOS)
      .map(item => item.nome);
    instrucoes = "Retorne o número do profissional mencionado.";
    if (/^\d{1,2}$/.test(texto)) return texto;
  } else if (conversa.etapa === "periodo") {
    opcoes = (conversa.periodosExibidos || []).map(codigo => {
      const periodo = consultarPeriodos().find(item => item.codigo === codigo);
      return periodo ? periodo.descricao : "";
    });
    instrucoes = "Retorne o número do horário mencionado. Considere horários aproximados como 9h e 09:00 equivalentes.";
    if (/^\d{1,2}$/.test(texto)) return texto;
  } else if (conversa.etapa === "data") {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) return texto;
    instrucoes = "Converta a data mencionada em DD/MM/AAAA. Resolva expressões como hoje, amanhã ou próxima segunda-feira usando a data de referência. Se não houver uma data clara, retorne vazio.";
  } else {
    return texto;
  }

  try {
    const valor = agendamentoWhatsAppGroqRepositoryInterpretarEntrada({
      etapa: conversa.etapa,
      texto: texto,
      opcoes: opcoes,
      instrucoes: instrucoes,
      dataReferencia: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd")
    });
    return valor || texto;
  } catch (erroInterpretacao) {
    // Mantém as validações existentes como resposta final quando a IA falhar.
    return texto;
  }
}

/**
 * Monta a lista de serviços do cadastro atual.
 *
 * @param {string} nomeCliente Nome usado na saudação.
 * @return {string} Mensagem com as opções.
 */
function agendamentoWhatsAppServiceMontarMenuServicos(nomeCliente) {
  const servicos = agendamentoRepositoryLerCodigoNome(CONFIG.ABAS.SERVICOS);
  if (!servicos.length) {
    return "Olá, " + nomeCliente + "! Ainda não há serviços cadastrados para agendamento.";
  }
  const opcoes = servicos.map((item, indice) => (indice + 1) + ". " + item.nome);
  return "Olá, " + nomeCliente + "! Vamos fazer seu agendamento.\n\nEscolha um serviço pelo nome ou pelo número:\n" + opcoes.join("\n") + "\n\nEnvie *cancelar* para encerrar.";
}

/** Seleciona um serviço e avança para a lista de profissionais. */
function agendamentoWhatsAppServiceSelecionarServico(telefone, conversa, texto) {
  const servicos = agendamentoRepositoryLerCodigoNome(CONFIG.ABAS.SERVICOS);
  const indice = agendamentoWhatsAppValidatorValidarOpcao(texto, servicos.length);
  conversa.codigoServico = servicos[indice].codigo;
  conversa.servico = servicos[indice].nome;

  const profissionais = agendamentoRepositoryLerCodigoNome(CONFIG.ABAS.FUNCIONARIOS);
  if (!profissionais.length) throw new Error("Não há profissionais cadastrados para agendamento.");
  conversa.etapa = "profissional";
  agendamentoWhatsAppRepositorySalvarConversa(telefone, conversa);
  return "Serviço escolhido: " + conversa.servico + ".\n\nAgora escolha o profissional pelo nome ou pelo número:\n" +
    profissionais.map((item, i) => (i + 1) + ". " + item.nome).join("\n");
}

/** Seleciona um profissional e solicita a data desejada. */
function agendamentoWhatsAppServiceSelecionarProfissional(telefone, conversa, texto) {
  const profissionais = agendamentoRepositoryLerCodigoNome(CONFIG.ABAS.FUNCIONARIOS);
  const indice = agendamentoWhatsAppValidatorValidarOpcao(texto, profissionais.length);
  conversa.codigoFuncionario = profissionais[indice].codigo;
  conversa.profissional = profissionais[indice].nome;
  conversa.etapa = "data";
  agendamentoWhatsAppRepositorySalvarConversa(telefone, conversa);
  return "Profissional escolhido: " + conversa.profissional + ".\n\nQual data você prefere? Pode enviar DD/MM/AAAA ou escrever, por exemplo, *amanhã*.";
}

/** Valida a data e apresenta os horários que estão livres. */
function agendamentoWhatsAppServiceSelecionarData(telefone, conversa, texto) {
  const data = agendamentoWhatsAppValidatorValidarData(
    texto,
    new Date(),
    Session.getScriptTimeZone()
  );
  const disponiveis = agendamentoWhatsAppRulesListarPeriodosDisponiveis(
    data,
    conversa.codigoCliente,
    conversa.codigoFuncionario,
    consultarPeriodos(),
    agendamentoRepositoryListarRegistrosParaConflito()
  );
  if (!disponiveis.length) {
    conversa.etapa = "data";
    agendamentoWhatsAppRepositorySalvarConversa(telefone, conversa);
    return "Não encontrei horários livres nessa data para esse profissional. Informe outra data no formato DD/MM/AAAA.";
  }

  conversa.data = data;
  conversa.periodosExibidos = disponiveis.map(item => item.codigo);
  conversa.etapa = "periodo";
  agendamentoWhatsAppRepositorySalvarConversa(telefone, conversa);
  return "Horários disponíveis em " + agendamentoWhatsAppRulesFormatarData(data) + ":\n" +
    disponiveis.map((item, i) => (i + 1) + ". " + item.descricao).join("\n") +
    "\n\nResponda com o número ou escreva o horário desejado.";
}

/** Seleciona um horário e pede confirmação antes de gravar. */
function agendamentoWhatsAppServiceSelecionarPeriodo(telefone, conversa, texto) {
  const codigosExibidos = conversa.periodosExibidos || [];
  const indice = agendamentoWhatsAppValidatorValidarOpcao(texto, codigosExibidos.length);
  const periodo = consultarPeriodos().find(item => item.codigo === codigosExibidos[indice] && item.ativo);
  if (!periodo) {
    conversa.etapa = "data";
    agendamentoWhatsAppRepositorySalvarConversa(telefone, conversa);
    throw new Error("Esse horário não está mais disponível. Informe novamente a data para consultar os horários atualizados.");
  }

  conversa.codigoPeriodo = periodo.codigo;
  conversa.horario = periodo.descricao;
  conversa.etapa = "confirmacao";
  agendamentoWhatsAppRepositorySalvarConversa(telefone, conversa);
  return "Confirme seu pedido:\n\nServiço: " + conversa.servico +
    "\nProfissional: " + conversa.profissional +
    "\nData: " + agendamentoWhatsAppRulesFormatarData(conversa.data) +
    "\nHorário: " + periodo.descricao +
    "\n\nResponda *1* para confirmar (ou escreva *sim*) ou *2* para voltar ao início.";
}

/** Confirma e cria o agendamento pelo Service oficial do sistema. */
function agendamentoWhatsAppServiceConfirmar(telefone, conversa, texto) {
  const resposta = String(texto || "").trim().toLowerCase();
  if (["2", "0", "não", "nao", "voltar"].includes(resposta)) {
    agendamentoWhatsAppRepositoryLimparConversa(telefone);
    return agendamentoWhatsAppServiceMontarMenuServicos(conversa.nomeCliente);
  }
  if (!["1", "sim", "confirmo", "confirmar", "pode confirmar", "confirmado"].includes(resposta)) {
    throw new Error("Responda *1* ou *sim* para confirmar, ou *2* para voltar ao início.");
  }

  const codigo = gerarCodigoAgendamento();
  const resultado = criarAgendamento(
    codigo,
    conversa.data,
    conversa.codigoPeriodo,
    conversa.codigoFuncionario,
    conversa.codigoCliente,
    conversa.codigoServico
  );
  agendamentoWhatsAppRepositoryLimparConversa(telefone);
  return resultado.mensagem + "\n\nCódigo do agendamento: " + codigo +
    "\nPara fazer outro agendamento, envie *agendar*.";
}
