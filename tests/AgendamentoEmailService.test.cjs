const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const codigo = fs.readFileSync(path.join(__dirname, '../AgendamentoEmailService.gs'), 'utf8');

function criarAmbiente(mensagens) {
  const registrados = [];
  const liberados = [];
  let proximoCodigo = 1;
  const contexto = {
    String, Number, Array, Object,
    agendamentoEmailRepositoryListarMensagensNovas: () => mensagens,
    agendamentoRepositoryListarCadastrosEmail: () => ({
      clientes: [{ codigo: '001', nome: 'João da Silva' }],
      servicos: [{ codigo: '010', nome: 'Corte' }],
      funcionarios: [{ codigo: '020', nome: 'Carlos' }],
      periodos: [{ codigo: 'P1', horaInicial: '09:00', horaFinal: '10:00', ativo: true }]
    }),
    agendamentoEmailRepositoryReservarProcessamento: () => true,
    agendamentoEmailRepositoryRegistrarProcessamento: (id, codigo) => registrados.push({ id, codigo }),
    agendamentoEmailRepositoryLiberarProcessamento: id => liberados.push(id),
    agendamentoValidatorInterpretarEmail: corpo => {
      if (corpo === 'INVALIDO') throw new Error('Formato de e-mail inválido.');
      return {
        cliente: 'João da Silva',
        servico: 'Corte',
        profissional: 'Carlos',
        data: '2026-11-05',
        horaInicial: '09:00',
        horaFinal: '10:00'
      };
    },
    agendamentoRulesResolverCadastroPorNome: (nome, lista) => lista[0],
    agendamentoRulesResolverPeriodoPorHorario: (inicio, fim, lista) => lista[0],
    gerarCodigoAgendamento: () => String(proximoCodigo++).padStart(3, '0'),
    criarAgendamento: () => ({ sucesso: true, mensagem: 'Agendamento cadastrado com sucesso.' })
  };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  return { contexto, registrados, liberados };
}

test('processa e registra uma mensagem válida', () => {
  const ambiente = criarAmbiente([
    { id: 'email-1', assunto: 'AGENDAMENTO', corpo: 'VALIDO' }
  ]);
  const resultado = ambiente.contexto.agendamentoEmailServiceProcessarNovosEmails();

  assert.equal(resultado.totalCriados, 1);
  assert.equal(resultado.totalFalhas, 0);
  assert.equal(ambiente.registrados.length, 1);
  assert.equal(ambiente.registrados[0].id, 'email-1');
  assert.equal(ambiente.registrados[0].codigo, '001');
});

test('uma mensagem inválida não impede o processamento das demais', () => {
  const ambiente = criarAmbiente([
    { id: 'email-ruim', assunto: 'AGENDAMENTO - inválido', corpo: 'INVALIDO' },
    { id: 'email-bom', assunto: 'AGENDAMENTO - válido', corpo: 'VALIDO' }
  ]);
  const resultado = ambiente.contexto.agendamentoEmailServiceProcessarNovosEmails();

  assert.equal(resultado.totalEncontrados, 2);
  assert.equal(resultado.totalCriados, 1);
  assert.equal(resultado.totalFalhas, 1);
  assert.equal(ambiente.registrados.length, 1);
  assert.deepEqual(ambiente.liberados, ['email-ruim']);
});

test('retorna resumo vazio quando não há novas mensagens', () => {
  const ambiente = criarAmbiente([]);
  const resultado = ambiente.contexto.agendamentoEmailServiceProcessarNovosEmails();
  assert.equal(resultado.totalEncontrados, 0);
  assert.equal(resultado.totalCriados, 0);
  assert.equal(resultado.totalFalhas, 0);
});
