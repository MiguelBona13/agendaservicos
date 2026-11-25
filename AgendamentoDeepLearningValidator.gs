/**
 * Entidade: Agendamento
 * Camada: Validator — Validação dos parâmetros de Deep Learning.
 *
 * Responsabilidade:
 * Normalizar e validar os parâmetros recebidos pela interface do dashboard.
 *
 * Dependências principais:
 * - Nenhuma; funções puras para execução no Apps Script e nos testes Node.js.
 */

/**
 * Valida os parâmetros do treinamento e da previsão.
 *
 * @param {Object} entrada Valores enviados pela interface.
 * @return {Object} Parâmetros normalizados.
 * @throws {Error} Quando algum parâmetro estiver fora da faixa permitida.
 */
function agendamentoDeepLearningValidatorValidarParametros(entrada) {
  const origem = entrada || {};
  const inteiro = (nome, padrao, minimo, maximo) => {
    const valor = origem[nome] === undefined || origem[nome] === "" ? padrao : Number(origem[nome]);
    if (!Number.isInteger(valor) || valor < minimo || valor > maximo) {
      throw new Error("O parâmetro " + nome + " deve ser um número inteiro entre " + minimo + " e " + maximo + ".");
    }
    return valor;
  };
  const decimal = (nome, padrao, minimo, maximo) => {
    const valor = origem[nome] === undefined || origem[nome] === "" ? padrao : Number(origem[nome]);
    if (!Number.isFinite(valor) || valor < minimo || valor > maximo) {
      throw new Error("O parâmetro " + nome + " deve estar entre " + minimo + " e " + maximo + ".");
    }
    return valor;
  };

  const ativacao = String(origem.ativacao || "tanh").toLowerCase();
  if (!["tanh", "relu"].includes(ativacao)) throw new Error("A função de ativação deve ser tanh ou relu.");

  return {
    neuroniosOcultos: inteiro("neuroniosOcultos", 5, 1, 32),
    epocas: inteiro("epocas", 500, 1, 5000),
    taxaAprendizado: decimal("taxaAprendizado", 0.05, 0.0001, 1),
    janelaHistorica: inteiro("janelaHistorica", 7, 2, 30),
    percentualTreinamento: inteiro("percentualTreinamento", 80, 60, 90),
    ativacao,
    semente: inteiro("semente", 12345, 0, 2147483647),
    horizontePrevisao: inteiro("horizontePrevisao", 10, 1, 10)
  };
}
