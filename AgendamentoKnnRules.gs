/**
 * Entidade: Agendamento
 * Camada: Rules — Regras do modelo K-NN.
 *
 * Responsabilidade:
 * Calcular a previsão de comparecimento ou falta a partir dos atendimentos
 * históricos concluídos, sem utilizar o resultado do próprio agendamento.
 *
 * Dependências principais:
 * - Nenhuma dependência de Google Sheets ou serviços externos.
 */

/**
 * Converte data e hora do agendamento em timestamp local.
 *
 * @param {string} data Data yyyy-MM-dd ou dd/MM/yyyy.
 * @param {string} hora Horário HH:mm.
 * @return {?number} Timestamp ou null quando os dados forem inválidos.
 */
function agendamentoKnnRulesObterTimestamp(data, hora) {
  const textoData = String(data || "").trim();
  const textoHora = String(hora || "").trim();
  const iso = textoData.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const brasileira = textoData.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const partesData = iso
    ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : brasileira
      ? [Number(brasileira[3]), Number(brasileira[2]), Number(brasileira[1])]
      : null;
  const partesHora = textoHora.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!partesData || !partesHora) return null;

  const instante = new Date(
    partesData[0], partesData[1] - 1, partesData[2],
    Number(partesHora[1]), Number(partesHora[2]), 0, 0
  );
  if (
    instante.getFullYear() !== partesData[0] ||
    instante.getMonth() !== partesData[1] - 1 ||
    instante.getDate() !== partesData[2]
  ) return null;
  return instante.getTime();
}

/**
 * Converte a data de cadastro em timestamp para calcular antecedência.
 *
 * @param {string} valor Data dd/MM/yyyy ou yyyy-MM-dd.
 * @return {?number} Timestamp ou null quando indisponível.
 */
function agendamentoKnnRulesObterTimestampData(valor) {
  const texto = String(valor || "").trim();
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const brasileira = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])).getTime();
  if (brasileira) return new Date(Number(brasileira[3]), Number(brasileira[2]) - 1, Number(brasileira[1])).getTime();
  return null;
}

/**
 * Calcula a distância entre dois agendamentos usando atributos conhecidos
 * antes do atendimento: cliente, serviço, funcionário, período, dia da semana,
 * antecedência da reserva e valor. O código e o status não são características.
 *
 * @param {Object} alvo Agendamento que receberá a previsão.
 * @param {Object} vizinho Agendamento histórico concluído.
 * @return {number} Distância ponderada; valores menores indicam maior semelhança.
 */
function agendamentoKnnRulesCalcularDistancia(alvo, vizinho) {
  const timestampAlvo = agendamentoKnnRulesObterTimestamp(alvo.data, alvo.hora);
  const timestampVizinho = agendamentoKnnRulesObterTimestamp(vizinho.data, vizinho.hora);
  if (timestampAlvo === null || timestampVizinho === null) return Infinity;

  const comparar = (campo, peso) =>
    String(alvo[campo] || "").trim() === String(vizinho[campo] || "").trim()
      ? 0 : peso;

  const diaAlvo = new Date(timestampAlvo).getDay();
  const diaVizinho = new Date(timestampVizinho).getDay();
  const diferencaDia = Math.min(
    Math.abs(diaAlvo - diaVizinho),
    7 - Math.abs(diaAlvo - diaVizinho)
  ) / 3;

  const cadastroAlvo = agendamentoKnnRulesObterTimestampData(alvo.dataCadastro);
  const cadastroVizinho = agendamentoKnnRulesObterTimestampData(vizinho.dataCadastro);
  let diferencaAntecedencia = 0.5;
  if (cadastroAlvo !== null && cadastroVizinho !== null) {
    const antecedenciaAlvo = Math.max(0, (timestampAlvo - cadastroAlvo) / 86400000);
    const antecedenciaVizinho = Math.max(0, (timestampVizinho - cadastroVizinho) / 86400000);
    diferencaAntecedencia = Math.min(1, Math.abs(antecedenciaAlvo - antecedenciaVizinho) / 30);
  }

  const valorAlvo = Number(alvo.valor) || 0;
  const valorVizinho = Number(vizinho.valor) || 0;
  const escalaValor = Math.max(1, Math.abs(valorAlvo), Math.abs(valorVizinho));

  return (
    comparar("codigoCliente", 3) +
    comparar("codigoServico", 1.5) +
    comparar("codigoFuncionario", 1.5) +
    comparar("codigoPeriodo", 1) +
    diferencaDia +
    diferencaAntecedencia +
    Math.min(1, Math.abs(valorAlvo - valorVizinho) / escalaValor) * 0.5
  );
}

/**
 * Classifica um agendamento pendente com K vizinhos históricos mais próximos.
 *
 * Somente Compareceu/Faltou com data e hora anteriores ao instante da previsão
 * são elegíveis. Cancelado, Reagendado e Agendado nunca entram no treinamento.
 *
 * @param {Object} alvo Agendamento futuro a classificar.
 * @param {Array<Object>} historico Todos os registros disponíveis.
 * @param {Date=} agora Instante de referência, injetável nos testes.
 * @return {{texto:string,classe:string,vizinhos:number,comparecimentos:number,faltas:number}} Resultado da previsão.
 */
function agendamentoKnnRulesPrever(alvo, historico, agora) {
  const instanteAtual = agora instanceof Date ? agora.getTime() : Date.now();
  const instanteAlvo = agendamentoKnnRulesObterTimestamp(alvo.data, alvo.hora);
  if (instanteAlvo === null || instanteAlvo <= instanteAtual) {
    return { texto: "Sem previsão — horário já iniciado ou inválido", classe: "indisponivel", vizinhos: 0, comparecimentos: 0, faltas: 0 };
  }

  const exemplos = (historico || [])
    .filter(item => ["Compareceu", "Faltou"].includes(String(item.status || "").trim()))
    .filter(item => {
      const timestamp = agendamentoKnnRulesObterTimestamp(item.data, item.hora);
      return timestamp !== null && timestamp < instanteAtual;
    })
    .map(item => ({
      status: String(item.status).trim(),
      distancia: agendamentoKnnRulesCalcularDistancia(alvo, item)
    }))
    .filter(item => Number.isFinite(item.distancia))
    .sort((a, b) => a.distancia - b.distancia);

  const k = 5;
  if (exemplos.length < k) {
    return {
      texto: "Sem previsão — histórico insuficiente (" + exemplos.length + "/" + k + ")",
      classe: "insuficiente", vizinhos: exemplos.length, comparecimentos: 0, faltas: 0
    };
  }

  const vizinhos = exemplos.slice(0, k);
  let pesoCompareceu = 0;
  let pesoFaltou = 0;
  let comparecimentos = 0;
  let faltas = 0;

  vizinhos.forEach(item => {
    const peso = 1 / (item.distancia + 0.1);
    if (item.status === "Compareceu") {
      pesoCompareceu += peso;
      comparecimentos++;
    } else {
      pesoFaltou += peso;
      faltas++;
    }
  });

  if (Math.abs(pesoCompareceu - pesoFaltou) < 0.000001) {
    return { texto: "Sem previsão — empate entre vizinhos", classe: "empate", vizinhos: k, comparecimentos, faltas };
  }

  const preverComparecimento = pesoCompareceu > pesoFaltou;
  const classe = preverComparecimento ? "comparecimento" : "falta";
  const texto = preverComparecimento
    ? "Provável comparecimento (" + comparecimentos + "/" + k + " vizinhos)"
    : "Risco de falta (" + faltas + "/" + k + " vizinhos)";

  return { texto, classe, vizinhos: k, comparecimentos, faltas };
}
