/**
 * Entidade: Bairro
 * Camada: Validator — Validador
 * Responsabilidade: validar código, nome e cidade associada.
 * Dependências: nenhuma.
 */
/** Valida código. @param {*} codigo Código. @return {string} Código normalizado. */
function bairroValidatorCodigo(codigo){const v=String(codigo==null?"":codigo).trim();if(!v)throw new Error("O código do bairro é obrigatório.");return v;}
/** Valida nome e cidade. @param {*} nome Nome. @param {*} codigoCidade Cidade. @return {{nome:string,codigoCidade:string}} Dados. */
function bairroValidatorDados(nome,codigoCidade){const n=String(nome==null?"":nome).trim().replace(/\s+/g," "),c=String(codigoCidade==null?"":codigoCidade).trim();if(!n)throw new Error("O nome do bairro é obrigatório.");if(n.length>120)throw new Error("O nome do bairro deve ter até 120 caracteres.");if(!c)throw new Error("A cidade do bairro é obrigatória.");return{nome:n,codigoCidade:c};}
