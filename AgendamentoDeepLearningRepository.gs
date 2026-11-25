/**
 * Entidade: Agendamento
 * Camada: Repository — Acesso aos dados históricos no Google Sheets.
 *
 * Responsabilidade:
 * Localizar a aba de agendamentos, identificar cabeçalhos semanticamente e
 * retornar observações de data de cadastro sem modificar a planilha.
 *
 * Dependências principais:
 * - CONFIG e getSheet(), já existentes no projeto.
 * - AgendamentoDeepLearningRules.gs para completar a série diária.
 */

/** Normaliza cabeçalhos ignorando acentos, espaços, pontuação e caixa. */
function agendamentoDeepLearningRepositoryNormalizarCabecalho(valor) {
  return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Resolve a coluna por um conjunto de nomes semanticamente equivalentes. */
function agendamentoDeepLearningRepositoryLocalizarColuna(cabecalhos, aliases) {
  const normalizados = cabecalhos.map(agendamentoDeepLearningRepositoryNormalizarCabecalho);
  const procurados = aliases.map(agendamentoDeepLearningRepositoryNormalizarCabecalho);
  return normalizados.findIndex(nome => procurados.includes(nome));
}

/** Converte datas de célula para AAAA-MM-DD sem utilizar a data do atendimento. */
function agendamentoDeepLearningRepositoryNormalizarDataCadastro(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  if (typeof valor === "number" && Number.isFinite(valor)) {
    const dataPlanilha = new Date(Date.UTC(1899, 11, 30) + Math.floor(valor) * 86400000);
    return dataPlanilha.toISOString().slice(0, 10);
  }
  const texto = String(valor || "").trim();
  if (!texto) return null;
  let correspondencia = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (correspondencia) {
    const data = correspondencia[1] + "-" + correspondencia[2].padStart(2, "0") + "-" + correspondencia[3].padStart(2, "0");
    return agendamentoDeepLearningRepositoryDataValida(data) ? data : null;
  }
  correspondencia = texto.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (correspondencia) {
    const data = correspondencia[3] + "-" + correspondencia[2].padStart(2, "0") + "-" + correspondencia[1].padStart(2, "0");
    return agendamentoDeepLearningRepositoryDataValida(data) ? data : null;
  }
  const convertida = new Date(texto);
  return !isNaN(convertida.getTime()) ? Utilities.formatDate(convertida, Session.getScriptTimeZone(), "yyyy-MM-dd") : null;
}

/** Verifica uma data ISO por componentes, evitando normalizações silenciosas. */
function agendamentoDeepLearningRepositoryDataValida(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const partes = data.split("-").map(Number);
  const objeto = new Date(Date.UTC(partes[0], partes[1] - 1, partes[2]));
  return objeto.toISOString().slice(0, 10) === data;
}

/**
 * Lê os registros de cadastro sem gravar, formatar ou criar abas.
 *
 * @return {Object} Observações, metadados do mapeamento e qualidade dos dados.
 * @throws {Error} Se a aba ou o cabeçalho de data de cadastro não existir.
 */
function agendamentoDeepLearningRepositoryListarObservacoes() {
  const nomeAba = CONFIG && CONFIG.ABAS && CONFIG.ABAS.AGENDA ? CONFIG.ABAS.AGENDA : "AGENDA";
  const aba = getSheet(nomeAba);
  const ultimaLinha = aba.getLastRow();
  const ultimaColuna = aba.getLastColumn();
  if (ultimaLinha < 1 || ultimaColuna < 1) throw new Error("A aba de agendamentos está vazia.");

  const cabecalhos = aba.getRange(1, 1, 1, ultimaColuna).getDisplayValues()[0];
  const colunaData = agendamentoDeepLearningRepositoryLocalizarColuna(cabecalhos, [
    "Data_Cadastro", "Data Cadastro", "Data de Cadastro", "DataCadastro", "Criado em", "Created At", "CreatedAt"
  ]);
  if (colunaData < 0) {
    throw new Error("Não foi encontrada uma coluna de data de cadastro. Cabeçalho esperado: Data_Cadastro, Data de Cadastro ou equivalente. Nenhuma coluna foi alterada.");
  }
  const colunaCodigo = agendamentoDeepLearningRepositoryLocalizarColuna(cabecalhos, [
    "Codigo", "Código", "Codigo Agendamento", "ID", "Id Agendamento"
  ]);
  const linhas = ultimaLinha > 1 ? aba.getRange(2, 1, ultimaLinha - 1, ultimaColuna).getValues() : [];
  const codigosVistos = new Set();
  const observacoes = [];
  const datasInvalidas = [];
  const linhasVazias = [];
  const duplicados = [];
  let semCodigo = 0;

  linhas.forEach((linha, indice) => {
    const valorData = linha[colunaData];
    if (valorData === "" || valorData === null) {
      linhasVazias.push(indice + 2);
      return;
    }
    const data = agendamentoDeepLearningRepositoryNormalizarDataCadastro(valorData);
    if (!data) {
      datasInvalidas.push(indice + 2);
      return;
    }
    if (colunaCodigo >= 0) {
      const codigo = String(linha[colunaCodigo] || "").trim();
      if (!codigo) {
        semCodigo++;
      } else if (codigosVistos.has(codigo)) {
        duplicados.push(indice + 2);
        return;
      } else {
        codigosVistos.add(codigo);
      }
    }
    observacoes.push({ data, quantidade: 1, linha: indice + 2 });
  });

  return {
    observacoes,
    mapeamento: { aba: nomeAba, colunaDataCadastro: colunaData + 1, cabecalhoDataCadastro: cabecalhos[colunaData], colunaCodigo: colunaCodigo < 0 ? null : colunaCodigo + 1 },
    qualidade: {
      linhasLidas: linhas.length,
      registrosContabilizados: observacoes.length,
      datasInvalidas,
      datasVazias: linhasVazias,
      linhasDuplicadas: duplicados,
      registrosSemCodigo: semCodigo
    }
  };
}
