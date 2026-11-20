/**
 * Testes unitários do FuncionarioValidator.
 * Entidade: Funcionário | Camada: Validator.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const fonte = fs.readFileSync(path.join(__dirname, "..", "FuncionarioValidator.gs"), "utf8");
function carregar() { const contexto = {}; vm.createContext(contexto); vm.runInContext(fonte, contexto); return contexto; }
test("normaliza código e nome", () => {
  const c = carregar();
  assert.equal(c.funcionarioValidatorValidarCodigo(" 007 "), "007");
  assert.equal(c.funcionarioValidatorValidarNome("  Ana   Souza "), "Ana Souza");
});
test("rejeita código vazio", () => assert.throws(() => carregar().funcionarioValidatorValidarCodigo(" "), /código.*obrigatório/i));
test("rejeita nome vazio", () => assert.throws(() => carregar().funcionarioValidatorValidarNome(" "), /nome.*obrigatório/i));
test("rejeita nome acima do limite", () => assert.throws(() => carregar().funcionarioValidatorValidarNome("A".repeat(121)), /120 caracteres/));
