/**
 * Entidade: Configurações
 * Camada: Repository — Repositório
 *
 * Responsabilidade:
 * Centralizar a leitura tabular da aba "Configurações", permitindo que a
 * interface consulte os parâmetros existentes sem acessar o Google Sheets.
 *
 * Dependências principais:
 * - Config.js — nome lógico da aba de configurações;
 * - Utils.js — função getSheet() para acesso ao Google Sheets.
 */

/**
 * Consulta os dados da aba de configurações sem presumir uma estrutura fixa
 * para suas colunas. A primeira linha é tratada como cabeçalho.
 *
 * @return {{colunas:Array<string>,registros:Array<Array<string>>}} Dados tabulares.
 */
function configuracaoRepositoryConsultarTabela() {
  const aba = getSheet(CONFIG.ABAS.CONFIGURACOES);
  const ultimaLinha = aba.getLastRow();
  const ultimaColuna = aba.getLastColumn();

  if (ultimaLinha < 1 || ultimaColuna < 1) {
    return { colunas: [], registros: [] };
  }

  const valores = aba.getRange(1, 1, ultimaLinha, ultimaColuna).getDisplayValues();

  return {
    colunas: valores[0].map(valor => String(valor || "").trim()),
    registros: valores.slice(1).filter(linha =>
      linha.some(valor => String(valor || "").trim() !== "")
    )
  };
}
