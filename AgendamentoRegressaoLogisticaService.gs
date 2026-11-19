/**
 * Entidade: Agendamento
 * Camada: Service — Camada de Serviço da Regressão Logística.
 *
 * Responsabilidade:
 * Coordenar o treinamento do modelo, a previsão de risco e a persistência
 * independente da coluna Previsao_Regressao_Logistica.
 *
 * Dependências principais:
 * - AgendamentoRegressaoLogisticaRules.gs;
 * - AgendamentoRepository.gs.
 */

/**
 * Acrescenta a probabilidade de falta aos registros já consultados pela agenda.
 *
 * O modelo é treinado uma vez por consulta com resultados reais anteriores.
 * A previsão não altera o Status nem as previsões dos outros classificadores.
 *
 * @param {Array<Object>} agendamentos Registros retornados pelo Repository.
 * @param {Date=} agora Instante de referência, injetável nos testes.
 * @return {Array<Object>} Registros com previsaoRegressaoLogistica.
 */
function agendamentoRegressaoLogisticaServiceAplicarPrevisoes(agendamentos, agora) {
  const registros = Array.isArray(agendamentos) ? agendamentos : [];
  const instante = agora instanceof Date ? agora : new Date();
  const modelo = agendamentoRegressaoLogisticaRulesTreinar(registros, instante);

  registros.forEach(agendamento => {
    let previsao = "";

    if (["Compareceu", "Faltou", "Cancelado", "Reagendado"].includes(agendamento.status)) {
      previsao = "Não aplicável";
    } else if (agendamento.status === "Agendado") {
      previsao = agendamentoRegressaoLogisticaRulesPrever(
        agendamento, modelo, instante
      ).texto;
    } else {
      previsao = "Sem previsão — status não reconhecido";
    }

    agendamento.previsaoRegressaoLogistica = previsao;
    if (previsao !== String(agendamento.previsaoRegressaoLogisticaSalva || "")) {
      agendamentoRepositoryAtualizarPrevisaoRegressaoLogistica(
        agendamento.linha, previsao
      );
    }
  });

  return registros;
}
