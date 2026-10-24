/**
 * Entidade: Agendamento
 * Camada: Service — Camada de Serviço
 *
 * Responsabilidade:
 * Coordenar os casos de uso de criação e cancelamento de agendamentos.
 *
 * Dependências principais:
 * - AgendamentoValidator.gs;
 * - AgendamentoRules.gs;
 * - AgendamentoRepository.gs;
 * - consultarPeriodos(), de Consultas.js;
 * - codigoExiste() e CONFIG, dos arquivos existentes do projeto;
 * - LockService, do Google Apps Script.
 */

/**
 * Cria um agendamento após validar os dados, verificar as referências e
 * aplicar a regra de conflito. O bloqueio protege a sequência de verificação
 * e gravação contra execuções simultâneas.
 *
 * @param {string} codigo Código do agendamento.
 * @param {string} data Data no formato yyyy-MM-dd.
 * @param {string} codigoPeriodo Código do período.
 * @param {string} codigoFuncionario Código do funcionário.
 * @param {string} codigoCliente Código do cliente.
 * @param {string} codigoServico Código do serviço.
 * @return {{sucesso:boolean, mensagem:string}} Resultado da operação.
 * @throws {Error} Quando os dados forem inválidos ou houver conflito.
 */
function criarAgendamento(
  codigo,
  data,
  codigoPeriodo,
  codigoFuncionario,
  codigoCliente,
  codigoServico
) {
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(10000);

  try {
    const dados = agendamentoValidatorValidarDadosCadastro(
      codigo,
      data,
      codigoPeriodo,
      codigoFuncionario,
      codigoCliente,
      codigoServico
    );

    if (agendamentoRepositoryCodigoExiste(dados.codigo)) {
      throw new Error(`O código ${dados.codigo} já está cadastrado.`);
    }

    const periodo = consultarPeriodos().find(
      item => item.codigo === dados.codigoPeriodo
    );

    if (!periodo) {
      throw new Error("O período selecionado não existe.");
    }

    if (!periodo.ativo) {
      throw new Error("Este período está inativo e não pode ser agendado.");
    }

    if (!codigoExiste(CONFIG.ABAS.FUNCIONARIOS, dados.codigoFuncionario)) {
      throw new Error("O funcionário selecionado não está cadastrado.");
    }

    if (!codigoExiste(CONFIG.ABAS.CLIENTES, dados.codigoCliente)) {
      throw new Error("O cliente selecionado não está cadastrado.");
    }

    const valorServico = agendamentoRepositoryBuscarValorServico(
      dados.codigoServico
    );

    if (valorServico === null) {
      throw new Error("O serviço selecionado não está cadastrado.");
    }

    if (!Number.isFinite(valorServico) || valorServico < 0) {
      throw new Error("O valor do serviço cadastrado é inválido.");
    }

    agendamentoRulesValidarConflito({
      data: dados.data,
      codigoPeriodo: dados.codigoPeriodo,
      codigoFuncionario: dados.codigoFuncionario,
      codigoCliente: dados.codigoCliente
    }, agendamentoRepositoryListarRegistrosParaConflito());

    agendamentoRepositoryInserir([
      dados.codigo,
      dados.data,
      dados.codigoPeriodo,
      dados.codigoFuncionario,
      dados.codigoCliente,
      dados.codigoServico,
      String(valorServico),
      "Agendado"
    ]);

    return {
      sucesso: true,
      mensagem: "Agendamento cadastrado com sucesso."
    };
  } finally {
    bloqueio.releaseLock();
  }
}

/**
 * Cancela um agendamento sem apagar seu histórico, atualizando seu status.
 *
 * @param {string} codigo Código do agendamento a cancelar.
 * @return {{sucesso:boolean, mensagem:string}} Resultado da operação.
 * @throws {Error} Quando o agendamento não existe ou já está cancelado.
 */
function cancelarAgendamento(codigo) {
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(10000);

  try {
    const agendamento = agendamentoValidatorValidarCancelamento(codigo);
    agendamentoRepositoryAtualizarStatus(agendamento.linha, "Cancelado");

    return {
      sucesso: true,
      mensagem: "Agendamento cancelado com sucesso."
    };
  } finally {
    bloqueio.releaseLock();
  }
}
