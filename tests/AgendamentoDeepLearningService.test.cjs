const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const contexto = {
  agendamentoDeepLearningRepositoryListarObservacoes: () => ({
    observacoes: Array.from({ length: 50 }, (_, i) => ({
      data: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
      quantidade: i % 5
    })),
    mapeamento: { aba: "AGENDA", colunaDataCadastro: 10, cabecalhoDataCadastro: "Data_Cadastro" },
    qualidade: { linhasLidas: 50, registrosContabilizados: 50, datasInvalidas: [], datasVazias: [], linhasDuplicadas: [] }
  })
};
[
  "AgendamentoDeepLearningRules.gs",
  "AgendamentoDeepLearningValidator.gs",
  "AgendamentoDeepLearningService.gs"
].forEach(arquivo => vm.runInNewContext(fs.readFileSync(arquivo, "utf8"), contexto));

test("diagnóstico retorna série, mapeamento e qualidade", () => {
  const resultado = contexto.agendamentoDeepLearningServiceObterDiagnostico();
  assert.equal(resultado.disponivel, true);
  assert.equal(resultado.mapeamento.colunaDataCadastro, 10);
  assert.ok(resultado.diasAnalisados >= 50);
});

test("service treina com parâmetros válidos e devolve data do treinamento", () => {
  const resultado = contexto.agendamentoDeepLearningServiceTreinar({ epocas: 15 });
  assert.ok(resultado.treinadoEm);
  assert.equal(resultado.parametros.epocas, 15);
  assert.equal(resultado.resultado.previsoes.length, 10);
});
