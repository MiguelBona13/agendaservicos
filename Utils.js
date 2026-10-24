function getSheet(nomeAba) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(nomeAba);

  if (!aba) {
    throw new Error(`A aba "${nomeAba}" não foi encontrada.`);
  }

  return aba;
}


function codigoExiste(nomeAba, codigo) {
  const aba = getSheet(nomeAba);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return false;
  }

  const codigos = aba
    .getRange(2, 1, ultimaLinha - 1, 1)
    .getValues();

  return codigos.some(linha => String(linha[0]) === String(codigo));
}