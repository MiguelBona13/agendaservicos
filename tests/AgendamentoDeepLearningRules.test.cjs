const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const arquivos = [
  "AgendamentoDeepLearningRules.gs",
  "AgendamentoDeepLearningValidator.gs"
];
const contexto = {};
arquivos.forEach(arquivo => vm.runInNewContext(fs.readFileSync(arquivo, "utf8"), contexto));

test("completa dias sem cadastro com zero e agrega datas repetidas", () => {
  const serie = contexto.agendamentoDeepLearningRulesCompletarSerie([
    { data: "2026-01-01", quantidade: 2 },
    { data: "2026-01-01", quantidade: 1 },
    { data: "2026-01-03", quantidade: 4 }
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(serie)), [
    { data: "2026-01-01", quantidade: 3 },
    { data: "2026-01-02", quantidade: 0 },
    { data: "2026-01-03", quantidade: 4 }
  ]);
});

test("gera atributos cíclicos e média dos dias anteriores", () => {
  const historico = Array.from({ length: 7 }, (_, i) => ({
    data: "2026-01-" + String(i + 1).padStart(2, "0"), quantidade: i + 1
  }));
  const atributos = contexto.agendamentoDeepLearningRulesExtrairAtributos(historico, "2026-01-08", 7);
  assert.equal(atributos.length, 3);
  assert.ok(Math.abs(atributos[2] - 4) < 1e-12);
});

test("treinamento é reproduzível com a mesma semente", () => {
  const amostras = Array.from({ length: 15 }, (_, i) => ({
    entrada: [Math.sin(i), Math.cos(i), i / 3],
    alvo: i % 4
  }));
  const parametros = {
    neuroniosOcultos: 4, epocas: 20, taxaAprendizado: 0.03,
    ativacao: "tanh", semente: 123
  };
  const primeiro = contexto.agendamentoDeepLearningRulesTreinarRede(amostras, parametros);
  const segundo = contexto.agendamentoDeepLearningRulesTreinarRede(amostras, parametros);
  assert.deepEqual(JSON.parse(JSON.stringify(primeiro)), JSON.parse(JSON.stringify(segundo)));
});

test("rede treina pesos e registra erro por época", () => {
  const amostras = Array.from({ length: 12 }, (_, i) => ({
    entrada: [i / 10, (i % 7) / 7, i],
    alvo: i % 5
  }));
  const modelo = contexto.agendamentoDeepLearningRulesTreinarRede(amostras, {
    neuroniosOcultos: 5, epocas: 25, taxaAprendizado: 0.05,
    ativacao: "tanh", semente: 12345
  });
  assert.equal(modelo.historicoErro.length, 25);
  assert.ok(modelo.rede.pesosOcultos.some(linha => linha.some(peso => peso !== 0)));
});

test("experimento faz previsão recursiva não negativa para dez dias", () => {
  const serie = Array.from({ length: 80 }, (_, i) => ({
    data: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
    quantidade: (i % 7) + (i % 4 === 0 ? 2 : 0)
  }));
  const resultado = contexto.agendamentoDeepLearningRulesExecutarExperimento(serie, {
    neuroniosOcultos: 5, epocas: 40, taxaAprendizado: 0.03,
    janelaHistorica: 7, percentualTreinamento: 80, ativacao: "tanh",
    semente: 12345, horizontePrevisao: 10
  });
  assert.equal(resultado.previsoes.length, 10);
  assert.ok(resultado.previsoes.every(item => item.previsao >= 0));
  assert.equal(resultado.dataReferencia, serie[serie.length - 1].data);
  assert.ok(Number.isFinite(resultado.maeRede));
  assert.ok(resultado.origensAvaliadas >= 1);
  assert.ok(Number.isFinite(resultado.maeRedeHorizonte));
  assert.ok(Number.isFinite(resultado.maeMediaHorizonte));
  assert.ok(Number.isFinite(resultado.maeMedia));
});

test("rejeita histórico insuficiente", () => {
  assert.throws(() => contexto.agendamentoDeepLearningRulesExecutarExperimento([], {
    janelaHistorica: 7
  }), /Histórico insuficiente/);
});

test("valida limites e valores de parâmetros", () => {
  const padrao = contexto.agendamentoDeepLearningValidatorValidarParametros({});
  assert.equal(padrao.neuroniosOcultos, 5);
  assert.equal(padrao.epocas, 500);
  assert.equal(padrao.horizontePrevisao, 10);
  assert.throws(() => contexto.agendamentoDeepLearningValidatorValidarParametros({ epocas: 0 }), /epocas/);
  assert.throws(() => contexto.agendamentoDeepLearningValidatorValidarParametros({ ativacao: "sigmoid" }), /ativação/);
});
