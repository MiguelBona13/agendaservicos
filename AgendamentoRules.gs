/**
 * Entidade: Agendamento
 * Camada: Rules — Regras de Negócio
 *
 * Responsabilidade:
 * Aplicar as regras de conflito de data, período, funcionário e cliente.
 *
 * Dependências principais:
 * - Utilities e Session, do Google Apps Script, para normalização de datas.
 *
 * Este arquivo recebe os registros já consultados pelo Repository e não
 * acessa diretamente o Google Sheets.
 */

/**
 * Impede conflito de horário com agendamentos que não estejam cancelados.
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

    // Cancelamentos preservam o histórico, mas liberam o horário.
    if (statusExistente === "cancelado") {
      return false;
    }

    if (dataExistente !== dados.data || periodoExistente !== dados.codigoPeriodo) {
      return false;
    }

    return funcionarioExistente === dados.codigoFuncionario ||
      clienteExistente === dados.codigoCliente;
  });

  if (conflito) {
    throw new Error(
      "Conflito de horário: o funcionário ou o cliente já possui um agendamento nesse dia e período."
    );
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
