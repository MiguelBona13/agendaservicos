/** Testes unitários da entrada HTTP do webhook Twilio. */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function carregarWebhook() {
  const saidas = [];
  const mensagens = [];
  const contexto = vm.createContext({
    String,
    Error,
    agendamentoWhatsAppRepositoryObterTokenWebhook: () => "token-seguro",
    agendamentoWhatsAppServiceProcessarMensagem: (from, body) => {
      mensagens.push({ from, body });
      return "Resposta <ok> & válida";
    },
    agendamentoWhatsAppValidatorEscaparXml: texto => String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;"),
    ContentService: {
      MimeType: { XML: "application/xml" },
      createTextOutput: corpo => ({
        corpo,
        setMimeType(tipo) {
          saidas.push({ corpo, tipo });
          return this;
        }
      })
    }
  });
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "..", "AgendamentoWhatsAppWebhook.gs"), "utf8"),
    contexto,
    { filename: "AgendamentoWhatsAppWebhook.gs" }
  );
  return { contexto, mensagens, saidas };
}

test("valida token, encaminha a mensagem e responde em TwiML XML", () => {
  const ambiente = carregarWebhook();
  const resposta = ambiente.contexto.doPost({
    parameter: {
      token: "token-seguro",
      From: "whatsapp:+5567999999999",
      Body: "agendar"
    }
  });

  assert.equal(ambiente.mensagens.length, 1);
  assert.match(resposta.corpo, /<Message>Resposta &lt;ok&gt; &amp; válida<\/Message>/);
  assert.equal(ambiente.saidas[0].tipo, "application/xml");
});

test("não encaminha mensagens com token incorreto", () => {
  const ambiente = carregarWebhook();
  const resposta = ambiente.contexto.doPost({
    parameter: { token: "incorreto", From: "whatsapp:+5567999999999", Body: "agendar" }
  });

  assert.equal(ambiente.mensagens.length, 0);
  assert.match(resposta.corpo, /Não foi possível validar esta solicitação/);
});
