/**
 * Entidade: Agendamento
 * Camada: Service — Coordenação do Dashboard de Deep Learning.
 *
 * Responsabilidade:
 * Orquestrar leitura do histórico, validação de parâmetros e execução do
 * experimento de previsão, sem acessar diretamente o Google Sheets.
 *
 * Dependências principais:
 * - AgendamentoDeepLearningRepository.gs;
 * - AgendamentoDeepLearningValidator.gs;
 * - AgendamentoDeepLearningRules.gs.
 */

/**
 * Prepara a visão inicial do dashboard e informa a qualidade do histórico.
 *
 * @return {Object} Série diária, mapeamento, qualidade e disponibilidade.
 */
function agendamentoDeepLearningServiceObterDiagnostico() {
  const dados = agendamentoDeepLearningRepositoryListarObservacoes();
  const serie = agendamentoDeepLearningRulesCompletarSerie(dados.observacoes);
  return {
    disponivel: serie.length > 0,
    serie: serie,
    mapeamento: dados.mapeamento,
    qualidade: dados.qualidade,
    totalHistorico: serie.reduce((soma, item) => soma + item.quantidade, 0),
    diasAnalisados: serie.length,
    dataInicial: serie.length ? serie[0].data : null,
    dataFinal: serie.length ? serie[serie.length - 1].data : null
  };
}

/**
 * Treina, valida e gera a previsão recursiva conforme os parâmetros recebidos.
 *
 * @param {Object} entrada Parâmetros enviados pelo dashboard.
 * @return {Object} Métricas, curvas, validação, previsões e diagnóstico.
 * @throws {Error} Quando dados ou parâmetros não permitem um experimento válido.
 */
function agendamentoDeepLearningServiceTreinar(entrada) {
  const parametros = agendamentoDeepLearningValidatorValidarParametros(entrada);
  const diagnostico = agendamentoDeepLearningServiceObterDiagnostico();
  if (!diagnostico.disponivel) {
    throw new Error("Não existem registros válidos de data de cadastro para treinamento.");
  }
  const resultado = agendamentoDeepLearningRulesExecutarExperimento(diagnostico.serie, parametros);
  return {
    parametros: parametros,
    mapeamento: diagnostico.mapeamento,
    qualidade: diagnostico.qualidade,
    treinadoEm: new Date().toISOString(),
    resultado: resultado
  };
}
