/**
 * Entidade: Cliente
 * Camada: Repository — Repositório
 *
 * Responsabilidade:
 * Consultar os dados de contato do cliente na planilha CLIENTES.
 *
 * Dependências principais:
 * - Config.js — nomes das abas;
 * - Utils.js — função getSheet().
 */

/**
 * Busca o nome e o e-mail de um cliente pelo código.
 *
 * A leitura da planilha fica concentrada neste Repository. A estrutura atual
 * da aba CLIENTES utiliza a coluna A para o código, B para o nome e J para
 * o endereço de e-mail.
 *
 * @param {string} codigoCliente Código do cliente.
 * @return {{codigo:string,nome:string,email:string}|null} Contato encontrado
 * ou null quando o cliente não existe.
 */
function clienteRepositoryBuscarContatoPorCodigo(codigoCliente) {
  const codigo = String(codigoCliente || "").trim();

  if (!codigo) {
    return null;
  }

  const aba = getSheet(CONFIG.ABAS.CLIENTES);
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) {
    return null;
  }

  const registros = aba
    .getRange(2, 1, ultimaLinha - 1, 10)
    .getDisplayValues();

  const registro = registros.find(linha =>
    String(linha[0] || "").trim() === codigo
  );

  if (!registro) {
    return null;
  }

  return {
    codigo: String(registro[0] || "").trim(),
    nome: String(registro[1] || "").trim(),
    email: String(registro[9] || "").trim()
  };
}
