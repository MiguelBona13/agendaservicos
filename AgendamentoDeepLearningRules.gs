/**
 * Entidade: Agendamento
 * Camada: Rules — Regras de negócio e algoritmo de Deep Learning.
 *
 * Responsabilidade:
 * Preparar a série diária de novos cadastros, treinar uma rede MLP por
 * retropropagação, avaliar a validação temporal e produzir previsões recursivas.
 *
 * Dependências principais:
 * - Nenhuma dependência do Google Apps Script; funções puras para teste em Node.js.
 */

/** Normaliza um número de forma determinística e rejeita valores inválidos. */
function agendamentoDeepLearningRulesNormalizarNumero(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * Constrói uma série diária contínua, incluindo dias sem novos cadastros.
 * Datas duplicadas são agregadas; o resultado é ordenado cronologicamente.
 *
 * @param {Array<{data:string,quantidade:number}>} observacoes Observações diárias.
 * @return {Array<{data:string,quantidade:number}>} Série sem lacunas.
 */
function agendamentoDeepLearningRulesCompletarSerie(observacoes) {
  if (!Array.isArray(observacoes) || observacoes.length === 0) return [];
  const totais = new Map();

  observacoes.forEach(item => {
    const data = String(item.data || "").slice(0, 10);
    const quantidade = agendamentoDeepLearningRulesNormalizarNumero(item.quantidade);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || quantidade === null || quantidade < 0) return;
    const partes = data.split("-").map(Number);
    const dataUtc = new Date(Date.UTC(partes[0], partes[1] - 1, partes[2]));
    if (dataUtc.toISOString().slice(0, 10) !== data) return;
    totais.set(data, (totais.get(data) || 0) + quantidade);
  });

  const datas = Array.from(totais.keys()).sort();
  if (!datas.length) return [];
  const inicio = new Date(datas[0] + "T00:00:00Z");
  const fim = new Date(datas[datas.length - 1] + "T00:00:00Z");
  const serie = [];

  for (let cursor = new Date(inicio); cursor <= fim; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const data = cursor.toISOString().slice(0, 10);
    serie.push({ data, quantidade: totais.get(data) || 0 });
  }
  return serie;
}

/** Calcula os três atributos disponíveis no instante da previsão. */
function agendamentoDeepLearningRulesExtrairAtributos(historico, dataAlvo, janela) {
  const valores = historico.slice(-janela).map(item => Number(item.quantidade));
  if (valores.length !== janela || valores.some(valor => !Number.isFinite(valor))) {
    throw new Error("Histórico insuficiente para calcular os atributos da previsão.");
  }
  const dia = new Date(dataAlvo + "T00:00:00Z").getUTCDay();
  const angulo = 2 * Math.PI * dia / 7;
  return [Math.sin(angulo), Math.cos(angulo), valores.reduce((soma, valor) => soma + valor, 0) / janela];
}

/** Gera números pseudoaleatórios reproduzíveis a partir de uma semente inteira. */
function agendamentoDeepLearningRulesGeradorAleatorio(semente) {
  let estado = (Number(semente) >>> 0) || 12345;
  return function () {
    estado = (estado * 1664525 + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

/** Calcula a média absoluta dos erros entre valores observados e previstos. */
function agendamentoDeepLearningRulesCalcularMae(reais, previstos) {
  if (!Array.isArray(reais) || !Array.isArray(previstos) || !reais.length || reais.length !== previstos.length) return null;
  return reais.reduce((soma, real, indice) => soma + Math.abs(real - previstos[indice]), 0) / reais.length;
}

/** Cria uma rede MLP com uma camada oculta e saída linear. */
function agendamentoDeepLearningRulesCriarRede(quantidadeEntradas, neuroniosOcultos, semente) {
  const aleatorio = agendamentoDeepLearningRulesGeradorAleatorio(semente);
  const limiteEntrada = Math.sqrt(6 / (quantidadeEntradas + neuroniosOcultos));
  const limiteSaida = Math.sqrt(6 / (neuroniosOcultos + 1));
  const matriz = (linhas, colunas, limite) =>
    Array.from({ length: linhas }, () => Array.from({ length: colunas }, () => (aleatorio() * 2 - 1) * limite));

  return {
    pesosOcultos: matriz(neuroniosOcultos, quantidadeEntradas, limiteEntrada),
    viesesOcultos: Array(neuroniosOcultos).fill(0),
    pesosSaida: Array.from({ length: neuroniosOcultos }, () => (aleatorio() * 2 - 1) * limiteSaida),
    viesSaida: 0
  };
}

/** Executa a passagem direta da rede neural. */
function agendamentoDeepLearningRulesPropagar(entrada, rede, ativacao) {
  const ocultos = rede.pesosOcultos.map((pesos, indice) => {
    const soma = pesos.reduce((total, peso, coluna) => total + peso * entrada[coluna], rede.viesesOcultos[indice]);
    return ativacao === "relu" ? Math.max(0, soma) : Math.tanh(soma);
  });
  const saida = ocultos.reduce((total, valor, indice) => total + valor * rede.pesosSaida[indice], rede.viesSaida);
  return { ocultos, saida };
}

/**
 * Treina a rede MLP por retropropagação real, atualizando pesos e vieses.
 * Normalização de atributos e alvo é calculada somente no conjunto de treino.
 *
 * @param {Array<{entrada:number[],alvo:number}>} amostras Amostras cronológicas.
 * @param {Object} parametros Parâmetros validados do treinamento.
 * @return {Object} Rede treinada, normalização e histórico de erro por época.
 */
function agendamentoDeepLearningRulesTreinarRede(amostras, parametros) {
  const { neuroniosOcultos, epocas, taxaAprendizado, ativacao, semente } = parametros;
  if (!Array.isArray(amostras) || amostras.length < 3) throw new Error("Não há amostras suficientes para treinar a rede neural.");
  const medias = [0, 1, 2].map(coluna => amostras.reduce((soma, item) => soma + item.entrada[coluna], 0) / amostras.length);
  const desvios = [0, 1, 2].map(coluna => {
    const variancia = amostras.reduce((soma, item) => soma + Math.pow(item.entrada[coluna] - medias[coluna], 2), 0) / amostras.length;
    return Math.sqrt(variancia) || 1;
  });
  const mediaAlvo = amostras.reduce((soma, item) => soma + item.alvo, 0) / amostras.length;
  const desvioAlvo = Math.sqrt(amostras.reduce((soma, item) => soma + Math.pow(item.alvo - mediaAlvo, 2), 0) / amostras.length) || 1;
  const normalizadas = amostras.map(item => ({
    entrada: item.entrada.map((valor, coluna) => (valor - medias[coluna]) / desvios[coluna]),
    alvo: (item.alvo - mediaAlvo) / desvioAlvo
  }));
  const rede = agendamentoDeepLearningRulesCriarRede(3, neuroniosOcultos, semente);
  const historicoErro = [];

  for (let epoca = 0; epoca < epocas; epoca++) {
    let erroTotal = 0;
    normalizadas.forEach(amostra => {
      const passagem = agendamentoDeepLearningRulesPropagar(amostra.entrada, rede, ativacao);
      const erro = passagem.saida - amostra.alvo;
      erroTotal += erro * erro;
      const gradienteSaida = 2 * erro;
      const pesosSaidaAntigos = rede.pesosSaida.slice();

      passagem.ocultos.forEach((valor, indice) => {
        const derivada = ativacao === "relu"
          ? (rede.pesosOcultos[indice].reduce((soma, peso, coluna) => soma + peso * amostra.entrada[coluna], rede.viesesOcultos[indice]) > 0 ? 1 : 0)
          : 1 - valor * valor;
        const gradienteOculto = gradienteSaida * pesosSaidaAntigos[indice] * derivada;
        rede.pesosOcultos[indice] = rede.pesosOcultos[indice].map((peso, coluna) => peso - taxaAprendizado * gradienteOculto * amostra.entrada[coluna]);
        rede.viesesOcultos[indice] -= taxaAprendizado * gradienteOculto;
        rede.pesosSaida[indice] -= taxaAprendizado * gradienteSaida * valor;
      });
      rede.viesSaida -= taxaAprendizado * gradienteSaida;
    });
    historicoErro.push(erroTotal / normalizadas.length);
  }

  return { rede, normalizacao: { medias, desvios, mediaAlvo, desvioAlvo }, historicoErro, ativacao };
}

/** Executa a previsão numérica e desfaz a normalização do alvo. */
function agendamentoDeepLearningRulesPreverAmostra(entrada, modelo) {
  const normalizada = entrada.map((valor, coluna) =>
    (valor - modelo.normalizacao.medias[coluna]) / modelo.normalizacao.desvios[coluna]
  );
  const resultado = agendamentoDeepLearningRulesPropagar(normalizada, modelo.rede, modelo.ativacao).saida;
  return Math.max(0, resultado * modelo.normalizacao.desvioAlvo + modelo.normalizacao.mediaAlvo);
}

/**
 * Executa treinamento cronológico, avaliação de um passo e previsão recursiva.
 * A validação não participa do cálculo de normalização nem da atualização dos pesos.
 *
 * @param {Array<{data:string,quantidade:number}>} serie Série diária completa.
 * @param {Object} parametros Configurações validadas.
 * @return {Object} Métricas, curvas, previsões e diagnóstico.
 */
function agendamentoDeepLearningRulesExecutarExperimento(serie, parametros) {
  const janela = parametros.janelaHistorica;
  if (!Array.isArray(serie) || serie.length < janela + 8) {
    throw new Error("Histórico insuficiente. São necessários pelo menos " + (janela + 8) + " dias consecutivos para treinar e validar.");
  }
  const inicioAmostras = janela;
  const amostras = [];
  for (let indice = inicioAmostras; indice < serie.length; indice++) {
    amostras.push({
      indice,
      entrada: agendamentoDeepLearningRulesExtrairAtributos(serie.slice(0, indice), serie[indice].data, janela),
      alvo: serie[indice].quantidade
    });
  }
  const quantidadeTreino = Math.floor(amostras.length * parametros.percentualTreinamento / 100);
  const treino = amostras.slice(0, quantidadeTreino);
  const validacao = amostras.slice(quantidadeTreino);
  if (treino.length < 3 || validacao.length < 2) throw new Error("A divisão temporal não deixou amostras suficientes para treinamento e validação.");

  const modelo = agendamentoDeepLearningRulesTreinarRede(treino, parametros);
  const reais = [];
  const previstos = [];
  validacao.forEach(amostra => {
    reais.push(amostra.alvo);
    previstos.push(agendamentoDeepLearningRulesPreverAmostra(amostra.entrada, modelo));
  });

  const maeRede = agendamentoDeepLearningRulesCalcularMae(reais, previstos);
  const mediaTreino = treino.reduce((soma, item) => soma + item.alvo, 0) / treino.length;
  const maeMedia = agendamentoDeepLearningRulesCalcularMae(reais, reais.map(() => mediaTreino));

  const historico = serie.map(item => ({ data: item.data, quantidade: item.quantidade }));
  const previsoesFuturas = [];
  for (let passo = 1; passo <= parametros.horizontePrevisao; passo++) {
    const ultima = historico[historico.length - 1];
    const proximaDataObj = new Date(ultima.data + "T00:00:00Z");
    proximaDataObj.setUTCDate(proximaDataObj.getUTCDate() + 1);
    const proximaData = proximaDataObj.toISOString().slice(0, 10);
    const entrada = agendamentoDeepLearningRulesExtrairAtributos(historico, proximaData, janela);
    const previsao = agendamentoDeepLearningRulesPreverAmostra(entrada, modelo);
    const mediaReferencia = entrada[2];
    const registro = {
      data: proximaData,
      diaSemana: ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"][new Date(proximaData + "T00:00:00Z").getUTCDay()],
      previsao,
      previsaoInteira: Math.round(previsao),
      mediaReferencia
    };
    previsoesFuturas.push(registro);
    historico.push({ data: proximaData, quantidade: previsao });
  }

  return {
    dataReferencia: serie[serie.length - 1].data,
    totalHistorico: serie.reduce((soma, item) => soma + item.quantidade, 0),
    mediaDiaria: serie.reduce((soma, item) => soma + item.quantidade, 0) / serie.length,
    diasAnalisados: serie.length,
    diasTreinamento: treino.length,
    diasValidacao: validacao.length,
    maeRede,
    maeMedia,
    melhoriaPercentual: maeMedia > 0 ? ((maeMedia - maeRede) / maeMedia) * 100 : null,
    mediaHistoricaTreino: mediaTreino,
    historicoErro: modelo.historicoErro,
    validacao: validacao.map((item, indice) => ({ data: serie[item.indice].data, real: reais[indice], previsto: previstos[indice], media: mediaTreino })),
    previsoes: previsoesFuturas,
    totalPrevisto: previsoesFuturas.reduce((soma, item) => soma + item.previsao, 0),
    mediaPrevista: previsoesFuturas.reduce((soma, item) => soma + item.previsao, 0) / previsoesFuturas.length,
    maiorPrevisao: Math.max.apply(null, previsoesFuturas.map(item => item.previsao)),
    menorPrevisao: Math.min.apply(null, previsoesFuturas.map(item => item.previsao))
  };
}
