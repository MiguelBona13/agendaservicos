/**
 * Entidade: Serviço
 * Camada: Validator — Validador
 *
 * Responsabilidade:
 * Validar e normalizar os dados recebidos para operações CRUD de serviços.
 *
 * Dependências principais: nenhuma.
 */

/** Valida o código do serviço.
 * @param {*} codigo Código informado.
 * @return {string} Código normalizado.
 */
function servicoValidatorValidarCodigo(codigo) {
  const valor = String(codigo == null ? "" : codigo).trim();
  if (!valor) throw new Error("O código do serviço é obrigatório.");
  return valor;
}

/** Valida o nome do serviço.
 * @param {*} nome Nome informado.
 * @return {string} Nome normalizado.
 */
function servicoValidatorValidarNome(nome) {
  const valor = String(nome == null ? "" : nome).trim().replace(/\s+/g, " ");
  if (!valor) throw new Error("O nome do serviço é obrigatório.");
  if (valor.length > 120) throw new Error("O nome do serviço deve ter até 120 caracteres.");
  return valor;
}

/** Valida o valor monetário do serviço.
 * @param {*} valor Valor informado.
 * @return {number} Valor numérico não negativo.
 */
function servicoValidatorValidarValor(valor) {
  if (valor === "" || valor === null || valor === undefined) {
    throw new Error("O valor do serviço é obrigatório.");
  }
  const numero = typeof valor === "number" ? valor : Number(String(valor).replace(",", "."));
  if (!Number.isFinite(numero)) throw new Error("O valor do serviço deve ser numérico.");
  if (numero < 0) throw new Error("O valor do serviço não pode ser negativo.");
  return numero;
}
