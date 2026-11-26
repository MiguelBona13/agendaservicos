/**
 * Entidade: Período
 * Camada: Service — Camada de Serviço
 * Responsabilidade: coordenar cadastro, consulta, edição, ativação, inativação e exclusão de períodos.
 * Dependências: PeriodoValidator, PeriodoRules, PeriodoRepository e LockService.
 */

/** Gera o próximo código sequencial de período.
 * @return {string} Código com três dígitos.
 */
function periodoServiceGerarCodigo() {
  return String(periodoRepositoryObterMaiorCodigo() + 1).padStart(3, "0");
}

/** Lista períodos cadastrados.
 * @return {Array<Object>} Períodos.
 */
function periodoServiceListar() {
  return periodoRepositoryListar();
}

/** Cria um período.
 * @param {string} codigo Código gerado.
 * @param {string} descricao Descrição.
 * @param {string} horaInicial Hora inicial.
 * @param {string} horaFinal Hora final.
 * @param {boolean|string} ativo Situação.
 * @return {Object} Resultado da operação.
 */
function periodoServiceCriar(codigo, descricao, horaInicial, horaFinal, ativo) {
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(10000);
  try {
    const id = periodoValidatorCodigo(codigo);
    const dados = periodoValidatorDados(descricao, horaInicial, horaFinal, ativo);
    periodoRulesValidarIntervalo(dados);
    if (periodoRepositoryBuscarPorCodigo(id)) throw new Error("O código " + id + " já está cadastrado.");
    periodoRepositoryInserir({ codigo: id, ...dados });
    return { sucesso: true, mensagem: "Período cadastrado com sucesso." };
  } finally {
    bloqueio.releaseLock();
  }
}

/** Atualiza período mantendo seu código imutável.
 * @return {Object} Resultado da operação.
 */
function periodoServiceAtualizar(codigo, descricao, horaInicial, horaFinal, ativo) {
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(10000);
  try {
    const id = periodoValidatorCodigo(codigo);
    const dados = periodoValidatorDados(descricao, horaInicial, horaFinal, ativo);
    periodoRulesValidarIntervalo(dados);
    const atual = periodoRepositoryBuscarPorCodigo(id);
    if (!atual) throw new Error("Período não encontrado.");
    const possuiVinculos = periodoRepositoryPossuiAgendamentos(id);
    periodoRulesValidarEdicaoComVinculos(id, atual, dados, possuiVinculos);
    periodoRepositoryAtualizar(atual.linha, dados);
    return { sucesso: true, mensagem: "Período atualizado com sucesso." };
  } finally {
    bloqueio.releaseLock();
  }
}

/** Exclui fisicamente o período sem vínculos ou o inativa quando há histórico.
 * @param {string} codigo Código do período.
 * @return {Object} Resultado da operação.
 */
function periodoServiceExcluir(codigo) {
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(10000);
  try {
    const id = periodoValidatorCodigo(codigo);
    const atual = periodoRepositoryBuscarPorCodigo(id);
    if (!atual) throw new Error("Período não encontrado.");
    const possuiVinculos = periodoRepositoryPossuiAgendamentos(id);
    const acao = periodoRulesDefinirAcaoExclusao(possuiVinculos);
    if (acao === "INATIVAR") {
      periodoRepositoryAtualizar(atual.linha, {
        descricao: atual.descricao,
        horaInicial: atual.horaInicial,
        horaFinal: atual.horaFinal,
        ativo: false
      });
      return { sucesso: true, acao: acao, mensagem: "O período possui agendamentos vinculados e foi inativado para preservar o histórico." };
    }
    periodoRepositoryExcluir(atual.linha);
    return { sucesso: true, acao: acao, mensagem: "Período excluído com sucesso." };
  } finally {
    bloqueio.releaseLock();
  }
}
