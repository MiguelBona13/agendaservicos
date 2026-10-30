const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const codigo = fs.readFileSync(path.join(__dirname, '../AgendamentoValidator.gs'), 'utf8');
const contexto = { Date, String, Number, Array, Object, RegExp };
vm.createContext(contexto);
vm.runInContext(codigo, contexto);

const emailValido = `Assunto: AGENDAMENTO

CLIENTE: João da Silva
SERVIÇO: Corte
PROFISSIONAL: Carlos
DATA: 2026-11-05
HORÁRIO: 09:00 às 10:00`;

test('interpreta todos os campos do e-mail estruturado', () => {
  const resultado = contexto.agendamentoValidatorInterpretarEmail(emailValido);
  assert.equal(resultado.cliente, 'João da Silva');
  assert.equal(resultado.servico, 'Corte');
  assert.equal(resultado.profissional, 'Carlos');
  assert.equal(resultado.data, '2026-11-05');
  assert.equal(resultado.horaInicial, '09:00');
  assert.equal(resultado.horaFinal, '10:00');
});

test('rejeita campo obrigatório ausente ou repetido', () => {
  assert.throws(
    () => contexto.agendamentoValidatorInterpretarEmail(emailValido.replace('SERVIÇO: Corte\n', '')),
    /SERVIÇO deve aparecer exatamente uma vez/
  );
  assert.throws(
    () => contexto.agendamentoValidatorInterpretarEmail(emailValido + '\nCLIENTE: Outro'),
    /CLIENTE deve aparecer exatamente uma vez/
  );
});

test('rejeita data inexistente e horário fora do formato', () => {
  assert.throws(
    () => contexto.agendamentoValidatorInterpretarEmail(emailValido.replace('2026-11-05', '2026-02-30')),
    /data informada no e-mail não existe/
  );
  assert.throws(
    () => contexto.agendamentoValidatorInterpretarEmail(emailValido.replace('09:00 às 10:00', '9h às 10h')),
    /formato HH:mm às HH:mm/
  );
});

test('rejeita horário final anterior ou igual ao inicial', () => {
  assert.throws(
    () => contexto.agendamentoValidatorInterpretarEmail(emailValido.replace('09:00 às 10:00', '10:00 às 10:00')),
    /posterior ao horário inicial/
  );
});
