/**
 * Entidade: Agendamento
 * Camada: Service — Camada de Serviço
 *
 * Responsabilidade:
 * Coordenar a importação de agendamentos recebidos por e-mail, reutilizando
 * as validações, regras de conflito e o fluxo oficial de criação da entidade.
 *
 * Dependências principais:
 * - AgendamentoEmailRepository.gs;
 * - AgendamentoRepository.gs;
 * - AgendamentoValidator.gs;
 * - AgendamentoRules.gs;
 * - Agenda.js, para gerar o próximo código;
 * - criarAgendamento(), de AgendamentoService.gs.
 */

/**
 * Registra o marco inicial do monitoramento de e-mails.
 * Deve ser executada uma única vez após a implantação da funcionalidade.
 *
 * @return {{sucesso:boolean,inicializado:boolean,mensagem:string}} Resultado da configuração.
 */
function agendamentoEmailServiceInicializarMonitoramento() {
  const resultado = agendamentoEmailRepositoryInicializarMonitoramento();

  return {
    sucesso: true,
    inicializado: resultado.inicializado,
    mensagem: resultado.inicializado
      ? "Monitoramento inicializado. Somente e-mails recebidos a partir de agora serão considerados."
      : "O monitoramento já estava inicializado. A data inicial foi preservada."
  };
}

/**
 * Processa individualmente os novos e-mails com assunto AGENDAMENTO.
 * Cada mensagem válida cria um registro pelo fluxo criarAgendamento().
 * Mensagens inválidas permanecem disponíveis para nova tentativa após correção.
 *
 * @return {{sucesso:boolean,totalEncontrados:number,totalCriados:number,totalFalhas:number,resultados:Array<Object>,mensagem:string}} Resumo do processamento.
 * @throws {Error} Quando o monitoramento ainda não foi inicializado.
 */
function agendamentoEmailServiceProcessarNovosEmails() {
  const mensagens = agendamentoEmailRepositoryListarMensagensNovas(100);

  if (!mensagens.length) {
    return {
      sucesso: true,
      totalEncontrados: 0,
      totalCriados: 0,
      totalFalhas: 0,
      resultados: [],
      mensagem: "Nenhum novo e-mail de agendamento foi encontrado."
    };
  }

  const cadastros = agendamentoRepositoryListarCadastrosEmail();
  const resultados = [];
  let totalCriados = 0;
  let totalFalhas = 0;

  mensagens.forEach(mensagem => {
    const reservado = agendamentoEmailRepositoryReservarProcessamento(mensagem.id);

    if (!reservado) {
      return;
    }

    let agendamentoCriado = false;

    try {
      const dadosEmail = agendamentoValidatorInterpretarEmail(mensagem.corpo);
      const cliente = agendamentoRulesResolverCadastroPorNome(
        dadosEmail.cliente,
        cadastros.clientes,
        "Cliente"
      );
      const servico = agendamentoRulesResolverCadastroPorNome(
        dadosEmail.servico,
        cadastros.servicos,
        "Serviço"
      );
      const funcionario = agendamentoRulesResolverCadastroPorNome(
        dadosEmail.profissional,
        cadastros.funcionarios,
        "Profissional"
      );
      const periodo = agendamentoRulesResolverPeriodoPorHorario(
        dadosEmail.horaInicial,
        dadosEmail.horaFinal,
        cadastros.periodos
      );
      const codigoAgendamento = gerarCodigoAgendamento();

      const resultado = criarAgendamento(
        codigoAgendamento,
        dadosEmail.data,
        periodo.codigo,
        funcionario.codigo,
        cliente.codigo,
        servico.codigo
      );

      agendamentoCriado = true;
      agendamentoEmailRepositoryRegistrarProcessamento(
        mensagem.id,
        codigoAgendamento
      );

      totalCriados += 1;
      resultados.push({
        status: "criado",
        assunto: mensagem.assunto,
        codigoAgendamento: codigoAgendamento,
        mensagem: resultado.mensagem
      });
    } catch (erro) {
      totalFalhas += 1;

      // Se o agendamento já foi criado, manter a reserva evita duplicidade
      // caso ocorra falha ao registrar o ID da mensagem como processado.
      if (!agendamentoCriado) {
        agendamentoEmailRepositoryLiberarProcessamento(mensagem.id);
      }

      resultados.push({
        status: "erro",
        assunto: mensagem.assunto,
        mensagem: erro && erro.message ? erro.message : String(erro)
      });
    }
  });

  return {
    sucesso: totalFalhas === 0,
    totalEncontrados: mensagens.length,
    totalCriados: totalCriados,
    totalFalhas: totalFalhas,
    resultados: resultados,
    mensagem:
      totalCriados + " agendamento(s) criado(s); " +
      totalFalhas + " mensagem(ns) com erro."
  };
}
