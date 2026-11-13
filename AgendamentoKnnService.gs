/**
 * Entidade: Agendamento
 * Camada: Service — Camada de Serviço do modelo K-NN.
 *
 * Responsabilidade:
 * Gerar e persistir a previsão de comparecimento para agendamentos pendentes,
 * utilizando os resultados reais históricos disponíveis no Repository.
 *
 * Dependências principais:
 * - AgendamentoKnnRules.gs;
 * - AgendamentoRepository.gs.
 */

/**
 * Lista a agenda com a coluna Previsao_KNN atualizada.
 *
 * Status reais concluídos são apresentados como resultado registrado.
 * Cancelados e reagendados não recebem previsão. Apenas agendamentos futuros
 * com status Agendado são classificados pelo K-NN.
 *
 * @return {Array<Object>} Agendamentos com a propriedade previsaoKnn.
 */
function agendamentoKnnServiceListarComPrevisoes() {
  const agendamentos = agendamentoRepositoryListarTodos();
  const agora = new Date();

  agendamentos.forEach(agendamento => {
    let previsao = "";

    if (["Compareceu", "Faltou"].includes(agendamento.status)) {
      previsao = "Resultado real: " + agendamento.status;
    } else if (["Cancelado", "Reagendado"].includes(agendamento.status)) {
      previsao = "Não aplicável";
    } else if (agendamento.status === "Agendado") {
      previsao = agendamentoKnnRulesPrever(
        agendamento,
        agendamentos,
        agora
      ).texto;
    } else {
      previsao = "Sem previsão — status não reconhecido";
    }

    agendamento.previsaoKnn = previsao;
    if (agendamento.previsaoKnn !== String(agendamento.previsaoKnnSalva || "")) {
      agendamentoRepositoryAtualizarPrevisao(agendamento.linha, previsao);
    }
  });

  return agendamentos;
}
