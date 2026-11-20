/**
 * Entidade: Cliente
 * Camada: Validator — Validador
 *
 * Responsabilidade:
 * Validar os dados necessários para solicitar o envio de um e-mail de teste.
 *
 * Dependências principais:
 * - Nenhuma dependência externa.
 */

/**
 * Valida o código do cliente recebido pela operação de teste de e-mail.
 *
 * @param {string} codigoCliente Código do cliente selecionado na interface.
 * @return {string} Código normalizado.
 * @throws {Error} Quando o código não é informado.
 */
function clienteValidatorValidarCodigoParaEmailTeste(codigoCliente) {
  const codigo = String(codigoCliente || "").trim();

  if (!codigo) {
    throw new Error("Selecione um cliente antes de verificar o e-mail.");
  }

  return codigo;
}

/**
 * Valida o formato básico de um endereço de e-mail.
 *
 * Esta validação não confirma a existência da caixa postal nem a entrega
 * da mensagem ao destinatário.
 *
 * @param {string} email Endereço de e-mail cadastrado.
 * @return {string} Endereço normalizado.
 * @throws {Error} Quando o endereço está vazio ou possui formato inválido.
 */
function clienteValidatorValidarEmail(email) {
  const endereco = String(email || "").trim();

  if (!endereco) {
    throw new Error("O cliente selecionado não possui e-mail cadastrado.");
  }

  const formatoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(endereco);

  if (!formatoValido) {
    throw new Error("O e-mail cadastrado para este cliente possui formato inválido.");
  }

  return endereco;
}

/** Valida CPF pelo cálculo dos dígitos verificadores. @param {string} cpf CPF normalizado. @return {boolean} Validade. */
function clienteValidatorCpfValido(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma=0; for(let i=0;i<9;i++) soma+=Number(cpf[i])*(10-i);
  let resto=(soma*10)%11; if(resto===10)resto=0; if(resto!==Number(cpf[9]))return false;
  soma=0; for(let i=0;i<10;i++)soma+=Number(cpf[i])*(11-i);
  resto=(soma*10)%11; if(resto===10)resto=0;
  return resto===Number(cpf[10]);
}
/**
 * Valida e normaliza os onze campos do cadastro de cliente.
 * @param {Object} dados Dados recebidos da interface.
 * @return {Object} Dados normalizados para persistência.
 */
function clienteValidatorValidarCadastro(dados) {
  const d=dados||{};
  const codigo=String(d.codigo==null?"":d.codigo).trim();
  const nome=String(d.nome==null?"":d.nome).trim().replace(/\s+/g," ");
  const cpf=String(d.cpf==null?"":d.cpf).replace(/\D/g,"");
  const aniversario=String(d.dataAniversario==null?"":d.dataAniversario).trim();
  const numero=String(d.numero==null?"":d.numero).trim();
  const codigoCidade=String(d.codigoCidade==null?"":d.codigoCidade).trim();
  const codigoBairro=String(d.codigoBairro==null?"":d.codigoBairro).trim();
  const cep=String(d.cep==null?"":d.cep).replace(/\D/g,"");
  const celular=String(d.celular==null?"":d.celular).replace(/\D/g,"");
  const email=String(d.email==null?"":d.email).trim();
  const statusFinanceiro=String(d.statusFinanceiro==null?"":d.statusFinanceiro).trim();
  if(!codigo)throw new Error("O código do cliente é obrigatório.");
  if(!nome)throw new Error("O nome do cliente é obrigatório.");
  if(!clienteValidatorCpfValido(cpf))throw new Error("O CPF informado é inválido.");
  if(!numero)throw new Error("O número do endereço é obrigatório.");
  if(!codigoCidade)throw new Error("A cidade do cliente é obrigatória.");
  if(!codigoBairro)throw new Error("O bairro do cliente é obrigatório.");
  if(!/^\d{8}$/.test(cep))throw new Error("O CEP deve conter 8 números.");
  if(!/^\d{10,11}$/.test(celular))throw new Error("O celular deve conter DDD e número.");
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("O e-mail informado é inválido.");
  if(!["Em dia","Pendente","Inadimplente"].includes(statusFinanceiro))throw new Error("O status financeiro selecionado é inválido.");
  let dataParaSalvar="";
  if(aniversario){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(aniversario))throw new Error("A data de aniversário é inválida.");
    const p=aniversario.split("-").map(Number),data=new Date(p[0],p[1]-1,p[2]);
    if(data.getFullYear()!==p[0]||data.getMonth()!==p[1]-1||data.getDate()!==p[2])throw new Error("A data de aniversário não existe.");
    dataParaSalvar=data;
  }
  return {codigo,nome,cpf,dataAniversario:dataParaSalvar,numero,codigoCidade,codigoBairro,cep,celular,email,statusFinanceiro};
}
