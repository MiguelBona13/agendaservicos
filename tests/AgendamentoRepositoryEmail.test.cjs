const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const codigo = fs.readFileSync(path.join(__dirname, '../AgendamentoRepository.gs'), 'utf8');

function criarAmbiente(abas) {
  const contexto = {
    Date, String, Number, Array, Object,
    CONFIG: {
      ABAS: {
        CLIENTES: 'CLIENTES',
        SERVICOS: 'SERVICOS',
        FUNCIONARIOS: 'FUNCIONARIOS',
        PERIODOS: 'PERIODOS',
        AGENDA: 'AGENDA'
      }
    },
    getSheet: nome => ({
      getLastRow: () => (abas[nome] || []).length + 1,
      getRange: (linha, coluna, quantidade, colunas) => ({
        getDisplayValues: () => (abas[nome] || [])
          .slice(linha - 2, linha - 2 + quantidade)
          .map(registro => registro.slice(coluna - 1, coluna - 1 + colunas))
      })
    })
  };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  return contexto;
}

test('consulta nomes e códigos nas três abas e períodos ativos', () => {
  const contexto = criarAmbiente({
    CLIENTES: [['001', 'João da Silva']],
    SERVICOS: [['010', 'Corte']],
    FUNCIONARIOS: [['020', 'Carlos']],
    PERIODOS: [
      ['P1', 'Manhã', '09:00', '10:00', 'Sim'],
      ['P2', 'Tarde', '14:00', '15:00', 'Não']
    ]
  });
  const resultado = contexto.agendamentoRepositoryListarCadastrosEmail();
  assert.equal(resultado.clientes[0].codigo, '001');
  assert.equal(resultado.servicos[0].nome, 'Corte');
  assert.equal(resultado.funcionarios[0].codigo, '020');
  assert.equal(resultado.periodos[0].ativo, true);
  assert.equal(resultado.periodos[1].ativo, false);
});

test('retorna listas vazias quando as abas ainda não possuem cadastros', () => {
  const contexto = criarAmbiente({ CLIENTES: [], SERVICOS: [], FUNCIONARIOS: [], PERIODOS: [] });
  const resultado = contexto.agendamentoRepositoryListarCadastrosEmail();
  assert.equal(resultado.clientes.length, 0);
  assert.equal(resultado.servicos.length, 0);
  assert.equal(resultado.funcionarios.length, 0);
  assert.equal(resultado.periodos.length, 0);
});

test('impede consulta de abas fora da lista permitida', () => {
  const contexto = criarAmbiente({});
  assert.throws(
    () => contexto.agendamentoRepositoryLerCodigoNome('AGENDA'),
    /Aba não permitida/
  );
});
