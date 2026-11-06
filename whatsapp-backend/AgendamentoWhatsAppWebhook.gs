/**
 * Entidade: Agendamento via WhatsApp
 * Camada: Interface — Webhook do Twilio
 *
 * Responsabilidade:
 * Receber a chamada HTTP do Twilio, autenticar o token compartilhado e
 * devolver a resposta do bot em TwiML.
 *
 * Dependências principais:
 * - AgendamentoWhatsAppService.gs;
 * - AgendamentoWhatsAppRepository.gs;
 * - ContentService, do Google Apps Script.
 */

/**
 * Recebe mensagens encaminhadas pelo Twilio Sandbox para WhatsApp.
 * A URL configurada no Twilio deve conter ?token= seguido do token salvo em
 * Script Properties como AGENDAMENTO_WHATSAPP_WEBHOOK_TOKEN.
 *
 * @param {Object} evento Evento HTTP POST do Google Apps Script.
 * @return {GoogleAppsScript.Content.TextOutput} Resposta TwiML em XML.
 */
function doPost(evento) {
  let mensagem = "Não consegui processar sua mensagem agora. Tente novamente.";
  try {
    const parametros = evento && evento.parameter ? evento.parameter : {};
    const tokenConfigurado = agendamentoWhatsAppRepositoryObterTokenWebhook();
    const tokenRecebido = String(parametros.token || "");

    if (!tokenConfigurado || tokenRecebido !== tokenConfigurado) {
      mensagem = "Não foi possível validar esta solicitação.";
    } else {
      mensagem = agendamentoWhatsAppServiceProcessarMensagem(
        parametros.From,
        parametros.Body
      );
    }
  } catch (erro) {
    mensagem = erro && erro.message
      ? erro.message
      : "Não consegui processar sua mensagem agora. Tente novamente.";
  }

  const corpo = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
    "<Response><Message>" +
    agendamentoWhatsAppValidatorEscaparXml(mensagem) +
    "</Message></Response>";
  return ContentService.createTextOutput(corpo)
    .setMimeType(ContentService.MimeType.XML);
}
