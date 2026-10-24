/**
 * Entidade: Agendamento
 * Camada: Interface — pontos de entrada legados
 *
 * Responsabilidade:
 * Preservar os nomes de funções chamados pela interface existente e delegar
 * a execução dos casos de uso à camada AgendamentoService.
 *
 * Dependências principais:
 * - AgendamentoService.gs;
 * - AgendamentoRepository.gs.
 */

/**
 * Gera o próximo código de agendamento com três dígitos e zeros à esquerda.
 *
 * @return {string} Próximo código, por exemplo "001".
 */
function gerarCodigoAgendamento() {
  return String(agendamentoRepositoryObterMaiorCodigo() + 1).padStart(3, "0");
}

/**
 * Mantém compatibilidade com a interface atual e delega o cadastro ao Service.
 *
 * @param {string} codigo Código do agendamento.
 * @param {string} data Data no formato yyyy-MM-dd.
 * @param {string} codigoPeriodo Código do período.
 * @param {string} codigoFuncionario Código do funcionário.
 * @param {string} codigoCliente Código do cliente.
 * @param {string} codigoServico Código do serviço.
 * @return {{sucesso:boolean, mensagem:string}} Resultado da operação.
 */
function cadastrarAgendamento(
  codigo,
  data,
  codigoPeriodo,
  codigoFuncionario,
  codigoCliente,
  codigoServico
) {
  return criarAgendamento(
    codigo,
    data,
    codigoPeriodo,
    codigoFuncionario,
    codigoCliente,
    codigoServico
  );
}
