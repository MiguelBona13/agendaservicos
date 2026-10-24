function cadastrarServico(codigo, nome, valor) {
  if (!codigo) {
    throw new Error("O código do serviço é obrigatório.");
  }

  if (!nome) {
    throw new Error("O nome do serviço é obrigatório.");
  }

  if (valor === "" || valor === null || valor === undefined) {
    throw new Error("O valor do serviço é obrigatório.");
  }

  if (typeof valor !== "number" || isNaN(valor)) {
    throw new Error("O valor do serviço deve ser numérico.");
  }

  if (valor < 0) {
    throw new Error("O valor do serviço não pode ser negativo.");
  }

  if (codigoExiste(CONFIG.ABAS.SERVICOS, codigo)) {
    throw new Error(`O código ${codigo} já está cadastrado.`);
  }

  const aba = getSheet(CONFIG.ABAS.SERVICOS);

  aba.appendRow([
    codigo,
    nome,
    valor
  ]);
}