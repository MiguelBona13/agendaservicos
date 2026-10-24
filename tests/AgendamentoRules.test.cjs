/**
 * Testes unitários das regras de Agendamento.
 *
 * Entidade: Agendamento
 * Camada: Testes — validação isolada das regras de negócio.
 *
 * Objetivo:
 * Carregar o fonte real AgendamentoRules.gs em um contexto Node.js e verificar
 * os cenários de conflito sem acessar Google Sheets nem modificar dados reais.
 *
 * Dependências:
 * - AgendamentoRules.gs
 * - Node.js: node:test, node:assert/strict e node:vm.
 *
 * Observação:
 * O ambiente Google Apps Script é simulado apenas nos pontos necessários.
 * Estes testes não substituem testes integrados no Apps Script.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const fonteRules = fs.readFileSync(
  path.join(__dirname, "..", "AgendamentoRules.gs"),
  "utf8"
);

function carregarRegrasAgendamento() {
  const contexto = {
    Utilities: {
      formatDate(data) {
        return data.toISOString().slice(0, 10);
      }
    },
    Session: {
      getScriptTimeZone() {
        return "Etc/UTC";
      }
    },
    Date,
    isNaN
  };

  vm.createContext(contexto);
  vm.runInContext(fonteRules, contexto, {
    filename: "AgendamentoRules.gs"
  });

  return contexto;
}

function criarDadosAgendamento(overrides = {}) {
  return {
    data: "2026-10-23",
    codigoPeriodo: "P01",
    codigoFuncionario: "F01",
    codigoCliente: "C01",
    ...overrides
  };
}

function criarLinhaAgendamento(overrides = {}) {
  const linha = [
    "A01",
    "2026-10-23",
    "P01",
    "F01",
    "C01",
    "Serviço",
    100,
    "Confirmado"
  ];

  for (const [indice, valor] of Object.entries(overrides)) {
    linha[Number(indice)] = valor;
  }

  return linha;
}

test("permite agendamento quando não existem registros", () => {
  const regras = carregarRegrasAgendamento();

  assert.doesNotThrow(() =>
    regras.agendamentoRulesValidarConflito(criarDadosAgendamento(), [])
  );
});

test("rejeita conflito com o mesmo funcionário na mesma data e período", () => {
  const regras = carregarRegrasAgendamento();
  const dados = criarDadosAgendamento({ codigoCliente: "C99" });

  assert.throws(
    () => regras.agendamentoRulesValidarConflito(dados, [criarLinhaAgendamento()]),
    /Conflito de horário/
  );
});

test("rejeita conflito com o mesmo cliente na mesma data e período", () => {
  const regras = carregarRegrasAgendamento();
  const dados = criarDadosAgendamento({ codigoFuncionario: "F99" });

  assert.throws(
    () => regras.agendamentoRulesValidarConflito(dados, [criarLinhaAgendamento()]),
    /Conflito de horário/
  );
});

test("permite reutilizar horário quando o agendamento existente está cancelado", () => {
  const regras = carregarRegrasAgendamento();
  const linhaCancelada = criarLinhaAgendamento({ 7: "Cancelado" });

  assert.doesNotThrow(() =>
    regras.agendamentoRulesValidarConflito(
      criarDadosAgendamento(),
      [linhaCancelada]
    )
  );
});

test("não acusa conflito quando a data ou o período são diferentes", () => {
  const regras = carregarRegrasAgendamento();
  const linhaOutraData = criarLinhaAgendamento({ 1: "2026-10-24" });
  const linhaOutroPeriodo = criarLinhaAgendamento({ 2: "P02" });

  assert.doesNotThrow(() =>
    regras.agendamentoRulesValidarConflito(
      criarDadosAgendamento(),
      [linhaOutraData, linhaOutroPeriodo]
    )
  );
});
