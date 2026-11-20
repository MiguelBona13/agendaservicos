
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

function consultarPeriodos() {
  const aba = getSheet(CONFIG.ABAS.PERIODOS);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return [];
  }

  return aba
    .getRange(2, 1, ultimaLinha - 1, 5)
    .getDisplayValues()
    .filter(linha =>
      linha[0].trim() !== "" &&
      linha[1].trim() !== ""
    )
    .map(linha => {
      const ativoTexto = linha[4].trim().toLowerCase();

      const ativo = [
        "sim",
        "true",
        "verdadeiro",
        "ativo",
        "1"
      ].includes(ativoTexto);

      return {
        codigo: linha[0].trim(),
        descricao: linha[1].trim(),
        horaInicial: linha[2].trim(),
        horaFinal: linha[3].trim(),
        ativo: ativo
      };
    });
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
