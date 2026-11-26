const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const valores = [
  ["Parâmetro", "Valor"],
  ["Nome do estabelecimento", "Agenda de Serviços"],
  ["Antecedência mínima", "2"]
];

const contexto = {
  CONFIG: { ABAS: { CONFIGURACOES: "Configurações" } },
  getSheet(nome) {
    assert.equal(nome, "Configurações");
    return {
      getLastRow: () => valores.length,
      getLastColumn: () => valores[0].length,
      getRange(linha, coluna, quantidadeLinhas, quantidadeColunas) {
        return {
          getDisplayValues: () => valores.slice(linha - 1, linha - 1 + quantidadeLinhas)
            .map(registro => registro.slice(coluna - 1, coluna - 1 + quantidadeColunas))
        };
      }
    };
  }
};

vm.runInNewContext(
  fs.readFileSync("ConfiguracaoRepository.gs", "utf8"),
  contexto
);

test("consulta a aba Configurações sem presumir nomes de colunas", () => {
  const resultado = contexto.configuracaoRepositoryConsultarTabela();
  assert.deepEqual(Array.from(resultado.colunas), ["Parâmetro", "Valor"]);
  assert.deepEqual(Array.from(resultado.registros, linha => Array.from(linha)), [
    ["Nome do estabelecimento", "Agenda de Serviços"],
    ["Antecedência mínima", "2"]
  ]);
});
