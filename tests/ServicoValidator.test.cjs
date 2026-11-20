/**
 * Testes unitários do ServicoValidator.
 * Entidade: Serviço | Camada: Validator.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const fonte = fs.readFileSync(path.join(__dirname, "..", "ServicoValidator.gs"), "utf8");
function carregar() { const contexto = {}; vm.createContext(contexto); vm.runInContext(fonte, contexto); return contexto; }

test("normaliza código e nome", () => {
  const c = carregar();
  assert.equal(c.servicoValidatorValidarCodigo(" 007 "), "007");
  assert.equal(c.servicoValidatorValidarNome("  Corte   simples "), "Corte simples");
});
test("rejeita código e nome vazios", () => {
  const c = carregar();
  assert.throws(() => c.servicoValidatorValidarCodigo(" "), /código.*obrigatório/i);
  assert.throws(() => c.servicoValidatorValidarNome(" "), /nome.*obrigatório/i);
});
test("valida valor numérico, zero e decimal com vírgula", () => {
  const c = carregar();
  assert.equal(c.servicoValidatorValidarValor(10.5), 10.5);
  assert.equal(c.servicoValidatorValidarValor("12,75"), 12.75);
  assert.equal(c.servicoValidatorValidarValor(0), 0);
});
test("rejeita valor ausente, não numérico e negativo", () => {
  const c = carregar();
  assert.throws(() => c.servicoValidatorValidarValor(""), /obrigatório/);
  assert.throws(() => c.servicoValidatorValidarValor("abc"), /numérico/);
  assert.throws(() => c.servicoValidatorValidarValor(-1), /negativo/);
});
