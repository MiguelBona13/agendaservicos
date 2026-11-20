/**
 * Entidade: Serviço
 * Camada: Service — Camada de Serviço
 *
 * Responsabilidade:
 * Coordenar criação, consulta, atualização e exclusão de serviços.
 *
 * Dependências principais:
 * - ServicoValidator.gs;
 * - ServicoRules.gs;
 * - ServicoRepository.gs;
 * - LockService — proteção contra operações simultâneas.
 */

/** @return {string} Próximo código sequencial de serviço. */
function servicoServiceGerarCodigo() {
  return String(servicoRepositoryObterMaiorCodigo() + 1).padStart(3, "0");
}

/** @return {Array<Object>} Serviços cadastrados. */
function servicoServiceListar() {
  return servicoRepositoryListar();
}

/** Cria um serviço.
 * @param {string} codigo Código do serviço.
 * @param {string} nome Nome do serviço.
 * @param {*} valor Valor monetário.
 * @return {{sucesso:boolean,mensagem:string}} Resultado.
 */
function servicoServiceCriar(codigo, nome, valor) {
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(10000);
  try {
    const dados = {
      codigo: servicoValidatorValidarCodigo(codigo),
      nome: servicoValidatorValidarNome(nome),
      valor: servicoValidatorValidarValor(valor)
    };
    if (servicoRepositoryBuscarPorCodigo(dados.codigo)) {
      throw new Error("O código " + dados.codigo + " já está cadastrado.");
    }
    servicoRepositoryInserir(dados);
    return { sucesso: true, mensagem: "Serviço cadastrado com sucesso." };
  } finally {
    bloqueio.releaseLock();
  }
}

/** Atualiza nome e valor sem alterar o código.
 * @param {string} codigo Código imutável do serviço.
 * @param {string} nome Novo nome.
 * @param {*} valor Novo valor.
 * @return {{sucesso:boolean,mensagem:string}} Resultado.
 */
function servicoServiceAtualizar(codigo, nome, valor) {
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(10000);
  try {
    const id = servicoValidatorValidarCodigo(codigo);
    const dados = {
      codigo: id,
      nome: servicoValidatorValidarNome(nome),
      valor: servicoValidatorValidarValor(valor)
    };
    const linha = servicoRepositoryObterLinha(id);
    if (linha < 2) throw new Error("Serviço não encontrado.");
    servicoRepositoryAtualizar(linha, dados);
    return { sucesso: true, mensagem: "Serviço atualizado com sucesso." };
  } finally {
    bloqueio.releaseLock();
  }
}

/** Exclui serviço somente quando não há agendamentos vinculados.
 * @param {string} codigo Código do serviço.
 * @return {{sucesso:boolean,mensagem:string}} Resultado.
 */
function servicoServiceExcluir(codigo) {
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(10000);
  try {
    const id = servicoValidatorValidarCodigo(codigo);
    const linha = servicoRepositoryObterLinha(id);
    if (linha < 2) throw new Error("Serviço não encontrado.");
    servicoRulesValidarExclusao(id, servicoRepositoryPossuiAgendamentos(id));
    servicoRepositoryExcluir(linha);
    return { sucesso: true, mensagem: "Serviço excluído com sucesso." };
  } finally {
    bloqueio.releaseLock();
  }
}
