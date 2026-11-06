# Backend isolado do WhatsApp

Esta pasta contém os arquivos necessários para um projeto Apps Script separado, sem interface web. O projeto usa a mesma planilha da Agenda de Serviços, mas publica somente o `doPost()` do webhook.

## Configuração inicial

1. Crie um novo projeto Apps Script autônomo na conta que tem acesso à planilha.
2. Adicione os arquivos desta pasta ao projeto, mantendo os nomes.
3. Em **Configurações do projeto → Propriedades do script**, configure:
   - `AGENDAMENTO_WHATSAPP_SPREADSHEET_ID`: trecho do link da planilha entre `/d/` e `/edit`;
   - `AGENDAMENTO_WHATSAPP_WEBHOOK_TOKEN`: token aleatório forte com pelo menos 32 bytes.
   - `GROQ_API_KEY`: chave Groq criada em [console.groq.com/keys](https://console.groq.com/keys), usada na interpretação de texto livre.
4. Implante como **App da Web**, executando como a conta proprietária e permitindo acesso a qualquer pessoa, inclusive anônima. Esse projeto não contém a interface Agenda.
5. Na configuração do WhatsApp Sandbox da Console Twilio, escolha a resposta personalizada e informe a URL `/exec` da implantação com `?token=TOKEN_GERADO`.
6. Salve e teste com um número cadastrado na coluna I de CLIENTES.

O bot aceita nomes de serviços e profissionais, datas como “amanhã” e horários
em texto livre. Essas mensagens e as opções da etapa atual são enviadas à API
Groq. A confirmação ainda exige `1`, `sim`, `confirmo`, `confirmar` ou `pode confirmar`; a Groq não cria
reservas. Sem a chave ou durante uma falha da API, o bot continua aceitando
números e datas no formato DD/MM/AAAA.

Não coloque o token no código-fonte, no GitHub, em capturas de tela ou em mensagens de suporte. O acesso anônimo é necessário para que o Twilio faça o webhook; o token é validado antes de qualquer leitura ou gravação da planilha.

O token no endereço é uma proteção de protótipo para o Sandbox. Para produção, use um intermediário que valide `X-Twilio-Signature` e não publique o token em registros do endpoint. A aplicação principal deve permanecer privada.
