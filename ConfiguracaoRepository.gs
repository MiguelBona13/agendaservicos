/**
 * Entidade: Configurações
 * Camada: Repository — Repositório
 *
 * Responsabilidade:
 * Centralizar a leitura da aba de configurações e tratar sua ausência sem
 * interromper o carregamento das demais telas.
 *
 * Dependências principais:
 * - Config.js — nome lógico da aba;
 * - SpreadsheetApp — acesso ao arquivo ativo, somente nesta camada.
 */

/**
 * Consulta os parâmetros cadastrados.
 * Aceita os nomes CONFIGURACOES e Configurações para compatibilidade com
 * planilhas já criadas. Quando nenhuma das abas existir, devolve uma lista
 * vazia com orientação em vez de lançar erro no carregamento da interface.
 *
 * @return {{colunas:Array<string>,registros:Array<Array<string>>,mensagem?:string}} Dados tabulares.
 */
function configuracaoRepositoryConsultarTabela() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const nomesPossiveis = [CONFIG.ABAS.CONFIGURACOES, "Configurações"];
  let aba = null;

  for (const nome of nomesPossiveis) {
    aba = planilha.getSheetByName(nome);
    if (aba) break;
  }

  if (!aba) {
    return {
      colunas: [],
      registros: [],
      mensagem: "A aba CONFIGURACOES ainda não existe na planilha. Crie uma aba com esse nome para cadastrar os parâmetros do sistema."
    };
  }

  const ultimaLinha = aba.getLastRow();
  const ultimaColuna = aba.getLastColumn();
  if (ultimaLinha < 1 || ultimaColuna < 1) {
    return {
      colunas: [],
      registros: [],
      mensagem: "A aba de configurações está vazia. Inclua os cabeçalhos e os parâmetros que deseja consultar."
    };
  }

  const valores = aba.getRange(1, 1, ultimaLinha, ultimaColuna).getDisplayValues();
  return {
    colunas: valores[0].map(valor => String(valor || "").trim()),
    registros: valores.slice(1).filter(linha =>
      linha.some(valor => String(valor || "").trim() !== "")
    )
  };
}
