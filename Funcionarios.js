/**
 * Entidade: Funcionário
 * Camada: Interface legada — compatibilidade pública.
 *
 * Responsabilidade:
 * Preservar os nomes de funções já utilizados pela interface e delegar
 * as operações às camadas FuncionarioService e FuncionarioRepository.
 */

/** @return {string} Próximo código sequencial disponível. */
function gerarCodigoFuncionario() {
  return funcionarioServiceGerarCodigo();
}

/**
 * Compatibilidade com a chamada de cadastro existente na interface.
 * @param {string} codigo Código do funcionário.
 * @param {string} nome Nome do funcionário.
 * @return {Object} Resultado do cadastro.
 */
function cadastrarFuncionario(codigo, nome) {
  return funcionarioServiceCriar(codigo, nome);
}

/** @param {string} codigo Código do funcionário. @param {string} nome Novo nome. */
function atualizarFuncionario(codigo, nome) {
  return funcionarioServiceAtualizar(codigo, nome);
}

/** @param {string} codigo Código do funcionário. */
function excluirFuncionario(codigo) {
  return funcionarioServiceExcluir(codigo);
}
