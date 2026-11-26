
/**
 * Consulta uma das listas de cadastro usando o Repository da própria entidade.
 * A função mantém o contrato público esperado pela interface.
 * @param {string} nomeAba Nome lógico da aba.
 * @return {{colunas:Array<string>,registros:Array<Array<string>>}} Dados tabulares.
 */
function consultarLista(nomeAba) {
  const consultas = {
    [CONFIG.ABAS.FUNCIONARIOS]: funcionarioRepositoryConsultarTabela,
    [CONFIG.ABAS.SERVICOS]: servicoRepositoryConsultarTabela,
    [CONFIG.ABAS.CLIENTES]: clienteRepositoryConsultarTabela,
    [CONFIG.ABAS.CIDADES]: cidadeRepositoryConsultarTabela,
    [CONFIG.ABAS.BAIRROS]: bairroRepositoryConsultarTabela
  };
  const consultar = consultas[nomeAba];
  if (!consultar) throw new Error("Esta lista não está disponível para consulta.");
  return consultar();
}

/** @return {Array<Object>} Cidades disponíveis para seletores. */
function consultarCidades() {
  return cidadeServiceListar();
}

/** @param {string} codigoCidade Código da cidade. @return {Array<Object>} Bairros da cidade. */
function consultarBairros(codigoCidade) {
  return bairroServiceListar(String(codigoCidade || "").trim());
}

/**
 * Mantém o contrato público utilizado pelos fluxos existentes e delega
 * a consulta ao Repository da entidade Período.
 *
 * @return {Array<Object>} Períodos cadastrados.
 */
function consultarPeriodos() {
  return periodoRepositoryListar();
}

/**
 * Mantém a função pública usada pela interface e delega a leitura da AGENDA
 * ao Repository, evitando acesso direto ao Google Sheets nesta camada.
 *
 * @return {Array<Object>} Agendamentos com os dez campos disponíveis.
 */
function consultarAgendamentos() {
  return agendamentoKnnServiceListarComPrevisoes();
}
