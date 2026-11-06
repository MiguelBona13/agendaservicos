/** Testes unitários do validador do webhook e das respostas do WhatsApp. */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const contexto = vm.createContext({
  Date,
  Error,
  String,
  RegExp,
  Number,
  Utilities: {
    formatDate(data) { return data.toISOString().slice(0, 10); }
  }
});
vm.runInContext(
  fs.readFileSync(path.join(__dirname, "..", "AgendamentoWhatsAppValidator.gs"), "utf8"),
  contexto,
  { filename: "AgendamentoWhatsAppValidator.gs" }
);

test("normaliza o telefone WhatsApp brasileiro para comparar com CLIENTES", () => {
  assert.equal(
    contexto.agendamentoWhatsAppValidatorNormalizarTelefone("whatsapp:+5567991234567"),
    "67991234567"
  );
});

test("rejeita remetente que não seja WhatsApp brasileiro", () => {
  assert.throws(
    () => contexto.agendamentoWhatsAppValidatorNormalizarTelefone("+14155552671"),
    /remetente.*inválido|disponível para números do Brasil/i
  );
});

test("valida datas reais no formato brasileiro e recusa datas passadas", () => {
  const agora = new Date("2026-11-05T12:00:00Z");
  assert.equal(
    contexto.agendamentoWhatsAppValidatorValidarData("06/11/2026", agora, "Etc/UTC"),
    "2026-11-06"
  );
  assert.throws(
    () => contexto.agendamentoWhatsAppValidatorValidarData("31/02/2026", agora, "Etc/UTC"),
    /não existe/
  );
  assert.throws(
    () => contexto.agendamentoWhatsAppValidatorValidarData("04/11/2026", agora, "Etc/UTC"),
    /data passada/
  );
});

test("escapa caracteres XML antes de compor a resposta TwiML", () => {
  assert.equal(
    contexto.agendamentoWhatsAppValidatorEscaparXml("A&B <C>"),
    "A&amp;B &lt;C&gt;"
  );
});
