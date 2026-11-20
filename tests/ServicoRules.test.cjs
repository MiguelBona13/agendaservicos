/**
 * Testes unitários das regras de exclusão de Serviço.
 * Entidade: Serviço | Camada: Rules.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const fonte = fs.readFileSync(path.join(__dirname, "..", "ServicoRules.gs"), "utf8");
function carregar() { const contexto = {}; vm.createContext(contexto); vm.runInContext(fonte, contexto); return contexto; }
test("permite exclusão sem agendamentos vinculados", () => {
  assert.doesNotThrow(() => carregar().servicoRulesValidarExclusao("007", false));
});
test("impede exclusão quando há agendamentos vinculados", () => {
  assert.throws(() => carregar().servicoRulesValidarExclusao("007", true), /agendamentos vinculados/);
});
