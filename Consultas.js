
function consultarLista(nomeAba) {
  const abasPermitidas = [
    CONFIG.ABAS.FUNCIONARIOS,
    CONFIG.ABAS.SERVICOS,
    CONFIG.ABAS.CLIENTES,
    CONFIG.ABAS.CIDADES,
    CONFIG.ABAS.BAIRROS
  ];

  if (!abasPermitidas.includes(nomeAba)) {
    throw new Error("Esta lista não está disponível para consulta.");
  }

  const aba = getSheet(nomeAba);
  const ultimaLinha = aba.getLastRow();
  const ultimaColuna = aba.getLastColumn();

  if (ultimaLinha < 1 || ultimaColuna < 1) {
    return {
      colunas: [],
      registros: []
    };
  }

  const dados = aba
    .getRange(1, 1, ultimaLinha, ultimaColuna)
    .getDisplayValues();

  return {
    colunas: dados[0],
    registros: dados.slice(1).filter(linha =>
      linha.some(valor => valor.trim() !== "")
    )
  };
}

function consultarCidades() {
  const aba = getSheet(CONFIG.ABAS.CIDADES);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return [];
  }

  return aba
    .getRange(2, 1, ultimaLinha - 1, 3)
    .getDisplayValues()
    .filter(linha => linha[0].trim() && linha[1].trim())
    .map(linha => ({
      codigo: linha[0].trim(),
      nome: linha[1].trim(),
      estado: linha[2].trim()
    }));
}

function consultarBairros(codigoCidade) {
  const cidade = String(codigoCidade || "").trim();

  if (!cidade) {
    return [];
  }

  const aba = getSheet(CONFIG.ABAS.BAIRROS);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return [];
  }

  return aba
    .getRange(2, 1, ultimaLinha - 1, 3)
    .getDisplayValues()
    .filter(linha =>
      linha[0].trim() &&
      linha[1].trim() &&
      linha[2].trim() === cidade
    )
    .map(linha => ({
      codigo: linha[0].trim(),
      nome: linha[1].trim()
    }));
}

function consultarPeriodos() {
  const aba = getSheet(CONFIG.ABAS.PERIODOS);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return [];
  }

  return aba
    .getRange(2, 1, ultimaLinha - 1, 5)
    .getDisplayValues()
    .filter(linha =>
      linha[0].trim() !== "" &&
      linha[1].trim() !== ""
    )
    .map(linha => {
      const ativoTexto = linha[4].trim().toLowerCase();

      const ativo = [
        "sim",
        "true",
        "verdadeiro",
        "ativo",
        "1"
      ].includes(ativoTexto);

      return {
        codigo: linha[0].trim(),
        descricao: linha[1].trim(),
        horaInicial: linha[2].trim(),
        horaFinal: linha[3].trim(),
        ativo: ativo
      };
    });
}

function consultarAgendamentos() {
  const aba = getSheet(CONFIG.ABAS.AGENDA);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return [];
  }

  const dados = aba
    .getRange(2, 1, ultimaLinha - 1, 8)
    .getValues();

  return dados
    .filter(linha => linha[0] !== "" && linha[0] !== null)
    .map(linha => ({
      codigo: String(linha[0]).trim(),
      data: agendamentoRulesNormalizarData(linha[1]),
      codigoPeriodo: String(linha[2]).trim(),
      codigoFuncionario: String(linha[3]).trim(),
      codigoCliente: String(linha[4]).trim(),
      codigoServico: String(linha[5]).trim(),
      valor: Number(linha[6]) || 0,
      status: String(linha[7]).trim()
    }));
}
