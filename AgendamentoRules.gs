/**
 * Entidade: Agendamento
 * Camada: Rules — Regras de Negócio
 *
 * Responsabilidade:
 * Aplicar as regras de conflito, status e horário dos agendamentos.
 *
 * Dependências principais:
 * - Utilities e Session, do Google Apps Script, para normalização de datas.
 *
 * Este arquivo recebe os registros já consultados pelo Repository e não
 * acessa diretamente o Google Sheets.
 */

/**
 * Impede conflito com agendamentos ativos; cancelados e reagendados liberam o horário.
 * Um conflito ocorre quando data e período coincidem e o funcionário ou o
 * cliente já está reservado nesse mesmo período.
 *
 * @param {{data:string, codigoPeriodo:string, codigoFuncionario:string, codigoCliente:string}} dados Dados do novo agendamento.
 * @param {Array<Array<*>>} agendamentos Registros da agenda, sem cabeçalho.
 * @return {void}
 * @throws {Error} Quando existe conflito de funcionário ou cliente.
 */
function agendamentoRulesValidarConflito(dados, agendamentos) {
  const conflito = (agendamentos || []).some(linha => {
    const dataExistente = agendamentoRulesNormalizarData(linha[1]);
    const periodoExistente = String(linha[2] || "").trim();
    const funcionarioExistente = String(linha[3] || "").trim();
    const clienteExistente = String(linha[4] || "").trim();
    const statusExistente = String(linha[7] || "").trim().toLowerCase();
    const codigoExistente = String(linha[0] || "").trim();

    if (dados.codigoIgnorado && codigoExistente === String(dados.codigoIgnorado).trim()) return false;
    if (["cancelado", "reagendado"].includes(statusExistente)) return false;
    if (dataExistente !== dados.data || periodoExistente !== dados.codigoPeriodo) return false;

    return funcionarioExistente === dados.codigoFuncionario ||
      clienteExistente === dados.codigoCliente;
  });

  if (conflito) {
    throw new Error("Conflito de horário: o funcionário ou o cliente já possui um agendamento nesse dia e período.");
  }
}

/**
 * Normaliza uma data lida da planilha para yyyy-MM-dd.
 *
 * @param {*} valor Data do Google Sheets ou texto.
 * @return {string} Data normalizada ou texto vazio quando não reconhecida.
 */
function agendamentoRulesNormalizarData(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return Utilities.formatDate(
      valor,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
  }

  const texto = String(valor || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : "";
}


/**
 * Normaliza nomes para comparação sem diferenciar maiúsculas, espaços extras
 * ou acentos. Não altera o nome original armazenado na planilha.
 *
 * @param {string} valor Nome informado no e-mail ou cadastro.
 * @return {string} Texto normalizado para comparação.
 */
function agendamentoRulesNormalizarNome(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Localiza um cadastro pelo nome e exige correspondência única.
 *
 * @param {string} nomeInformado Nome recebido no e-mail.
 * @param {Array<{codigo:string,nome:string}>} cadastros Cadastros consultados pelo Repository.
 * @param {string} tipoNome Descrição do tipo de cadastro para mensagens de erro.
 * @return {{codigo:string,nome:string}} Cadastro correspondente.
 * @throws {Error} Quando não houver correspondência ou houver nomes duplicados.
 */
function agendamentoRulesResolverCadastroPorNome(nomeInformado, cadastros, tipoNome) {
  const nomeNormalizado = agendamentoRulesNormalizarNome(nomeInformado);
  const correspondencias = (cadastros || []).filter(item =>
    agendamentoRulesNormalizarNome(item.nome) === nomeNormalizado
  );

  if (!correspondencias.length) {
    throw new Error(tipoNome + " não encontrado: " + nomeInformado + ".");
  }

  if (correspondencias.length > 1) {
    throw new Error(
      "Existe mais de um " + tipoNome.toLowerCase() +
      " com o nome " + nomeInformado + ". Informe um nome exclusivo no e-mail."
    );
  }

  return correspondencias[0];
}

/**
 * Localiza um período ativo pela hora inicial e, quando informada, também pela
 * hora final. Sem hora final, exige uma única correspondência na aba PERIODOS.
 *
 * @param {string} horaInicial Horário inicial no formato HH:mm.
 * @param {?string} horaFinal Horário final no formato HH:mm ou vazio.
 * @param {Array<Object>} periodos Períodos consultados pelo Repository.
 * @return {Object} Período ativo correspondente.
 * @throws {Error} Quando o período não existir ou for ambíguo.
 */
function agendamentoRulesResolverPeriodoPorHorario(horaInicial, horaFinal, periodos) {
  const horaFinalInformada = String(horaFinal || "").trim();
  const correspondencias = (periodos || []).filter(periodo =>
    periodo.ativo &&
    String(periodo.horaInicial || "").trim() === horaInicial &&
    (!horaFinalInformada ||
      String(periodo.horaFinal || "").trim() === horaFinalInformada)
  );

  if (!correspondencias.length) {
    throw new Error(
      horaFinalInformada
        ? "Não existe período ativo cadastrado para " +
          horaInicial + " às " + horaFinalInformada + "."
        : "Não existe período ativo iniciado às " + horaInicial + "."
    );
  }

  if (correspondencias.length > 1) {
    throw new Error(
      "Há mais de um período ativo compatível com esse horário. " +
      "Informe também o horário final ou revise a aba PERIODOS."
    );
  }

  return correspondencias[0];
}


/**
 * Valida o status e impede registrar presença ou falta antes da data do serviço.
 * Cancelado e Reagendado não são resultados de treinamento do K-NN.
 *
 * @param {string} status Status proposto.
 * @param {string} data Data do atendimento em yyyy-MM-dd.
 * @param {string} hora Horário inicial em HH:mm.
 * @return {void}
 * @throws {Error} Quando o status for desconhecido ou o atendimento ainda não ocorreu.
 */
function agendamentoRulesValidarStatus(status, data, hora) {
  const statusNormalizado = String(status || "").trim();
  const permitidos = ["Agendado", "Compareceu", "Faltou", "Cancelado", "Reagendado"];

  if (!permitidos.includes(statusNormalizado)) {
    throw new Error("Status inválido para o agendamento.");
  }

  if (["Compareceu", "Faltou"].includes(statusNormalizado)) {
    const dataHoraAgendamento = String(data) + " " + String(hora || "00:00");
    const agora = Utilities.formatDate(
      new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm"
    );
    if (dataHoraAgendamento > agora) {
      throw new Error("Comparecimento ou falta só pode ser registrado após o horário do atendimento.");
    }
  }
}
