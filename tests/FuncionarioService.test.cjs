/**
 * Testes unitários do FuncionarioService com dependências simuladas.
 * Entidade: Funcionário | Camada: Service.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const fonte = fs.readFileSync(path.join(__dirname, "..", "FuncionarioService.gs"), "utf8");

function carregar(dependencias = {}) {
  const contexto = {
    LockService: {
      getScriptLock: () => ({
        waitLock: () => {},
        releaseLock: () => {}
      })
    },
    funcionarioValidatorValidarCodigo: valor => String(valor || "").trim(),
    funcionarioValidatorValidarNome: valor => {
      const nome = String(valor || "").trim();
      if (!nome) throw new Error("O nome do funcionário é obrigatório.");
      return nome;
    },
    funcionarioRepositoryObterMaiorCodigo: () => 9,
    funcionarioRepositoryListar: () => [],
    funcionarioRepositoryBuscarPorCodigo: () => null,
    funcionarioRepositoryInserir: () => {},
    funcionarioRepositoryObterLinha: () => 2,
    funcionarioRepositoryAtualizar: () => {},
    funcionarioRepositoryPossuiAgendamentos: () => false,
    funcionarioRepositoryExcluir: () => {},
    funcionarioRulesValidarExclusao: () => {},
    ...dependencias
  };
  vm.createContext(contexto);
  vm.runInContext(fonte, contexto, { filename: "FuncionarioService.gs" });
  return contexto;
}

test("gera código sequencial com zeros à esquerda", () => {
  assert.equal(carregar().funcionarioServiceGerarCodigo(), "010");
});

test("cria funcionário e persiste dados normalizados", () => {
  let inserido;
  const service = carregar({
    funcionarioRepositoryInserir: dados => { inserido = dados; }
  });
  const resultado = service.funcionarioServiceCriar(" 010 ", " Ana Souza ");
  assert.equal(resultado.sucesso, true);
  assert.deepEqual({ ...inserido }, { codigo: "010", nome: "Ana Souza" });
});

test("impede duplicidade de código", () => {
  const service = carregar({
    funcionarioRepositoryBuscarPorCodigo: () => ({ codigo: "010", nome: "Ana" })
  });
  assert.throws(() => service.funcionarioServiceCriar("010", "Ana"), /já está cadastrado/);
});

test("atualiza funcionário existente", () => {
  let atualizacao;
  const service = carregar({
    funcionarioRepositoryAtualizar: (linha, dados) => { atualizacao = { linha, dados }; }
  });
  const resultado = service.funcionarioServiceAtualizar("010", "Novo Nome");
  assert.equal(resultado.sucesso, true);
  assert.equal(atualizacao.linha, 2);
  assert.equal(atualizacao.dados.nome, "Novo Nome");
});

test("impede exclusão quando há agendamentos vinculados", () => {
  const service = carregar({
    funcionarioRepositoryPossuiAgendamentos: () => true,
    funcionarioRulesValidarExclusao: (codigo, possui) => {
      if (possui) throw new Error("Existem agendamentos vinculados.");
    }
  });
  assert.throws(() => service.funcionarioServiceExcluir("010"), /agendamentos vinculados/);
});
