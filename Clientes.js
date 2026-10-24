
function gerarCodigoCliente() {
  const aba = getSheet(CONFIG.ABAS.CLIENTES);
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

function cadastrarCliente(
  codigo,
  nome,
  cpf,
  dataAniversario,
  numero,
  codigoCidade,
  codigoBairro,
  cep,
  celular,
  email,
  statusFinanceiro
) {
  codigo = String(codigo || "").trim();
  nome = String(nome || "").trim();
  cpf = String(cpf || "").replace(/\D/g, "");
  numero = String(numero ?? "").trim();
  codigoCidade = String(codigoCidade || "").trim();
  codigoBairro = String(codigoBairro || "").trim();
  cep = String(cep || "").replace(/\D/g, "");
  celular = String(celular || "").replace(/\D/g, "");
  email = String(email || "").trim();
  statusFinanceiro = String(statusFinanceiro || "").trim();

  if (!codigo) {
    throw new Error("O código do cliente é obrigatório.");
  }

  if (!nome) {
    throw new Error("O nome do cliente é obrigatório.");
  }

  if (!validarCPF(cpf)) {
    throw new Error("O CPF informado é inválido.");
  }

  if (numero === "") {
    throw new Error("O número do endereço é obrigatório.");
  }

  if (!codigoCidade) {
    throw new Error("A cidade do cliente é obrigatória.");
  }

  if (!codigoBairro) {
    throw new Error("O bairro do cliente é obrigatório.");
  }

  if (!/^\d{8}$/.test(cep)) {
    throw new Error("O CEP deve conter 8 números.");
  }

  if (!/^\d{10,11}$/.test(celular)) {
    throw new Error("O celular deve conter DDD e número.");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("O e-mail informado é inválido.");
  }

  const statusPermitidos = [
    "Em dia",
    "Pendente",
    "Inadimplente"
  ];

  if (!statusPermitidos.includes(statusFinanceiro)) {
    throw new Error("O status financeiro selecionado é inválido.");
  }

  if (codigoExiste(CONFIG.ABAS.CLIENTES, codigo)) {
    throw new Error(`O código ${codigo} já está cadastrado.`);
  }

  if (cpfExiste(cpf)) {
    throw new Error("Este CPF já está cadastrado.");
  }

  const abaCidades = getSheet(CONFIG.ABAS.CIDADES);
  const cidades = abaCidades.getDataRange().getDisplayValues();

  const cidadeExiste = cidades.slice(1).some(linha =>
    String(linha[0]).trim() === codigoCidade
  );

  if (!cidadeExiste) {
    throw new Error("A cidade selecionada não está cadastrada.");
  }

  const abaBairros = getSheet(CONFIG.ABAS.BAIRROS);
  const bairros = abaBairros.getDataRange().getDisplayValues();

  const bairroValido = bairros.slice(1).some(linha =>
    String(linha[0]).trim() === codigoBairro &&
    String(linha[2]).trim() === codigoCidade
  );

  if (!bairroValido) {
    throw new Error("O bairro selecionado não pertence à cidade informada.");
  }

  let dataParaSalvar = "";

  if (dataAniversario) {
    const dataTexto = String(dataAniversario).trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataTexto)) {
      throw new Error("A data de aniversário é inválida.");
    }

    const partes = dataTexto.split("-").map(Number);
    const data = new Date(partes[0], partes[1] - 1, partes[2]);

    if (
      data.getFullYear() !== partes[0] ||
      data.getMonth() !== partes[1] - 1 ||
      data.getDate() !== partes[2]
    ) {
      throw new Error("A data de aniversário não existe.");
    }

    dataParaSalvar = data;
  }

  const proximaLinha = abaClientesProximaLinha();

  const aba = getSheet(CONFIG.ABAS.CLIENTES);

  aba.getRange(proximaLinha, 1, 1, 11).setNumberFormat("@");

  aba.getRange(proximaLinha, 1, 1, 11).setValues([[
    codigo,
    nome,
    cpf,
    dataParaSalvar,
    numero,
    codigoCidade,
    codigoBairro,
    cep,
    celular,
    email,
    statusFinanceiro
  ]]);
}

function abaClientesProximaLinha() {
  return getSheet(CONFIG.ABAS.CLIENTES).getLastRow() + 1;
}

function validarCPF(cpf) {
  if (!/^\d{11}$/.test(cpf)) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let soma = 0;

  for (let i = 0; i < 9; i++) {
    soma += Number(cpf[i]) * (10 - i);
  }

  let resto = (soma * 10) % 11;

  if (resto === 10) {
    resto = 0;
  }

  if (resto !== Number(cpf[9])) {
    return false;
  }

  soma = 0;

  for (let i = 0; i < 10; i++) {
    soma += Number(cpf[i]) * (11 - i);
  }

  resto = (soma * 10) % 11;

  if (resto === 10) {
    resto = 0;
  }

  return resto === Number(cpf[10]);
}

function cpfExiste(cpf) {
  const aba = getSheet(CONFIG.ABAS.CLIENTES);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return false;
  }

  const cpfs = aba
    .getRange(2, 3, ultimaLinha - 1, 1)
    .getDisplayValues();

  const cpfProcurado = String(cpf).replace(/\D/g, "");

  return cpfs.some(linha => {
    const cpfCadastrado = String(linha[0]).replace(/\D/g, "");
    return cpfCadastrado === cpfProcurado;
  });
}
