/**
 * Entidade: AgendamentoBot
 * Camada: Service — Serviço
 *
 * Responsabilidade:
 * Fornecer os dados públicos do bot, identificar o cliente pelo celular e
 * coordenar a consulta e confirmação de um agendamento pelo fluxo oficial.
 */

/** @return {{servicos:Array<Object>,profissionais:Array<Object>}} Opções do bot. */
function agendamentoBotServiceInicializar() {
  const opcoes = agendamentoBotRepositoryListarOpcoes();
  return {
    servicos: opcoes.servicos,
    profissionais: opcoes.profissionais
  };
}

/**
 * Localiza o cliente pelo celular já registrado, sem devolver outros clientes.
 *
 * @param {string} telefone Celular informado pelo cliente.
 * @return {{codigo:string,nome:string}} Cadastro correspondente.
 * @throws {Error} Quando não há exatamente um cadastro correspondente.
 */
function agendamentoBotServiceIdentificarCliente(telefone) {
  const celular = agendamentoBotValidatorNormalizarTelefone(telefone);
  const cliente = agendamentoBotRepositoryBuscarClientePorTelefone(celular);
  if (!cliente) {
    throw new Error("Não encontrei um cadastro único para esse celular. Confira o número ou fale com a equipe para atualizar seu cadastro.");
  }
  return { codigo: cliente.codigo, nome: cliente.nome };
}

/**
 * Lista períodos ativos sem conflito para cliente, profissional e data.
 *
 * @param {string} data Data no formato yyyy-MM-dd recebido do campo de data.
 * @param {string} codigoCliente Código do cliente identificado no servidor.
 * @param {string} codigoFuncionario Código do profissional selecionado.
 * @return {Array<Object>} Horários disponíveis.
 */
function agendamentoBotServiceListarHorarios(data, codigoCliente, codigoFuncionario) {
  const dataValidada = agendamentoBotValidatorValidarData(data);
  const dados = agendamentoBotRepositoryObterDadosDisponibilidade();
  return agendamentoBotRulesListarHorariosDisponiveis(
    dataValidada,
    String(codigoCliente || "").trim(),
    String(codigoFuncionario || "").trim(),
    dados.periodos,
    dados.agendamentos
  );
}

/**
 * Confirma a escolha, identifica novamente o cliente e delega a gravação ao
 * fluxo padrão, que repete validações e verifica conflitos sob bloqueio.
 *
 * @param {Object} pedido Dados selecionados na interface.
 * @return {{sucesso:boolean,mensagem:string,codigo:string}} Resultado final.
 */
function agendamentoBotServiceConfirmar(pedido) {
  const dados = pedido || {};
  const cliente = agendamentoBotServiceIdentificarCliente(dados.telefone);
  if (cliente.codigo !== String(dados.codigoCliente || "").trim()) {
    throw new Error("O cadastro do cliente mudou. Atualize a página e tente novamente.");
  }

  const horarios = agendamentoBotServiceListarHorarios(
    dados.data,
    cliente.codigo,
    dados.codigoFuncionario
  );
  const periodo = horarios.find(item =>
    item.codigo === String(dados.codigoPeriodo || "").trim()
  );
  if (!periodo) {
    throw new Error("Esse horário não está mais disponível. Consulte os horários novamente.");
  }

  const codigo = gerarCodigoAgendamento();
  const resultado = criarAgendamento(
    codigo,
    dados.data,
    periodo.codigo,
    dados.codigoFuncionario,
    cliente.codigo,
    dados.codigoServico
  );
  return { sucesso: resultado.sucesso, mensagem: resultado.mensagem, codigo: codigo };
}

