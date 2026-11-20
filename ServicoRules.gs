/**
 * Entidade: Serviço
 * Camada: Rules — Regras de Negócio
 *
 * Responsabilidade:
 * Aplicar regras de integridade específicas do cadastro de serviços.
 *
 * Dependências principais:
 * - dados de referência consultados por ServicoRepository.gs.
 */

/**
 * Impede a exclusão física de serviços utilizados no histórico da agenda.
 * @param {string} codigo Código do serviço.
 * @param {boolean} possuiAgendamentos Indica se há agendamentos vinculados.
 * @return {void}
 */
function servicoRulesValidarExclusao(codigo, possuiAgendamentos) {
  if (possuiAgendamentos) {
    throw new Error(
      "Não é possível excluir o serviço " + codigo +
      " porque existem agendamentos vinculados. Mantenha o cadastro para preservar o histórico."
    );
  }
}
