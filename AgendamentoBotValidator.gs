/**
 * Entidade: AgendamentoBot
 * Camada: Validator — Validador
 *
 * Responsabilidade:
 * Normalizar e validar o celular informado na interface web antes da consulta
 * ao cadastro de clientes.
 */

/**
 * Retorna o celular brasileiro em DDD + número, compatível com CLIENTES.
 * Aceita número local ou código do país 55, com pontuação opcional.
 *
 * @param {string} telefone Celular digitado pelo cliente.
 * @return {string} Somente dígitos, com 10 ou 11 posições.
 * @throws {Error} Quando o telefone não possui formato brasileiro válido.
 */
function agendamentoBotValidatorNormalizarTelefone(telefone) {
  let digitos = String(telefone || "").replace(/\D/g, "");
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) {
    digitos = digitos.slice(2);
  }
  if (!/^\d{10,11}$/.test(digitos)) {
    throw new Error("Informe um celular brasileiro com DDD, por exemplo (11) 99999-9999.");
  }
  return digitos;
}

/**
 * Valida uma data de campo HTML (yyyy-MM-dd) e rejeita datas passadas.
 *
 * @param {string} valor Data recebida do navegador.
 * @return {string} Data válida em yyyy-MM-dd.
 * @throws {Error} Quando a data não existe ou já passou.
 */
function agendamentoBotValidatorValidarData(valor) {
  const texto = String(valor || "").trim();
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) throw new Error("Escolha uma data válida.");
  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) {
    throw new Error("A data escolhida não existe.");
  }
  const hoje = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  if (texto < hoje) throw new Error("Não é possível agendar em uma data passada.");
  return texto;
}

