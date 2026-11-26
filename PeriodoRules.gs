/**
 * Entidade: Período
 * Camada: Rules — Regras de Negócio
 * Responsabilidade: proteger a integridade dos períodos usados em agendamentos.
 * Dependências: consultas de vínculo fornecidas por PeriodoRepository.
 */

/** Garante que o horário final seja posterior ao inicial.
 * @param {Object} dados Dados já normalizados pelo Validator.
 */
function periodoRulesValidarIntervalo(dados) {
  if (dados.horaFinal <= dados.horaInicial) {
    throw new Error("A hora final deve ser posterior à hora inicial.");
  }
}

/** Impede alterar descrição ou horários quando o período já consta no histórico.
 * @param {string} codigo Código do período.
 * @param {Object} atual Período persistido.
 * @param {Object} novo Dados propostos.
 * @param {boolean} possuiAgendamentos Indica vínculo histórico.
 */
function periodoRulesValidarEdicaoComVinculos(codigo, atual, novo, possuiAgendamentos) {
  if (!possuiAgendamentos) return;
  const alterouDadosHistoricos =
    atual.descricao !== novo.descricao ||
    atual.horaInicial !== novo.horaInicial ||
    atual.horaFinal !== novo.horaFinal;
  if (alterouDadosHistoricos) {
    throw new Error("O período " + codigo + " possui agendamentos vinculados. Para preservar o histórico, sua descrição e seus horários não podem ser alterados; somente é permitido inativá-lo.");
  }
}

/** Define a ação de exclusão conforme a existência de agendamentos.
 * @param {boolean} possuiAgendamentos Há vínculo histórico.
 * @return {string} INATIVAR ou EXCLUIR.
 */
function periodoRulesDefinirAcaoExclusao(possuiAgendamentos) {
  return possuiAgendamentos ? "INATIVAR" : "EXCLUIR";
}
