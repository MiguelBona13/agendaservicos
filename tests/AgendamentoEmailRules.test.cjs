const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const codigo = fs.readFileSync(path.join(__dirname, '../AgendamentoRules.gs'), 'utf8');
const contexto = { Date, String, Number, Array, Object, RegExp };
vm.createContext(contexto);
vm.runInContext(codigo, contexto);

test('normaliza acentos, caixa e espaços dos nomes', () => {
  assert.equal(contexto.agendamentoRulesNormalizarNome('  JOÃO   da Silva '), 'joao da silva');
});

test('resolve cadastro por nome sem diferenciar acentos', () => {
  const cadastro = contexto.agendamentoRulesResolverCadastroPorNome(
    'Joao da Silva',
    [{ codigo: '001', nome: 'João da Silva' }],
    'Cliente'
  );
  assert.equal(cadastro.codigo, '001');
});

test('rejeita cadastro inexistente ou com nome duplicado', () => {
  assert.throws(
    () => contexto.agendamentoRulesResolverCadastroPorNome('Maria', [], 'Cliente'),
    /Cliente não encontrado/
  );
  assert.throws(
    () => contexto.agendamentoRulesResolverCadastroPorNome(
      'Carlos',
      [{ codigo: '001', nome: 'Carlos' }, { codigo: '002', nome: 'Carlos' }],
      'Profissional'
    ),
    /mais de um profissional/
  );
});

test('localiza somente período ativo com horários exatos', () => {
  const periodo = contexto.agendamentoRulesResolverPeriodoPorHorario(
    '09:00', '10:00',
    [
      { codigo: '001', horaInicial: '09:00', horaFinal: '10:00', ativo: false },
      { codigo: '002', horaInicial: '09:00', horaFinal: '10:00', ativo: true }
    ]
  );
  assert.equal(periodo.codigo, '002');
});

test('rejeita período ausente ou ambíguo', () => {
  assert.throws(
    () => contexto.agendamentoRulesResolverPeriodoPorHorario('09:00', '10:00', []),
    /Não existe período ativo/
  );
  assert.throws(
    () => contexto.agendamentoRulesResolverPeriodoPorHorario(
      '09:00', '10:00',
      [
        { codigo: '001', horaInicial: '09:00', horaFinal: '10:00', ativo: true },
        { codigo: '002', horaInicial: '09:00', horaFinal: '10:00', ativo: true }
      ]
    ),
    /mais de um período ativo/
  );
});
