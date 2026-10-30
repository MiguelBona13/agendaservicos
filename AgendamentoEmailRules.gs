/**
 * Entidade: Agendamento por E-mail
 * Camada: Rules — Regras de Negócio
 *
 * Responsabilidade:
 * Validar a identidade do remetente das mensagens que podem originar
 * agendamentos, aceitando somente a conta que executa o Google Apps Script.
 *
 * Dependências principais:
 * - Nenhuma dependência externa; recebe os endereços já obtidos pelo Service.
 */

/**
 * Confere se o remetente da mensagem é a própria conta executora do aplicativo.
 * Aceita os formatos "email@dominio.com" e "Nome <email@dominio.com>".
 *
 * @param {string} remetente Valor do campo From retornado pelo Gmail.
 * @param {string} emailContaExecutora Endereço obtido por Session.getEffectiveUser().
 * @return {void}
 * @throws {Error} Quando a conta executora não puder ser identificada ou
 * quando o remetente não corresponder a ela.
 */
function agendamentoEmailRulesValidarRemetente(remetente, emailContaExecutora) {
  const valorRemetente = String(remetente || "").trim();
  const valorConta = String(emailContaExecutora || "").trim().toLowerCase();
  const enderecoEntreSinais = valorRemetente.match(/<([^<>]+)>/);
  const emailRemetente = String(
    enderecoEntreSinais ? enderecoEntreSinais[1] : valorRemetente
  ).trim().toLowerCase();

  if (!valorConta) {
    throw new Error(
      "Não foi possível identificar a conta autorizada a enviar agendamentos."
    );
  }

  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(emailRemetente)) {
    throw new Error("O endereço do remetente não é válido.");
  }

  if (emailRemetente !== valorConta) {
    throw new Error(
      "Remetente não autorizado. Somente a conta do aplicativo pode enviar agendamentos."
    );
  }
}
