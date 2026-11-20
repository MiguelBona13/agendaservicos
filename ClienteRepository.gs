/**
 * Entidade: Cliente
 * Camada: Repository — Repositório
 *
 * Responsabilidade:
 * Consultar os dados de contato do cliente na planilha CLIENTES.
 *
 * Dependências principais:
 * - Config.js — nomes das abas;
 * - Utils.js — função getSheet().
 */

/**
 * Busca o nome e o e-mail de um cliente pelo código.
 *
 * A leitura da planilha fica concentrada neste Repository. A estrutura atual
 * da aba CLIENTES utiliza a coluna A para o código, B para o nome e J para
 * o endereço de e-mail.
 *
 * @param {string} codigoCliente Código do cliente.
 * @return {{codigo:string,nome:string,email:string}|null} Contato encontrado
 * ou null quando o cliente não existe.
 */
function clienteRepositoryBuscarContatoPorCodigo(codigoCliente) {
  const codigo = String(codigoCliente || "").trim();

  if (!codigo) {
    return null;
  }

  const aba = getSheet(CONFIG.ABAS.CLIENTES);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return null;
  }

  const registros = aba
    .getRange(2, 1, ultimaLinha - 1, 10)
    .getDisplayValues();

  const registro = registros.find(linha =>
    String(linha[0] || "").trim() === codigo
  );

  if (!registro) {
    return null;
  }

  return {
    codigo: String(registro[0] || "").trim(),
    nome: String(registro[1] || "").trim(),
    email: String(registro[9] || "").trim()
  };
}

/** Lista os clientes com os onze campos do cadastro. @return {Array<Object>} Clientes. */
function clienteRepositoryListar() {
  const a=getSheet(CONFIG.ABAS.CLIENTES),n=a.getLastRow(); if(n<2)return[];
  return a.getRange(2,1,n-1,11).getValues().filter(r=>String(r[0]||"").trim()&&String(r[1]||"").trim()).map(r=>({
    codigo:String(r[0]).trim(),nome:String(r[1]).trim(),cpf:String(r[2]).replace(/\D/g,""),
    dataAniversario:r[3] instanceof Date?Utilities.formatDate(r[3],Session.getScriptTimeZone(),"yyyy-MM-dd"):String(r[3]||""),
    numero:String(r[4]||""),codigoCidade:String(r[5]||"").trim(),codigoBairro:String(r[6]||"").trim(),
    cep:String(r[7]||"").replace(/\D/g,""),celular:String(r[8]||"").replace(/\D/g,""),
    email:String(r[9]||""),statusFinanceiro:String(r[10]||"")
  }));
}
/** Maior código numérico. @return {number} Maior. */
function clienteRepositoryMaiorCodigo(){return clienteRepositoryListar().reduce((m,r)=>{const n=Number(r.codigo);return Number.isInteger(n)&&n>m?n:m;},0);}
/** Busca linha pelo código. @param {string} codigo Código. @return {number} Linha ou -1. */
function clienteRepositoryLinha(codigo){const a=getSheet(CONFIG.ABAS.CLIENTES),n=a.getLastRow();if(n<2)return-1;const i=a.getRange(2,1,n-1,1).getDisplayValues().flat().findIndex(v=>String(v).trim()===String(codigo).trim());return i<0?-1:i+2;}
/** Verifica duplicidade de CPF excluindo o próprio código em edição. @param {string} cpf CPF. @param {string=} codigoIgnorado Código ignorado. @return {boolean} Duplicado. */
function clienteRepositoryCpfExiste(cpf,codigoIgnorado){return clienteRepositoryListar().some(r=>r.cpf===String(cpf).replace(/\D/g,"")&&r.codigo!==String(codigoIgnorado||""));}
/** Confirma que cidade existe. @param {string} codigo Código. @return {boolean} Existe. */
function clienteRepositoryCidadeExiste(codigo){return cidadeRepositoryLinha(codigo)>=2;}
/** Confirma que bairro pertence à cidade. @param {string} bairro Código bairro. @param {string} cidade Código cidade. @return {boolean} Vínculo válido. */
function clienteRepositoryBairroPertenceCidade(bairro,cidade){return bairroRepositoryListar(cidade).some(r=>r.codigo===String(bairro).trim());}
/** Insere cliente. @param {Object} d Dados validados. */
function clienteRepositoryInserirCadastro(d){const a=getSheet(CONFIG.ABAS.CLIENTES),linha=a.getLastRow()+1;a.getRange(linha,1,1,11).setValues([[d.codigo,d.nome,d.cpf,d.dataAniversario,d.numero,d.codigoCidade,d.codigoBairro,d.cep,d.celular,d.email,d.statusFinanceiro]]);}
/** Atualiza cliente mantendo código. @param {number} linha Linha. @param {Object} d Dados. */
function clienteRepositoryAtualizarCadastro(linha,d){const a=getSheet(CONFIG.ABAS.CLIENTES);if(!Number.isInteger(linha)||linha<2||linha>a.getLastRow())throw new Error("Cliente não encontrado.");a.getRange(linha,2,1,10).setValues([[d.nome,d.cpf,d.dataAniversario,d.numero,d.codigoCidade,d.codigoBairro,d.cep,d.celular,d.email,d.statusFinanceiro]]);}
/** Verifica vínculo com agenda. @param {string} codigo Código. @return {boolean} Vínculo. */
function clienteRepositoryPossuiAgendamentos(codigo){const a=getSheet(CONFIG.ABAS.AGENDA),n=a.getLastRow();return n>=2&&a.getRange(2,5,n-1,1).getDisplayValues().some(r=>String(r[0]).trim()===String(codigo).trim());}
/** Exclui cliente. @param {number} linha Linha. */
function clienteRepositoryExcluir(linha){const a=getSheet(CONFIG.ABAS.CLIENTES);if(!Number.isInteger(linha)||linha<2||linha>a.getLastRow())throw new Error("Cliente não encontrado.");a.deleteRow(linha);}
