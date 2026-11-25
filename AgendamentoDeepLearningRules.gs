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
/**
 * Cria uma MLP profunda com duas camadas ocultas e saída linear.
 * Ambas as camadas usam a quantidade de neurônios configurada no dashboard.
 */
function agendamentoDeepLearningRulesCriarRede(quantidadeEntradas, neuroniosOcultos, semente) {
  const aleatorio = agendamentoDeepLearningRulesGeradorAleatorio(semente);
  const matriz = (linhas, colunas) => {
    const limite = Math.sqrt(6 / (linhas + colunas));
    return Array.from({ length: linhas }, () =>
      Array.from({ length: colunas }, () => (aleatorio() * 2 - 1) * limite)
    );
  };
  const criarCamada = (entradas, neuronios) => ({
    pesos: matriz(neuronios, entradas),
    vieses: Array(neuronios).fill(0)
  });

  return {
    camadasOcultas: [
      criarCamada(quantidadeEntradas, neuroniosOcultos),
      criarCamada(neuroniosOcultos, neuroniosOcultos)
    ],
    pesosSaida: Array.from({ length: neuroniosOcultos }, () => {
      const limite = Math.sqrt(6 / (neuroniosOcultos + 1));
      return (aleatorio() * 2 - 1) * limite;
    }),
    viesSaida: 0
  };
}

/**
 * Executa a passagem direta e preserva ativações e somas para a retropropagação.
 * A saída é linear; as duas camadas ocultas usam tanh ou ReLU.
 */
function agendamentoDeepLearningRulesPropagar(entrada, rede, ativacao) {
  let valores = entrada.slice();
  const ativacoes = [];
  const preAtivacoes = [];

  rede.camadasOcultas.forEach(camada => {
    const somas = camada.pesos.map((pesos, indice) =>
      pesos.reduce((total, peso, coluna) => total + peso * valores[coluna], camada.vieses[indice])
    );
    valores = somas.map(soma => ativacao === "relu" ? Math.max(0, soma) : Math.tanh(soma));
    preAtivacoes.push(somas);
    ativacoes.push(valores);
  });

  const ultimaCamada = ativacoes[ativacoes.length - 1];
  const saida = ultimaCamada.reduce(
    (total, valor, indice) => total + valor * rede.pesosSaida[indice],
    rede.viesSaida
  );
  return { ativacoes, preAtivacoes, saida };
}

/**
 * Treina uma MLP com duas camadas ocultas por retropropagação.
 * A normalização é calculada exclusivamente com as amostras recebidas.
 */
function agendamentoDeepLearningRulesTreinarRede(amostras, parametros) {
  const { neuroniosOcultos, epocas, taxaAprendizado, ativacao, semente } = parametros;
  if (!Array.isArray(amostras) || amostras.length < 3) {
    throw new Error("Não há amostras suficientes para treinar a rede neural.");
  }

  const medias = [0, 1, 2].map(coluna =>
    amostras.reduce((soma, item) => soma + item.entrada[coluna], 0) / amostras.length
  );
  const desvios = [0, 1, 2].map(coluna => {
    const variancia = amostras.reduce(
      (soma, item) => soma + Math.pow(item.entrada[coluna] - medias[coluna], 2), 0
    ) / amostras.length;
    return Math.sqrt(variancia) || 1;
  });
  const mediaAlvo = amostras.reduce((soma, item) => soma + item.alvo, 0) / amostras.length;
  const desvioAlvo = Math.sqrt(
    amostras.reduce((soma, item) => soma + Math.pow(item.alvo - mediaAlvo, 2), 0) / amostras.length
  ) || 1;
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
      const ultimaAtivacao = passagem.ativacoes[passagem.ativacoes.length - 1];

      // Calcula todos os deltas antes de atualizar os pesos usados no gradiente.
      const deltas = new Array(rede.camadasOcultas.length);
      let gradienteSeguinte = rede.pesosSaida.map(peso => gradienteSaida * peso);
      for (let indiceCamada = rede.camadasOcultas.length - 1; indiceCamada >= 0; indiceCamada--) {
        const camada = rede.camadasOcultas[indiceCamada];
        const ativacoesCamada = passagem.ativacoes[indiceCamada];
        const somasCamada = passagem.preAtivacoes[indiceCamada];
        deltas[indiceCamada] = ativacoesCamada.map((valor, indiceNeuronio) => {
          const derivada = ativacao === "relu"
            ? (somasCamada[indiceNeuronio] > 0 ? 1 : 0)
            : 1 - valor * valor;
          return gradienteSeguinte[indiceNeuronio] * derivada;
        });
        if (indiceCamada > 0) {
          const camadaSeguinte = rede.camadasOcultas[indiceCamada];
          gradienteSeguinte = rede.camadasOcultas[indiceCamada - 1].pesos.map((_, indiceNeuronioAnterior) =>
            camadaSeguinte.pesos.reduce(
              (soma, pesosNeuronioSeguinte, indiceNeuronioSeguinte) =>
                soma + pesosNeuronioSeguinte[indiceNeuronioAnterior] * deltas[indiceCamada][indiceNeuronioSeguinte],
              0
            )
          );
        }
      }

      // Atualiza a camada de saída.
      ultimaAtivacao.forEach((valor, indice) => {
        rede.pesosSaida[indice] -= taxaAprendizado * gradienteSaida * valor;
      });
      rede.viesSaida -= taxaAprendizado * gradienteSaida;

      // Atualiza as camadas ocultas da última para a primeira.
      for (let indiceCamada = rede.camadasOcultas.length - 1; indiceCamada >= 0; indiceCamada--) {
        const camada = rede.camadasOcultas[indiceCamada];
        const entradaCamada = indiceCamada === 0
          ? amostra.entrada
          : passagem.ativacoes[indiceCamada - 1];
        deltas[indiceCamada].forEach((delta, indiceNeuronio) => {
          camada.pesos[indiceNeuronio] = camada.pesos[indiceNeuronio].map(
            (peso, indiceEntrada) => peso - taxaAprendizado * delta * entradaCamada[indiceEntrada]
          );
          camada.vieses[indiceNeuronio] -= taxaAprendizado * delta;
        });
      }
    });
    historicoErro.push(erroTotal / normalizadas.length);
  }

  return {
    rede,
    normalizacao: { medias, desvios, mediaAlvo, desvioAlvo },
    historicoErro,
    ativacao,
    quantidadeCamadasOcultas: 2
  };
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
/**
 * Faz previsões recursivas a partir de uma origem, usando apenas dados disponíveis
 * até aquela origem. Valores previstos entram na janela dos próximos passos.
 *
 * @param {Array<Object>} historico Série disponível até a origem.
 * @param {Object} modelo Rede treinada.
 * @param {number} janela Tamanho da janela móvel.
 * @param {number} horizonte Quantidade de passos futuros.
 * @return {Array<Object>} Previsões recursivas.
 */
function agendamentoDeepLearningRulesPreverHorizonte(historico, modelo, janela, horizonte) {
  const serieFutura = historico.map(item => ({ data: item.data, quantidade: item.quantidade }));
  const previsoes = [];
  for (let passo = 0; passo < horizonte; passo++) {
    const ultima = serieFutura[serieFutura.length - 1];
    const dataObj = new Date(ultima.data + "T00:00:00Z");
    dataObj.setUTCDate(dataObj.getUTCDate() + 1);
    const data = dataObj.toISOString().slice(0, 10);
    const entrada = agendamentoDeepLearningRulesExtrairAtributos(serieFutura, data, janela);
    const quantidade = agendamentoDeepLearningRulesPreverAmostra(entrada, modelo);
    previsoes.push({ data, quantidade });
    serieFutura.push({ data, quantidade });
  }
  return previsoes;
}

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

  // Backtest de origem móvel: cada origem utiliza somente o passado conhecido
  // e avalia o horizonte completo por previsões recursivas.
  const reaisHorizonte = [];
  const previstosHorizonte = [];
  const mediasHorizonte = [];
  const primeiraOrigem = validacao[0].indice - 1;
  for (let origem = primeiraOrigem; origem <= serie.length - parametros.horizontePrevisao - 1; origem++) {
    const passado = serie.slice(0, origem + 1);
    const previsoesOrigem = agendamentoDeepLearningRulesPreverHorizonte(
      passado, modelo, janela, parametros.horizontePrevisao
    );
    previsoesOrigem.forEach((previsao, passo) => {
      reaisHorizonte.push(serie[origem + passo + 1].quantidade);
      previstosHorizonte.push(previsao.quantidade);
      mediasHorizonte.push(mediaTreino);
    });
  }
  const maeRedeHorizonte = agendamentoDeepLearningRulesCalcularMae(reaisHorizonte, previstosHorizonte);
  const maeMediaHorizonte = agendamentoDeepLearningRulesCalcularMae(reaisHorizonte, mediasHorizonte);

  // Após medir o desempenho em dados não vistos, ajusta-se um modelo final
  // com todo o histórico disponível. Assim, a previsão futura aproveita também
  // os dias que ficaram reservados para validação e não descarta dados recentes.
  const modeloFinal = agendamentoDeepLearningRulesTreinarRede(
    amostras.map(item => ({ entrada: item.entrada, alvo: item.alvo })),
    parametros
  );

  const historico = serie.map(item => ({ data: item.data, quantidade: item.quantidade }));
  const previsoesFuturas = [];
  for (let passo = 1; passo <= parametros.horizontePrevisao; passo++) {
    const ultima = historico[historico.length - 1];
    const proximaDataObj = new Date(ultima.data + "T00:00:00Z");
    proximaDataObj.setUTCDate(proximaDataObj.getUTCDate() + 1);
    const proximaData = proximaDataObj.toISOString().slice(0, 10);
    const entrada = agendamentoDeepLearningRulesExtrairAtributos(historico, proximaData, janela);
    const previsao = agendamentoDeepLearningRulesPreverAmostra(entrada, modeloFinal);
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
    diasTreinamentoFinal: amostras.length,
    maeRede,
    maeMedia,
    maeRedeHorizonte,
    maeMediaHorizonte,
    origensAvaliadas: Math.floor(reaisHorizonte.length / parametros.horizontePrevisao),
    melhoriaPercentual: maeMedia > 0 ? ((maeMedia - maeRede) / maeMedia) * 100 : null,
    mediaHistoricaTreino: mediaTreino,
    historicoErro: modeloFinal.historicoErro,
    validacao: validacao.map((item, indice) => ({ data: serie[item.indice].data, real: reais[indice], previsto: previstos[indice], media: mediaTreino })),
    previsoes: previsoesFuturas,
    totalPrevisto: previsoesFuturas.reduce((soma, item) => soma + item.previsao, 0),
    mediaPrevista: previsoesFuturas.reduce((soma, item) => soma + item.previsao, 0) / previsoesFuturas.length,
    maiorPrevisao: Math.max.apply(null, previsoesFuturas.map(item => item.previsao)),
    menorPrevisao: Math.min.apply(null, previsoesFuturas.map(item => item.previsao))
  };
}
