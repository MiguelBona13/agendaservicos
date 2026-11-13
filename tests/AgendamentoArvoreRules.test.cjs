/**
 * Testes unitários das regras da árvore de decisão de risco de falta.
 *
 * Entidade: Agendamento.
 * Camada: Testes de Rules — modelo CART.
 *
 * Objetivo:
 * Verificar treino temporal, tratamento de categorias nominais, classificação
 * e exclusão de estados que não representam resultados reais.
 *
 * Dependências:
 * - AgendamentoArvoreRules.gs;
 * - Node.js: node:test, node:assert/strict, node:fs, node:path e node:vm.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function carregarRegras() {
  const contexto = { Date, Number, String, Math, Infinity, isFinite, Array, Object };
  vm.createContext(contexto);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "..", "AgendamentoArvoreRules.gs"), "utf8"),
    contexto,
    { filename: "AgendamentoArvoreRules.gs" }
  );
  return contexto;
}

const AGORA = new Date("2026-12-10T12:00:00");

function criarHistorico(status, cliente, data = "2026-11-01") {
  return {
    data,
    hora: "10:00",
    dataCadastro: "2026-10-01",
    codigoCliente: cliente,
    codigoServico: "S01",
    codigoFuncionario: "F01",
    codigoPeriodo: "P01",
    valor: 100,
    status
  };
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

function criarHistoricoSeparado() {
  return [
    criarHistorico("Faltou", "C-FALTA"),
    criarHistorico("Faltou", "C-FALTA"),
    criarHistorico("Faltou", "C-FALTA"),
    criarHistorico("Faltou", "C-FALTA"),
    criarHistorico("Faltou", "C-FALTA"),
    criarHistorico("Compareceu", "C-OK"),
    criarHistorico("Compareceu", "C-OK"),
    criarHistorico("Compareceu", "C-OK"),
    criarHistorico("Compareceu", "C-OK"),
    criarHistorico("Compareceu", "C-OK")
  ];
}

test("identifica risco de falta por categoria de cliente sem ordenar códigos", () => {
  const regras = carregarRegras();
  const modelo = regras.agendamentoArvoreRulesTreinar(criarHistoricoSeparado(), AGORA);
  const resultado = regras.agendamentoArvoreRulesPrever(criarAlvo("C-FALTA"), modelo, AGORA);
  assert.equal(resultado.classe, "risco");
  assert.equal(resultado.texto, "Risco de falta");
  assert.equal(resultado.amostras, 10);
});

test("não exibe classe de comparecimento quando a folha não indica risco", () => {
  const regras = carregarRegras();
  const modelo = regras.agendamentoArvoreRulesTreinar(criarHistoricoSeparado(), AGORA);
  const resultado = regras.agendamentoArvoreRulesPrever(criarAlvo("C-OK"), modelo, AGORA);
  assert.equal(resultado.classe, "sem_risco");
  assert.equal(resultado.texto, "Sem risco de falta identificado");
});

test("não treina com menos de oito resultados reais válidos", () => {
  const regras = carregarRegras();
  const modelo = regras.agendamentoArvoreRulesTreinar(
    criarHistoricoSeparado().slice(0, 7), AGORA
  );
  const resultado = regras.agendamentoArvoreRulesPrever(criarAlvo(), modelo, AGORA);
  assert.equal(modelo.raiz, null);
  assert.match(resultado.texto, /histórico insuficiente \(7\/8\)/);
});

test("exclui Agendado, Cancelado, Reagendado e atendimentos futuros do treino", () => {
  const regras = carregarRegras();
  const historico = criarHistoricoSeparado().slice(0, 7).concat([
    criarHistorico("Agendado", "C-FALTA"),
    criarHistorico("Cancelado", "C-FALTA"),
    criarHistorico("Reagendado", "C-FALTA"),
    criarHistorico("Faltou", "C-FALTA", "2026-12-25")
  ]);
  const modelo = regras.agendamentoArvoreRulesTreinar(historico, AGORA);
  assert.equal(modelo.amostras, 7);
  assert.equal(modelo.raiz, null);
});

test("não classifica agendamento cujo horário já começou", () => {
  const regras = carregarRegras();
  const modelo = regras.agendamentoArvoreRulesTreinar(criarHistoricoSeparado(), AGORA);
  const alvo = { ...criarAlvo(), data: "2026-12-01" };
  const resultado = regras.agendamentoArvoreRulesPrever(alvo, modelo, AGORA);
  assert.equal(resultado.classe, "indisponivel");
  assert.match(resultado.texto, /horário já iniciado/);
});

test("aceita data brasileira e horário HH:mm", () => {
  const regras = carregarRegras();
  assert.notEqual(
    regras.agendamentoArvoreRulesTimestamp("20/12/2026", "10:00"),
    null
  );
});

test("não utiliza código do agendamento nem Status como característica", () => {
  const regras = carregarRegras();
  const caracteristicas = regras.agendamentoArvoreRulesExtrairCaracteristicas({
    ...criarHistorico("Faltou", "C-FALTA"),
    codigo: "999999",
    status: "Faltou"
  });
  assert.equal(Object.prototype.hasOwnProperty.call(caracteristicas, "codigo"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(caracteristicas, "status"), false);
});
