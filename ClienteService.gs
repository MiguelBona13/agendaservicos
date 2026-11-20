/**
 * Entidade: Cliente
 * Camada: Service — Camada de Serviço
 *
 * Responsabilidade:
 * Coordenar o envio de uma mensagem de teste para o e-mail cadastrado
 * do cliente selecionado no formulário de agendamento.
 *
 * Dependências principais:
 * - ClienteValidator.gs;
 * - ClienteRepository.gs;
 * - MailApp — serviço de envio de e-mails do Google Apps Script.
 */

/**
 * Envia uma mensagem de teste para o endereço cadastrado do cliente.
 *
 * O sucesso retornado indica que o MailApp aceitou a solicitação de envio.
 * Isso não confirma que a mensagem chegou à caixa de entrada, não foi
 * direcionada ao spam ou foi aberta pelo destinatário.
 *
 * @param {string} codigoCliente Código do cliente selecionado.
 * @return {{sucesso:boolean,mensagem:string,destinatario:string}} Resultado.
 * @throws {Error} Quando o cliente não existe, não possui e-mail válido ou
 * quando o serviço de e-mail não aceita a solicitação.
 */
function clienteServiceEnviarEmailTeste(codigoCliente) {
  const codigo = clienteValidatorValidarCodigoParaEmailTeste(codigoCliente);
  const cliente = clienteRepositoryBuscarContatoPorCodigo(codigo);

  if (!cliente) {
    throw new Error("O cliente selecionado não foi encontrado.");
  }

  const destinatario = clienteValidatorValidarEmail(cliente.email);
  const nomeCliente = cliente.nome || "cliente";

  const assunto = "E-mail de teste - Agenda de Serviços";
  const corpo =
    "Olá, " + nomeCliente + "!\n\n" +
    "Esta é uma mensagem de teste enviada pelo sistema Agenda de Serviços.\n" +
    "O objetivo é verificar se o serviço de envio de e-mails está aceitando " +
    "solicitações para o endereço cadastrado.\n\n" +
    "O envio aceito pelo sistema não confirma a entrega na caixa de entrada.\n\n" +
    "Atenciosamente,\n" +
    "Agenda de Serviços";

  // MailApp lança uma exceção quando não consegue aceitar a solicitação.
  MailApp.sendEmail(destinatario, assunto, corpo);

  return {
    sucesso: true,
    mensagem: "O serviço de e-mail aceitou a solicitação de envio.",
    destinatario: destinatario
  };
}

/** Próximo código sequencial. @return {string} Código. */
function clienteServiceGerarCodigo(){return String(clienteRepositoryMaiorCodigo()+1).padStart(3,"0");}
/** Lista clientes para o cadastro. @return {Array<Object>} Clientes. */
function clienteServiceListar(){return clienteRepositoryListar();}
/** Valida vínculos e duplicidade do cadastro. @param {Object} d Dados. @param {string=} codigoIgnorado Código ignorado. */
function clienteServiceValidarReferencias(d,codigoIgnorado){if(!clienteRepositoryCidadeExiste(d.codigoCidade))throw new Error("A cidade selecionada não está cadastrada.");if(!clienteRepositoryBairroPertenceCidade(d.codigoBairro,d.codigoCidade))throw new Error("O bairro selecionado não pertence à cidade informada.");if(clienteRepositoryCpfExiste(d.cpf,codigoIgnorado))throw new Error("Este CPF já está cadastrado.");}
/** Cria cliente preservando validações históricas. @param {Object} dados Dados do cliente. @return {Object} Resultado. */
function clienteServiceCriarCadastro(dados){const l=LockService.getScriptLock();l.waitLock(10000);try{const d=clienteValidatorValidarCadastro(dados);if(clienteRepositoryLinha(d.codigo)>1)throw new Error("O código "+d.codigo+" já está cadastrado.");clienteServiceValidarReferencias(d);clienteRepositoryInserirCadastro(d);return{sucesso:true,mensagem:"Cliente cadastrado com sucesso."};}finally{l.releaseLock();}}
/** Atualiza cadastro sem alterar código. @param {Object} dados Dados completos. @return {Object} Resultado. */
function clienteServiceAtualizarCadastro(dados){const l=LockService.getScriptLock();l.waitLock(10000);try{const d=clienteValidatorValidarCadastro(dados),linha=clienteRepositoryLinha(d.codigo);if(linha<2)throw new Error("Cliente não encontrado.");clienteServiceValidarReferencias(d,d.codigo);clienteRepositoryAtualizarCadastro(linha,d);return{sucesso:true,mensagem:"Cliente atualizado com sucesso."};}finally{l.releaseLock();}}
/** Exclui cliente sem agendamentos. @param {string} codigo Código. @return {Object} Resultado. */
function clienteServiceExcluirCadastro(codigo){const l=LockService.getScriptLock();l.waitLock(10000);try{const id=String(codigo||"").trim(),linha=clienteRepositoryLinha(id);if(!id)throw new Error("O código do cliente é obrigatório.");if(linha<2)throw new Error("Cliente não encontrado.");clienteRulesValidarExclusao(id,clienteRepositoryPossuiAgendamentos(id));clienteRepositoryExcluir(linha);return{sucesso:true,mensagem:"Cliente excluído com sucesso."};}finally{l.releaseLock();}}
