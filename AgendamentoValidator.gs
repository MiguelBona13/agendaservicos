/**
 * Entidade: Agendamento
 * Camada: Validator — Validação de Dados
 *
 * Responsabilidade:
 * Validar os dados de entrada para cadastro e cancelamento de agendamentos.
 *
 * Dependências principais:
 * - AgendamentoRepository.gs, para consultar agendamentos existentes.
 */

/**
 * Valida e normaliza os campos básicos de um novo agendamento.
 * A função não acessa a planilha nem verifica regras de conflito.
 *
 * @param {string} codigo Código do agendamento.
 * @param {string} data Data no formato yyyy-MM-dd.
 * @param {string} codigoPeriodo Código do período selecionado.
 * @param {string} codigoFuncionario Código do funcionário.
 * @param {string} codigoCliente Código do cliente.
 * @param {string} codigoServico Código do serviço.
 * @return {{codigo: string, data: string, codigoPeriodo: string, codigoFuncionario: string, codigoCliente: string, codigoServico: string}} Dados normalizados.
 * @throws {Error} Quando algum campo obrigatório ou a data forem inválidos.
 */
function agendamentoValidatorValidarDadosCadastro(
  codigo,
  data,
  codigoPeriodo,
  codigoFuncionario,
  codigoCliente,
  codigoServico
) {
  const dados = {
    codigo: String(codigo || "").trim(),
    data: String(data || "").trim(),
    codigoPeriodo: String(codigoPeriodo || "").trim(),
    codigoFuncionario: String(codigoFuncionario || "").trim(),
    codigoCliente: String(codigoCliente || "").trim(),
    codigoServico: String(codigoServico || "").trim()
  };

  if (!dados.codigo) {
    throw new Error("O código do agendamento é obrigatório.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.data)) {
    throw new Error("A data do agendamento é inválida.");
  }

  const partesData = dados.data.split("-").map(Number);
  const dataObjeto = new Date(
    partesData[0],
    partesData[1] - 1,
    partesData[2]
  );

  if (
    dataObjeto.getFullYear() !== partesData[0] ||
    dataObjeto.getMonth() !== partesData[1] - 1 ||
    dataObjeto.getDate() !== partesData[2]
  ) {
    throw new Error("A data informada não existe.");
  }

  if (!dados.codigoPeriodo) {
    throw new Error("Selecione um período.");
  }

  if (!dados.codigoFuncionario) {
    throw new Error("Selecione um funcionário.");
  }

  if (!dados.codigoCliente) {
    throw new Error("Selecione um cliente.");
  }

  if (!dados.codigoServico) {
    throw new Error("Selecione um serviço.");
  }

  return dados;
}

/**
 * Valida se um agendamento pode ser cancelado.
 *
 * @param {string} codigo Código do agendamento a cancelar.
 * @return {Object} Registro encontrado após a validação.
 * @throws {Error} Quando o código é inválido, não existe ou já foi cancelado.
 */
function agendamentoValidatorValidarCancelamento(codigo) {
  const codigoNormalizado = String(codigo || "").trim();

  if (!codigoNormalizado) {
    throw new Error("Informe o código do agendamento.");
  }

  const agendamento = agendamentoRepositoryBuscarPorCodigo(codigoNormalizado);

  if (!agendamento) {
    throw new Error("Agendamento não encontrado.");
  }

  if (String(agendamento.status).trim().toLowerCase() === "cancelado") {
    throw new Error("Este agendamento já está cancelado.");
  }

  return agendamento;
}


/**
 * Interpreta o corpo de um e-mail de agendamento no formato estruturado acordado.
 * Cada campo deve aparecer exatamente uma vez para evitar leitura ambígua de
 * respostas encaminhadas ou citações de mensagens anteriores.
 *
 * @param {string} corpo Texto simples recebido do Gmail.
 * @return {{cliente:string,servico:string,profissional:string,data:string,horaInicial:string,horaFinal:string}} Dados extraídos.
 * @throws {Error} Quando um campo estiver ausente, repetido ou inválido.
 */
function agendamentoValidatorInterpretarEmail(corpo) {
  const texto = String(corpo || "");
  const definicoes = [
    { chave: "cliente", rotulo: "CLIENTE" },
    { chave: "servico", rotulo: "SERVIÇO" },
    { chave: "profissional", rotulo: "PROFISSIONAL" },
    { chave: "data", rotulo: "DATA" },
    { chave: "horario", rotulo: "HORÁRIO" }
  ];
  const valores = {};

  definicoes.forEach(definicao => {
    const expressao = new RegExp(
      "^[ \\t]*" + definicao.rotulo + "[ \\t]*:[ \\t]*(.*?)[ \\t]*$",
      "gim"
    );
    const ocorrencias = Array.from(texto.matchAll(expressao));

    if (ocorrencias.length !== 1 || !String(ocorrencias[0][1] || "").trim()) {
      throw new Error(
        "O campo " + definicao.rotulo + " deve aparecer exatamente uma vez e possuir valor."
      );
    }

    valores[definicao.chave] = String(ocorrencias[0][1]).trim();
  });

  if (!/^\d{4}-\d{2}-\d{2}$/.test(valores.data)) {
    throw new Error("A data do e-mail deve estar no formato AAAA-MM-DD.");
  }

  const partesData = valores.data.split("-").map(Number);
  const dataObjeto = new Date(
    partesData[0],
    partesData[1] - 1,
    partesData[2]
  );

  if (
    dataObjeto.getFullYear() !== partesData[0] ||
    dataObjeto.getMonth() !== partesData[1] - 1 ||
    dataObjeto.getDate() !== partesData[2]
  ) {
    throw new Error("A data informada no e-mail não existe.");
  }

  const horario = valores.horario.match(
    /^(?:([01]\d|2[0-3]):([0-5]\d))[ \t]+às[ \t]+(?:([01]\d|2[0-3]):([0-5]\d))$/i
  );

  if (!horario) {
    throw new Error("O horário deve seguir o formato HH:mm às HH:mm.");
  }

  const horaInicial = horario[1] + ":" + horario[2];
  const horaFinal = horario[3] + ":" + horario[4];

  if (horaInicial >= horaFinal) {
    throw new Error("O horário final deve ser posterior ao horário inicial.");
  }

  return {
    cliente: valores.cliente,
    servico: valores.servico,
    profissional: valores.profissional,
    data: valores.data,
    horaInicial: horaInicial,
    horaFinal: horaFinal
  };
}
