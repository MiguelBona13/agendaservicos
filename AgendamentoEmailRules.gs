/**
 * Entidade: Agendamento por E-mail
 * Camada: Rules — Regras de Negócio
 *
 * Responsabilidade:
 * Aceitar remetentes externos e validar apenas o formato do endereço de e-mail.
 */

/**
 * Valida o formato do remetente, sem restringir a conta que enviou a mensagem.
 * Aceita os formatos "email@dominio.com" e "Nome <email@dominio.com>".
 *
 * @param {string} remetente Valor do campo From retornado pelo Gmail.
 * @return {void}
 * @throws {Error} Quando o endereço do remetente não for válido.
 */
function agendamentoEmailRulesValidarRemetente(remetente) {
  const valorRemetente = String(remetente || "").trim();
  const enderecoEntreSinais = valorRemetente.match(/<([^<>]+)>/);
  const emailRemetente = String(
    enderecoEntreSinais ? enderecoEntreSinais[1] : valorRemetente
  ).trim().toLowerCase();

  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(emailRemetente)) {
    throw new Error("O endereço do remetente não é válido.");
  }

}
