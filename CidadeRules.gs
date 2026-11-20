/**
 * Entidade: Cidade
 * Camada: Rules — Regras de Negócio
 * Responsabilidade: proteger vínculos de bairros e clientes ao excluir ou alterar cidade.
 * Dependências: CidadeRepository.
 */
/** Impede excluir cidade referenciada por bairros ou clientes.
 * @param {string} codigo Código da cidade.
 * @param {boolean} possuiBairros Existem bairros associados.
 * @param {boolean} possuiClientes Existem clientes associados.
 */
function cidadeRulesValidarExclusao(codigo, possuiBairros, possuiClientes) {
  if (possuiBairros || possuiClientes) {
    throw new Error("Não é possível excluir a cidade " + codigo + " porque existem bairros ou clientes vinculados.");
  }
}
