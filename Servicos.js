/**
 * Entidade: Serviço
 * Camada: Interface legada — compatibilidade pública.
 *
 * Responsabilidade:
 * Preservar os nomes de funções já utilizados pelo sistema e delegar
 * as operações às camadas ServicoService, ServicoValidator,
 * ServicoRules e ServicoRepository.
 */

/** @return {string} Próximo código sequencial disponível. */
function gerarCodigoServico() {
  return servicoServiceGerarCodigo();
}

/**
 * Compatibilidade com o cadastro legado.
 * @param {string} codigo Código do serviço.
 * @param {string} nome Nome do serviço.
 * @param {number|string} valor Valor monetário.
 * @return {Object} Resultado da operação.
 */
function cadastrarServico(codigo, nome, valor) {
  return servicoServiceCriar(codigo, nome, valor);
}

/**
 * Atualiza nome e valor sem alterar o código.
 * @param {string} codigo Código imutável do serviço.
 * @param {string} nome Novo nome.
 * @param {number|string} valor Novo valor.
 * @return {Object} Resultado da operação.
 */
function atualizarServico(codigo, nome, valor) {
  return servicoServiceAtualizar(codigo, nome, valor);
}

/**
 * Exclui serviço somente se não houver agendamentos vinculados.
 * @param {string} codigo Código do serviço.
 * @return {Object} Resultado da operação.
 */
function excluirServico(codigo) {
  return servicoServiceExcluir(codigo);
}
