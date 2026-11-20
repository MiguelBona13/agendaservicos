/**
 * Entidade: Bairro
 * Camada: Rules — Regras de Negócio
 * Responsabilidade: impedir exclusão ou troca de cidade quando há clientes vinculados.
 * Dependências: BairroRepository.
 */
/** Protege vínculos de clientes. @param {string} codigo Código do bairro. @param {boolean} possuiClientes Vínculos existentes. */
function bairroRulesValidarExclusao(codigo,possuiClientes){if(possuiClientes)throw new Error("Não é possível excluir o bairro "+codigo+" porque existem clientes vinculados.");}
/** Impede mover bairro para outra cidade enquanto clientes estiverem vinculados. @param {boolean} possuiClientes Vínculos. */
function bairroRulesValidarMudancaCidade(possuiClientes){if(possuiClientes)throw new Error("Não é possível alterar a cidade deste bairro enquanto houver clientes vinculados.");}
