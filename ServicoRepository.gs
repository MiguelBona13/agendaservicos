/**
 * Entidade: Serviço
 * Camada: Repository — Repositório
 *
 * Responsabilidade:
 * Centralizar a leitura e a persistência dos serviços na aba SERVICOS.
 *
 * Dependências principais:
 * - Config.js — nome da aba SERVICOS e AGENDA;
 * - Utils.js — acesso à planilha por getSheet().
 */

/** @return {Array<Object>} Serviços cadastrados. */
function servicoRepositoryListar() {
  const aba = getSheet(CONFIG.ABAS.SERVICOS);
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return [];
  return aba.getRange(2, 1, ultimaLinha - 1, 3).getDisplayValues()
    .filter(linha => String(linha[0] || "").trim() && String(linha[1] || "").trim())
    .map(linha => ({
      codigo: String(linha[0]).trim(),
      nome: String(linha[1]).trim(),
      valor: Number(String(linha[2]).replace(",", ".")) || 0
    }));
}

/** @param {string} codigo Código do serviço. @return {?Object} Serviço ou null. */
function servicoRepositoryBuscarPorCodigo(codigo) {
  return servicoRepositoryListar().find(item => item.codigo === String(codigo).trim()) || null;
}

/** @return {number} Maior código numérico cadastrado. */
function servicoRepositoryObterMaiorCodigo() {
  return servicoRepositoryListar().reduce((maior, item) => {
    const numero = Number(item.codigo);
    return Number.isInteger(numero) && numero > maior ? numero : maior;
  }, 0);
}

/** @param {Object} dados Serviço validado a inserir. */
function servicoRepositoryInserir(dados) {
  const aba = getSheet(CONFIG.ABAS.SERVICOS);
  aba.appendRow([String(dados.codigo), String(dados.nome), Number(dados.valor)]);
}

/** @param {number} linha Linha física validada. @param {Object} dados Serviço validado. */
function servicoRepositoryAtualizar(linha, dados) {
  const aba = getSheet(CONFIG.ABAS.SERVICOS);
  if (!Number.isInteger(linha) || linha < 2 || linha > aba.getLastRow()) {
    throw new Error("Serviço não encontrado para atualização.");
  }
  aba.getRange(linha, 2, 1, 2).setValues([[String(dados.nome), Number(dados.valor)]]);
}

/** @param {string} codigo Código do serviço. @return {boolean} Se há vínculo na agenda. */
function servicoRepositoryPossuiAgendamentos(codigo) {
  const aba = getSheet(CONFIG.ABAS.AGENDA);
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return false;
  // Na aba AGENDA, o código do serviço ocupa a sexta coluna.
  return aba.getRange(2, 6, ultimaLinha - 1, 1).getDisplayValues()
    .some(linha => String(linha[0] || "").trim() === String(codigo).trim());
}

/** @param {string} codigo Código do serviço. @return {number} Linha física ou -1. */
function servicoRepositoryObterLinha(codigo) {
  const aba = getSheet(CONFIG.ABAS.SERVICOS);
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return -1;
  const codigos = aba.getRange(2, 1, ultimaLinha - 1, 1).getDisplayValues().flat();
  const indice = codigos.findIndex(valor => String(valor).trim() === String(codigo).trim());
  return indice < 0 ? -1 : indice + 2;
}

/** @param {number} linha Linha física validada. */
function servicoRepositoryExcluir(linha) {
  const aba = getSheet(CONFIG.ABAS.SERVICOS);
  if (!Number.isInteger(linha) || linha < 2 || linha > aba.getLastRow()) {
    throw new Error("Serviço não encontrado para exclusão.");
  }
  aba.deleteRow(linha);
}

/**
 * Retorna cabeçalhos e registros para a tabela da interface.
 * A leitura da planilha permanece concentrada no Repository da entidade.
 * @return {{colunas:Array<string>,registros:Array<Array<string>>}} Dados tabulares.
 */
function servicoRepositoryConsultarTabela() {
  const aba = getSheet(CONFIG.ABAS.SERVICO), ultimaLinha = aba.getLastRow(), ultimaColuna = aba.getLastColumn();
  if (ultimaLinha < 1 || ultimaColuna < 1) return { colunas: [], registros: [] };
  const valores = aba.getRange(1, 1, ultimaLinha, ultimaColuna).getDisplayValues();
  return { colunas: valores[0], registros: valores.slice(1).filter(linha => linha.some(valor => String(valor).trim() !== "")) };
}
