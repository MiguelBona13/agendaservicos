/**
 * Entidade: AgendamentoBot
 * Camada: Rules — Regras de Negócio
 *
 * Responsabilidade:
 * Filtrar períodos ativos aplicando a mesma regra de conflito da agenda.
 * Recebe os dados lidos pelo Repository e não acessa o Google Sheets.
 */

/**
 * Retorna os períodos ativos livres para o cliente e profissional na data.
 *
 * @param {string} data Data no formato yyyy-MM-dd.
 * @param {string} codigoCliente Código do cliente identificado.
 * @param {string} codigoFuncionario Código do profissional escolhido.
 * @param {Array<Object>} periodos Períodos lidos do cadastro.
 * @param {Array<Array<*>>} agendamentos Registros lidos da agenda.
 * @return {Array<Object>} Períodos sem conflito.
 */
function agendamentoBotRulesListarHorariosDisponiveis(
  data, codigoCliente, codigoFuncionario, periodos, agendamentos
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

