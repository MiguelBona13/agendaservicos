/**
 * Entidade: Período
 * Camada: Validator — Validador
 * Responsabilidade: normalizar e validar os dados recebidos para o CRUD de períodos.
 * Dependências: nenhuma.
 */

/** Valida e normaliza o código imutável do período. */
function periodoValidatorCodigo(codigo) {
  const valor = String(codigo == null ? "" : codigo).trim();
  if (!valor) throw new Error("O código do período é obrigatório.");
  return valor;
}

/** Valida e normaliza a descrição do período. */
function periodoValidatorDescricao(descricao) {
  const valor = String(descricao == null ? "" : descricao).trim().replace(/\\s+/g, " ");
  if (!valor) throw new Error("A descrição do período é obrigatória.");
  if (valor.length > 80) throw new Error("A descrição deve ter até 80 caracteres.");
  return valor;
}

/** Valida horário no formato HH:mm. */
function periodoValidatorHorario(horario, campo) {
  const valor = String(horario == null ? "" : horario).trim();
  if (!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(valor)) {
    throw new Error("Informe um horário válido para " + campo + " no formato HH:mm.");
  }
  return valor;
}

/** Valida os dados editáveis de um período. */
function periodoValidatorDados(descricao, horaInicial, horaFinal, ativo) {
  if (ativo !== true && ativo !== false && !["SIM", "NÃO", "NAO", "TRUE", "FALSE"].includes(String(ativo).trim().toUpperCase())) {
    throw new Error("A situação do período é inválida.");
  }
  const ativoNormalizado = ativo === true || ["SIM", "TRUE"].includes(String(ativo).trim().toUpperCase());
  return {
    descricao: periodoValidatorDescricao(descricao),
    horaInicial: periodoValidatorHorario(horaInicial, "hora inicial"),
    horaFinal: periodoValidatorHorario(horaFinal, "hora final"),
    ativo: ativoNormalizado
  };
}
