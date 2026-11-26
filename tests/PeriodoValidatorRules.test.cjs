const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const contexto = {};
for (const arquivo of ["PeriodoValidator.gs", "PeriodoRules.gs"]) {
  vm.runInNewContext(fs.readFileSync(arquivo, "utf8"), contexto);
}

test("normaliza descrição, horários e situação do período", () => {
  const dados = contexto.periodoValidatorDados("  Manhã   ", "08:00", "12:00", true);
  assert.equal(dados.descricao, "Manhã");
  assert.equal(dados.horaInicial, "08:00");
  assert.equal(dados.horaFinal, "12:00");
  assert.equal(dados.ativo, true);
  assert.equal(contexto.periodoValidatorDados("Tarde", "13:00", "17:00", "false").ativo, false);
});

test("rejeita descrição vazia, horário inválido e situação inválida", () => {
  assert.throws(() => contexto.periodoValidatorDados("", "08:00", "12:00", true), /descrição/);
  assert.throws(() => contexto.periodoValidatorDados("Manhã", "8:00", "12:00", true), /horário válido/);
  assert.throws(() => contexto.periodoValidatorDados("Manhã", "08:00", "12:00", "talvez"), /situação/);
});

test("impede intervalo com hora final igual ou anterior à inicial", () => {
  assert.throws(() => contexto.periodoRulesValidarIntervalo({horaInicial:"08:00",horaFinal:"08:00"}), /posterior/);
  assert.throws(() => contexto.periodoRulesValidarIntervalo({horaInicial:"13:00",horaFinal:"12:00"}), /posterior/);
});

test("preserva os dados históricos de período vinculado", () => {
  const atual = {descricao:"Manhã",horaInicial:"08:00",horaFinal:"12:00"};
  assert.doesNotThrow(() => contexto.periodoRulesValidarEdicaoComVinculos("001", atual, {...atual,ativo:false}, true));
  assert.throws(() => contexto.periodoRulesValidarEdicaoComVinculos("001", atual, {...atual,horaFinal:"11:00"}, true), /preservar o histórico/);
});

test("define exclusão física sem vínculo e inativação com vínculo", () => {
  assert.equal(contexto.periodoRulesDefinirAcaoExclusao(false), "EXCLUIR");
  assert.equal(contexto.periodoRulesDefinirAcaoExclusao(true), "INATIVAR");
});
