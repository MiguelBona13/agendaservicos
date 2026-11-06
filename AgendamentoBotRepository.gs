/**
 * Entidade: AgendamentoBot
 * Camada: Repository — Repositório
 *
 * Responsabilidade:
 * Consultar no Google Sheets somente os dados necessários à experiência
 * pública de agendamento. A lista de clientes nunca é exposta ao navegador.
 */

/**
 * Retorna os serviços e profissionais cadastrados para montar as opções do bot.
 *
 * @return {{servicos:Array<Object>,profissionais:Array<Object>}} Opções públicas.
 */
function agendamentoBotRepositoryListarOpcoes() {
  return {
    servicos: agendamentoRepositoryLerCodigoNome(CONFIG.ABAS.SERVICOS),
    profissionais: agendamentoRepositoryLerCodigoNome(CONFIG.ABAS.FUNCIONARIOS)
  };
}

/**
 * Localiza um cliente pelo celular cadastrado, sem listar clientes ao navegador.
 * O cadastro guarda o telefone na coluna I da aba CLIENTES.
 *
 * @param {string} telefone Telefone normalizado para DDD + número.
 * @return {?Object} Cliente quando houver exatamente uma correspondência.
 */
function agendamentoBotRepositoryBuscarClientePorTelefone(telefone) {
  const alvo = String(telefone || "").replace(/\D/g, "");
  const aba = getSheet(CONFIG.ABAS.CLIENTES);
  const ultimaLinha = aba.getLastRow();
  if (!alvo || ultimaLinha < 2) return null;

  const correspondencias = aba.getRange(2, 1, ultimaLinha - 1, 11).getDisplayValues()
    .filter(linha =>
      String(linha[8] || "").replace(/\D/g, "") === alvo &&
      String(linha[0] || "").trim() && String(linha[1] || "").trim()
    );
  if (correspondencias.length !== 1) return null;
  return {
    codigo: String(correspondencias[0][0]).trim(),
    nome: String(correspondencias[0][1]).trim()
  };
}

/**
 * Retorna os períodos ativos e os registros necessários para conferir horários.
 *
 * @return {{periodos:Array<Object>,agendamentos:Array<Array<*>>}} Dados de agenda.
 */
function agendamentoBotRepositoryObterDadosDisponibilidade() {
  return {
    periodos: consultarPeriodos(),
    agendamentos: agendamentoRepositoryListarRegistrosParaConflito()
  };
}

