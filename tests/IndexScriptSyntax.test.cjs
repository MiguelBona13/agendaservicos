/**
 * Verifica sintaxe JavaScript embutida na interface HTML.
 * Este teste não simula o DOM nem os serviços do Apps Script.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const test=require("node:test");
test("Index.html contém JavaScript sintaticamente válido",()=>{
  const html=fs.readFileSync(path.join(__dirname,"..","Index.html"),"utf8");
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length>0,"Nenhum bloco script encontrado.");
  for(let i=0;i<scripts.length;i++) {
    try { new vm.Script(scripts[i][1],{filename:"Index.html"}); }
    catch(erro) { throw new Error("Bloco script "+(i+1)+": "+erro.message); }
  }
});
