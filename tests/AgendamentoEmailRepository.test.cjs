const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const codigo = fs.readFileSync(
  path.join(__dirname, '../AgendamentoEmailRepository.gs'),
  'utf8'
);

function criarAmbiente({ dataInicial = null, threads = [] } = {}) {
  const propriedades = new Map();
  if (dataInicial !== null) {
    propriedades.set('AGENDAMENTO_EMAIL_DATA_INICIAL', String(dataInicial));
  }

  const chamadasBusca = [];
  const contexto = {
    Date,
    Number,
    String,
    Array,
    Object,
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: chave => propriedades.has(chave)
          ? propriedades.get(chave)
          : null,
        setProperty: (chave, valor) => propriedades.set(chave, String(valor))
      })
    },
    Utilities: {
      formatDate: data => {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${ano}/${mes}/${dia}`;
      }
    },
    Session: { getScriptTimeZone: () => 'America/Campo_Grande' },
    GmailApp: {
      search: (...args) => {
        chamadasBusca.push(args);
        return threads;
      }
    }
  };

  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  return { contexto, propriedades, chamadasBusca };
}

function criarMensagem({ id, assunto, data, corpo = 'dados', remetente = 'cliente@exemplo.com' }) {
  return {
    getId: () => id,
    getSubject: () => assunto,
    getDate: () => new Date(data),
    getFrom: () => remetente,
    getPlainBody: () => corpo
  };
}

test('inicializa o marco uma única vez e preserva o valor existente', () => {
  const ambiente = criarAmbiente();
  const primeira = ambiente.contexto.agendamentoEmailRepositoryInicializarMonitoramento();
  const segunda = ambiente.contexto.agendamentoEmailRepositoryInicializarMonitoramento();

  assert.equal(primeira.inicializado, true);
  assert.equal(segunda.inicializado, false);
  assert.equal(segunda.dataInicial, primeira.dataInicial);
});

test('não permite pesquisar mensagens antes de inicializar o monitoramento', () => {
  const ambiente = criarAmbiente();

  assert.throws(
    () => ambiente.contexto.agendamentoEmailRepositoryListarMensagensNovas(),
    /ainda não foi inicializado/
  );
});

test('retorna apenas mensagens posteriores ao marco, com assunto correto e ainda não processadas', () => {
  const marco = new Date('2026-10-29T12:00:00Z').getTime();
  const mensagens = [
    criarMensagem({ id: 'antiga', assunto: 'AGENDAMENTO', data: marco - 1 }),
    criarMensagem({ id: 'mesmo-instante', assunto: 'AGENDAMENTO', data: marco }),
    criarMensagem({ id: 'nova', assunto: 'Novo AGENDAMENTO recebido', data: marco + 1000 }),
    criarMensagem({ id: 'outro-assunto', assunto: 'ORÇAMENTO', data: marco + 2000 })
  ];
  const ambiente = criarAmbiente({
    dataInicial: marco,
    threads: [{ getMessages: () => mensagens }]
  });

  const resultado = ambiente.contexto.agendamentoEmailRepositoryListarMensagensNovas();

  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].id, 'nova');
  assert.match(ambiente.chamadasBusca[0][0], /in:inbox subject:AGENDAMENTO after:/);
});

test('não retorna mensagem que já possui registro de processamento', () => {
  const marco = new Date('2026-10-29T12:00:00Z').getTime();
  const ambiente = criarAmbiente({
    dataInicial: marco,
    threads: [{
      getMessages: () => [
        criarMensagem({ id: 'msg-123', assunto: 'AGENDAMENTO', data: marco + 1000 })
      ]
    }]
  });
  ambiente.propriedades.set('AGENDAMENTO_EMAIL_PROCESSADO_msg-123', 'AG-001');

  const resultado = ambiente.contexto.agendamentoEmailRepositoryListarMensagensNovas();
  assert.equal(resultado.length, 0);
});

test('registra o ID da mensagem associado ao código criado', () => {
  const ambiente = criarAmbiente();

  ambiente.contexto.agendamentoEmailRepositoryRegistrarProcessamento('msg-456', 'AG-002');

  assert.equal(
    ambiente.propriedades.get('AGENDAMENTO_EMAIL_PROCESSADO_msg-456'),
    'AG-002'
  );
});
