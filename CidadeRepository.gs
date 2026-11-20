/**
 * Entidade: Cidade
 * Camada: Repository — Repositório
 * Responsabilidade: concentrar o acesso à aba CIDADES e consultas de vínculos.
 * Dependências: Config.js e Utils.js.
 */
/** Lista cidades. @return {Array<Object>} Registros. */
function cidadeRepositoryListar() {
  const aba = getSheet(CONFIG.ABAS.CIDADES), ultima = aba.getLastRow();
  if (ultima < 2) return [];
  return aba.getRange(2,1,ultima-1,3).getDisplayValues().filter(r=>String(r[0]).trim()&&String(r[1]).trim())
    .map(r=>({codigo:String(r[0]).trim(),nome:String(r[1]).trim(),estado:String(r[2]).trim()}));
}
/** Maior código numérico. @return {number} Maior código. */
function cidadeRepositoryMaiorCodigo() {
  return cidadeRepositoryListar().reduce((m,r)=>{const n=Number(r.codigo);return Number.isInteger(n)&&n>m?n:m;},0);
}
/** Localiza linha física. @param {string} codigo Código. @return {number} Linha ou -1. */
function cidadeRepositoryLinha(codigo) {
  const aba=getSheet(CONFIG.ABAS.CIDADES), ultima=aba.getLastRow(); if(ultima<2)return -1;
  const i=aba.getRange(2,1,ultima-1,1).getDisplayValues().flat().findIndex(v=>String(v).trim()===String(codigo).trim());
  return i<0?-1:i+2;
}
/** Insere cidade. @param {Object} dados Dados validados. */
function cidadeRepositoryInserir(dados) { getSheet(CONFIG.ABAS.CIDADES).appendRow([dados.codigo,dados.nome,dados.estado]); }
/** Atualiza nome e UF sem trocar código. @param {number} linha Linha. @param {Object} dados Dados. */
function cidadeRepositoryAtualizar(linha,dados) { const a=getSheet(CONFIG.ABAS.CIDADES); if(linha<2||linha>a.getLastRow())throw new Error("Cidade não encontrada."); a.getRange(linha,2,1,2).setValues([[dados.nome,dados.estado]]); }
/** Verifica bairros associados. @param {string} codigo Código. @return {boolean} Resultado. */
function cidadeRepositoryPossuiBairros(codigo) { const a=getSheet(CONFIG.ABAS.BAIRROS),n=a.getLastRow(); return n>=2&&a.getRange(2,3,n-1,1).getDisplayValues().some(r=>String(r[0]).trim()===String(codigo).trim()); }
/** Verifica clientes associados diretamente à cidade. @param {string} codigo Código. @return {boolean} Resultado. */
function cidadeRepositoryPossuiClientes(codigo) { const a=getSheet(CONFIG.ABAS.CLIENTES),n=a.getLastRow(); return n>=2&&a.getRange(2,6,n-1,1).getDisplayValues().some(r=>String(r[0]).trim()===String(codigo).trim()); }
/** Exclui linha validada. @param {number} linha Linha. */
function cidadeRepositoryExcluir(linha) { const a=getSheet(CONFIG.ABAS.CIDADES); if(!Number.isInteger(linha)||linha<2||linha>a.getLastRow())throw new Error("Cidade não encontrada."); a.deleteRow(linha); }
