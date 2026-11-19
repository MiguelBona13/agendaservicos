/**
 * Entidade: Agendamento
 * Camada: Rules — Regras do modelo de Regressão Logística.
 *
 * Responsabilidade:
 * Treinar um classificador binário e estimar a probabilidade de falta em
 * agendamentos futuros, utilizando exclusivamente resultados reais anteriores.
 *
 * Dependências principais:
 * - Nenhuma dependência de Google Sheets ou serviços externos.
 *
 * Regras de segurança:
 * - Compareceu representa a classe 0 e Faltou representa a classe 1.
 * - Somente atendimentos concluídos antes do instante da previsão treinam o modelo.
 * - Código do agendamento e Status nunca são características.
 * - Códigos de cliente, serviço, funcionário e período são categorias nominais.
 */

const AGENDAMENTO_LOGISTICA_MINIMO_EXEMPLOS = 20;
const AGENDAMENTO_LOGISTICA_MINIMO_POR_CLASSE = 5;
const AGENDAMENTO_LOGISTICA_ITERACOES_MAXIMAS = 2000;
const AGENDAMENTO_LOGISTICA_TAXA_APRENDIZADO = 0.1;
const AGENDAMENTO_LOGISTICA_REGULARIZACAO = 0.01;

/**
 * Converte data e hora nos formatos utilizados pela agenda em timestamp local.
 *
 * @param {*} data Data yyyy-MM-dd ou dd/MM/yyyy.
 * @param {*} hora Horário HH:mm.
 * @return {?number} Timestamp local ou null quando inválido.
 */
function agendamentoRegressaoLogisticaRulesTimestamp(data, hora) {
  const textoData = String(data || "").trim();
  const textoHora = String(hora || "").trim();
  const iso = textoData.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const brasileira = textoData.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const partes = iso
    ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : brasileira
      ? [Number(brasileira[3]), Number(brasileira[2]), Number(brasileira[1])]
      : null;
  const horario = textoHora.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!partes || !horario) return null;

  const instante = new Date(
    partes[0], partes[1] - 1, partes[2],
    Number(horario[1]), Number(horario[2]), 0, 0
  );
  if (
    instante.getFullYear() !== partes[0] ||
    instante.getMonth() !== partes[1] - 1 ||
    instante.getDate() !== partes[2]
  ) return null;
  return instante.getTime();
}

/**
 * Converte a data de cadastro em timestamp local.
 *
 * @param {*} valor Data yyyy-MM-dd, yyyy-MM-dd HH:mm:ss ou dd/MM/yyyy.
 * @return {?number} Timestamp local ou null.
 */
function agendamentoRegressaoLogisticaRulesTimestampCadastro(valor) {
  const texto = String(valor || "").trim();
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const brasileira = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const partes = iso
    ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : brasileira
      ? [Number(brasileira[3]), Number(brasileira[2]), Number(brasileira[1])]
      : null;
  if (!partes) return null;

  const instante = new Date(partes[0], partes[1] - 1, partes[2]);
  return instante.getFullYear() === partes[0] &&
    instante.getMonth() === partes[1] - 1 &&
    instante.getDate() === partes[2]
    ? instante.getTime()
    : null;
}

/**
 * Extrai características disponíveis antes da realização do atendimento.
 *
 * @param {Object} item Agendamento com dados normalizados.
 * @return {?Object} Características do modelo ou null se data/hora forem inválidas.
 */
function agendamentoRegressaoLogisticaRulesExtrairCaracteristicas(item) {
  const instante = agendamentoRegressaoLogisticaRulesTimestamp(item.data, item.hora);
  if (instante === null) return null;

  const data = new Date(instante);
  const cadastro = agendamentoRegressaoLogisticaRulesTimestampCadastro(item.dataCadastro);
  const hora = String(item.hora || "").match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  const minutoDia = hora ? Number(hora[1]) * 60 + Number(hora[2]) : null;
  const antecedencia = cadastro === null
    ? null
    : Math.max(0, (instante - cadastro) / 86400000);
  const valor = Number(item.valor);

  return {
    cliente: String(item.codigoCliente || "").trim(),
    servico: String(item.codigoServico || "").trim(),
    funcionario: String(item.codigoFuncionario || "").trim(),
    periodo: String(item.codigoPeriodo || "").trim(),
    diaSemana: data.getDay(),
    mes: data.getMonth() + 1,
    minutoDia: minutoDia,
    antecedenciaDias: antecedencia,
    valor: Number.isFinite(valor) ? valor : null
  };
}

/**
 * Aplica a função logística com proteção contra overflow numérico.
 *
 * @param {number} valor Soma ponderada das características.
 * @return {number} Probabilidade entre zero e um.
 */
function agendamentoRegressaoLogisticaRulesSigmoide(valor) {
  const limitado = Math.max(-35, Math.min(35, valor));
  return 1 / (1 + Math.exp(-limitado));
}

/**
 * Monta o vetor numérico a partir das estatísticas do conjunto de treinamento.
 * Valores numéricos ausentes são imputados pela média (valor padronizado zero).
 * Categorias desconhecidas no treinamento ficam com indicadores iguais a zero.
 *
 * @param {Object} caracteristicas Características do agendamento.
 * @param {Object} modelo Estrutura do modelo com categorias e escalas.
 * @return {Array<number>} Vetor de características.
 */
function agendamentoRegressaoLogisticaRulesMontarVetor(caracteristicas, modelo) {
  const vetor = [];
  modelo.camposCategoricos.forEach(campo => {
    const categoria = String(caracteristicas[campo] || "").trim();
    modelo.categorias[campo].forEach(valor => {
      vetor.push(categoria === valor ? 1 : 0);
    });
  });

  modelo.camposNumericos.forEach(campo => {
    const valor = Number(caracteristicas[campo]);
    const normalizado = Number.isFinite(valor)
      ? (valor - modelo.medias[campo]) / modelo.desvios[campo]
      : 0;
    vetor.push(normalizado);
  });
  return vetor;
}

/**
 * Calcula a probabilidade prevista por um vetor de coeficientes.
 *
 * @param {Array<number>} vetor Características numéricas.
 * @param {Array<number>} coeficientes Pesos treinados.
 * @param {number} intercepto Termo independente.
 * @return {number} Probabilidade estimada de falta.
 */
function agendamentoRegressaoLogisticaRulesProbabilidade(vetor, coeficientes, intercepto) {
  let soma = intercepto;
  for (let i = 0; i < vetor.length; i++) {
    soma += vetor[i] * coeficientes[i];
  }
  return agendamentoRegressaoLogisticaRulesSigmoide(soma);
}

/**
 * Treina o modelo por descida do gradiente com regularização L2.
 *
 * @param {Array<Object>} historico Registros da agenda.
 * @param {Date=} agora Instante de referência, injetável nos testes.
 * @return {Object} Modelo treinado ou indicação de histórico insuficiente.
 */
function agendamentoRegressaoLogisticaRulesTreinar(historico, agora) {
  const instanteAtual = agora instanceof Date ? agora.getTime() : Date.now();
  const camposCategoricos = ["cliente", "servico", "funcionario", "periodo"];
  const camposNumericos = [
    "diaSemana", "mes", "minutoDia", "antecedenciaDias", "valor"
  ];

  const exemplos = (historico || [])
    .filter(item => ["Compareceu", "Faltou"].includes(String(item.status || "").trim()))
    .map(item => {
      const instante = agendamentoRegressaoLogisticaRulesTimestamp(item.data, item.hora);
      return {
        instante: instante,
        classe: String(item.status).trim() === "Faltou" ? 1 : 0,
        caracteristicas: agendamentoRegressaoLogisticaRulesExtrairCaracteristicas(item)
      };
    })
    .filter(item =>
      item.instante !== null &&
      item.instante < instanteAtual &&
      item.caracteristicas !== null
    );

  const faltas = exemplos.filter(item => item.classe === 1).length;
  const comparecimentos = exemplos.length - faltas;
  if (
    exemplos.length < AGENDAMENTO_LOGISTICA_MINIMO_EXEMPLOS ||
    faltas < AGENDAMENTO_LOGISTICA_MINIMO_POR_CLASSE ||
    comparecimentos < AGENDAMENTO_LOGISTICA_MINIMO_POR_CLASSE
  ) {
    return {
      treinado: false,
      amostras: exemplos.length,
      faltas: faltas,
      comparecimentos: comparecimentos,
      motivo: "Histórico insuficiente ou sem representação das duas classes."
    };
  }

  const categorias = {};
  camposCategoricos.forEach(campo => {
    categorias[campo] = Array.from(new Set(
      exemplos.map(item => String(item.caracteristicas[campo] || "").trim())
        .filter(Boolean)
    )).sort();
  });

  const medias = {};
  const desvios = {};
  camposNumericos.forEach(campo => {
    const valores = exemplos
      .map(item => Number(item.caracteristicas[campo]))
      .filter(Number.isFinite);
    const media = valores.length
      ? valores.reduce((total, valor) => total + valor, 0) / valores.length
      : 0;
    const variancia = valores.length
      ? valores.reduce((total, valor) => total + Math.pow(valor - media, 2), 0) / valores.length
      : 0;
    medias[campo] = media;
    desvios[campo] = Math.sqrt(variancia) || 1;
  });

  const modelo = {
    treinado: true,
    amostras: exemplos.length,
    faltas: faltas,
    comparecimentos: comparecimentos,
    camposCategoricos: camposCategoricos,
    camposNumericos: camposNumericos,
    categorias: categorias,
    medias: medias,
    desvios: desvios,
    coeficientes: [],
    intercepto: 0
  };

  const vetores = exemplos.map(item =>
    agendamentoRegressaoLogisticaRulesMontarVetor(item.caracteristicas, modelo)
  );
  const dimensoes = vetores[0].length;
  const coeficientes = Array(dimensoes).fill(0);
  let intercepto = Math.log((faltas + 0.5) / (comparecimentos + 0.5));

  for (let iteracao = 0; iteracao < AGENDAMENTO_LOGISTICA_ITERACOES_MAXIMAS; iteracao++) {
    const gradientes = Array(dimensoes).fill(0);
    let gradienteIntercepto = 0;

    vetores.forEach((vetor, indice) => {
      const previsto = agendamentoRegressaoLogisticaRulesProbabilidade(
        vetor, coeficientes, intercepto
      );
      const erro = previsto - exemplos[indice].classe;
      gradienteIntercepto += erro;
      for (let coluna = 0; coluna < dimensoes; coluna++) {
        gradientes[coluna] += erro * vetor[coluna];
      }
    });

    gradienteIntercepto /= exemplos.length;
    let maiorAtualizacao = Math.abs(gradienteIntercepto);
    intercepto -= AGENDAMENTO_LOGISTICA_TAXA_APRENDIZADO * gradienteIntercepto;

    for (let coluna = 0; coluna < dimensoes; coluna++) {
      const gradiente = gradientes[coluna] / exemplos.length +
        AGENDAMENTO_LOGISTICA_REGULARIZACAO * coeficientes[coluna];
      const atualizacao = AGENDAMENTO_LOGISTICA_TAXA_APRENDIZADO * gradiente;
      coeficientes[coluna] -= atualizacao;
      maiorAtualizacao = Math.max(maiorAtualizacao, Math.abs(atualizacao));
    }

    if (maiorAtualizacao < 0.000001) break;
  }

  modelo.coeficientes = coeficientes;
  modelo.intercepto = intercepto;
  return modelo;
}

/**
 * Estima a probabilidade de falta para um agendamento futuro.
 *
 * @param {Object} alvo Agendamento que receberá a previsão.
 * @param {Object} modelo Modelo retornado por agendamentoRegressaoLogisticaRulesTreinar.
 * @param {Date=} agora Instante de referência, injetável nos testes.
 * @return {Object} Probabilidade, faixa de risco e justificativa.
 */
function agendamentoRegressaoLogisticaRulesPrever(alvo, modelo, agora) {
  const instanteAtual = agora instanceof Date ? agora.getTime() : Date.now();
  const instanteAlvo = agendamentoRegressaoLogisticaRulesTimestamp(alvo.data, alvo.hora);
  if (instanteAlvo === null || instanteAlvo <= instanteAtual) {
    return {
      disponivel: false,
      texto: "Sem previsão — horário já iniciado ou inválido",
      classe: "indisponivel",
      probabilidade: null,
      amostras: modelo ? modelo.amostras : 0
    };
  }

  if (!modelo || !modelo.treinado) {
    return {
      disponivel: false,
      texto: "Sem previsão — histórico insuficiente (" +
        (modelo ? modelo.amostras : 0) + "/" +
        AGENDAMENTO_LOGISTICA_MINIMO_EXEMPLOS + ")",
      classe: "insuficiente",
      probabilidade: null,
      amostras: modelo ? modelo.amostras : 0
    };
  }

  const caracteristicas = agendamentoRegressaoLogisticaRulesExtrairCaracteristicas(alvo);
  if (!caracteristicas) {
    return {
      disponivel: false,
      texto: "Sem previsão — dados do agendamento inválidos",
      classe: "indisponivel",
      probabilidade: null,
      amostras: modelo.amostras
    };
  }

  const vetor = agendamentoRegressaoLogisticaRulesMontarVetor(caracteristicas, modelo);
  const probabilidade = agendamentoRegressaoLogisticaRulesProbabilidade(
    vetor, modelo.coeficientes, modelo.intercepto
  );
  const percentual = Math.round(probabilidade * 100);
  const classe = probabilidade >= 0.6
    ? "alto"
    : probabilidade >= 0.3
      ? "moderado"
      : "baixo";
  const descricao = classe === "alto"
    ? "Risco alto"
    : classe === "moderado"
      ? "Risco moderado"
      : "Risco baixo";

  return {
    disponivel: true,
    probabilidade: probabilidade,
    percentual: percentual,
    classe: classe,
    amostras: modelo.amostras,
    texto: percentual + "% — " + descricao
  };
}
