/**
 * Entidade: Funcionário
 * Camada: Validator — Validador
 *
 * Responsabilidade:
 * Validar e normalizar os dados recebidos para operações CRUD de funcionários.
 *
 * Dependências principais: nenhuma.
 */

/**
 * Valida o código do funcionário.
 * @param {*} codigo Código informado.
 * @return {string} Código normalizado.
 */
function funcionarioValidatorValidarCodigo(codigo) {
  const valor = String(codigo == null ? "" : codigo).trim();
  if (!valor) throw new Error("O código do funcionário é obrigatório.");
  return valor;
}

/**
 * Valida e normaliza o nome do funcionário.
 * @param {*} nome Nome informado.
 * @return {string} Nome normalizado.
 */
function funcionarioValidatorValidarNome(nome) {
  const valor = String(nome == null ? "" : nome).trim().replace(/\s+/g, " ");
  if (!valor) throw new Error("O nome do funcionário é obrigatório.");
  if (valor.length > 120) throw new Error("O nome do funcionário deve ter até 120 caracteres.");
  return valor;
}
