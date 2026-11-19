/**
 * Entidade: Funcionário
 * Camada: Repository — Repositório
 *
 * Responsabilidade:
 * Centralizar a leitura e a persistência dos funcionários na aba FUNCIONARIOS.
 *
 * Dependências principais:
 * - Config.js — nome da aba FUNCIONARIOS;
 * - Utils.js — acesso à planilha por getSheet().
 */

/** @return {Array<Object>} Lista de funcionários cadastrados. */
function funcionarioRepositoryListar() {
  const aba = getSheet(CONFIG.ABAS.FUNCIONARIOS);
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return [];
  return aba.getRange(2, 1, ultimaLinha - 1, 2).getDisplayValues()
    .filter(linha => String(linha[0] || "").trim() && String(linha[1] || "").trim())
    .map(linha => ({ codigo: String(linha[0]).trim(), nome: String(linha[1]).trim() }));
}

/**
 * Busca funcionário pelo código.
 * @param {string} codigo Código do funcionário.
 * @return {?Object} Funcionário ou null.
 */
function funcionarioRepositoryBuscarPorCodigo(codigo) {
  return funcionarioRepositoryListar().find(item => item.codigo === String(codigo).trim()) || null;
}

/** @return {number} Maior código numérico cadastrado. */
function funcionarioRepositoryObterMaiorCodigo() {
  return funcionarioRepositoryListar().reduce((maior, item) => {
    const numero = Number(item.codigo);
    return Number.isInteger(numero) && numero > maior ? numero : maior;
  }, 0);
}

/**
 * Insere funcionário.
 * @param {{codigo:string,nome:string}} dados Dados validados.
 */
function funcionarioRepositoryInserir(dados) {
  const aba = getSheet(CONFIG.ABAS.FUNCIONARIOS);
  const linha = aba.getLastRow() + 1;
  aba.getRange(linha, 1, 1, 2).setValues([[String(dados.codigo), String(dados.nome)]]);
}

/**
 * Atualiza nome sem alterar o código.
 * @param {number} linha Linha física validada.
 * @param {{codigo:string,nome:string}} dados Dados validados.
 */
function funcionarioRepositoryAtualizar(linha, dados) {
  const aba = getSheet(CONFIG.ABAS.FUNCIONARIOS);
  if (!Number.isInteger(linha) || linha < 2 || linha > aba.getLastRow()) {
    throw new Error("Funcionário não encontrado para atualização.");
  }
  aba.getRange(linha, 2).setValue(String(dados.nome));
}

/**
 * Verifica se o funcionário está referenciado na agenda.
 * @param {string} codigo Código do funcionário.
 * @return {boolean} true quando existe agendamento relacionado.
 */
function funcionarioRepositoryPossuiAgendamentos(codigo) {
  const aba = getSheet(CONFIG.ABAS.AGENDA);
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return false;
  return aba.getRange(2, 4, ultimaLinha - 1, 1).getDisplayValues()
    .some(linha => String(linha[0] || "").trim() === String(codigo).trim());
}

/**
 * Exclui fisicamente um funcionário sem vínculos.
 * @param {number} linha Linha física validada.
 */
function funcionarioRepositoryExcluir(linha) {
  const aba = getSheet(CONFIG.ABAS.FUNCIONARIOS);
  if (!Number.isInteger(linha) || linha < 2 || linha > aba.getLastRow()) {
    throw new Error("Funcionário não encontrado para exclusão.");
  }
  aba.deleteRow(linha);
}

/** @param {string} codigo Código do funcionário. @return {number} Linha física ou -1. */
function funcionarioRepositoryObterLinha(codigo) {
  const aba = getSheet(CONFIG.ABAS.FUNCIONARIOS);
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return -1;
  const codigos = aba.getRange(2, 1, ultimaLinha - 1, 1).getDisplayValues().flat();
  const indice = codigos.findIndex(valor => String(valor).trim() === String(codigo).trim());
  return indice < 0 ? -1 : indice + 2;
}
