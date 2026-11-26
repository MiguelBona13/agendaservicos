const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function criarContexto({vinculado=false}={}) {
  const periodos = [{codigo:"001",descricao:"Manhã",horaInicial:"08:00",horaFinal:"12:00",ativo:true,linha:2}];
  let excluiu = false;
  const contexto = {
    LockService: { getScriptLock: () => ({ waitLock(){}, releaseLock(){} }) },
    periodoRepositoryObterMaiorCodigo: () => periodos.reduce((m,p)=>Math.max(m,Number(p.codigo)||0),0),
    periodoRepositoryListar: () => periodos.map(p=>({...p})),
    periodoRepositoryBuscarPorCodigo: codigo => periodos.find(p=>p.codigo===String(codigo)) || null,
    periodoRepositoryPossuiAgendamentos: () => vinculado,
    periodoRepositoryInserir: dados => periodos.push({...dados,linha:periodos.length+2}),
    periodoRepositoryAtualizar: (linha,dados) => Object.assign(periodos.find(p=>p.linha===linha),dados),
    periodoRepositoryExcluir: linha => { const i=periodos.findIndex(p=>p.linha===linha); if(i>=0)periodos.splice(i,1); excluiu=true; }
  };
  for (const arquivo of ["PeriodoValidator.gs","PeriodoRules.gs","PeriodoService.gs"]) {
    vm.runInNewContext(fs.readFileSync(arquivo,"utf8"),contexto);
  }
  return {contexto,periodos,excluiu:()=>excluiu};
}

test("gera código sequencial e cadastra período", () => {
  const {contexto,periodos}=criarContexto();
  assert.equal(contexto.periodoServiceGerarCodigo(),"002");
  const r=contexto.periodoServiceCriar("002","Tarde","13:00","17:00",true);
  assert.equal(r.sucesso,true);
  assert.equal(periodos.length,2);
});

test("não permite cadastrar código repetido", () => {
  const {contexto}=criarContexto();
  assert.throws(()=>contexto.periodoServiceCriar("001","Tarde","13:00","17:00",true),/já está cadastrado/);
});

test("não permite editar horários ou descrição de período vinculado", () => {
  const {contexto}=criarContexto({vinculado:true});
  assert.throws(()=>contexto.periodoServiceAtualizar("001","Manhã nova","08:00","12:00",true),/preservar o histórico/);
  assert.doesNotThrow(()=>contexto.periodoServiceAtualizar("001","Manhã","08:00","12:00",false));
});

test("inativa período vinculado em vez de excluir fisicamente", () => {
  const {contexto,periodos,excluiu}=criarContexto({vinculado:true});
  const r=contexto.periodoServiceExcluir("001");
  assert.equal(r.acao,"INATIVAR");
  assert.equal(periodos[0].ativo,false);
  assert.equal(excluiu(),false);
});

test("exclui fisicamente período sem agendamentos", () => {
  const {contexto,periodos,excluiu}=criarContexto();
  const r=contexto.periodoServiceExcluir("001");
  assert.equal(r.acao,"EXCLUIR");
  assert.equal(periodos.length,0);
  assert.equal(excluiu(),true);
});
