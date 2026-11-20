/**
 * Entidade: Bairro
 * Camada: Service — Camada de Serviço
 * Responsabilidade: coordenar CRUD e integridade referencial dos bairros.
 * Dependências: BairroValidator, BairroRules, BairroRepository e LockService.
 */
/** Próximo código. @return {string} Código. */
function bairroServiceGerarCodigo(){return String(bairroRepositoryMaiorCodigo()+1).padStart(3,"0");}
/** Lista bairros. @param {string=} codigoCidade Filtro. @return {Array<Object>} Bairros. */
function bairroServiceListar(codigoCidade){return bairroRepositoryListar(codigoCidade);}
/** Cria bairro. @param {string} codigo Código. @param {string} nome Nome. @param {string} codigoCidade Cidade. @return {Object} Resultado. */
function bairroServiceCriar(codigo,nome,codigoCidade){const l=LockService.getScriptLock();l.waitLock(10000);try{const id=bairroValidatorCodigo(codigo),d=bairroValidatorDados(nome,codigoCidade);if(bairroRepositoryLinha(id)>1)throw new Error("O código "+id+" já está cadastrado.");if(!bairroRepositoryCidadeExiste(d.codigoCidade))throw new Error("A cidade informada não está cadastrada.");bairroRepositoryInserir({codigo:id,...d});return{sucesso:true,mensagem:"Bairro cadastrado com sucesso."};}finally{l.releaseLock();}}
/** Atualiza bairro. @param {string} codigo Código. @param {string} nome Nome. @param {string} codigoCidade Cidade. @return {Object} Resultado. */
function bairroServiceAtualizar(codigo,nome,codigoCidade){const l=LockService.getScriptLock();l.waitLock(10000);try{const id=bairroValidatorCodigo(codigo),d=bairroValidatorDados(nome,codigoCidade),linha=bairroRepositoryLinha(id);if(linha<2)throw new Error("Bairro não encontrado.");if(!bairroRepositoryCidadeExiste(d.codigoCidade))throw new Error("A cidade informada não está cadastrada.");const atual=bairroRepositoryListar().find(x=>x.codigo===id);if(atual.codigoCidade!==d.codigoCidade)bairroRulesValidarMudancaCidade(bairroRepositoryPossuiClientes(id));bairroRepositoryAtualizar(linha,d);return{sucesso:true,mensagem:"Bairro atualizado com sucesso."};}finally{l.releaseLock();}}
/** Exclui bairro sem clientes vinculados. @param {string} codigo Código. @return {Object} Resultado. */
function bairroServiceExcluir(codigo){const l=LockService.getScriptLock();l.waitLock(10000);try{const id=bairroValidatorCodigo(codigo),linha=bairroRepositoryLinha(id);if(linha<2)throw new Error("Bairro não encontrado.");bairroRulesValidarExclusao(id,bairroRepositoryPossuiClientes(id));bairroRepositoryExcluir(linha);return{sucesso:true,mensagem:"Bairro excluído com sucesso."};}finally{l.releaseLock();}}
