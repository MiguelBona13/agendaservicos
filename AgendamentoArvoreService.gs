/**
 * Entidade: Agendamento
 * Camada: Service — Camada de Serviço do modelo Árvore de Decisão.
 *
 * Responsabilidade:
 * Gerar e persistir a indicação de risco de falta para agendamentos futuros.
 *
 * Dependências principais:
 * - AgendamentoArvoreRules.gs;
 * - AgendamentoRepository.gs.
 */

/**
 * Acrescenta a previsão da árvore aos agendamentos já consultados pelo K-NN.
 *
 * A árvore é treinada uma vez por consulta, usando somente resultados reais
 * anteriores ao instante atual. O status original nunca é alterado.
 *
 * @param {Array<Object>} agendamentos Registros retornados pelo Repository.
 * @param {Date=} agora Instante de referência, injetável nos testes.
 * @return {Array<Object>} Registros com a propriedade previsaoArvore.
 */
function agendamentoArvoreServiceAplicarPrevisoes(agendamentos, agora) {
  const registros = Array.isArray(agendamentos) ? agendamentos : [];
  const instante = agora instanceof Date ? agora : new Date();
  const modelo = agendamentoArvoreRulesTreinar(registros, instante);

  registros.forEach(agendamento => {
    let previsao = "";

    if (["Compareceu", "Faltou", "Cancelado", "Reagendado"].includes(agendamento.status)) {
      previsao = "Não aplicável";
    } else if (agendamento.status === "Agendado") {
      previsao = agendamentoArvoreRulesPrever(agendamento, modelo, instante).texto;
    } else {
      previsao = "Sem previsão — status não reconhecido";
    }

    agendamento.previsaoArvore = previsao;
    if (previsao !== String(agendamento.previsaoArvoreSalva || "")) {
      agendamentoRepositoryAtualizarPrevisaoArvore(agendamento.linha, previsao);
    }
  });

  return registros;
}
