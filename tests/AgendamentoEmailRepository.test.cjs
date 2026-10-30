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
  const codigosExistentes = new Set();
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
    Session: {
      getScriptTimeZone: () => 'America/Campo_Grande',
      getEffectiveUser: () => ({ getEmail: () => 'app@exemplo.com' })
    },
    LockService: {
      getScriptLock: () => ({
        waitLock: () => {},
        releaseLock: () => {}
      })
    },
    agendamentoRepositoryCodigoExiste: codigo => codigosExistentes.has(codigo),
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
    isInInbox: () => true,
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


test('ignora respostas enviadas ou mensagens fora da caixa de entrada na mesma conversa', () => {
  const marco = new Date('2026-10-29T12:00:00Z').getTime();
  const recebida = {
    getId: () => 'recebida',
    getSubject: () => 'AGENDAMENTO',
    getDate: () => new Date(marco + 1000),
    isInInbox: () => true,
    getFrom: () => 'cliente@exemplo.com',
    getPlainBody: () => 'dados'
  };
  const enviada = {
    getId: () => 'enviada',
    getSubject: () => 'Re: AGENDAMENTO',
    getDate: () => new Date(marco + 2000),
    isInInbox: () => false,
    getFrom: () => 'agenda@exemplo.com',
    getPlainBody: () => 'resposta'
  };
  const ambiente = criarAmbiente({
    dataInicial: marco,
    threads: [{ getMessages: () => [recebida, enviada] }]
  });

  const resultado = ambiente.contexto.agendamentoEmailRepositoryListarMensagensNovas();
  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].id, 'recebida');
});


test('obtém o endereço da conta que executa o Apps Script', () => {
  const ambiente = criarAmbiente();
  assert.equal(
    ambiente.contexto.agendamentoEmailRepositoryObterEmailContaExecutora(),
    'app@exemplo.com'
  );
});


test('cria uma reserva com data e hora para permitir recuperação', () => {
  const ambiente = criarAmbiente();
  const reservou = ambiente.contexto.agendamentoEmailRepositoryReservarProcessamento('msg-reserva');
  const valor = ambiente.propriedades.get('AGENDAMENTO_EMAIL_PROCESSADO_msg-reserva');

  assert.equal(reservou, true);
  assert.match(valor, /^PROCESSANDO:\\d+$/);
});

test('não recupera uma reserva que ainda está dentro do prazo', () => {
  const ambiente = criarAmbiente();
  ambiente.propriedades.set(
    'AGENDAMENTO_EMAIL_PROCESSADO_msg-ativa',
    'PROCESSANDO:' + Date.now()
  );

  assert.equal(
    ambiente.contexto.agendamentoEmailRepositoryReservarProcessamento('msg-ativa'),
    false
  );
});

test('retoma reserva expirada quando o código ainda não existe na AGENDA', () => {
  const ambiente = criarAmbiente();
  ambiente.propriedades.set(
    'AGENDAMENTO_EMAIL_PROCESSADO_msg-expirada',
    'PROCESSANDO:' + (Date.now() - 36 * 60 * 1000) + ':AG-900'
  );

  assert.equal(
    ambiente.contexto.agendamentoEmailRepositoryReservarProcessamento('msg-expirada'),
    true
  );
  assert.match(
    ambiente.propriedades.get('AGENDAMENTO_EMAIL_PROCESSADO_msg-expirada'),
    /^PROCESSANDO:\\d+$/
  );
});

test('conclui reserva expirada quando o código já está na AGENDA', () => {
  const ambiente = criarAmbiente();
  ambiente.contexto.agendamentoRepositoryCodigoExiste = codigo => codigo === 'AG-901';
  ambiente.propriedades.set(
    'AGENDAMENTO_EMAIL_PROCESSADO_msg-criada',
    'PROCESSANDO:' + (Date.now() - 36 * 60 * 1000) + ':AG-901'
  );

  assert.equal(
    ambiente.contexto.agendamentoEmailRepositoryReservarProcessamento('msg-criada'),
    false
  );
  assert.equal(
    ambiente.propriedades.get('AGENDAMENTO_EMAIL_PROCESSADO_msg-criada'),
    'AG-901'
  );
});

test('associa o código à reserva antes da criação do agendamento', () => {
  const ambiente = criarAmbiente();
  ambiente.contexto.agendamentoEmailRepositoryReservarProcessamento('msg-codigo');

  ambiente.contexto.agendamentoEmailRepositoryAtualizarReservaProcessamento(
    'msg-codigo',
    'AG-902'
  );

  assert.match(
    ambiente.propriedades.get('AGENDAMENTO_EMAIL_PROCESSADO_msg-codigo'),
    /^PROCESSANDO:\\d+:AG-902$/
  );
});

test('mantém reserva antiga sem data para revisão manual segura', () => {
  const ambiente = criarAmbiente();
  ambiente.propriedades.set('AGENDAMENTO_EMAIL_PROCESSADO_msg-legada', 'PROCESSANDO');

  assert.equal(
    ambiente.contexto.agendamentoEmailRepositoryReservarProcessamento('msg-legada'),
    false
  );
  assert.equal(
    ambiente.propriedades.get('AGENDAMENTO_EMAIL_PROCESSADO_msg-legada'),
    'PROCESSANDO'
  );
});


test('lista novamente uma reserva expirada para permitir sua recuperação', () => {
  const marco = new Date('2026-10-29T12:00:00Z').getTime();
  const ambiente = criarAmbiente({
    dataInicial: marco,
    threads: [{
      getMessages: () => [
        criarMensagem({ id: 'reserva-antiga', assunto: 'AGENDAMENTO', data: marco + 1000 })
      ]
    }]
  });
  ambiente.propriedades.set(
    'AGENDAMENTO_EMAIL_PROCESSADO_reserva-antiga',
    'PROCESSANDO:' + (Date.now() - 36 * 60 * 1000) + ':AG-903'
  );

  const resultado = ambiente.contexto.agendamentoEmailRepositoryListarMensagensNovas();
  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].id, 'reserva-antiga');
});

test('não lista reserva que ainda está dentro do prazo de segurança', () => {
  const marco = new Date('2026-10-29T12:00:00Z').getTime();
  const ambiente = criarAmbiente({
    dataInicial: marco,
    threads: [{
      getMessages: () => [
        criarMensagem({ id: 'reserva-recente', assunto: 'AGENDAMENTO', data: marco + 1000 })
      ]
    }]
  });
  ambiente.propriedades.set(
    'AGENDAMENTO_EMAIL_PROCESSADO_reserva-recente',
    'PROCESSANDO:' + Date.now()
  );

  const resultado = ambiente.contexto.agendamentoEmailRepositoryListarMensagensNovas();
  assert.equal(resultado.length, 0);
});
