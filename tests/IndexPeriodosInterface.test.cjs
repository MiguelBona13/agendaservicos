const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

test("o JavaScript incorporado em Index.html possui sintaxe válida", () => {
  const html = fs.readFileSync("Index.html", "utf8");
  const correspondencia = html.match(/<script>([\\s\\S]*?)<\\/script>/i);
  assert.ok(correspondencia, "O script principal da interface deve existir.");
  assert.doesNotThrow(() => new vm.Script(correspondencia[1]));
});

test("a interface possui formulário e ações de CRUD para períodos", () => {
  const html = fs.readFileSync("Index.html", "utf8");
  assert.match(html, /id="formPeriodo"/);
  assert.match(html, /periodoServiceGerarCodigo/);
  assert.match(html, /periodoServiceCriar/);
  assert.match(html, /periodoServiceAtualizar/);
  assert.match(html, /periodoServiceExcluir/);
});

test("a interface apresenta orientação quando a aba Configurações não existe", () => {
  const html = fs.readFileSync("Index.html", "utf8");
  assert.match(html, /resultado\\.mensagem/);
  assert.match(html, /consultarLista\\(abaAtual\\)/);
});
