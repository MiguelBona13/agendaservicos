/**
 * Entidade: Bairro
 * Camada: Interface legada — compatibilidade pública.
 * Responsabilidade: preservar as funções públicas de cadastro e delegar ao BairroService.
 */
/** Próximo código de bairro. @return {string} Código. */
function gerarCodigoBairro(){return bairroServiceGerarCodigo();}
/** Cadastra bairro. @param {string} codigo Código. @param {string} nome Nome. @param {string} codigoCidade Cidade. */
function cadastrarBairro(codigo,nome,codigoCidade){return bairroServiceCriar(codigo,nome,codigoCidade);}
/** Atualiza bairro. @param {string} codigo Código. @param {string} nome Nome. @param {string} codigoCidade Cidade. */
function atualizarBairro(codigo,nome,codigoCidade){return bairroServiceAtualizar(codigo,nome,codigoCidade);}
/** Exclui bairro sem clientes vinculados. @param {string} codigo Código. */
function excluirBairro(codigo){return bairroServiceExcluir(codigo);}
