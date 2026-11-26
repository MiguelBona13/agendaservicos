const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function carregarRepository(abAs) {
  const contexto = {
    CONFIG: { ABAS: { CONFIGURACOES: "CONFIGURACOES" } },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: nome => abAs[nome] || null
      })
    }
  };
  vm.runInNewContext(fs.readFileSync("ConfiguracaoRepository.gs", "utf8"), contexto);
  return contexto;
}

function criarAba(valores) {
  return {
    getLastRow: () => valores.length,
    getLastColumn: () => valores[0] ? valores[0].length : 0,
    getRange(linha, coluna, quantidadeLinhas, quantidadeColunas) {
      return {
        getDisplayValues: () => valores.slice(linha-1,linha-1+quantidadeLinhas)
          .map(registro=>registro.slice(coluna-1,coluna-1+quantidadeColunas))
      };
    }
  };
}

test("consulta a aba CONFIGURACOES", () => {
  const contexto=carregarRepository({CONFIGURACOES:criarAba([["Parâmetro","Valor"],["Nome","Agenda"]])});
  const resultado=contexto.configuracaoRepositoryConsultarTabela();
  assert.deepEqual(Array.from(resultado.colunas),["Parâmetro","Valor"]);
  assert.deepEqual(Array.from(resultado.registros,linha=>Array.from(linha)),[["Nome","Agenda"]]);
});

test("mantém compatibilidade com a aba antiga Configurações", () => {
  const contexto=carregarRepository({"Configurações":criarAba([["Chave","Valor"],["Tema","Claro"]])});
  const resultado=contexto.configuracaoRepositoryConsultarTabela();
  assert.equal(resultado.registros.length,1);
});

test("não lança erro quando a aba ainda não existe e informa como corrigir", () => {
  const contexto=carregarRepository({});
  const resultado=contexto.configuracaoRepositoryConsultarTabela();
  assert.deepEqual(Array.from(resultado.colunas),[]);
  assert.match(resultado.mensagem,/CONFIGURACOES/);
});
