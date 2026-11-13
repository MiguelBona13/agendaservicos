/**
 * Entidade: Agendamento
 * Camada: Rules — Regras do modelo Árvore de Decisão.
 *
 * Responsabilidade:
 * Treinar uma árvore CART (árvore de classificação e regressão) com resultados
 * históricos válidos e estimar se um agendamento futuro apresenta risco de falta.
 *
 * Dependências principais:
 * - Nenhuma dependência de Google Sheets ou serviços externos.
 *
 * Regras de segurança dos dados:
 * - Somente Compareceu/Faltou anteriores ao instante da previsão treinam o modelo.
 * - Código e Status nunca são características.
 * - Identificadores categóricos são comparados como categorias, não como números.
 */

/** @const {number} Quantidade mínima de resultados reais para treinar. */
const AGENDAMENTO_ARVORE_MINIMO_EXEMPLOS = 8;
/** @const {number} Profundidade máxima para limitar sobreajuste. */
const AGENDAMENTO_ARVORE_PROFUNDIDADE_MAXIMA = 4;
/** @const {number} Quantidade mínima de registros em cada folha. */
const AGENDAMENTO_ARVORE_MINIMO_FOLHA = 2;

/**
 * Converte data e hora em timestamp local, aceitando os formatos do projeto.
 *
 * @param {*} data Data yyyy-MM-dd ou dd/MM/yyyy.
 * @param {*} hora Horário HH:mm.
 * @return {?number} Timestamp válido ou null.
 */
function agendamentoArvoreRulesTimestamp(data, hora) {
  const textoData = String(data || "").trim();
  const textoHora = String(hora || "").trim();
  const iso = textoData.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const br = textoData.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const partes = iso
    ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : br ? [Number(br[3]), Number(br[2]), Number(br[1])] : null;
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
 * Converte a data de cadastro para calcular antecedência da reserva.
 *
 * @param {*} valor Data yyyy-MM-dd, yyyy-MM-dd HH:mm:ss ou dd/MM/yyyy.
 * @return {?number} Timestamp local ou null.
 */
function agendamentoArvoreRulesTimestampCadastro(valor) {
  const texto = String(valor || "").trim();
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const partes = iso
    ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : br ? [Number(br[3]), Number(br[2]), Number(br[1])] : null;
  if (!partes) return null;
  const data = new Date(partes[0], partes[1] - 1, partes[2]);
  return data.getFullYear() === partes[0] &&
    data.getMonth() === partes[1] - 1 &&
    data.getDate() === partes[2] ? data.getTime() : null;
}

/**
 * Extrai características conhecidas antes do atendimento.
 *
 * Códigos de cliente, serviço, funcionário e período são categorias nominais.
 * Dia, mês, minuto do dia, antecedência e valor são características numéricas.
 *
 * @param {Object} item Agendamento da agenda.
 * @return {Object} Características sem código identificador nem status.
 */
function agendamentoArvoreRulesExtrairCaracteristicas(item) {
  const instante = agendamentoArvoreRulesTimestamp(item.data, item.hora);
  if (instante === null) return null;
  const data = new Date(instante);
  const cadastro = agendamentoArvoreRulesTimestampCadastro(item.dataCadastro);
  const hora = String(item.hora || "").match(/^([01]\d|2[0-3]):([0-5]\d)$/);
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
    minutoDia: hora ? Number(hora[1]) * 60 + Number(hora[2]) : null,
    antecedenciaDias: antecedencia,
    valor: Number.isFinite(valor) ? valor : null
  };
}

/**
 * Calcula a impureza Gini de um conjunto de exemplos.
 *
 * @param {Array<Object>} exemplos Exemplos com rótulo faltou.
 * @return {number} Impureza entre zero e 0,5.
 */
function agendamentoArvoreRulesGini(exemplos) {
  if (!exemplos.length) return 0;
  const faltas = exemplos.filter(item => item.faltou).length;
  const proporcao = faltas / exemplos.length;
  return 2 * proporcao * (1 - proporcao);
}

/**
 * Separa exemplos conforme uma condição binária da árvore.
 *
 * @param {Array<Object>} exemplos Exemplos de treinamento.
 * @param {Object} divisao Regra candidata.
 * @return {{esquerda:Array<Object>,direita:Array<Object>}} Partições.
 */
function agendamentoArvoreRulesParticionar(exemplos, divisao) {
  const esquerda = [];
  const direita = [];
  exemplos.forEach(item => {
    const valor = item.caracteristicas[divisao.campo];
    const pertence = divisao.tipo === "numerico"
      ? Number.isFinite(valor) && valor <= divisao.limite
      : String(valor) === divisao.categoria;
    (pertence ? esquerda : direita).push(item);
  });
  return { esquerda, direita };
}

/**
 * Procura a divisão com maior redução ponderada da impureza Gini.
 *
 * Categorias são separadas por igualdade; números por limiares entre valores
 * observados. Assim, códigos nominais não recebem uma ordem artificial.
 *
 * @param {Array<Object>} exemplos Exemplos no nó atual.
 * @return {?Object} Melhor divisão ou null.
 */
function agendamentoArvoreRulesMelhorDivisao(exemplos) {
  const campos = [
    { nome: "cliente", tipo: "categorico" },
    { nome: "servico", tipo: "categorico" },
    { nome: "funcionario", tipo: "categorico" },
    { nome: "periodo", tipo: "categorico" },
    { nome: "diaSemana", tipo: "numerico" },
    { nome: "mes", tipo: "numerico" },
    { nome: "minutoDia", tipo: "numerico" },
    { nome: "antecedenciaDias", tipo: "numerico" },
    { nome: "valor", tipo: "numerico" }
  ];
  const impurezaPai = agendamentoArvoreRulesGini(exemplos);
  let melhor = null;

  function avaliar(divisao) {
    const partes = agendamentoArvoreRulesParticionar(exemplos, divisao);
    if (
      partes.esquerda.length < AGENDAMENTO_ARVORE_MINIMO_FOLHA ||
      partes.direita.length < AGENDAMENTO_ARVORE_MINIMO_FOLHA
    ) return;

    const ponderada =
      (partes.esquerda.length / exemplos.length) * agendamentoArvoreRulesGini(partes.esquerda) +
      (partes.direita.length / exemplos.length) * agendamentoArvoreRulesGini(partes.direita);
    const ganho = impurezaPai - ponderada;
    if (ganho > 0.000001 && (!melhor || ganho > melhor.ganho + 0.0000000001)) {
      melhor = Object.assign({}, divisao, { ganho: ganho });
    }
  }

  campos.forEach(campo => {
    const valores = exemplos
      .map(item => item.caracteristicas[campo.nome])
      .filter(valor => campo.tipo === "numerico"
        ? Number.isFinite(valor)
        : String(valor || "").trim() !== "");

    const unicos = Array.from(new Set(valores));
    if (campo.tipo === "categorico") {
      unicos.forEach(categoria => avaliar({
        campo: campo.nome, tipo: "categorico", categoria: categoria
      }));
      return;
    }

    const ordenados = unicos.map(Number).sort((a, b) => a - b);
    for (let i = 0; i < ordenados.length - 1; i++) {
      if (ordenados[i] === ordenados[i + 1]) continue;
      avaliar({
        campo: campo.nome,
        tipo: "numerico",
        limite: (ordenados[i] + ordenados[i + 1]) / 2
      });
    }
  });

  return melhor;
}

/**
 * Cria recursivamente a árvore de classificação CART.
 *
 * @param {Array<Object>} exemplos Exemplos do nó.
 * @param {number} profundidade Profundidade atual.
 * @return {Object} Nó folha ou nó de decisão.
 */
function agendamentoArvoreRulesConstruirNo(exemplos, profundidade) {
  const faltas = exemplos.filter(item => item.faltou).length;
  const folha = {
    folha: true,
    total: exemplos.length,
    faltas: faltas,
    comparecimentos: exemplos.length - faltas,
    proporcaoFalta: faltas / exemplos.length
  };

  if (
    profundidade >= AGENDAMENTO_ARVORE_PROFUNDIDADE_MAXIMA ||
    exemplos.length < AGENDAMENTO_ARVORE_MINIMO_FOLHA * 2 ||
    faltas === 0 || faltas === exemplos.length
  ) return folha;

  const divisao = agendamentoArvoreRulesMelhorDivisao(exemplos);
  if (!divisao) return folha;

  const partes = agendamentoArvoreRulesParticionar(exemplos, divisao);
  return {
    folha: false,
    campo: divisao.campo,
    tipo: divisao.tipo,
    categoria: divisao.categoria,
    limite: divisao.limite,
    esquerda: agendamentoArvoreRulesConstruirNo(partes.esquerda, profundidade + 1),
    direita: agendamentoArvoreRulesConstruirNo(partes.direita, profundidade + 1),
    fallback: folha
  };
}

/**
 * Treina a árvore apenas com resultados reais anteriores ao instante atual.
 *
 * @param {Array<Object>} historico Registros retornados pelo Repository.
 * @param {Date} agora Instante de referência, injetável nos testes.
 * @return {{raiz:?Object,amostras:number}} Modelo treinado.
 */
function agendamentoArvoreRulesTreinar(historico, agora) {
  const instanteAtual = agora instanceof Date ? agora.getTime() : Date.now();
  const exemplos = (historico || [])
    .filter(item => ["Compareceu", "Faltou"].includes(String(item.status || "").trim()))
    .map(item => {
      const instante = agendamentoArvoreRulesTimestamp(item.data, item.hora);
      const caracteristicas = agendamentoArvoreRulesExtrairCaracteristicas(item);
      return {
        instante: instante,
        caracteristicas: caracteristicas,
        faltou: String(item.status).trim() === "Faltou"
      };
    })
    .filter(item =>
      item.instante !== null &&
      item.instante < instanteAtual &&
      item.caracteristicas !== null
    );

  if (exemplos.length < AGENDAMENTO_ARVORE_MINIMO_EXEMPLOS) {
    return { raiz: null, amostras: exemplos.length };
  }
  return {
    raiz: agendamentoArvoreRulesConstruirNo(exemplos, 0),
    amostras: exemplos.length
  };
}

/**
 * Percorre a árvore e obtém a proporção de faltas na folha correspondente.
 *
 * @param {Object} no Nó atual.
 * @param {Object} caracteristicas Características do agendamento-alvo.
 * @return {Object} Folha com contagem e proporção de faltas.
 */
function agendamentoArvoreRulesClassificarNo(no, caracteristicas) {
  if (!no || no.folha) return no;
  const valor = caracteristicas[no.campo];
  const esquerda = no.tipo === "numerico"
    ? Number.isFinite(valor) && valor <= no.limite
    : String(valor) === String(no.categoria);
  const filho = esquerda ? no.esquerda : no.direita;
  return filho
    ? agendamentoArvoreRulesClassificarNo(filho, caracteristicas)
    : no.fallback;
}

/**
 * Estima se um agendamento futuro apresenta risco de falta.
 *
 * @param {Object} alvo Agendamento pendente.
 * @param {Object} modelo Modelo produzido por agendamentoArvoreRulesTreinar.
 * @param {Date} agora Instante de referência, injetável nos testes.
 * @return {{texto:string,classe:string,amostras:number}} Resultado textual.
 */
function agendamentoArvoreRulesPrever(alvo, modelo, agora) {
  const instanteAtual = agora instanceof Date ? agora.getTime() : Date.now();
  const instanteAlvo = agendamentoArvoreRulesTimestamp(alvo.data, alvo.hora);
  if (instanteAlvo === null || instanteAlvo <= instanteAtual) {
    return { texto: "Sem previsão — horário já iniciado ou inválido", classe: "indisponivel", amostras: modelo ? modelo.amostras : 0 };
  }
  if (!modelo || !modelo.raiz) {
    const quantidade = modelo ? modelo.amostras : 0;
    return { texto: "Sem previsão — histórico insuficiente (" + quantidade + "/" + AGENDAMENTO_ARVORE_MINIMO_EXEMPLOS + ")", classe: "insuficiente", amostras: quantidade };
  }

  const caracteristicas = agendamentoArvoreRulesExtrairCaracteristicas(alvo);
  if (!caracteristicas) {
    return { texto: "Sem previsão — dados do agendamento inválidos", classe: "indisponivel", amostras: modelo.amostras };
  }

  const folha = agendamentoArvoreRulesClassificarNo(modelo.raiz, caracteristicas);
  const risco = folha.proporcaoFalta >= 0.5;
  return {
    texto: risco ? "Risco de falta" : "Sem risco de falta identificado",
    classe: risco ? "risco" : "sem_risco",
    amostras: modelo.amostras
  };
}
