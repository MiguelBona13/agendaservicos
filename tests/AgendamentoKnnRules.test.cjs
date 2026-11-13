/**
 * Testes unitários das regras de previsão de comparecimento por K-NN.
 *
 * Entidade: Agendamento.
 * Camada: Testes de Rules — regras do modelo.
 *
 * Objetivo:
 * Validar a seleção de históricos concluídos, a exclusão de resultados futuros
 * e a classificação de comparecimento/falta sem acessar Google Sheets.
 *
 * Dependências:
 * - AgendamentoKnnRules.gs;
 * - Node.js: node:test, node:assert/strict, node:fs, node:path e node:vm.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function carregarRegras() {
  const contexto = { Date, Number, String, Math, Infinity, isFinite };
  vm.createContext(contexto);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "..", "AgendamentoKnnRules.gs"), "utf8"),
    contexto,
    { filename: "AgendamentoKnnRules.gs" }
  );
  return contexto;
}

function criarAlvo() {
  return {
    data: "2026-12-20", hora: "10:00",
    codigoCliente: "C01", codigoServico: "S01",
    codigoFuncionario: "F01", codigoPeriodo: "P01",
    valor: 100, dataCadastro: "01/12/2026"
  };
}

function criarHistorico(status, codigoCliente = "C01", dia = "2026-11-20") {
  return {
    data: dia, hora: "10:00", codigoCliente,
    codigoServico: "S01", codigoFuncionario: "F01",
    codigoPeriodo: "P01", valor: 100,
    dataCadastro: "01/11/2026", status
  };
}

test("retorna sem previsão quando há menos de cinco resultados reais", () => {
  const regras = carregarRegras();
  const historico = [
    criarHistorico("Compareceu"),
    criarHistorico("Faltou"),
    criarHistorico("Compareceu"),
    criarHistorico("Cancelado"),
    criarHistorico("Agendado")
  ];
  const resultado = regras.agendamentoKnnRulesPrever(
    criarAlvo(), historico, new Date("2026-12-10T12:00:00")
  );
  assert.match(resultado.texto, /histórico insuficiente/);
  assert.equal(resultado.vizinhos, 2);
});

test("classifica como provável comparecimento quando a maioria dos vizinhos compareceu", () => {
  const regras = carregarRegras();
  const historico = [
    criarHistorico("Compareceu"),
    criarHistorico("Compareceu"),
    criarHistorico("Compareceu"),
    criarHistorico("Compareceu"),
    criarHistorico("Faltou")
  ];
  const resultado = regras.agendamentoKnnRulesPrever(
    criarAlvo(), historico, new Date("2026-12-10T12:00:00")
  );
  assert.equal(resultado.classe, "comparecimento");
  assert.equal(resultado.vizinhos, 5);
});

test("classifica como risco de falta quando a maioria dos vizinhos faltou", () => {
  const regras = carregarRegras();
  const historico = [
    criarHistorico("Faltou"),
    criarHistorico("Faltou"),
    criarHistorico("Faltou"),
    criarHistorico("Faltou"),
    criarHistorico("Compareceu")
  ];
  const resultado = regras.agendamentoKnnRulesPrever(
    criarAlvo(), historico, new Date("2026-12-10T12:00:00")
  );
  assert.equal(resultado.classe, "falta");
  assert.equal(resultado.vizinhos, 5);
});

test("não prevê agendamentos que já começaram", () => {
  const regras = carregarRegras();
  const alvo = { ...criarAlvo(), data: "2026-12-01" };
  const resultado = regras.agendamentoKnnRulesPrever(
    alvo, [], new Date("2026-12-10T12:00:00")
  );
  assert.match(resultado.texto, /horário já iniciado/);
});

test("não usa status pendente, cancelado ou reagendado como rótulo de treinamento", () => {
  const regras = carregarRegras();
  const historico = [
    criarHistorico("Agendado"),
    criarHistorico("Cancelado"),
    criarHistorico("Reagendado"),
    criarHistorico("Compareceu"),
    criarHistorico("Faltou")
  ];
  const resultado = regras.agendamentoKnnRulesPrever(
    criarAlvo(), historico, new Date("2026-12-10T12:00:00")
  );
  assert.equal(resultado.vizinhos, 2);
});
