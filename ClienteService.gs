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
