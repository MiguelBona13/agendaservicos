/**
 * Entidade: Período
 * Camada: Repository — Repositório
 *
 * Responsabilidade:
 * Centralizar a leitura e a persistência dos períodos na aba PERIODOS,
 * incluindo a consulta de vínculos históricos com a aba AGENDA.
 *
 * Dependências principais:
 * - Config.js — nomes das abas PERIODOS e AGENDA;
 * - Utils.js — função getSheet() para acesso ao Google Sheets.
 *
 * Estrutura esperada da aba PERIODOS:
 * A: Código | B: Descrição | C: Hora inicial | D: Hora final | E: Ativo
 */

/**
 * Converte os valores aceitos na coluna Ativo para booleano.
 *
 * @param {*} valor Valor exibido na planilha.
 * @return {boolean} true quando o período estiver ativo.
 */
function periodoRepositoryInterpretarAtivo(valor) {
  return ["sim", "true", "verdadeiro", "ativo", "1"].includes(
    String(valor || "").trim().toLowerCase()
  );
}

/**
 * Lista os períodos cadastrados, preservando os horários como texto.
 *
 * @return {Array<Object>} Períodos com código, descrição, horários, situação e linha.
 */
function periodoRepositoryListar() {
  const aba = getSheet(CONFIG.ABAS.PERIODOS);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) return [];

  return aba.getRange(2, 1, ultimaLinha - 1, 5).getDisplayValues()
    .filter(linha =>
      String(linha[0] || "").trim() !== "" &&
      String(linha[1] || "").trim() !== ""
    )
    .map((linha, indice) => ({
      codigo: String(linha[0]).trim(),
      descricao: String(linha[1]).trim(),
      horaInicial: String(linha[2] || "").trim(),
      horaFinal: String(linha[3] || "").trim(),
      ativo: periodoRepositoryInterpretarAtivo(linha[4]),
      linha: indice + 2
    }));
}

/**
 * Busca um período pelo código.
 *
 * @param {string} codigo Código do período.
 * @return {?Object} Período encontrado ou null.
 */
function periodoRepositoryBuscarPorCodigo(codigo) {
  const codigoNormalizado = String(codigo || "").trim();
  if (!codigoNormalizado) return null;

  return periodoRepositoryListar().find(
    periodo => periodo.codigo === codigoNormalizado
  ) || null;
}

/**
 * Retorna o maior código numérico já utilizado.
 *
 * @return {number} Maior código numérico ou zero quando não houver períodos.
 */
function periodoRepositoryObterMaiorCodigo() {
  return periodoRepositoryListar().reduce((maior, periodo) => {
    const numero = Number(periodo.codigo);
    return Number.isInteger(numero) && numero > maior ? numero : maior;
  }, 0);
}

/**
 * Insere um período validado na próxima linha disponível.
 *
 * @param {{codigo:string,descricao:string,horaInicial:string,horaFinal:string,ativo:boolean}} dados Período validado.
 * @return {number} Número da linha gravada.
 */
function periodoRepositoryInserir(dados) {
  const aba = getSheet(CONFIG.ABAS.PERIODOS);
  const linha = aba.getLastRow() + 1;

  aba.getRange(linha, 1, 1, 5).setValues([[
    String(dados.codigo),
    String(dados.descricao),
    String(dados.horaInicial),
    String(dados.horaFinal),
    dados.ativo ? "SIM" : "NÃO"
  ]]);

  return linha;
}

/**
 * Atualiza descrição, horários e situação sem modificar o código.
 *
 * @param {number} linha Linha física identificada pelo Repository.
 * @param {{descricao:string,horaInicial:string,horaFinal:string,ativo:boolean}} dados Período validado.
 * @return {void}
 * @throws {Error} Quando a linha não corresponder a um registro existente.
 */
function periodoRepositoryAtualizar(linha, dados) {
  const aba = getSheet(CONFIG.ABAS.PERIODOS);

  if (!Number.isInteger(linha) || linha < 2 || linha > aba.getLastRow()) {
    throw new Error("Período não encontrado para atualização.");
  }

  aba.getRange(linha, 2, 1, 4).setValues([[
    String(dados.descricao),
    String(dados.horaInicial),
    String(dados.horaFinal),
    dados.ativo ? "SIM" : "NÃO"
  ]]);
}

/**
 * Localiza a linha física de um período pelo código.
 *
 * @param {string} codigo Código do período.
 * @return {number} Número da linha ou -1 quando não encontrado.
 */
function periodoRepositoryObterLinha(codigo) {
  const codigoNormalizado = String(codigo || "").trim();
  if (!codigoNormalizado) return -1;

  const aba = getSheet(CONFIG.ABAS.PERIODOS);
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return -1;

  const codigos = aba.getRange(2, 1, ultimaLinha - 1, 1).getDisplayValues().flat();
  const indice = codigos.findIndex(
    valor => String(valor || "").trim() === codigoNormalizado
  );

  return indice < 0 ? -1 : indice + 2;
}

/**
 * Verifica se algum agendamento, inclusive histórico ou cancelado,
 * referencia o período informado na terceira coluna da aba AGENDA.
 *
 * @param {string} codigo Código do período.
 * @return {boolean} true quando existe ao menos um vínculo.
 */
function periodoRepositoryPossuiAgendamentos(codigo) {
  const codigoNormalizado = String(codigo || "").trim();
  if (!codigoNormalizado) return false;

  const aba = getSheet(CONFIG.ABAS.AGENDA);
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return false;

  return aba.getRange(2, 3, ultimaLinha - 1, 1).getDisplayValues()
    .some(linha => String(linha[0] || "").trim() === codigoNormalizado);
}

/**
 * Exclui fisicamente um período pela linha previamente localizada.
 * A verificação de vínculos deve ser realizada pelo Service antes desta chamada.
 *
 * @param {number} linha Linha física do período.
 * @return {void}
 * @throws {Error} Quando a linha não corresponder a um registro existente.
 */
function periodoRepositoryExcluir(linha) {
  const aba = getSheet(CONFIG.ABAS.PERIODOS);

  if (!Number.isInteger(linha) || linha < 2 || linha > aba.getLastRow()) {
    throw new Error("Período não encontrado para exclusão.");
  }

  aba.deleteRow(linha);
}

/**
 * Retorna cabeçalhos e registros para a tabela da interface.
 *
 * @return {{colunas:Array<string>,registros:Array<Array<string>>}} Dados tabulares.
 */
function periodoRepositoryConsultarTabela() {
  const aba = getSheet(CONFIG.ABAS.PERIODOS);
  const ultimaLinha = aba.getLastRow();
  const ultimaColuna = Math.min(5, aba.getLastColumn());

  if (ultimaLinha < 1 || ultimaColuna < 1) {
    return { colunas: [], registros: [] };
  }

  const valores = aba.getRange(1, 1, ultimaLinha, ultimaColuna).getDisplayValues();

  return {
    colunas: valores[0],
    registros: valores.slice(1).filter(linha =>
      linha.some(valor => String(valor || "").trim() !== "")
    )
  };
}
