/**
 * Entidade: Cidade
 * Camada: Service — Camada de Serviço
 * Responsabilidade: coordenar operações CRUD e integridade referencial de cidades.
 * Dependências: CidadeValidator, CidadeRules, CidadeRepository e LockService.
 */
/** Próximo código sequencial. @return {string} Código. */
function cidadeServiceGerarCodigo(){return String(cidadeRepositoryMaiorCodigo()+1).padStart(3,"0");}
/** Lista cidades. @return {Array<Object>} Cidades. */
function cidadeServiceListar(){return cidadeRepositoryListar();}
/** Cria cidade. @param {string} codigo Código. @param {string} nome Nome. @param {string} estado UF. @return {Object} Resultado. */
function cidadeServiceCriar(codigo,nome,estado){const l=LockService.getScriptLock();l.waitLock(10000);try{const id=cidadeValidatorCodigo(codigo),d=cidadeValidatorDados(nome,estado);if(cidadeRepositoryLinha(id)>1)throw new Error("O código "+id+" já está cadastrado.");cidadeRepositoryInserir({codigo:id,...d});return{sucesso:true,mensagem:"Cidade cadastrada com sucesso."};}finally{l.releaseLock();}}
/** Atualiza cidade preservando o código. @param {string} codigo Código. @param {string} nome Nome. @param {string} estado UF. @return {Object} Resultado. */
function cidadeServiceAtualizar(codigo,nome,estado){const l=LockService.getScriptLock();l.waitLock(10000);try{const id=cidadeValidatorCodigo(codigo),d=cidadeValidatorDados(nome,estado),linha=cidadeRepositoryLinha(id);if(linha<2)throw new Error("Cidade não encontrada.");cidadeRepositoryAtualizar(linha,d);return{sucesso:true,mensagem:"Cidade atualizada com sucesso."};}finally{l.releaseLock();}}
/** Exclui cidade sem bairros ou clientes vinculados. @param {string} codigo Código. @return {Object} Resultado. */
function cidadeServiceExcluir(codigo){const l=LockService.getScriptLock();l.waitLock(10000);try{const id=cidadeValidatorCodigo(codigo),linha=cidadeRepositoryLinha(id);if(linha<2)throw new Error("Cidade não encontrada.");cidadeRulesValidarExclusao(id,cidadeRepositoryPossuiBairros(id),cidadeRepositoryPossuiClientes(id));cidadeRepositoryExcluir(linha);return{sucesso:true,mensagem:"Cidade excluída com sucesso."};}finally{l.releaseLock();}}
