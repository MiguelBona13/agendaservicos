const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const contexto = {
  CONFIG: { ABAS: { AGENDA: "AGENDA" } },
  Session: { getScriptTimeZone: () => "America/Cuiaba" },
  Utilities: { formatDate: date => date.toISOString().slice(0, 10) }
};
vm.runInNewContext(fs.readFileSync("AgendamentoDeepLearningRepository.gs", "utf8"), contexto);

test("normaliza cabeçalhos ignorando acentos e espaços", () => {
  assert.equal(contexto.agendamentoDeepLearningRepositoryNormalizarCabecalho(" Data de Cadastro "), "datadecadastro");
  assert.equal(contexto.agendamentoDeepLearningRepositoryLocalizarColuna(["Código", "Data_Cadastro"], ["data de cadastro"]), 1);
});

test("interpreta datas ISO e brasileiras e rejeita datas impossíveis", () => {
  const normalizar = contexto.agendamentoDeepLearningRepositoryNormalizarDataCadastro;
  assert.equal(normalizar("2026-11-24 15:30:00"), "2026-11-24");
  assert.equal(normalizar("24/11/2026"), "2026-11-24");
  assert.equal(normalizar("31/02/2026"), null);
});

test("mapeia data de cadastro fora de posição fixa e não altera a planilha", () => {
  const valores = [
    ["Código", "Cliente", "Data do atendimento", "Data de Cadastro"],
    ["A1", "Ana", "2026-11-25", "2026-11-20 10:00:00"],
    ["A2", "Bia", "2026-11-26", "2026-11-20 11:00:00"],
    ["A2", "Bia", "2026-11-26", "2026-11-21 11:00:00"],
    ["A4", "Caio", "2026-11-27", "31/02/2026"]
  ];
  let escrita = false;
  contexto.getSheet = () => ({
    getLastRow: () => valores.length,
    getLastColumn: () => valores[0].length,
    getRange: () => ({ getDisplayValues: () => [valores[0]], getValues: () => valores.slice(1) })
  });
  const resultado = contexto.agendamentoDeepLearningRepositoryListarObservacoes();
  assert.equal(resultado.mapeamento.colunaDataCadastro, 4);
  assert.equal(resultado.observacoes.length, 2);
  assert.deepEqual(Array.from(resultado.qualidade.linhasDuplicadas), [4]);
  assert.deepEqual(Array.from(resultado.qualidade.datasInvalidas), [5]);
  assert.equal(escrita, false);
});

test("informa claramente quando não existe coluna de data de cadastro", () => {
  contexto.getSheet = () => ({
    getLastRow: () => 1, getLastColumn: () => 2,
    getRange: () => ({ getDisplayValues: () => [["Código", "Data do atendimento"]] })
  });
  assert.throws(() => contexto.agendamentoDeepLearningRepositoryListarObservacoes(), /Data_Cadastro/);
});
