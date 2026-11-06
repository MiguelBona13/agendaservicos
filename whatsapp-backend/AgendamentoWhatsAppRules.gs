/**
 * Entidade: Agendamento via WhatsApp
 * Camada: Rules — Regras de Negócio
 *
 * Responsabilidade:
 * Aplicar regras de conversa, estados e disponibilidade sem acessar o Sheets.
 *
 * Dependências principais:
 * - AgendamentoRules.gs, para a regra existente de conflito de horário.
 */

/**
 * Cria uma conversa inicial para um cliente identificado.
 *
 * @param {Object} cliente Cliente já localizado pelo Repository.
 * @return {Object} Estado inicial da conversa.
 */
function agendamentoWhatsAppRulesCriarConversa(cliente) {
  return {
    etapa: "servico",
    codigoCliente: String(cliente.codigo),
    nomeCliente: String(cliente.nome),
    codigoServico: "",
    codigoFuncionario: "",
    data: "",
    codigoPeriodo: "",
    atualizadoEm: Date.now()
  };
}

/**
 * Filtra os períodos ativos que não conflitam com a agenda na data selecionada.
 *
 * @param {string} data Data yyyy-MM-dd.
 * @param {string} codigoCliente Código do cliente identificado.
 * @param {string} codigoFuncionario Código do profissional selecionado.
 * @param {Array<Object>} periodos Períodos cadastrados.
 * @param {Array<Array<*>>} agendamentos Registros da agenda.
 * @return {Array<Object>} Períodos ainda disponíveis.
 */
function agendamentoWhatsAppRulesListarPeriodosDisponiveis(
  data,
  codigoCliente,
  codigoFuncionario,
  periodos,
  agendamentos
) {
  return (periodos || []).filter(periodo => {
    if (!periodo.ativo) return false;
    try {
      agendamentoRulesValidarConflito({
        data: data,
        codigoPeriodo: periodo.codigo,
        codigoFuncionario: codigoFuncionario,
        codigoCliente: codigoCliente
      }, agendamentos);
      return true;
    } catch (erroConflito) {
      return false;
    }
  });
}

/**
 * Formata data interna em formato legível para confirmação pelo WhatsApp.
 *
 * @param {string} data Data yyyy-MM-dd.
 * @return {string} Data dd/MM/yyyy.
 */
function agendamentoWhatsAppRulesFormatarData(data) {
  const partes = String(data || "").split("-");
  return partes.length === 3
    ? partes[2] + "/" + partes[1] + "/" + partes[0]
    : String(data || "");
}
