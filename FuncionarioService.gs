/**
 * Entidade: Funcionário
 * Camada: Service — Camada de Serviço
 *
 * Responsabilidade:
 * Coordenar criação, consulta, atualização e exclusão de funcionários.
 *
 * Dependências principais:
 * - FuncionarioValidator.gs;
 * - FuncionarioRules.gs;
 * - FuncionarioRepository.gs;
 * - LockService — proteção contra operações simultâneas.
 */

/** @return {string} Próximo código sequencial de funcionário. */
function funcionarioServiceGerarCodigo() {
  return String(funcionarioRepositoryObterMaiorCodigo() + 1).padStart(3, "0");
}

/** @return {Array<Object>} Funcionários cadastrados. */
function funcionarioServiceListar() {
  return funcionarioRepositoryListar();
}

/**
 * Cria um funcionário.
 * @param {string} codigo Código gerado pela interface.
 * @param {string} nome Nome do funcionário.
 * @return {{sucesso:boolean,mensagem:string}} Resultado.
 */
function funcionarioServiceCriar(codigo, nome) {
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(10000);
  try {
    const dados = {
      codigo: funcionarioValidatorValidarCodigo(codigo),
      nome: funcionarioValidatorValidarNome(nome)
    };
    if (funcionarioRepositoryBuscarPorCodigo(dados.codigo)) {
      throw new Error("O código " + dados.codigo + " já está cadastrado.");
    }
    funcionarioRepositoryInserir(dados);
    return { sucesso: true, mensagem: "Funcionário cadastrado com sucesso." };
  } finally {
    bloqueio.releaseLock();
  }
}

/**
 * Atualiza o nome de um funcionário existente.
 * @param {string} codigo Código imutável do funcionário.
 * @param {string} nome Novo nome.
 * @return {{sucesso:boolean,mensagem:string}} Resultado.
 */
function funcionarioServiceAtualizar(codigo, nome) {
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(10000);
  try {
    const id = funcionarioValidatorValidarCodigo(codigo);
    const nomeValidado = funcionarioValidatorValidarNome(nome);
    const linha = funcionarioRepositoryObterLinha(id);
    if (linha < 2) throw new Error("Funcionário não encontrado.");
    funcionarioRepositoryAtualizar(linha, { codigo: id, nome: nomeValidado });
    return { sucesso: true, mensagem: "Funcionário atualizado com sucesso." };
  } finally {
    bloqueio.releaseLock();
  }
}

/**
 * Exclui funcionário somente quando não há agendamentos vinculados.
 * @param {string} codigo Código do funcionário.
 * @return {{sucesso:boolean,mensagem:string}} Resultado.
 */
function funcionarioServiceExcluir(codigo) {
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(10000);
  try {
    const id = funcionarioValidatorValidarCodigo(codigo);
    const linha = funcionarioRepositoryObterLinha(id);
    if (linha < 2) throw new Error("Funcionário não encontrado.");
    funcionarioRulesValidarExclusao(
      id,
      funcionarioRepositoryPossuiAgendamentos(id)
    );
    funcionarioRepositoryExcluir(linha);
    return { sucesso: true, mensagem: "Funcionário excluído com sucesso." };
  } finally {
    bloqueio.releaseLock();
  }
}
