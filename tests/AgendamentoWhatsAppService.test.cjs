/**
 * Testes unitários do fluxo de agendamento via WhatsApp.
 *
 * Entidade: Agendamento via WhatsApp
 * Objetivo: Exercitar a conversa com dependências externas simuladas, sem
 * acessar Twilio, Google Sheets ou a conta real do usuário.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function carregarServico(overrides = {}) {
  const conversas = new Map();
  let dadosCriacao = null;
  const periodo = {
    codigo: "P01",
    descricao: "09:00 às 10:00",
    horaInicial: "09:00",
    horaFinal: "10:00",
    ativo: true
  };
  const contexto = {
    Date,
    Error,
    String,
    RegExp,
    Number,
    Object,
    Array,
    Utilities: {
      formatDate(data) { return data.toISOString().slice(0, 10); }
    },
    Session: { getScriptTimeZone: () => "Etc/UTC" },
    CONFIG: { ABAS: { SERVICOS: "SERVICOS", FUNCIONARIOS: "FUNCIONARIOS" } },
    agendamentoWhatsAppRepositoryBuscarClientePorTelefone: () => ({
      codigo: "C01",
      nome: "Ana Cliente"
    }),
    agendamentoWhatsAppRepositoryObterConversa: telefone => conversas.get(telefone) || null,
    agendamentoWhatsAppRepositorySalvarConversa: (telefone, conversa) => conversas.set(telefone, conversa),
    agendamentoWhatsAppRepositoryLimparConversa: telefone => conversas.delete(telefone),
    agendamentoRepositoryLerCodigoNome: nomeAba => nomeAba === "SERVICOS"
      ? [{ codigo: "S01", nome: "Corte" }]
      : [{ codigo: "F01", nome: "Bia Profissional" }],
    agendamentoRepositoryListarRegistrosParaConflito: () => [],
    consultarPeriodos: () => [periodo],
    agendamentoRulesValidarConflito() {},
    gerarCodigoAgendamento: () => "AG001",
    criarAgendamento: (...args) => {
      dadosCriacao = args;
      return { sucesso: true, mensagem: "Agendamento cadastrado com sucesso." };
    },
    ...overrides
  };

  for (const arquivo of [
    "AgendamentoWhatsAppValidator.gs",
    "AgendamentoWhatsAppRules.gs",
    "AgendamentoWhatsAppService.gs"
  ]) {
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, "..", arquivo), "utf8"),
      vm.createContext(contexto),
      { filename: arquivo }
    );
  }

  return {
    contexto,
    conversas,
    obterDadosCriacao: () => dadosCriacao
  };
}

test("identifica o cliente e conclui o agendamento somente após confirmação", () => {
  const ambiente = carregarServico();
  const telefone = "whatsapp:+5567999999999";

  assert.match(
    ambiente.contexto.agendamentoWhatsAppServiceProcessarMensagem(telefone, "agendar"),
    /Escolha um serviço/
  );
  assert.match(
    ambiente.contexto.agendamentoWhatsAppServiceProcessarMensagem(telefone, "1"),
    /escolha o profissional/i
  );
  assert.match(
    ambiente.contexto.agendamentoWhatsAppServiceProcessarMensagem(telefone, "1"),
    /DD\/MM\/AAAA/
  );
  assert.match(
    ambiente.contexto.agendamentoWhatsAppServiceProcessarMensagem(telefone, "01/01/2099"),
    /09:00 às 10:00/
  );
  assert.match(
    ambiente.contexto.agendamentoWhatsAppServiceProcessarMensagem(telefone, "1"),
    /Responda \*1\* para confirmar/
  );
  assert.equal(ambiente.obterDadosCriacao(), null);

  const resposta = ambiente.contexto.agendamentoWhatsAppServiceProcessarMensagem(telefone, "1");
  assert.match(resposta, /AG001/);
  assert.deepEqual(ambiente.obterDadosCriacao(), [
    "AG001", "2099-01-01", "P01", "F01", "C01", "S01"
  ]);
  assert.equal(ambiente.conversas.has("5567999999999"), false);
});

test("não inicia o fluxo para um telefone sem cadastro", () => {
  const ambiente = carregarServico({
    agendamentoWhatsAppRepositoryBuscarClientePorTelefone: () => null
  });
  const resposta = ambiente.contexto.agendamentoWhatsAppServiceProcessarMensagem(
    "whatsapp:+5567999999999",
    "agendar"
  );

  assert.match(resposta, /precisa estar cadastrado/i);
  assert.equal(ambiente.obterDadosCriacao(), null);
});
