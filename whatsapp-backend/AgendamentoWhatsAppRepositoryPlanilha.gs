/**
 * Entidade: Agendamento via WhatsApp
 * Camada: Repository — Acesso à planilha no projeto isolado
 *
 * Responsabilidade:
 * Conectar os repositórios do fluxo de agendamento à planilha existente sem
 * depender de uma planilha ativa no projeto Apps Script separado.
 *
 * Dependências principais:
 * - Script Properties com a chave AGENDAMENTO_WHATSAPP_SPREADSHEET_ID;
 * - SpreadsheetApp, do Google Apps Script.
 */

/**
 * Abre uma aba da planilha principal para os repositórios do agendamento.
 *
 * A função getSheet mantém compatibilidade com os repositórios existentes,
 * sem copiar nem expor o WebApp.js da aplicação principal.
 *
 * @param {string} nomeAba Nome definido em CONFIG.ABAS.
 * @return {GoogleAppsScript.Spreadsheet.Sheet} Aba solicitada.
 * @throws {Error} Quando o ID não estiver configurado ou a aba não existir.
 */
function getSheet(nomeAba) {
  const idPlanilha = String(
    PropertiesService.getScriptProperties().getProperty(
      "AGENDAMENTO_WHATSAPP_SPREADSHEET_ID"
    ) || ""
  ).trim();
  if (!idPlanilha) {
    throw new Error("A propriedade AGENDAMENTO_WHATSAPP_SPREADSHEET_ID não foi configurada.");
  }

  const planilha = SpreadsheetApp.openById(idPlanilha);
  const aba = planilha.getSheetByName(nomeAba);
  if (!aba) {
    throw new Error("A aba " + nomeAba + " não foi encontrada na planilha.");
  }
  return aba;
}

/**
 * Verifica se um código existe na primeira coluna de uma aba cadastrada.
 *
 * @param {string} nomeAba Nome da aba a consultar.
 * @param {string} codigo Código procurado.
 * @return {boolean} Verdadeiro quando o código já está cadastrado.
 */
function codigoExiste(nomeAba, codigo) {
  const aba = getSheet(nomeAba);
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return false;

  return aba.getRange(2, 1, ultimaLinha - 1, 1)
    .getDisplayValues()
    .some(linha => String(linha[0] || "").trim() === String(codigo || "").trim());
}
