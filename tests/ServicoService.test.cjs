/**
 * Testes unitários do ServicoService com dependências simuladas.
 * Entidade: Serviço | Camada: Service.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const fonte = fs.readFileSync(path.join(__dirname, "..", "ServicoService.gs"), "utf8");

function carregar(dependencias = {}) {
  const contexto = {
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    servicoValidatorValidarCodigo: valor => String(valor || "").trim(),
    servicoValidatorValidarNome: valor => String(valor || "").trim(),
    servicoValidatorValidarValor: valor => Number(valor),
    servicoRepositoryObterMaiorCodigo: () => 9,
    servicoRepositoryListar: () => [],
    servicoRepositoryBuscarPorCodigo: () => null,
    servicoRepositoryInserir: () => {},
    servicoRepositoryObterLinha: () => 2,
    servicoRepositoryAtualizar: () => {},
    servicoRepositoryPossuiAgendamentos: () => false,
    servicoRepositoryExcluir: () => {},
    servicoRulesValidarExclusao: () => {},
    ...dependencias
  };
  vm.createContext(contexto);
  vm.runInContext(fonte, contexto, { filename: "ServicoService.gs" });
  return contexto;
}

test("gera código sequencial com zeros à esquerda", () => {
  assert.equal(carregar().servicoServiceGerarCodigo(), "010");
});
test("lista serviços pelo Repository", () => {
  const itens = [{ codigo: "001", nome: "Corte", valor: 25 }];
  assert.equal(carregar({ servicoRepositoryListar: () => itens }).servicoServiceListar(), itens);
});
test("cria serviço com dados validados", () => {
  let inserido;
  const c = carregar({ servicoRepositoryInserir: dados => { inserido = dados; } });
  const r = c.servicoServiceCriar("010", "Corte", 25);
  assert.equal(r.sucesso, true);
  assert.deepEqual({ ...inserido }, { codigo: "010", nome: "Corte", valor: 25 });
});
test("impede código duplicado", () => {
  const c = carregar({ servicoRepositoryBuscarPorCodigo: () => ({ codigo: "010" }) });
  assert.throws(() => c.servicoServiceCriar("010", "Corte", 25), /já está cadastrado/);
});
test("atualiza nome e valor sem trocar código", () => {
  let atualizacao;
  const c = carregar({ servicoRepositoryAtualizar: (linha, dados) => { atualizacao = { linha, dados }; } });
  const r = c.servicoServiceAtualizar("010", "Corte atualizado", 30);
  assert.equal(r.sucesso, true);
  assert.equal(atualizacao.linha, 2);
  assert.equal(atualizacao.dados.codigo, "010");
  assert.equal(atualizacao.dados.valor, 30);
});
test("impede exclusão quando existem agendamentos", () => {
  const c = carregar({
    servicoRepositoryPossuiAgendamentos: () => true,
    servicoRulesValidarExclusao: (codigo, possui) => { if (possui) throw new Error("Existem agendamentos vinculados."); }
  });
  assert.throws(() => c.servicoServiceExcluir("010"), /agendamentos vinculados/);
});
