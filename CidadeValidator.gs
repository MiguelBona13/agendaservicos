/**
 * Entidade: Cidade
 * Camada: Validator — Validador
 * Responsabilidade: normalizar e validar os dados do cadastro de cidades.
 * Dependências: nenhuma.
 */
/** Valida o código imutável da cidade. @param {*} codigo Código informado. @return {string} Código normalizado. */
function cidadeValidatorCodigo(codigo) {
  const valor = String(codigo == null ? "" : codigo).trim();
  if (!valor) throw new Error("O código da cidade é obrigatório.");
  return valor;
}
/** Valida nome e sigla da unidade federativa. @param {*} nome Nome. @param {*} estado UF. @return {{nome:string,estado:string}} Dados normalizados. */
function cidadeValidatorDados(nome, estado) {
  const nomeNormalizado = String(nome == null ? "" : nome).trim().replace(/\s+/g, " ");
  const uf = String(estado == null ? "" : estado).trim().toUpperCase();
  if (!nomeNormalizado) throw new Error("O nome da cidade é obrigatório.");
  if (nomeNormalizado.length > 120) throw new Error("O nome da cidade deve ter até 120 caracteres.");
  if (!/^[A-Z]{2}$/.test(uf)) throw new Error("O estado deve ter uma sigla válida de duas letras.");
  return { nome: nomeNormalizado, estado: uf };
}
