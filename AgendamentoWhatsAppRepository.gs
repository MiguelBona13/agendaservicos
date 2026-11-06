/**
 * Entidade: Agendamento via WhatsApp
 * Camada: Repository — Repositório
 *
 * Responsabilidade:
 * Consultar o cliente pelo telefone e persistir as conversas temporárias e a
 * configuração técnica do webhook usando serviços do Google Apps Script.
 *
 * Dependências principais:
 * - CONFIG e getSheet(), para consultar Google Sheets;
 * - PropertiesService e Utilities, para estado e configuração do webhook.
 */

const AGENDAMENTO_WHATSAPP_PROPRIEDADES = {
  TOKEN: "AGENDAMENTO_WHATSAPP_WEBHOOK_TOKEN",
  CONVERSA_PREFIXO: "AGENDAMENTO_WHATSAPP_CONVERSA_"
};

/**
 * Localiza um único cliente ativo pelo celular cadastrado na coluna I.
 *
 * @param {string} telefone Telefone com DDD, somente dígitos.
 * @return {?Object} Código e nome do cliente, ou null sem correspondência única.
 */
function agendamentoWhatsAppRepositoryBuscarClientePorTelefone(telefone) {
  const alvo = String(telefone || "").replace(/\D/g, "");
  if (!alvo) return null;

  const aba = getSheet(CONFIG.ABAS.CLIENTES);
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return null;

  const registros = aba.getRange(2, 1, ultimaLinha - 1, 11).getDisplayValues();
  const correspondencias = registros.filter(linha =>
    String(linha[8] || "").replace(/\D/g, "") === alvo &&
    String(linha[0] || "").trim() &&
    String(linha[1] || "").trim()
  );

  if (correspondencias.length !== 1) return null;
  return {
    codigo: String(correspondencias[0][0]).trim(),
    nome: String(correspondencias[0][1]).trim()
  };
}

/**
 * Obtém o token compartilhado configurado nas propriedades do projeto.
 *
 * @return {string} Token ou texto vazio quando não configurado.
 */
function agendamentoWhatsAppRepositoryObterTokenWebhook() {
  return String(
    PropertiesService.getScriptProperties().getProperty(
      AGENDAMENTO_WHATSAPP_PROPRIEDADES.TOKEN
    ) || ""
  );
}

/**
 * Lê o estado da conversa do cliente. Telefones são resumidos em hash para
 * evitar armazená-los diretamente no nome da propriedade.
 *
 * @param {string} telefone Telefone com DDD, somente dígitos.
 * @return {?Object} Conversa salva ou null.
 */
function agendamentoWhatsAppRepositoryObterConversa(telefone) {
  const chave = agendamentoWhatsAppRepositoryCriarChaveConversa(telefone);
  const valor = PropertiesService.getScriptProperties().getProperty(chave);
  if (!valor) return null;

  try {
    const conversa = JSON.parse(valor);
    const idade = Date.now() - Number(conversa.atualizadoEm || 0);
    if (!conversa.etapa || idade > 24 * 60 * 60 * 1000) {
      PropertiesService.getScriptProperties().deleteProperty(chave);
      return null;
    }
    return conversa;
  } catch (erroLeitura) {
    PropertiesService.getScriptProperties().deleteProperty(chave);
    return null;
  }
}

/**
 * Salva uma conversa do cliente e atualiza seu prazo de validade.
 *
 * @param {string} telefone Telefone com DDD, somente dígitos.
 * @param {Object} conversa Estado de conversa serializável.
 * @return {void}
 */
function agendamentoWhatsAppRepositorySalvarConversa(telefone, conversa) {
  const chave = agendamentoWhatsAppRepositoryCriarChaveConversa(telefone);
  const estado = Object.assign({}, conversa, { atualizadoEm: Date.now() });
  PropertiesService.getScriptProperties().setProperty(chave, JSON.stringify(estado));
}

/**
 * Remove o estado salvo de uma conversa.
 *
 * @param {string} telefone Telefone com DDD, somente dígitos.
 * @return {void}
 */
function agendamentoWhatsAppRepositoryLimparConversa(telefone) {
  PropertiesService.getScriptProperties().deleteProperty(
    agendamentoWhatsAppRepositoryCriarChaveConversa(telefone)
  );
}

/**
 * Cria a chave de armazenamento da conversa sem incluir o telefone em claro.
 *
 * @param {string} telefone Telefone com DDD, somente dígitos.
 * @return {string} Chave de propriedade com hash SHA-256.
 */
function agendamentoWhatsAppRepositoryCriarChaveConversa(telefone) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(telefone || "")
  );
  const hash = digest.map(byte => (byte + 256).toString(16).slice(-2)).join("");
  return AGENDAMENTO_WHATSAPP_PROPRIEDADES.CONVERSA_PREFIXO + hash;
}
