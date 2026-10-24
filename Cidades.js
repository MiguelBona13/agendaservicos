function cadastrarCidade(codigo, nome, estado) {
  if (!codigo) {
    throw new Error("O código da cidade é obrigatório.");
  }

  if (!nome) {
    throw new Error("O nome da cidade é obrigatório.");
  }

  if (!estado) {
    throw new Error("O estado da cidade é obrigatório.");
  }

  estado = String(estado).trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(estado)) {
    throw new Error("O estado deve ter uma sigla válida de duas letras.");
  }

  if (codigoExiste(CONFIG.ABAS.CIDADES, codigo)) {
    throw new Error(`O código ${codigo} já está cadastrado.`);
  }

  const aba = getSheet(CONFIG.ABAS.CIDADES);

  aba.appendRow([
    codigo,
    nome,
    estado
  ]);
}