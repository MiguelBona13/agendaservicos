/**
 * Entrega a interface administrativa ou o bot público de agendamento.
 * O parâmetro `bot=1` seleciona somente a tela; a validação e a gravação
 * continuam no servidor, pelas camadas Service, Rules, Validator e Repository.
 *
 * @param {Object} e Evento de entrada da aplicação Web do Apps Script.
 * @return {GoogleAppsScript.HTML.HtmlOutput} Página solicitada.
 */
function doGet(e) {
  const parametros = e && e.parameter ? e.parameter : {};
  const arquivo = String(parametros.bot || "") === "1" ? "Bot" : "Index";
  const titulo = arquivo === "Bot" ? "Agende seu serviço" : "Agenda de atendimento";

  return HtmlService.createHtmlOutputFromFile(arquivo).setTitle(titulo);
}

