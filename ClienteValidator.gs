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
