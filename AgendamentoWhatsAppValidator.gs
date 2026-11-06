/**
 * Entidade: Agendamento via WhatsApp
 * Camada: Validator — Validação de Dados
 *
 * Responsabilidade:
 * Validar e normalizar os campos recebidos pelo webhook do Twilio e as
 * respostas enviadas pelo cliente durante a conversa.
 *
 * Dependências principais:
 * - Nenhuma API de armazenamento; este arquivo contém apenas validações.
 */

/**
 * Valida o telefone internacional recebido no formato do Twilio e reduz o
 * número brasileiro ao formato DDD + telefone usado no cadastro de clientes.
 *
 * @param {string} remetente Campo From enviado pelo Twilio.
 * @return {string} Telefone brasileiro com 10 ou 11 dígitos.
 * @throws {Error} Quando o remetente não for um WhatsApp brasileiro válido.
 */
function agendamentoWhatsAppValidatorNormalizarTelefone(remetente) {
  const valor = String(remetente || "").trim();
  if (!/^whatsapp:\+\d{10,15}$/i.test(valor)) {
    throw new Error("O remetente do WhatsApp é inválido.");
  }

  let digitos = valor.replace(/\D/g, "");
  if (!digitos.startsWith("55")) {
    throw new Error("Este atendimento está disponível para números do Brasil.");
  }

  digitos = digitos.slice(2);
  if (!/^\d{10,11}$/.test(digitos)) {
    throw new Error("O número de WhatsApp não tem um formato brasileiro válido.");
  }
  return digitos;
}

/**
 * Normaliza a resposta numérica para seleção de uma lista apresentada pelo bot.
 *
 * @param {string} resposta Mensagem enviada pelo cliente.
 * @param {number} quantidadeOpcoes Total de opções disponíveis.
 * @return {number} Índice de opção baseado em zero.
 * @throws {Error} Quando a resposta não selecionar uma opção existente.
 */
function agendamentoWhatsAppValidatorValidarOpcao(resposta, quantidadeOpcoes) {
  const numero = String(resposta || "").trim();
  if (!/^\d{1,2}$/.test(numero)) {
    throw new Error("Responda com o número de uma das opções exibidas.");
  }

  const indice = Number(numero) - 1;
  if (!Number.isInteger(indice) || indice < 0 || indice >= quantidadeOpcoes) {
    throw new Error("Essa opção não está na lista. Escolha um dos números exibidos.");
  }
  return indice;
}

/**
 * Converte uma data brasileira válida para yyyy-MM-dd e impede datas passadas.
 *
 * @param {string} resposta Data no formato dd/MM/yyyy.
 * @param {Date} agora Data atual usada para verificar o passado.
 * @param {string} fusoHorario Fuso horário do projeto Apps Script.
 * @return {string} Data no formato yyyy-MM-dd.
 * @throws {Error} Quando o texto for inválido ou a data já tiver passado.
 */
function agendamentoWhatsAppValidatorValidarData(resposta, agora, fusoHorario) {
  const correspondencia = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(
    String(resposta || "").trim()
  );
  if (!correspondencia) {
    throw new Error("Informe a data no formato DD/MM/AAAA, por exemplo 25/12/2026.");
  }

  const dia = Number(correspondencia[1]);
  const mes = Number(correspondencia[2]);
  const ano = Number(correspondencia[3]);
  const diasNoMes = mes >= 1 && mes <= 12
    ? new Date(Date.UTC(ano, mes, 0)).getUTCDate()
    : 0;
  if (dia < 1 || dia > diasNoMes) {
    throw new Error("Essa data não existe. Confira o dia, mês e ano.");
  }

  const dataNormalizada = ano + "-" +
    String(mes).padStart(2, "0") + "-" + String(dia).padStart(2, "0");
  const hoje = Utilities.formatDate(agora, fusoHorario, "yyyy-MM-dd");
  if (dataNormalizada < hoje) {
    throw new Error("Não é possível agendar em uma data passada. Informe outra data.");
  }
  return dataNormalizada;
}

/**
 * Escapa texto para uso seguro em um nó de texto XML/TwiML.
 *
 * @param {string} texto Texto de resposta do bot.
 * @return {string} Texto com caracteres especiais escapados.
 */
function agendamentoWhatsAppValidatorEscaparXml(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
