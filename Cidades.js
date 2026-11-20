/**
 * Entidade: Cidade
 * Camada: Interface legada — compatibilidade pública.
 * Responsabilidade: preservar as funções públicas de cadastro e delegar ao CidadeService.
 */
/** Próximo código de cidade. @return {string} Código. */
function gerarCodigoCidade(){return cidadeServiceGerarCodigo();}
/** Cadastra cidade. @param {string} codigo Código. @param {string} nome Nome. @param {string} estado UF. */
function cadastrarCidade(codigo,nome,estado){return cidadeServiceCriar(codigo,nome,estado);}
/** Atualiza cidade. @param {string} codigo Código. @param {string} nome Nome. @param {string} estado UF. */
function atualizarCidade(codigo,nome,estado){return cidadeServiceAtualizar(codigo,nome,estado);}
/** Exclui cidade sem bairros/clientes vinculados. @param {string} codigo Código. */
function excluirCidade(codigo){return cidadeServiceExcluir(codigo);}
