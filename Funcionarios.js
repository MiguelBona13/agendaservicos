function gerarCodigoFuncionario() {
  const aba = getSheet(CONFIG.ABAS.FUNCIONARIOS);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return "001";
  }

  const codigos = aba
    .getRange(2, 1, ultimaLinha - 1, 1)
    .getDisplayValues()
    .flat();

  let maiorCodigo = 0;

  codigos.forEach(codigo => {
    const numero = Number(String(codigo).trim());

    if (Number.isInteger(numero) && numero > maiorCodigo) {
      maiorCodigo = numero;
    }
  });

  return String(maiorCodigo + 1).padStart(3, "0");
}

function cadastrarFuncionario(codigo, nome) {
  if (!codigo) {
    throw new Error("O código do funcionário é obrigatório.");
  }

  if (!nome || !String(nome).trim()) {
    throw new Error("O nome do funcionário é obrigatório.");
  }

  codigo = String(codigo).trim();
  nome = String(nome).trim();

  if (codigoExiste(CONFIG.ABAS.FUNCIONARIOS, codigo)) {
    throw new Error(`O código ${codigo} já está cadastrado.`);
  }

  const aba = getSheet(CONFIG.ABAS.FUNCIONARIOS);
  const proximaLinha = aba.getLastRow() + 1;

  // Formata a linha como texto antes de gravar os dados.
  aba.getRange(proximaLinha, 1, 1, 2).setNumberFormat("@");

  aba.getRange(proximaLinha, 1, 1, 2).setValues([[
    codigo,
    nome
  ]]);
}
