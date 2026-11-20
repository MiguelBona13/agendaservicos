/**
 * Entidade: Bairro
 * Camada: Repository — Repositório
 * Responsabilidade: centralizar operações na aba BAIRROS e consultas de integridade.
 * Dependências: Config.js e Utils.js.
 */
/** Lista bairros, opcionalmente filtrados por cidade. @param {string=} codigoCidade Cidade. @return {Array<Object>} Bairros. */
function bairroRepositoryListar(codigoCidade){const a=getSheet(CONFIG.ABAS.BAIRROS),n=a.getLastRow();if(n<2)return[];return a.getRange(2,1,n-1,3).getDisplayValues().filter(r=>String(r[0]).trim()&&String(r[1]).trim()&&(!codigoCidade||String(r[2]).trim()===String(codigoCidade).trim())).map(r=>({codigo:String(r[0]).trim(),nome:String(r[1]).trim(),codigoCidade:String(r[2]).trim()}));}
/** Maior código numérico. @return {number} Maior. */
function bairroRepositoryMaiorCodigo(){return bairroRepositoryListar().reduce((m,r)=>{const n=Number(r.codigo);return Number.isInteger(n)&&n>m?n:m;},0);}
/** Linha física. @param {string} codigo Código. @return {number} Linha ou -1. */
function bairroRepositoryLinha(codigo){const a=getSheet(CONFIG.ABAS.BAIRROS),n=a.getLastRow();if(n<2)return-1;const i=a.getRange(2,1,n-1,1).getDisplayValues().flat().findIndex(v=>String(v).trim()===String(codigo).trim());return i<0?-1:i+2;}
/** Insere bairro. @param {Object} d Dados. */
function bairroRepositoryInserir(d){getSheet(CONFIG.ABAS.BAIRROS).appendRow([d.codigo,d.nome,d.codigoCidade]);}
/** Atualiza nome e cidade. @param {number} linha Linha. @param {Object} d Dados. */
function bairroRepositoryAtualizar(linha,d){const a=getSheet(CONFIG.ABAS.BAIRROS);if(linha<2||linha>a.getLastRow())throw new Error("Bairro não encontrado.");a.getRange(linha,2,1,2).setValues([[d.nome,d.codigoCidade]]);}
/** Confere cidade existente. @param {string} codigo Cidade. @return {boolean} Existe. */
function bairroRepositoryCidadeExiste(codigo){return cidadeRepositoryLinha(codigo)>=2;}
/** Verifica clientes vinculados. @param {string} codigo Bairro. @return {boolean} Resultado. */
function bairroRepositoryPossuiClientes(codigo){const a=getSheet(CONFIG.ABAS.CLIENTES),n=a.getLastRow();return n>=2&&a.getRange(2,7,n-1,1).getDisplayValues().some(r=>String(r[0]).trim()===String(codigo).trim());}
/** Exclui linha. @param {number} linha Linha. */
function bairroRepositoryExcluir(linha){const a=getSheet(CONFIG.ABAS.BAIRROS);if(!Number.isInteger(linha)||linha<2||linha>a.getLastRow())throw new Error("Bairro não encontrado.");a.deleteRow(linha);}

/**
 * Retorna cabeçalhos e registros para a tabela da interface.
 * A leitura da planilha permanece concentrada no Repository da entidade.
 * @return {{colunas:Array<string>,registros:Array<Array<string>>}} Dados tabulares.
 */
function bairroRepositoryConsultarTabela() {
  const aba = getSheet(CONFIG.ABAS.BAIRRO), ultimaLinha = aba.getLastRow(), ultimaColuna = aba.getLastColumn();
  if (ultimaLinha < 1 || ultimaColuna < 1) return { colunas: [], registros: [] };
  const valores = aba.getRange(1, 1, ultimaLinha, ultimaColuna).getDisplayValues();
  return { colunas: valores[0], registros: valores.slice(1).filter(linha => linha.some(valor => String(valor).trim() !== "")) };
}
