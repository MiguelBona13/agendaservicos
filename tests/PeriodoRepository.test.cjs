const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const planilhas = {
  PERIODOS: [
    ["Código", "Descrição", "Hora inicial", "Hora final", "Ativo"],
    ["1", "Manhã", "08:00", "12:00", "SIM"],
    ["", "", "", "", ""],
    ["2", "Tarde", "13:00", "17:00", "NÃO"]
  ],
  AGENDA: [
    ["Código", "Data", "Código do período"],
    ["A1", "2026-11-25", "1"],
    ["A2", "2026-11-26", "2"]
  ]
};

function criarAba(nome) {
  const valores = planilhas[nome];

  return {
    getLastRow: () => valores.length,
    getLastColumn: () => valores[0] ? valores[0].length : 0,
    getRange(linha, coluna, quantidadeLinhas = 1, quantidadeColunas = 1) {
      return {
        getDisplayValues() {
          return valores.slice(linha - 1, linha - 1 + quantidadeLinhas)
            .map(registro => registro.slice(coluna - 1, coluna - 1 + quantidadeColunas)
              .map(valor => String(valor == null ? "" : valor)));
        },
        setValues(novosValores) {
          novosValores.forEach((registro, indiceLinha) => {
            const destino = linha - 1 + indiceLinha;
            while (valores.length <= destino) valores.push([]);
            registro.forEach((valor, indiceColuna) => {
              valores[destino][coluna - 1 + indiceColuna] = valor;
            });
          });
        }
      };
    },
    deleteRow(linha) {
      valores.splice(linha - 1, 1);
    }
  };
}

const contexto = {
  CONFIG: { ABAS: { PERIODOS: "PERIODOS", AGENDA: "AGENDA" } },
  getSheet: nome => criarAba(nome)
};

vm.runInNewContext(
  fs.readFileSync("PeriodoRepository.gs", "utf8"),
  contexto
);

test("lista períodos e preserva o número da linha física mesmo com linha vazia", () => {
  const periodos = contexto.periodoRepositoryListar();

  assert.equal(periodos.length, 2);
  assert.equal(periodos[0].codigo, "1");
  assert.equal(periodos[0].ativo, true);
  assert.equal(periodos[0].linha, 2);
  assert.equal(periodos[1].codigo, "2");
  assert.equal(periodos[1].ativo, false);
  assert.equal(periodos[1].linha, 4);
});

test("busca período por código e calcula o maior código numérico", () => {
  assert.equal(contexto.periodoRepositoryBuscarPorCodigo("2").descricao, "Tarde");
  assert.equal(contexto.periodoRepositoryBuscarPorCodigo("99"), null);
  assert.equal(contexto.periodoRepositoryObterMaiorCodigo(), 2);
});

test("insere período com situação normalizada", () => {
  const linha = contexto.periodoRepositoryInserir({
    codigo: "3",
    descricao: "Noite",
    horaInicial: "18:00",
    horaFinal: "22:00",
    ativo: true
  });

  assert.equal(linha, 5);
  assert.deepEqual(planilhas.PERIODOS[4], ["3", "Noite", "18:00", "22:00", "SIM"]);
});

test("atualiza os campos editáveis sem alterar o código", () => {
  contexto.periodoRepositoryAtualizar(2, {
    descricao: "Manhã atualizada",
    horaInicial: "07:30",
    horaFinal: "11:30",
    ativo: false
  });

  assert.deepEqual(planilhas.PERIODOS[1], ["1", "Manhã atualizada", "07:30", "11:30", "NÃO"]);
});

test("identifica vínculos na terceira coluna da agenda", () => {
  assert.equal(contexto.periodoRepositoryPossuiAgendamentos("1"), true);
  assert.equal(contexto.periodoRepositoryPossuiAgendamentos("99"), false);
});

test("localiza linha, consulta tabela e exclui registro pela linha", () => {
  assert.equal(contexto.periodoRepositoryObterLinha("2"), 4);

  const tabela = contexto.periodoRepositoryConsultarTabela();
  assert.equal(tabela.colunas.length, 5);
  assert.equal(tabela.registros.length, 3);

  contexto.periodoRepositoryExcluir(4);
  assert.equal(contexto.periodoRepositoryBuscarPorCodigo("2"), null);
});

test("rejeita atualização e exclusão com linha inválida", () => {
  assert.throws(() => contexto.periodoRepositoryAtualizar(1, {
    descricao: "Inválido", horaInicial: "00:00", horaFinal: "01:00", ativo: true
  }), /não encontrado/);

  assert.throws(() => contexto.periodoRepositoryExcluir(99), /não encontrado/);
});
