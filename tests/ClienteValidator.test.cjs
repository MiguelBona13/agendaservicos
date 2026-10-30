/**
 * Testes unitários do validador de e-mail do Cliente.
 *
 * Entidade: Cliente
 * Camada: Testes — validação isolada dos dados de e-mail.
 *
 * Objetivo:
 * Carregar ClienteValidator.gs em um contexto Node.js sem acessar serviços
 * do Google Apps Script ou dados reais.
 *
 * Dependências:
 * - ClienteValidator.gs;
 * - Node.js: node:test, node:assert/strict, node:fs, node:path e node:vm.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const fonteValidator = fs.readFileSync(
  path.join(__dirname, "..", "ClienteValidator.gs"),
  "utf8"
);

function carregarClienteValidator() {
  const contexto = {};
  vm.createContext(contexto);
  vm.runInContext(fonteValidator, contexto, {
    filename: "ClienteValidator.gs"
  });
  return contexto;
}

test("normaliza o código do cliente", () => {
  const validator = carregarClienteValidator();

  assert.equal(
    validator.clienteValidatorValidarCodigoParaEmailTeste(" C001 "),
    "C001"
  );
});

test("rejeita código de cliente vazio", () => {
  const validator = carregarClienteValidator();

  assert.throws(
    () => validator.clienteValidatorValidarCodigoParaEmailTeste(" "),
    /Selecione um cliente/
  );
});

test("aceita endereço de e-mail com formato válido", () => {
  const validator = carregarClienteValidator();

  assert.equal(
    validator.clienteValidatorValidarEmail(" cliente@exemplo.com "),
    "cliente@exemplo.com"
  );
});

test("rejeita e-mail vazio", () => {
  const validator = carregarClienteValidator();

  assert.throws(
    () => validator.clienteValidatorValidarEmail(""),
    /não possui e-mail cadastrado/
  );
});

test("rejeita endereço com formato inválido", () => {
  const validator = carregarClienteValidator();

  assert.throws(
    () => validator.clienteValidatorValidarEmail("cliente@"),
    /formato inválido/
  );
});
