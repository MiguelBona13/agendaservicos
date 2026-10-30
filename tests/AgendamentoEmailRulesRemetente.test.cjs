const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const codigo = fs.readFileSync(
  path.join(__dirname, '../AgendamentoEmailRules.gs'),
  'utf8'
);
const contexto = { String, RegExp, Error };
vm.createContext(contexto);
vm.runInContext(codigo, contexto);

test('aceita remetente igual à conta executora', () => {
  assert.doesNotThrow(() =>
    contexto.agendamentoEmailRulesValidarRemetente(
      'app@exemplo.com',
      'app@exemplo.com'
    )
  );
});

test('aceita endereço em campo From com nome de exibição', () => {
  assert.doesNotThrow(() =>
    contexto.agendamentoEmailRulesValidarRemetente(
      'Agenda do App <APP@EXEMPLO.COM>',
      'app@exemplo.com'
    )
  );
});

test('rejeita remetente diferente da conta executora', () => {
  assert.throws(
    () => contexto.agendamentoEmailRulesValidarRemetente(
      'terceiro@exemplo.com',
      'app@exemplo.com'
    ),
    /Remetente não autorizado/
  );
});

test('rejeita conta executora não identificada', () => {
  assert.throws(
    () => contexto.agendamentoEmailRulesValidarRemetente(
      'app@exemplo.com',
      ''
    ),
    /Não foi possível identificar/
  );
});

test('rejeita endereço de remetente inválido', () => {
  assert.throws(
    () => contexto.agendamentoEmailRulesValidarRemetente(
      'remetente inválido',
      'app@exemplo.com'
    ),
    /não é válido/
  );
});
