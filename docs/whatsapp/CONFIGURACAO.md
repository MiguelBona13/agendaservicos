# Bot de agendamento pelo WhatsApp

## Fluxo implementado

1. O bot recebe uma mensagem pelo webhook do Twilio Sandbox.
2. Identifica o cliente pelo celular cadastrado na coluna I da aba CLIENTES.
3. Se o número não corresponder a exatamente um cliente, informa que o cadastro precisa ser atualizado.
4. Para cliente identificado, oferece os serviços e profissionais cadastrados, solicita a data e lista os períodos ativos sem conflito.
5. Só grava o agendamento depois que o cliente responde `1` na etapa de confirmação. A criação passa por `criarAgendamento()`, preservando as validações e o bloqueio de conflito já existentes.
6. `0` reinicia o fluxo e `cancelar` encerra a conversa.

Nas etapas de serviço, profissional, data e horário, o cliente pode responder
por nome ou em linguagem natural. A Groq interpreta o texto livre no contexto
da etapa atual, e os valores continuam passando pelas validações do bot. A
confirmação aceita `1`, `sim`, `confirmo`, `confirmar` ou `pode confirmar`; a Groq não decide nem cria reservas.

As conversas ficam temporariamente em Script Properties e expiram após 24 horas. A configuração do token também fica em Script Properties, nunca no código-fonte.

## Configuração para o projeto de estudo

Por decisão do usuário, o próprio projeto da Agenda será publicado com acesso anônimo para que o Twilio Sandbox chame `doPost()`. Isso também permite abrir a interface do curso sem login. Use somente dados de estudo e não coloque informações reais de clientes nessa planilha enquanto esse acesso estiver habilitado.

1. Nas **Propriedades do script** do projeto atual, adicione `AGENDAMENTO_WHATSAPP_WEBHOOK_TOKEN` com um token aleatório forte de pelo menos 32 bytes e confirme que `GROQ_API_KEY` está cadastrada.
2. Implante uma nova versão como **App da Web**, executando como a conta proprietária e permitindo acesso anônimo. O manifesto já está configurado como `ANYONE_ANONYMOUS`.
3. Copie a URL `/exec` da implantação.
4. Na Console Twilio, abra a configuração do WhatsApp Sandbox, escolha resposta personalizada (**Custom**) e informe a URL seguida de `?token=...`. O Sandbox responde a mensagens recebidas durante a janela de atendimento do WhatsApp.
5. Envie `agendar` de um número vinculado ao Sandbox e cadastrado na coluna I de CLIENTES.
6. Percorra o fluxo usando nomes, datas em linguagem natural e horários; confirme que a linha só aparece na aba AGENDA após a confirmação.
7. Teste também número sem cadastro, opção inválida, data passada, falta de horários, cancelamento e conflito.

As mensagens livres e as opções da etapa atual são enviadas à API Groq para
interpretação. Não envie dados sensíveis; mantenha essa integração em dados de
estudo até concluir a validação integrada.

O projeto separado em `whatsapp-backend/` permanece como alternativa caso a Agenda volte a usar dados reais ou precise ficar privada. O token protege o webhook do protótipo; para produção, valide também `X-Twilio-Signature` em uma camada que tenha acesso aos cabeçalhos HTTP.

O Sandbox é apenas para teste e requer que o número do usuário esteja vinculado ao Sandbox. A publicação com um remetente próprio e as regras de produção do WhatsApp são uma etapa posterior.
