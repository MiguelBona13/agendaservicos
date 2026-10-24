function cadastrarBairro(codigo, nome, codigoCidade) {
  if (!codigo) {
    throw new Error("O código do bairro é obrigatório.");
  }

  if (!nome) {
    throw new Error("O nome do bairro é obrigatório.");
  }

  if (!codigoCidade) {
    throw new Error("A cidade do bairro é obrigatória.");
  }

  if (codigoExiste(CONFIG.ABAS.BAIRROS, codigo)) {
    throw new Error(`O código ${codigo} já está cadastrado.`);
  }

  if (!codigoExiste(CONFIG.ABAS.CIDADES, codigoCidade)) {
    throw new Error("A cidade informada não está cadastrada.");
  }

  const aba = getSheet(CONFIG.ABAS.BAIRROS);

  aba.appendRow([
    codigo,
    nome,
    codigoCidade
  ]);
}
