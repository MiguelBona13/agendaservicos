/**
 * Testes unitários das regras e validações dos campos usados pelo K-NN.
 *
 * Entidade: Agendamento
 * Camada: Testes unitários.
 *
 * Objetivo:
 * Verificar os status elegíveis, a proteção contra resultados futuros e a
 * exclusão de cancelados/reagendados da regra de conflito.
 *
 * Dependências:
 * - AgendamentoRules.gs;
 * - AgendamentoValidator.gs;
 * - Node.js: node:test, node:assert/strict, node:fs, node:path e node:vm.
 *
 * Não acessa Google Sheets nem serviços reais do Apps Script.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function carregarFonte(nomeArquivo, extras = {}) {
  const fonte = fs.readFileSync(path.join(__dirname, "..", nomeArquivo), "utf8");
  const contexto = {
    Date,
    isNaN,
    Utilities: {
      formatDate(data, zona, formato) {
        const iso = data.toISOString();
        if (formato === "yyyy-MM-dd HH:mm") return iso.slice(0, 16).replace("T", " ");
        if (formato === "HH:mm") return iso.slice(11, 16);
        if (formato === "dd/MM/yyyy") return iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4);
        return iso.slice(0, 10);
      }
    },
    Session: { getScriptTimeZone: () => "Etc/UTC" },
    ...extras
  };
  vm.createContext(contexto);
  vm.runInContext(fonte, contexto, { filename: nomeArquivo });
  return contexto;
}

test("aceita os cinco status previstos para a agenda", () => {
  const regras = carregarFonte("AgendamentoRules.gs");
  for (const status of ["Agendado", "Compareceu", "Faltou", "Cancelado", "Reagendado"]) {
    assert.doesNotThrow(() => regras.agendamentoRulesValidarStatus(status, "2000-01-01", "09:00"));
  }
});

test("não permite registrar comparecimento antes do horário agendado", () => {
  const regras = carregarFonte("AgendamentoRules.gs");
  assert.throws(
    () => regras.agendamentoRulesValidarStatus("Compareceu", "2999-12-31", "09:00"),
    /só pode ser registrado após/
  );
});

test("não permite registrar falta antes do horário agendado", () => {
  const regras = carregarFonte("AgendamentoRules.gs");
  assert.throws(
    () => regras.agendamentoRulesValidarStatus("Faltou", "2999-12-31", "09:00"),
    /só pode ser registrado após/
  );
});

test("ignora o próprio agendamento durante a verificação de conflito na edição", () => {
  const regras = carregarFonte("AgendamentoRules.gs");
  const existente = ["001", "2026-01-01", "P01", "F01", "C01", "S01", 100, "Agendado"];
  assert.doesNotThrow(() => regras.agendamentoRulesValidarConflito({
    data: "2026-01-01",
    codigoPeriodo: "P01",
    codigoFuncionario: "F01",
    codigoCliente: "C01",
    codigoIgnorado: "001"
  }, [existente]));
});

test("cancelados e reagendados não bloqueiam o horário", () => {
  const regras = carregarFonte("AgendamentoRules.gs");
  const cancelado = ["001", "2026-01-01", "P01", "F01", "C01", "S01", 100, "Cancelado"];
  const reagendado = ["002", "2026-01-01", "P01", "F01", "C01", "S01", 100, "Reagendado"];
  assert.doesNotThrow(() => regras.agendamentoRulesValidarConflito({
    data: "2026-01-01", codigoPeriodo: "P01",
    codigoFuncionario: "F01", codigoCliente: "C01"
  }, [cancelado, reagendado]));
});

test("valida o status no payload de atualização", () => {
  const validator = carregarFonte("AgendamentoValidator.gs");
  const dados = {
    codigo: "001", data: "2026-01-01", codigoPeriodo: "P01",
    codigoFuncionario: "F01", codigoCliente: "C01", codigoServico: "S01",
    status: "Compareceu"
  };
  assert.equal(validator.agendamentoValidatorValidarDadosAtualizacao(dados).status, "Compareceu");
  assert.throws(
    () => validator.agendamentoValidatorValidarDadosAtualizacao({ ...dados, status: "Desconhecido" }),
    /status válido/
  );
});


test("normaliza horários armazenados como Date ou texto para HH:mm", () => {
  const regras = carregarFonte("AgendamentoRules.gs");
  const horaPlanilha = new Date("1899-12-30T12:30:00.000Z");
  assert.equal(regras.agendamentoRulesNormalizarHora(horaPlanilha), "12:30");
  assert.equal(regras.agendamentoRulesNormalizarHora("08:30:00"), "08:30");
  assert.equal(regras.agendamentoRulesNormalizarHora("valor inválido"), "");
});

test("normaliza datas de cadastro para dd/MM/yyyy", () => {
  const regras = carregarFonte("AgendamentoRules.gs");
  assert.equal(
    regras.agendamentoRulesNormalizarDataCadastro(new Date("2026-04-28T00:00:00.000Z")),
    "28/04/2026"
  );
  assert.equal(regras.agendamentoRulesNormalizarDataCadastro("2026-04-28 09:15:00"), "28/04/2026");
  assert.equal(regras.agendamentoRulesNormalizarDataCadastro("28/04/2026"), "28/04/2026");
  assert.equal(regras.agendamentoRulesNormalizarDataCadastro("inválida"), "");
});
