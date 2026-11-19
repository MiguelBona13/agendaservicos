/**
 * Testes unitários das regras de previsão de faltas por Regressão Logística.
 *
 * Entidade: Agendamento.
 * Camada: Testes de Rules — classificador probabilístico.
 *
 * Objetivo:
 * Verificar treinamento temporal, probabilidade, faixas de risco e histórico
 * insuficiente, sem depender do Google Apps Script ou Google Sheets.
 *
 * Dependências:
 * - AgendamentoRegressaoLogisticaRules.gs;
 * - Node.js: node:test, node:assert/strict, node:fs, node:path e node:vm.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function carregarRegras() {
  const contexto = { Date, Number, String, Math, Infinity, isFinite, Array, Object, Set };
  vm.createContext(contexto);
  vm.runInContext(
    fs.readFileSync(
      path.join(__dirname, "..", "AgendamentoRegressaoLogisticaRules.gs"),
      "utf8"
    ),
    contexto,
    { filename: "AgendamentoRegressaoLogisticaRules.gs" }
  );
  return contexto;
}

const AGORA = new Date("2026-12-10T12:00:00");

function criarRegistro(status, cliente, data = "2026-11-01", indice = 0) {
  return {
    codigo: String(indice + 1),
    data: data,
    hora: "10:00",
    dataCadastro: "2026-10-01",
    codigoCliente: cliente,
    codigoServico: "S01",
    codigoFuncionario: "F01",
    codigoPeriodo: "P01",
    valor: 100,
    status: status
  };
}

function criarHistorico() {
  const registros = [];
  for (let indice = 0; indice < 10; indice++) {
    registros.push(criarRegistro("Faltou", "C-FALTA", "2026-11-01", indice));
    registros.push(criarRegistro("Compareceu", "C-OK", "2026-11-02", indice + 10));
  }
  return registros;
}

function criarAlvo(cliente = "C-FALTA") {
  return {
    data: "2026-12-20",
    hora: "10:00",
    dataCadastro: "2026-12-01",
    codigoCliente: cliente,
    codigoServico: "S01",
    codigoFuncionario: "F01",
    codigoPeriodo: "P01",
    valor: 100,
    status: "Agendado"
  };
}

test("treina com pelo menos vinte resultados reais e duas classes", () => {
  const regras = carregarRegras();
  const modelo = regras.agendamentoRegressaoLogisticaRulesTreinar(criarHistorico(), AGORA);
  assert.equal(modelo.treinado, true);
  assert.equal(modelo.amostras, 20);
  assert.equal(modelo.faltas, 10);
  assert.equal(modelo.comparecimentos, 10);
});

test("retorna probabilidade entre zero e um e percentual de falta", () => {
  const regras = carregarRegras();
  const modelo = regras.agendamentoRegressaoLogisticaRulesTreinar(criarHistorico(), AGORA);
  const resultado = regras.agendamentoRegressaoLogisticaRulesPrever(
    criarAlvo("C-FALTA"), modelo, AGORA
  );
  assert.equal(resultado.disponivel, true);
  assert.ok(resultado.probabilidade >= 0 && resultado.probabilidade <= 1);
  assert.equal(resultado.percentual, Math.round(resultado.probabilidade * 100));
  assert.match(resultado.texto, /^\d+% — Risco (baixo|moderado|alto)$/);
});

test("reconhece probabilidades diferentes para categorias com históricos distintos", () => {
  const regras = carregarRegras();
  const modelo = regras.agendamentoRegressaoLogisticaRulesTreinar(criarHistorico(), AGORA);
  const risco = regras.agendamentoRegressaoLogisticaRulesPrever(
    criarAlvo("C-FALTA"), modelo, AGORA
  );
  const seguro = regras.agendamentoRegressaoLogisticaRulesPrever(
    criarAlvo("C-OK"), modelo, AGORA
  );
  assert.ok(risco.probabilidade > seguro.probabilidade);
});

test("não treina com menos de vinte exemplos ou sem as duas classes", () => {
  const regras = carregarRegras();
  const poucos = regras.agendamentoRegressaoLogisticaRulesTreinar(
    criarHistorico().slice(0, 19), AGORA
  );
  const umaClasse = regras.agendamentoRegressaoLogisticaRulesTreinar(
    Array.from({ length: 20 }, (_, indice) =>
      criarRegistro("Faltou", "C-FALTA", "2026-11-01", indice)
    ),
    AGORA
  );
  assert.equal(poucos.treinado, false);
  assert.equal(umaClasse.treinado, false);
});

test("exclui agendamentos pendentes, cancelados, reagendados e futuros do treinamento", () => {
  const regras = carregarRegras();
  const historico = criarHistorico().slice(0, 19).concat([
    criarRegistro("Agendado", "C-FALTA"),
    criarRegistro("Cancelado", "C-FALTA"),
    criarRegistro("Reagendado", "C-FALTA"),
    criarRegistro("Faltou", "C-FALTA", "2026-12-25")
  ]);
  const modelo = regras.agendamentoRegressaoLogisticaRulesTreinar(historico, AGORA);
  assert.equal(modelo.amostras, 19);
  assert.equal(modelo.treinado, false);
});

test("não prevê agendamento cujo horário já começou", () => {
  const regras = carregarRegras();
  const modelo = regras.agendamentoRegressaoLogisticaRulesTreinar(criarHistorico(), AGORA);
  const resultado = regras.agendamentoRegressaoLogisticaRulesPrever(
    { ...criarAlvo(), data: "2026-12-01" }, modelo, AGORA
  );
  assert.equal(resultado.disponivel, false);
  assert.equal(resultado.classe, "indisponivel");
});

test("aceita data brasileira e horário HH:mm", () => {
  const regras = carregarRegras();
  assert.notEqual(
    regras.agendamentoRegressaoLogisticaRulesTimestamp("20/12/2026", "10:00"),
    null
  );
});

test("não utiliza código do agendamento nem Status como características", () => {
  const regras = carregarRegras();
  const caracteristicas = regras.agendamentoRegressaoLogisticaRulesExtrairCaracteristicas({
    ...criarRegistro("Faltou", "C-FALTA"),
    codigo: "999999",
    status: "Faltou"
  });
  assert.equal(Object.prototype.hasOwnProperty.call(caracteristicas, "codigo"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(caracteristicas, "status"), false);
});
