/**
 * Entidade: Funcionário
 * Camada: Rules — Regras de Negócio
 *
 * Responsabilidade:
 * Aplicar regras de integridade específicas do cadastro de funcionários.
 *
 * Dependências principais:
 * - dados consultados por FuncionarioRepository.gs.
 */

/**
 * Impede exclusão física quando o funcionário possui agendamentos históricos.
 * @param {string} codigo Código do funcionário.
 * @param {boolean} possuiAgendamentos Resultado da consulta do Repository.
 * @return {void}
 */
function funcionarioRulesValidarExclusao(codigo, possuiAgendamentos) {
  if (possuiAgendamentos) {
    throw new Error(
      "Não é possível excluir o funcionário " + codigo +
      " porque existem agendamentos vinculados. Edite o cadastro ou mantenha-o para preservar o histórico."
    );
  }
}
