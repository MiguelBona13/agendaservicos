/**
 * Entidade: Agendamento
 * Camada: Repository — Camada de Acesso a Dados
 *
 * Responsabilidade:
 * Centralizar as operações de leitura e gravação do Google Sheets usadas
 * pelos fluxos de criação, consulta e atualização de agendamentos.
 *
 * Dependências principais:
 * - CONFIG, definido em Config.js;
 * - getSheet(), definido atualmente em Utils.js.
 *
 * Observação:
 * Este arquivo não aplica regras de negócio nem valida dados recebidos.
 */

/**
 * Retorna o maior código numérico já utilizado na aba AGENDA.
 * Os códigos são lidos como texto de exibição para preservar zeros à esquerda.
 *
 * @return {number} Maior código numérico encontrado ou zero se não houver registros.
 */
function agendamentoRepositoryObterMaiorCodigo() {
  const aba = getSheet(CONFIG.ABAS.AGENDA);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return 0;
  }

  const codigos = aba
    .getRange(2, 1, ultimaLinha - 1, 1)
    .getDisplayValues()
    .flat();

  return codigos.reduce((maiorCodigo, codigo) => {
    const numero = Number(String(codigo).trim());

    return Number.isInteger(numero) && numero > maiorCodigo
      ? numero
      : maiorCodigo;
  }, 0);
}

/**
 * Verifica se o código informado já existe na coluna de códigos da aba AGENDA.
 *
 * @param {string} codigo Código do agendamento que será pesquisado.
 * @return {boolean} Verdadeiro quando o código já estiver cadastrado.
 */
function agendamentoRepositoryCodigoExiste(codigo) {
  const aba = getSheet(CONFIG.ABAS.AGENDA);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return false;
  }

  const codigos = aba
    .getRange(2, 1, ultimaLinha - 1, 1)
    .getDisplayValues()
    .flat();

  return codigos.some(valor => String(valor).trim() === String(codigo).trim());
}

/**
 * Busca o valor cadastrado de um serviço pelo código.
 *
 * @param {string} codigoServico Código do serviço procurado.
 * @return {?number} Valor numérico do serviço ou null se não for encontrado.
 */
function agendamentoRepositoryBuscarValorServico(codigoServico) {
  const aba = getSheet(CONFIG.ABAS.SERVICOS);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return null;
  }

  const servicos = aba
    .getRange(2, 1, ultimaLinha - 1, 3)
    .getValues();

  const servico = servicos.find(linha =>
    String(linha[0]).trim() === String(codigoServico).trim()
  );

  if (!servico) {
    return null;
  }

  const valor = Number(servico[2]);
  return Number.isFinite(valor) ? valor : NaN;
}

/**
 * Retorna os registros da agenda necessários para verificar conflitos.
 *
 * @return {Array<Array<*>>} Linhas da agenda, sem o cabeçalho, com até dez colunas.
 */
function agendamentoRepositoryListarRegistrosParaConflito() {
  const aba = getSheet(CONFIG.ABAS.AGENDA);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return [];
  }

  return aba.getRange(2, 1, ultimaLinha - 1, Math.max(8, Math.min(10, aba.getLastColumn()))).getValues();
}

/**
 * Garante os cabeçalhos das colunas hora e Data_Cadastro sem alterar os
 * registros históricos das oito colunas originais.
 *
 * @return {void}
 */
function agendamentoRepositoryGarantirColunasKnn() {
  const aba = getSheet(CONFIG.ABAS.AGENDA);
  if (aba.getLastColumn() < 9) aba.getRange(1, 9).setValue("hora");
  if (aba.getLastColumn() < 10) aba.getRange(1, 10).setValue("Data_Cadastro");
}

/**
 * Grava um agendamento na próxima linha disponível da aba AGENDA.
 * Os dez campos são gravados em uma única operação. Os códigos e horários
 * permanecem como texto; a data de cadastro é recebida do Service.
 *
 * @param {Array<string>} registro Dados na ordem definida para a aba AGENDA.
 * @return {void}
 */
function agendamentoRepositoryInserir(registro) {
  if (!Array.isArray(registro) || registro.length !== 10) {
    throw new Error("O registro do agendamento deve conter exatamente dez campos.");
  }

  agendamentoRepositoryGarantirColunasKnn();
  const aba = getSheet(CONFIG.ABAS.AGENDA);
  const proximaLinha = aba.getLastRow() + 1;
  aba.getRange(proximaLinha, 1, 1, 10).setNumberFormat("@");
  aba.getRange(proximaLinha, 1, 1, 10).setValues([
    registro.map(valor => String(valor == null ? "" : valor))
  ]);
}


/**
 * Busca um agendamento pelo código e informa o número da linha na planilha.
 *
 * @param {string} codigo Código do agendamento procurado.
 * @return {?Object} Dados do agendamento e número da linha, ou null se não existir.
 */
function agendamentoRepositoryBuscarPorCodigo(codigo) {
  const aba = getSheet(CONFIG.ABAS.AGENDA);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return null;
  }

  const registros = aba.getRange(2, 1, ultimaLinha - 1, 10).getDisplayValues();
  const indice = registros.findIndex(linha =>
    String(linha[0]).trim() === String(codigo).trim()
  );

  if (indice === -1) {
    return null;
  }

  const registro = registros[indice];
  return {
    codigo: String(registro[0]).trim(),
    data: registro[1],
    codigoPeriodo: String(registro[2]).trim(),
    codigoFuncionario: String(registro[3]).trim(),
    codigoCliente: String(registro[4]).trim(),
    codigoServico: String(registro[5]).trim(),
    valor: registro[6],
    status: String(registro[7]).trim(),
    hora: String(registro[8] || "").trim(),
    dataCadastro: String(registro[9] || "").trim(),
    linha: indice + 2
  };
}

/**
 * Atualiza o status de um agendamento existente.
 *
 * @param {number} linha Número da linha na aba AGENDA.
 * @param {string} status Novo status do agendamento.
 * @return {void}
 * @throws {Error} Quando a linha informada não corresponde a um registro válido.
 */
function agendamentoRepositoryAtualizarStatus(linha, status) {
  const aba = getSheet(CONFIG.ABAS.AGENDA);

  if (!Number.isInteger(linha) || linha < 2 || linha > aba.getLastRow()) {
    throw new Error("Não foi possível localizar a linha do agendamento.");
  }

  aba.getRange(linha, 8).setNumberFormat("@");
  aba.getRange(linha, 8).setValue(String(status));
}


/**
 * Atualiza os dez campos de um agendamento existente.
 *
 * @param {number} linha Número da linha na aba AGENDA.
 * @param {Array<*>} registro Dados na ordem oficial das dez colunas.
 * @return {void}
 */
function agendamentoRepositoryAtualizarRegistro(linha, registro) {
  const aba = getSheet(CONFIG.ABAS.AGENDA);
  if (!Number.isInteger(linha) || linha < 2 || linha > aba.getLastRow()) {
    throw new Error("Não foi possível localizar a linha do agendamento.");
  }
  if (!Array.isArray(registro) || registro.length !== 10) {
    throw new Error("O registro do agendamento deve conter exatamente dez campos.");
  }
  agendamentoRepositoryGarantirColunasKnn();
  aba.getRange(linha, 1, 1, 10).setNumberFormat("@");
  aba.getRange(linha, 1, 1, 10).setValues([
    registro.map(valor => String(valor == null ? "" : valor))
  ]);
}

/**
 * Lista todos os agendamentos, aceitando linhas históricas com apenas oito campos.
 *
 * @return {Array<Object>} Agendamentos com os dez campos disponíveis.
 */
function agendamentoRepositoryListarTodos() {
  const aba = getSheet(CONFIG.ABAS.AGENDA);
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return [];
  const colunas = Math.max(8, Math.min(10, aba.getLastColumn()));
  return aba.getRange(2, 1, ultimaLinha - 1, colunas).getValues()
    .map((linha, indice) => ({
      codigo: String(linha[0] || "").trim(),
      data: agendamentoRulesNormalizarData(linha[1]),
      codigoPeriodo: String(linha[2] || "").trim(),
      codigoFuncionario: String(linha[3] || "").trim(),
      codigoCliente: String(linha[4] || "").trim(),
      codigoServico: String(linha[5] || "").trim(),
      valor: Number(linha[6]) || 0,
      status: String(linha[7] || "").trim(),
      hora: String(linha[8] || "").trim(),
      dataCadastro: String(linha[9] || "").trim(),
      linha: indice + 2
    }))
    .filter(item => item.codigo);
}

/**
 * Lê cadastros de clientes, serviços e funcionários e períodos disponíveis
 * para resolver os nomes recebidos em mensagens de agendamento.
 *
 * @return {{clientes:Array<Object>,servicos:Array<Object>,funcionarios:Array<Object>,periodos:Array<Object>}} Cadastros necessários à importação.
 */
function agendamentoRepositoryListarCadastrosEmail() {
  const clientes = agendamentoRepositoryLerCodigoNome(CONFIG.ABAS.CLIENTES);
  const servicos = agendamentoRepositoryLerCodigoNome(CONFIG.ABAS.SERVICOS);
  const funcionarios = agendamentoRepositoryLerCodigoNome(CONFIG.ABAS.FUNCIONARIOS);
  const abaPeriodos = getSheet(CONFIG.ABAS.PERIODOS);
  const ultimaLinhaPeriodos = abaPeriodos.getLastRow();

  const periodos = ultimaLinhaPeriodos < 2
    ? []
    : abaPeriodos
      .getRange(2, 1, ultimaLinhaPeriodos - 1, 5)
      .getDisplayValues()
      .filter(linha =>
        String(linha[0] || "").trim() &&
        String(linha[1] || "").trim()
      )
      .map(linha => ({
        codigo: String(linha[0]).trim(),
        descricao: String(linha[1]).trim(),
        horaInicial: String(linha[2]).trim(),
        horaFinal: String(linha[3]).trim(),
        ativo: ["sim", "true", "verdadeiro", "ativo", "1"].includes(
          String(linha[4] || "").trim().toLowerCase()
        )
      }));

  return {
    clientes: clientes,
    servicos: servicos,
    funcionarios: funcionarios,
    periodos: periodos
  };
}

/**
 * Lê código e nome de uma aba de cadastro permitida.
 *
 * @param {string} nomeAba Nome da aba de clientes, serviços ou funcionários.
 * @return {Array<{codigo:string,nome:string}>} Cadastros com código e nome.
 */
function agendamentoRepositoryLerCodigoNome(nomeAba) {
  const abasPermitidas = [
    CONFIG.ABAS.CLIENTES,
    CONFIG.ABAS.SERVICOS,
    CONFIG.ABAS.FUNCIONARIOS
  ];

  if (!abasPermitidas.includes(nomeAba)) {
    throw new Error("Aba não permitida para consulta de cadastros.");
  }

  const aba = getSheet(nomeAba);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return [];
  }

  return aba
    .getRange(2, 1, ultimaLinha - 1, 2)
    .getDisplayValues()
    .filter(linha =>
      String(linha[0] || "").trim() &&
      String(linha[1] || "").trim()
    )
    .map(linha => ({
      codigo: String(linha[0]).trim(),
      nome: String(linha[1]).trim()
    }));
}
