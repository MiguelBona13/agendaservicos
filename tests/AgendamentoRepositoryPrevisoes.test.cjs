/**
 * Testes unitários do repositório de previsões da entidade Agendamento.
 *
 * Camada: Repository — testes isolados de persistência em lote.
 * Objetivo: garantir que as três previsões sejam gravadas em uma única
 * operação, que linhas não informadas sejam preservadas e que dados iguais
 * não provoquem gravações desnecessárias.
 *
 * Dependências: Node.js (node:test, node:assert/strict, node:fs, node:path,
 * node:vm). Não acessa Google Sheets real.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

function criarContextoRepository(valoresIniciais) {
  const estado = {
    valores: valoresIniciais.map(linha => linha.slice()),
    leituras: 0,
    gravacoes: 0,
  };

  const faixa = {
    getValues() {
      estado.leituras++;
      return estado.valores.map(linha => linha.slice());
    },
    setValues(valores) {
      estado.gravacoes++;
      estado.valores = valores.map(linha => linha.slice());
    }
  };

  const aba = {
    getLastRow: () => estado.valores.length + 1,
    getRange(linha, coluna, quantidadeLinhas, quantidadeColunas) {
      assert.equal(linha, 2);
      assert.equal(coluna, 11);
      assert.equal(quantidadeLinhas, estado.valores.length);
      assert.equal(quantidadeColunas, 3);
      return faixa;
    }
  };

  const contexto = {
    CONFIG: { ABAS: { AGENDA: "AGENDA" } },
    getSheet: () => aba
  };
  vm.createContext(contexto);
  const fonte = fs.readFileSync(
    path.join(__dirname, "..", "AgendamentoRepository.gs"), "utf8"
  );
  vm.runInContext(fonte, contexto, { filename: "AgendamentoRepository.gs" });
  return { contexto, estado };
}

test("grava as três previsões em uma única operação e preserva as demais linhas", () => {
  const { contexto, estado } = criarContextoRepository([
    ["K antigo 1", "A antigo 1", "R antigo 1"],
    ["K antigo 2", "A antigo 2", "R antigo 2"],
    ["K antigo 3", "A antigo 3", "R antigo 3"]
  ]);

  contexto.agendamentoRepositoryAtualizarPrevisoesEmLote([
    {
      linha: 2,
      previsaoKnn: "K novo 1",
      previsaoArvore: "A novo 1",
      previsaoRegressaoLogistica: "R novo 1"
    },
    {
      linha: 4,
      previsaoKnn: "K novo 3",
      previsaoArvore: "A novo 3",
      previsaoRegressaoLogistica: "R novo 3"
    }
  ]);

  assert.equal(estado.gravacoes, 1);
  assert.deepEqual(estado.valores, [
    ["K novo 1", "A novo 1", "R novo 1"],
    ["K antigo 2", "A antigo 2", "R antigo 2"],
    ["K novo 3", "A novo 3", "R novo 3"]
  ]);
});

test("não grava quando as previsões já estão atualizadas", () => {
  const { contexto, estado } = criarContextoRepository([
    ["K", "A", "R"]
  ]);

  contexto.agendamentoRepositoryAtualizarPrevisoesEmLote([
    {
      linha: 2,
      previsaoKnn: "K",
      previsaoArvore: "A",
      previsaoRegressaoLogistica: "R"
    }
  ]);

  assert.equal(estado.leituras, 1);
  assert.equal(estado.gravacoes, 0);
});

test("ignora linhas inválidas e não tenta gravar quando não há registros", () => {
  const { contexto, estado } = criarContextoRepository([["K", "A", "R"]]);

  contexto.agendamentoRepositoryAtualizarPrevisoesEmLote([
    {
      linha: 1,
      previsaoKnn: "inválida",
      previsaoArvore: "inválida",
      previsaoRegressaoLogistica: "inválida"
    },
    {
      linha: 999,
      previsaoKnn: "fora",
      previsaoArvore: "fora",
      previsaoRegressaoLogistica: "fora"
    }
  ]);
  contexto.agendamentoRepositoryAtualizarPrevisoesEmLote([]);

  assert.equal(estado.gravacoes, 0);
  assert.deepEqual(estado.valores, [["K", "A", "R"]]);
});
