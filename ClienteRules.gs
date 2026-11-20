/**
 * Entidade: Cliente
 * Camada: Rules — Regras de Negócio
 * Responsabilidade: proteger o histórico de agendamentos ao excluir clientes.
 * Dependências: ClienteRepository.
 */
/** Impede excluir cliente referenciado na agenda. @param {string} codigo Código. @param {boolean} possuiAgendamentos Vínculos. */
function clienteRulesValidarExclusao(codigo,possuiAgendamentos){if(possuiAgendamentos)throw new Error("Não é possível excluir o cliente "+codigo+" porque existem agendamentos vinculados.");}
