# PROJECT_STATUS.md — Status do Projeto Agenda de Serviços

## Versão atual
Bot web de autoagendamento com interpretação pela Groq e previsão de faltas por K-NN, Árvore de Decisão e Regressão Logística publicados no Apps Script na versão 57; teste funcional manual da nova coluna e avaliação preditiva com dados reais ainda pendentes.

## Etapa atual
Integração do bot web de autoagendamento com a API Groq e publicação no Apps Script.

## Concluído até o momento
- Definição do estudo de caso Agenda de Serviços.
- Primeira versão funcional da aplicação.
- Cadastro de clientes, profissionais e serviços.
- Criação de agendamentos.
- Uso do Google Sheets como armazenamento e Google Apps Script na aplicação.
- Definição da arquitetura em camadas.
- Documentação do Agente Testador.
- Workflow do GitHub Actions para executar testes unitários.
- Cinco testes unitários para regras de conflito de agendamento; última execução registrada com 5 aprovados e 0 falhas.
- Hook local versionado para executar `npm test` antes de cada commit e documentação para ativá-lo.

## Arquitetura definida
**Interface → Service → Rules / Validator → Repository → Google Sheets**

## Arquivos relevantes para testes
- `.github/workflows/testes.yml` — executa os testes no GitHub em push e pull requests compatíveis com os caminhos configurados.
- `package.json` — define o comando `npm test`.
- `tests/AgendamentoRules.test.cjs` — cinco testes unitários isolados das regras de agendamento.
- `.githooks/pre-commit` — executa os testes antes de um commit, depois de ativado localmente.
- `docs/testes/CONFIGURACAO_LOCAL.md` — instruções para ativar e validar o hook.
- `docs/agente-testador/INSTRUCOES.md`
- `docs/agente-testador/ROTEIRO_DE_TESTES.md`
- `docs/agente-testador/README.md`

## Arquivos da aplicação mantidos
- `AgendamentoService.gs`
- `AgendamentoRules.gs`
- `AgendamentoValidator.gs`
- `AgendamentoRepository.gs`
- `Agenda.js`
- `Consultas.js`
- Demais arquivos da aplicação.

A lógica da aplicação não foi alterada nesta etapa de automação de testes.

## Arquivos alterados nesta etapa
- `PROJECT_STATUS.md` — registro do progresso.
- Foram adicionados os arquivos de hook local e documentação de configuração.

## Arquivos que podem ser excluídos
- Nenhum recomendado nesta fase.

## Como testar
1. Na cópia local do repositório, execute `git pull`.
2. Execute uma vez `git config core.hooksPath .githooks`.
3. Execute `npm test` e confirme que os cinco testes passam.
4. Faça uma alteração segura, adicione-a com `git add` e tente criar um commit.
5. Confirme que o hook executa os testes antes de permitir o commit.
6. Envie a alteração ao GitHub e confira a execução em Actions.

## Pendências e ressalvas
- A ativação do hook é local por clone e ainda precisa ser validada na máquina de desenvolvimento.
- Os testes atuais são unitários e isolados; não substituem testes integrados no Google Apps Script e Google Sheets.
- A refatoração de Agendamento ainda precisa de validação integrada antes de ser considerada validada em produção.
- A cópia de `PROJECT_GUIDE.md` fornecida na conversa foi usada como orientação; o arquivo não foi encontrado na raiz do repositório GitHub.

## Próximo passo
- Ativar e testar o hook local no Windows.
- Ampliar testes para Validator e Service, uma camada por vez.
- Planejar testes integrados no Google Apps Script.
- Considerar proteção da branch principal para exigir verificações bem-sucedidas antes de integrar pull requests.


## Etapa anterior — Envio de e-mail de teste ao cliente (botão reaproveitado)

### Implementação realizada
- Adicionado o botão **Verificar Email** ao formulário de agendamento.
- O botão é habilitado somente quando um cliente está selecionado.
- Criado o fluxo de consulta do endereço de e-mail cadastrado do cliente.
- Criadas as camadas ClienteService, ClienteValidator e ClienteRepository para coordenar, validar e consultar os dados.
- O envio utiliza MailApp do Google Apps Script.
- A interface informa quando o serviço de e-mail aceita a solicitação ou apresenta o erro retornado.
- Adicionados cinco testes unitários para o ClienteValidator.

### Arquivos criados
- `ClienteService.gs` — coordena o envio da mensagem de teste.
- `ClienteValidator.gs` — valida o código do cliente e o formato do e-mail.
- `ClienteRepository.gs` — consulta nome e e-mail na aba CLIENTES.
- `tests/ClienteValidator.test.cjs` — testes automatizados do validador.

### Arquivos alterados
- `Index.html` — botão, habilitação conforme seleção e mensagens do resultado.
- `PROJECT_STATUS.md` — registro desta etapa.

### Arquivos mantidos
- `Clientes.js` — cadastro atual de clientes preservado.
- `Consultas.js` — consultas existentes preservadas.
- `AgendamentoService.gs`, `AgendamentoRules.gs`, `AgendamentoValidator.gs`, `AgendamentoRepository.gs` e `Agenda.js` — fluxo de agendamento preservado.

### Arquivos que podem ser excluídos
- Nenhum. Os novos arquivos adicionam responsabilidades que ainda não existiam em camadas próprias.

### Como testar
1. Executar `npm test` e confirmar os testes existentes e os cinco novos testes do ClienteValidator.
2. Implantar a versão atualizada do projeto no Google Apps Script.
3. Autorizar o envio de e-mails quando o Google solicitar a permissão correspondente.
4. Abrir a tela Agenda, selecionar um cliente com endereço de e-mail válido e clicar em **Verificar Email**.
5. Confirmar que a interface informa a aceitação da solicitação e conferir a caixa de entrada e a pasta de spam do destinatário.
6. Testar também um cliente sem e-mail cadastrado e um endereço inválido.

### Ressalva importante
A confirmação apresentada pelo sistema significa que o MailApp aceitou a solicitação de envio. Ela não comprova entrega, leitura ou chegada à caixa de entrada. A entrega depende também do provedor e das condições do destinatário.

### Pendências
- Executar e validar a suíte de testes automatizados no GitHub Actions.
- Realizar teste integrado no Google Apps Script com autorização de envio.
- Confirmar o recebimento da mensagem em uma conta de teste.


## Etapa concluída — Importação de agendamentos por e-mail (validação automatizada)

### Comportamento implementado
- O botão **Verificar Email**, na tela Agenda, foi reaproveitado para consultar mensagens recebidas na caixa de entrada com assunto contendo `AGENDAMENTO`.
- Somente mensagens recebidas depois da data e hora de inicialização do monitoramento e que ainda estejam individualmente na caixa de entrada são consideradas; respostas enviadas na mesma conversa são ignoradas.
- O sistema interpreta os campos CLIENTE, SERVIÇO, PROFISSIONAL, DATA e HORÁRIO.
- Os códigos internos são localizados pelos nomes existentes nas abas CLIENTES, SERVICOS e FUNCIONARIOS.
- O horário informado deve corresponder exatamente a um período ativo da aba PERIODOS.
- A criação reutiliza `criarAgendamento()`, preservando validações, regras de conflito, bloqueio e gravação existentes.
- Mensagens válidas são registradas pelo ID do Gmail para evitar duplicidade.
- Mensagens inválidas são informadas individualmente e não impedem o processamento das demais.
- Mensagens originais não são marcadas como lidas nem movidas.

### Arquivos criados
- `AgendamentoEmailRepository.gs` — pesquisa mensagens, registra o marco inicial, controla reservas e evita reprocessamento.
- `AgendamentoEmailService.gs` — coordena a interpretação, resolução dos cadastros e criação dos agendamentos.
- `tests/AgendamentoEmailRepository.test.cjs`
- `tests/AgendamentoEmailRules.test.cjs`
- `tests/AgendamentoEmailValidator.test.cjs`
- `tests/AgendamentoEmailService.test.cjs`
- `tests/AgendamentoRepositoryEmail.test.cjs`

### Arquivos alterados
- `AgendamentoRepository.gs` — consulta clientes, serviços, funcionários e períodos para a importação.
- `AgendamentoRules.gs` — normaliza nomes e resolve correspondências únicas e períodos ativos.
- `AgendamentoValidator.gs` — interpreta e valida os campos do e-mail.
- `Index.html` — reaproveita o botão Verificar Email para iniciar a importação, sem depender da seleção de cliente.
- `PROJECT_STATUS.md` — registro desta etapa.

### Arquivos mantidos
- `AgendamentoService.gs` — fluxo oficial de criação preservado e reutilizado.
- `Agenda.js` — geração de código e compatibilidade com a interface preservadas.
- `ClienteService.gs`, `ClienteRepository.gs` e `ClienteValidator.gs` — mantidos; não foram excluídos nesta etapa.
- `AgendamentoEmailRepository.gs` usa GmailApp e PropertiesService; a autorização do Gmail será solicitada pelo Google Apps Script no primeiro uso que exigir acesso à caixa postal.

### Arquivos que podem ser excluídos
- Nenhum recomendado. Os arquivos da funcionalidade anterior de envio de e-mail de teste foram mantidos para evitar remoção prematura de código ainda disponível no projeto.

### Testes automatizados
- GitHub Actions: execução concluída com sucesso.
- Resultado registrado na execução mais recente: 31 testes aprovados e 0 falhas.
- Execução: https://github.com/MiguelBona13/agendaservicos/actions/runs/40983374620

### Como ativar e testar no Google Apps Script
1. Atualizar o projeto com os arquivos desta branch e implantar uma nova versão do aplicativo.
2. No editor do Google Apps Script, executar manualmente uma única vez a função `agendamentoEmailServiceInicializarMonitoramento()`. Essa execução grava o marco inicial e impede que mensagens antigas sejam importadas.
3. Abrir a tela Agenda e clicar em **Verificar Email**. No primeiro acesso ao Gmail, autorizar as permissões solicitadas pelo Google.
4. Enviar uma nova mensagem para a caixa de entrada com assunto contendo `AGENDAMENTO` e os campos no formato documentado.
5. Clicar em **Verificar Email** e confirmar a criação na aba AGENDA.
6. Repetir o teste com nome inexistente, nome duplicado, período inativo e horário não cadastrado. Nenhum desses casos deve criar agendamento.
7. Clicar novamente e confirmar que mensagens já processadas não geram duplicidade.

### Pendências e ressalvas
- A validação automatizada não substitui o teste integrado com Gmail, Google Sheets e Google Apps Script.
- A função de inicialização deve ser executada depois da implantação e antes de começar a enviar mensagens que devam ser importadas.
- A busca considera mensagens que estejam na caixa de entrada no momento da verificação.
- Mensagens com erro permanecem elegíveis para nova tentativa; após corrigir o conteúdo, o usuário pode clicar novamente em Verificar Email.
- Se houver falha técnica depois da criação do agendamento e antes do registro do ID do Gmail, a mensagem ficará reservada para evitar duplicidade e exigirá conferência manual.

### Próximo passo
- Implantar a versão no Google Apps Script.
- Inicializar o monitoramento uma única vez.
- Autorizar o acesso ao Gmail e executar testes integrados com mensagens reais de teste.
- Validar o comportamento com e-mails válidos, inválidos, nomes duplicados e conflitos de horário.


## Correção incremental — autorização do remetente

### Alteração realizada
- A importação consulta o endereço da conta efetivamente executora por meio de `Session.getEffectiveUser().getEmail()`.
- Cada mensagem é validada antes da reserva de processamento.
- Somente mensagens cujo campo de remetente corresponda à conta executora podem seguir para interpretação e criação do agendamento.
- Se o Apps Script não conseguir identificar o endereço da conta executora, a operação é interrompida por segurança.
- A regra aceita o formato simples de e-mail e o formato de nome de exibição seguido do endereço entre sinais de menor e maior.

### Configuração de implantação
- Para usar a conta proprietária do aplicativo como identidade executora, a implantação do aplicativo da web deve estar configurada como **Executar como: Eu**.
- A conta que executa o aplicativo precisa autorizar o acesso ao Gmail.

### Arquivos criados
- `AgendamentoEmailRules.gs` — regra de autorização do remetente.
- `tests/AgendamentoEmailRulesRemetente.test.cjs` — testes unitários da regra de autorização.

### Arquivos alterados
- `AgendamentoEmailRepository.gs` — leitura do endereço da conta executora.
- `AgendamentoEmailService.gs` — validação do remetente antes de reservar/processar a mensagem.
- `tests/AgendamentoEmailRepository.test.cjs` — teste da identificação da conta executora.
- `tests/AgendamentoEmailService.test.cjs` — testes de remetente autorizado, não autorizado e identidade indisponível.
- `PROJECT_STATUS.md` — atualização do estado e registro desta etapa.

### Arquivos mantidos
- `AgendamentoService.gs`, `AgendamentoRepository.gs`, `AgendamentoValidator.gs`, `AgendamentoRules.gs`, `Agenda.js` e `Index.html` — fluxo existente preservado.
- `tests/AgendamentoEmailRules.test.cjs` — mantido, pois já cobre as regras de resolução de cadastros e períodos.
- Nenhum arquivo foi excluído.

### Como testar
1. Executar `npm test`.
2. Confirmar que mensagem enviada pela conta executora pode seguir para validação do conteúdo.
3. Confirmar que mensagem enviada por outro endereço é rejeitada e não reserva o ID para processamento.
4. Confirmar que a ausência do endereço da conta executora bloqueia a operação.
5. Na implantação real, selecionar **Executar como: Eu**, autorizar Gmail e testar com mensagem enviada pela própria conta.

### Ressalvas
- A validação compara o campo From retornado pelo Gmail. Ela reduz o processamento acidental de mensagens de outros remetentes, mas não substitui mecanismos de autenticação de e-mail contra falsificação do cabeçalho do remetente.
- O teste automatizado usa simulações e não comprova o comportamento real da conta executora no ambiente implantado.

### Pendências
- Recuperação segura de reservas de processamento interrompidas.
- Estratégia para controlar o crescimento dos registros de mensagens processadas.
- Retorno visual para indicar mensagens pendentes além do limite por execução.
- Teste integrado real com Gmail, Google Sheets e Google Apps Script.


## Correção incremental — recuperação de reservas interrompidas

### Alteração realizada
- As reservas novas passam a armazenar data e hora de início.
- Antes de chamar `criarAgendamento()`, o código gerado é associado à reserva da mensagem.
- Reservas com mais de 35 minutos podem ser recuperadas. O prazo supera o limite máximo usual de execução do Apps Script, inclusive o limite ampliado de 30 minutos.
- Na recuperação, o sistema consulta a aba AGENDA pelo código reservado e compara também data, período, profissional, cliente e serviço:
  - se todos os dados corresponderem, registra a mensagem como processada e não cria outro agendamento;
  - se não houver registro correspondente, libera a mensagem para nova tentativa.
- O filtro de mensagens permite que reservas expiradas retornem ao Service para recuperação.
- Foi removida uma declaração duplicada de `agendamentoEmailRepositoryObterEmailContaExecutora()` identificada durante a revisão.

### Compatibilidade com reservas antigas
- Reservas gravadas pela versão anterior apenas como `PROCESSANDO`, sem data e sem código associado, não são recuperadas automaticamente.
- Essas reservas permanecem bloqueadas para evitar duplicidade, pois não há informação suficiente para confirmar se a criação chegou a ocorrer.
- A conferência e eventual liberação dessas reservas antigas exigem verificação manual da aba AGENDA.

### Arquivos alterados
- `AgendamentoEmailRepository.gs` — reserva com data, expiração, recuperação pelo código e filtro de mensagens expiradas.
- `AgendamentoEmailService.gs` — grava o código na reserva antes de iniciar a criação e preserva a reserva quando o código já foi gravado.
- `tests/AgendamentoEmailRepository.test.cjs` — testes de reserva ativa, expirada, recuperação e compatibilidade antiga.
- `tests/AgendamentoEmailService.test.cjs` — teste do vínculo do código antes da criação.
- `PROJECT_STATUS.md` — registro da correção.

### Arquivos mantidos
- `AgendamentoService.gs` e `AgendamentoRepository.gs` — fluxo de criação e consulta do código existentes foram reutilizados.
- Nenhum arquivo foi criado ou excluído nesta etapa.

### Como testar
1. Executar `npm test`.
2. Confirmar que reservas recentes não são retomadas.
3. Confirmar que reserva expirada sem registro correspondente na AGENDA pode ser retomada.
4. Confirmar que reserva expirada cujo código já existe na AGENDA é concluída sem nova criação.
5. Confirmar que reservas antigas sem data permanecem bloqueadas para revisão manual.

### Validação desta etapa
- Foram executados 10 cenários direcionados em ambiente Node.js simulado, cobrindo reservas novas, ativas, expiradas, recuperadas, colisão de código e fluxo do Service; 10 aprovados e 0 falhas.
- A execução completa de `npm test` no GitHub Actions após estas últimas alterações ainda está pendente.

### Ressalvas
- O prazo de 35 minutos é uma proteção operacional, não um teste integrado de interrupção real do Apps Script.
- A recuperação compara o código e os dados completos do agendamento para reduzir o risco de confundir uma colisão de código com a gravação originada pelo e-mail.

### Pendências
- Estratégia para controlar o crescimento dos registros de mensagens processadas.
- Retorno visual para indicar mensagens pendentes além do limite por execução.
- Teste integrado real com Gmail, Google Sheets e Google Apps Script.


## Correção incremental — aviso de mensagens pendentes após o limite

### Alteração realizada
- O Service consulta até 101 mensagens para identificar se existe conteúdo além do limite operacional de 100 por execução.
- No máximo 100 mensagens são efetivamente processadas em cada clique.
- Quando a consulta identifica uma 101ª mensagem, o resultado inclui `maisMensagensPendentes: true` e orienta o usuário a clicar novamente em **Verificar Email**.
- A interface já exibe a mensagem retornada pelo Service, portanto não foi necessário alterar o HTML.
- A consulta adicional não reserva nem processa a 101ª mensagem; ela permanece disponível para a próxima execução.

### Arquivos alterados
- `AgendamentoEmailService.gs` — detecção de mensagens além do limite e aviso no resultado.
- `tests/AgendamentoEmailService.test.cjs` — teste para garantir o limite de 100 e a sinalização de pendência.
- `PROJECT_STATUS.md` — registro da correção.

### Arquivos mantidos
- `AgendamentoEmailRepository.gs` — consulta e controle de mensagens existentes preservados.
- `Index.html` — mantido, pois já apresenta a mensagem devolvida pelo Service.
- Demais arquivos e camadas não foram alterados.

### Arquivos criados ou excluídos
- Nenhum arquivo criado.
- Nenhum arquivo excluído.

### Como testar
1. Executar `npm test`.
2. Confirmar que o novo teste simula 101 mensagens e que apenas 100 são processadas.
3. Confirmar que o retorno informa `maisMensagensPendentes: true` e orienta novo clique.
4. No Apps Script, testar com mais de 100 mensagens elegíveis e confirmar que execuções sucessivas continuam o processamento sem duplicar os agendamentos.

### Ressalvas
- A detecção é feita por amostragem de uma mensagem além do limite. Se houver 101 ou mais mensagens, o sistema informa que há pendências; não informa o total exato.
- A execução completa da suíte e o teste integrado real com Gmail, Google Sheets e Google Apps Script ainda precisam ser confirmados.

## Ajuste de validação — teste da reserva de e-mail

### Alteração realizada
- Corrigida a comparação do teste de integração isolado do Service para validar os campos da reserva sem comparar diretamente objetos criados em contextos JavaScript diferentes (VM do Node.js).
- A falha identificada era do mecanismo de comparação do teste; os valores efetivamente produzidos estavam corretos.
- Nenhuma regra de negócio ou comportamento da importação foi alterado.

### Arquivos alterados
- `tests/AgendamentoEmailService.test.cjs` — comparação explícita dos campos da reserva.
- `PROJECT_STATUS.md` — registro da correção.

### Arquivos mantidos
- `Index.html` — botão **Verificar Email** e chamada do Service mantidos.
- `AgendamentoEmailService.gs`, `AgendamentoEmailRepository.gs`, `AgendamentoEmailRules.gs`, `AgendamentoValidator.gs`, `AgendamentoRules.gs` e `AgendamentoRepository.gs` — rotina e camadas de negócio mantidas.
- Nenhum arquivo criado ou excluído.

### Como testar
1. Executar `npm test`.
2. Confirmar que os testes do Service validam os dados gravados na reserva.
3. Conferir a execução do GitHub Actions vinculada ao commit desta correção.
4. Realizar o teste integrado no Apps Script com Gmail e Google Sheets.

### Situação
- A correção do teste foi enviada à branch `feature/verificar-email-cliente`.
- A execução automatizada correspondente ainda precisa concluir para confirmar a suíte completa.

## Validação automatizada concluída — importação por e-mail

- GitHub Actions executou a suíte completa após a correção do teste: **49 testes aprovados e 0 falhas**.
- Execução: https://github.com/MiguelBona13/agendaservicos/actions/runs/40985443094
- A rotina e o botão **Verificar Email** estão integrados na branch `feature/verificar-email-cliente`.
- Permanece pendente somente a validação integrada no Google Apps Script com Gmail e Google Sheets reais.
- Antes do uso, implantar esta branch no projeto Apps Script, configurar a implantação como **Executar como: Eu**, executar uma vez `agendamentoEmailServiceInicializarMonitoramento()` e autorizar o acesso ao Gmail.



## Correção — botão Verificar Email integrado à branch principal

### Problema identificado
- A implementação do botão e da importação de agendamentos por e-mail estava somente na branch `feature/verificar-email-cliente`.
- A branch `main` não continha o botão nem a chamada do Service; por isso ele não aparecia no código principal.

### Alteração realizada
- Pull request #1 integrado à branch `main` por squash merge.
- Título do pull request corrigido para refletir a funcionalidade efetivamente entregue.
- Confirmado no arquivo `Index.html` da branch `main` que o botão **Verificar Email** e a chamada `agendamentoEmailServiceProcessarNovosEmails()` estão presentes.
- A implementação mantém a arquitetura em camadas e reutiliza `criarAgendamento()`.

### Arquivos integrados
- `Index.html` — botão e acionamento da rotina na tela Agenda.
- `AgendamentoEmailService.gs`, `AgendamentoEmailRepository.gs` e `AgendamentoEmailRules.gs` — processamento, acesso ao Gmail e regras da importação.
- `AgendamentoRepository.gs`, `AgendamentoRules.gs` e `AgendamentoValidator.gs` — consultas e validações reutilizadas.
- Testes automatizados da importação por e-mail.
- Este `PROJECT_STATUS.md`.

### Validação
- GitHub Actions: 49 testes aprovados e 0 falhas na execução vinculada ao último commit da implementação.
- Pull request #1 integrado com sucesso à `main`.
- Conferência do arquivo `Index.html` na `main`: botão e chamada do Service encontrados.
- Testes integrados reais com Gmail, Google Sheets e Apps Script ainda pendentes.

### Implantação necessária para o botão aparecer no aplicativo publicado
1. Atualizar/sincronizar o projeto Apps Script com o conteúdo da branch `main`.
2. Criar uma nova versão da implantação do aplicativo da web.
3. Configurar **Executar como: Eu** e autorizar o acesso ao Gmail.
4. Executar uma única vez `agendamentoEmailServiceInicializarMonitoramento()`.
5. Abrir a tela Agenda e confirmar que o botão **Verificar Email** aparece e processa uma mensagem de teste.

### Arquivos criados, alterados ou excluídos nesta correção
- Nenhum arquivo de aplicação foi criado, alterado ou excluído durante a integração; os arquivos já existentes na branch de funcionalidade foram incorporados à `main`.
- `PROJECT_STATUS.md` foi atualizado para registrar a integração.
- Nenhum arquivo foi identificado para exclusão.

### Próximo passo
- Publicar a nova versão no Google Apps Script e executar os testes integrados reais. A integração no GitHub, por si só, não atualiza automaticamente a implantação publicada.


## Bot web de autoagendamento — publicação pelo Apps Script

- Criada a rota `?bot=1` em `WebApp.js`; sem o parâmetro, a interface administrativa atual continua sendo aberta.
- Criada interface responsiva `Bot.html`, com aparência de conversa inspirada no WhatsApp.
- O bot mostra serviços e profissionais cadastrados, identifica o cliente pelo celular sem expor a lista de clientes, lista períodos livres e pede confirmação.
- `AgendamentoBotService.gs`, `AgendamentoBotRules.gs`, `AgendamentoBotValidator.gs` e `AgendamentoBotRepository.gs` mantêm a lógica nas camadas definidas e chamam `criarAgendamento()` para a gravação final.
- A publicação é feita pelo workflow `.github/workflows/publicar-apps-script.yml` após a alteração chegar à branch `main`.
- Como validar: abrir a URL implantada com `?bot=1`, usar um celular cadastrado e percorrer a seleção até confirmar. Testar também celular não cadastrado e horário que deixou de estar livre.
- O teste integrado com o Apps Script e a planilha ainda deve ser feito após a publicação.


## Integração Groq — webhook do WhatsApp via Twilio

### Alteração implementada
- O bot aceita texto livre para selecionar serviços e profissionais, informar datas como “amanhã” e escolher horários.
- A Groq interpreta a mensagem na etapa atual; opções e datas continuam passando pelas validações existentes.
- A primeira mensagem pode já conter o pedido. A confirmação permanece explícita, e a IA não cria reservas.
- A mensagem do cliente e as opções da etapa atual são enviadas à API Groq. A chave `GROQ_API_KEY` é lida das Script Properties.

### Arquivos criados e alterados
- `AgendamentoWhatsAppGroqRepository.gs` e `AgendamentoWhatsAppService.gs` — integração e interpretação contextual.
- `AgendamentoWhatsAppRepository.gs`, `AgendamentoWhatsAppRules.gs`, `AgendamentoWhatsAppValidator.gs` e `AgendamentoWhatsAppWebhook.gs` — camadas do fluxo do bot.
- `docs/whatsapp/CONFIGURACAO.md` e `whatsapp-backend/` — instruções e backend isolado.
- `tests/AgendamentoWhatsApp*.test.cjs` — testes do fluxo base incluídos no repositório; não executados nesta etapa.

### Arquivos mantidos e exclusões
- Mantidos o fluxo oficial de criação, as regras de conflito, o webhook Twilio e o estado temporário da conversa.
- Nenhum arquivo excluído.

### Como testar
1. Configurar `GROQ_API_KEY` nas Script Properties do projeto Apps Script.
2. Sincronizar os arquivos e autorizar chamadas externas.
3. Testar no Twilio Sandbox nomes, data em linguagem natural, horário por texto e confirmação explícita com dados de teste.
4. Confirmar que não há gravação antes da confirmação final.

### Situação
- Os arquivos do projeto, incluindo o webhook Twilio, foram sincronizados; o app da Web foi atualizado na implantação existente para a versão 45.
- O fluxo Twilio com Groq ainda não foi validado com chamadas reais.


## Integração incremental — Groq no bot web do Apps Script (`?bot=1`)

### Alteração implementada
- A interface web inspirada no WhatsApp aceita texto livre para selecionar serviço e profissional, informar datas como “amanhã” e escolher horário.
- `AgendamentoBotGroqRepository.gs` usa `GROQ_API_KEY` e a API Groq para interpretar apenas a etapa atual.
- `AgendamentoBotService.gs` reconsulta catálogos e disponibilidade no servidor; a resposta da IA é validada antes de avançar.
- A confirmação é explícita pela interface ou por respostas exatas como `confirmar` e `sim`; a IA não cria nem confirma reservas.
- As cópias de implantação foram sincronizadas em `apps-script-clone-readonly`, raiz indicada pelo `.clasp.json` local.

### Arquivos criados
- `AgendamentoBotGroqRepository.gs` — integração HTTP com a Groq.

### Arquivos alterados
- `AgendamentoBotService.gs` — interpretação contextual validada pelo Service.
- `Bot.html` — entrada de texto livre nas etapas de serviço, profissional, data, horário e confirmação, mantendo opções clicáveis.
- `PROJECT_STATUS.md` — registro desta etapa.

### Arquivos mantidos e exclusões
- Mantidos os botões de opção, a identificação do cliente, a consulta de disponibilidade e o fluxo oficial `criarAgendamento()` com confirmação.
- Nenhum arquivo excluído.

### Como testar
1. Confirmar `GROQ_API_KEY` nas Script Properties do projeto Apps Script.
2. Abrir `https://script.google.com/macros/s/AKfycbwfn0gri59cZEObAKHKgBwBKvGn9i0jTPasg2VKKoVPXCyg-pLc15oIrBEDfhswTDjc/exec?bot=1`.
3. Testar nome de serviço, nome de profissional, data como “amanhã” e horário em texto.
4. Confirmar que a planilha só é alterada depois da confirmação explícita.

### Situação
- 39 arquivos sincronizados com o Apps Script; a implantação existente foi atualizada para a versão 45, mantendo o mesmo ID e link.
- Sintaxe do Service, do repositório Groq e do JavaScript da interface verificada. Teste integrado real com Groq e Sheets ainda pendente.



## Implementação incremental — CRUD da AGENDA com dez campos para preparação do K-NN

### Alterações implementadas na branch `feature/crud-agenda-campos-knn`
- A AGENDA mantém exatamente dez colunas, nesta ordem: `codigo`, `Data`, `Codigo_Periodo`, `Funcionario`, `Cliente`, `Servico`, `Valor`, `Status`, `hora`, `Data_Cadastro`.
- O cadastro obtém `hora` do horário inicial do período ativo e gera `Data_Cadastro` no servidor, usando o fuso horário do Apps Script.
- O Repository grava e consulta os dez campos e acrescenta os cabeçalhos `hora` e `Data_Cadastro` quando necessário.
- Registros históricos com oito campos continuam legíveis; os campos históricos desconhecidos permanecem vazios, sem criação retroativa de dados.
- A consulta da AGENDA em `Consultas.js` delega a leitura ao Repository.
- A interface apresenta os dez campos, permite editar os dados do agendamento e alterar o status durante a edição.
- Os status previstos são `Agendado`, `Compareceu`, `Faltou`, `Cancelado` e `Reagendado`. Comparecimento e falta só podem ser registrados depois do horário agendado.
- Cancelado e Reagendado não bloqueiam horários nem devem ser usados como rótulos de falta no treinamento.
- O fluxo oficial de criação continua sendo reutilizado pelas integrações existentes; a AGENDA não recebeu colunas de previsão do K-NN.

### Arquivos alterados
- `AgendamentoRepository.gs` — persistência, leitura e atualização dos dez campos, com compatibilidade histórica.
- `AgendamentoService.gs` — geração de hora e data de cadastro e caso de uso de atualização.
- `AgendamentoRules.gs` — regras de conflito e validação de status/horário.
- `AgendamentoValidator.gs` — validação do payload de atualização.
- `Agenda.js` — ponto de entrada para atualização, delegando ao Service.
- `Consultas.js` — consulta da AGENDA delegada ao Repository.
- `Index.html` — exibição dos dez campos, edição e seleção de status.
- `PROJECT_STATUS.md` — registro desta etapa.

### Arquivo criado
- `tests/AgendamentoKnnFields.test.cjs` — seis testes para status, horários futuros, conflito durante edição e validação do status.

### Arquivos mantidos
- Integrações de e-mail e WhatsApp e demais arquivos da aplicação foram preservados.
- `PROJECT_GUIDE.md` não foi alterado.
- Nenhum arquivo foi excluído.

### Validação automatizada
- GitHub Actions executou `npm test` com sucesso na branch de trabalho.
- Execução após a alteração da interface: https://github.com/MiguelBona13/agendaservicos/actions/runs/43329107943
- Os testes são unitários; ainda não foi realizado teste integrado real com Google Apps Script e Google Sheets.

### Como testar no ambiente integrado
1. Revisar a branch e integrar as alterações somente após aprovação.
2. Atualizar a implantação do Apps Script em ambiente de teste.
3. Confirmar que a aba AGENDA possui os dez cabeçalhos na ordem definida.
4. Criar um agendamento e conferir a hora derivada do período e a Data_Cadastro gerada pelo servidor.
5. Editar data, período, funcionário, cliente e serviço; confirmar que a Data_Cadastro original permanece igual.
6. Tentar registrar Compareceu/Faltou antes do horário e confirmar que a operação é recusada.
7. Após o horário, registrar Compareceu e Faltou em registros de teste e confirmar que Cancelado/Reagendado continuam distintos.
8. Conferir importação por e-mail e WhatsApp para garantir que continuam criando pela função oficial `criarAgendamento()`.

### Pendências e ressalvas
- A migração adiciona os cabeçalhos das colunas 9 e 10 ao primeiro cadastro/atualização; não preenche retroativamente hora ou Data_Cadastro dos registros antigos.
- A validação integrada com Apps Script, planilha real e integrações de e-mail/WhatsApp permanece pendente.
- A previsão K-NN e o armazenamento separado de previsões não fazem parte desta etapa.

### Próximo passo
- Revisar e aprovar o pull request da branch.
- Executar testes integrados no Apps Script antes da publicação em produção.



## Conclusão da implementação — CRUD da AGENDA preparado para o K-NN

### Integração e publicação
- Pull Request #2 integrado à branch `main` em 12/11/2026.
- Commit de integração: `166f6ff930005f853529d5173a6c28d68b50f3e9`.
- Testes automatizados no commit integrado: aprovados.
- Publicação do Apps Script concluída com sucesso na versão 46, atualizando a implantação existente.
- Execução de publicação: https://github.com/MiguelBona13/agendaservicos/actions/runs/43330393445
- Execução dos testes automatizados: https://github.com/MiguelBona13/agendaservicos/actions/runs/43330393390

### Ajuste de publicação
- Criado `.claspignore` para impedir que o manifesto `whatsapp-backend/appsscript.json` e os arquivos do backend WhatsApp sejam enviados ao projeto Apps Script principal.
- O primeiro push após a integração falhou por conflito de nome entre os dois manifestos `appsscript.json`; a configuração foi corrigida e o push subsequente, a criação da versão e a atualização da implantação foram concluídos com sucesso.
- `AgendamentoRepository.gs` recebeu apenas ajuste de documentação na quebra de linha do comentário.

### Situação final
- O CRUD de AGENDA com os dez campos está integrado na `main` e publicado no Apps Script, versão 46.
- A estrutura de colunas permanece: `codigo`, `Data`, `Codigo_Periodo`, `Funcionario`, `Cliente`, `Servico`, `Valor`, `Status`, `hora`, `Data_Cadastro`.
- Nenhuma coluna de previsão K-NN foi adicionada à AGENDA.
- Não houve exclusão de arquivos.
- `PROJECT_GUIDE.md` não foi alterado.
- A publicação técnica foi confirmada pelo GitHub Actions; não foi realizado teste funcional manual com dados reais na planilha após a publicação.
- A implementação do algoritmo K-NN e o armazenamento separado das previsões permanecem fora do escopo desta entrega.

### Próxima etapa recomendada
- Acompanhar o uso real do cadastro para acumular resultados válidos `Compareceu` e `Faltou`; depois desenvolver e validar o modelo K-NN em etapa separada.

## Correção de apresentação — formato brasileiro de data e hora na AGENDA

### Alterações implementadas
- A coluna `hora` é normalizada para `HH:mm`, inclusive quando o Google Sheets retorna um objeto Date com data-base 30/12/1899.
- A normalização da hora utiliza o fuso horário configurado no projeto Apps Script (`America/Cuiaba`).
- A coluna `Data_Cadastro` é normalizada para `dd/MM/yyyy`.
- A interface apresenta `Data` e `Data_Cadastro` no formato `dd/MM/yyyy`; o valor ISO da data de atendimento continua preservado internamente para edição e envio ao servidor.
- Foram adicionados testes unitários para os formatos de hora e data.

### Arquivos alterados
- `AgendamentoRules.gs` — normalização de hora e data de cadastro.
- `AgendamentoRepository.gs` — aplicação das normalizações ao montar os registros consultados.
- `Index.html` — apresentação de datas no padrão brasileiro.
- `tests/AgendamentoKnnFields.test.cjs` — testes para os novos formatos.

### Arquivos mantidos e exclusões
- Mantidos os demais arquivos e fluxos da aplicação.
- Nenhum arquivo criado ou excluído.
- `PROJECT_GUIDE.md` não foi alterado.

### Validação
- A primeira execução do workflow apontou erro de sintaxe nas expressões regulares recém-adicionadas; os escapes foram corrigidos.
- Após a correção, a sintaxe dos arquivos `AgendamentoRules.gs`, `AgendamentoRepository.gs`, `Index.html` e do teste novo foi verificada.
- A suíte completa precisa concluir novamente no GitHub Actions após a correção.
- O teste funcional integrado com Google Sheets/Apps Script permanece não executado manualmente.

### Próximo passo
- Integrar a correção à `main` e confirmar a publicação automática no Apps Script.

## Etapa em desenvolvimento — previsão de comparecimento com K-NN

### Objetivo
Adicionar à aba AGENDA a coluna `Previsao_KNN`, separada do `Status` real do atendimento, para estimar se cada agendamento futuro tende a resultar em comparecimento ou falta.

### Regras da previsão
- `Status` continua representando o resultado real: Agendado, Compareceu, Faltou, Cancelado ou Reagendado.
- `Previsao_KNN` apresenta a estimativa do modelo e nunca substitui o status real.
- O K-NN utiliza K=5 vizinhos e distância ponderada por semelhança.
- Características consideradas: cliente, serviço, funcionário, período, dia da semana, antecedência da reserva e valor.
- O código do agendamento e o status não são características de distância.
- Apenas registros históricos com status Compareceu ou Faltou e atendimento anterior ao instante da previsão podem treinar o modelo.
- Cancelados, reagendados, pendentes e atendimentos futuros são excluídos do treinamento.
- Com menos de cinco exemplos históricos válidos, a interface informa que o histórico é insuficiente.
- Agendamentos concluídos mostram o resultado real; cancelados/reagendados mostram que a previsão não se aplica.

### Arquivos criados
- `AgendamentoKnnRules.gs` — cálculo da distância e classificação pelos cinco vizinhos mais próximos.
- `AgendamentoKnnService.gs` — coordena a geração e persistência das previsões.
- `tests/AgendamentoKnnRules.test.cjs` — testes unitários de classificação, histórico insuficiente e exclusão de status não elegíveis.

### Arquivos alterados
- `AgendamentoRepository.gs` — cria a 11ª coluna, lê a previsão salva e atualiza somente essa coluna.
- `Consultas.js` — encaminha a consulta da agenda ao serviço de previsão.
- `Index.html` — exibe a coluna Previsão K-NN na tabela.
- `PROJECT_STATUS.md` — registra a etapa.

### Arquivos mantidos
- `AgendamentoService.gs`, `AgendamentoRules.gs`, `AgendamentoValidator.gs` e os dez campos originais da AGENDA.
- O campo `Status` continua sendo o rótulo real para treinamento.
- Nenhum arquivo existente foi excluído.
- `PROJECT_GUIDE.md` não foi alterado.

### Validação e pendências
- Foram criados testes unitários para os cenários centrais do classificador.
- A execução completa da suíte no GitHub Actions e a validação integrada com Google Sheets/Apps Script ainda precisam ser concluídas.
- O desempenho preditivo real ainda não foi medido; não apresentar as estimativas como garantia de comparecimento ou falta.
- A nova coluna será criada automaticamente pela camada Repository ao consultar ou gravar registros na AGENDA.

## Etapa implementada — previsão de risco de falta com Árvore de Decisão

### Objetivo
Adicionar à AGENDA uma indicação independente de risco de falta, calculada por uma árvore de decisão CART, preservando a previsão K-NN e o Status real.

### Regras implementadas
- A interface mostra somente **Risco de falta**, **Sem risco de falta identificado** ou uma justificativa de indisponibilidade/histórico insuficiente.
- A árvore é treinada com pelo menos oito resultados reais válidos.
- Somente Compareceu e Faltou com atendimento anterior ao instante da previsão entram no treinamento.
- Agendado, Cancelado, Reagendado e atendimentos futuros não são rótulos de treinamento.
- Código do agendamento e Status não são características.
- Cliente, serviço, funcionário e período são tratados como categorias nominais, sem atribuir ordem numérica aos códigos.
- Dia da semana, mês, horário, antecedência e valor podem ser usados como características.
- A árvore usa impureza Gini, profundidade máxima quatro e mínimo de dois exemplos por folha.
- A classificação de risco ocorre quando pelo menos metade dos exemplos da folha terminal corresponde a faltas.
- A previsão não altera o Status real nem substitui a coluna Previsao_KNN.

### Arquivos criados
- AgendamentoArvoreRules.gs — extração de características, treinamento CART e classificação de risco.
- AgendamentoArvoreService.gs — coordena o treinamento, classificação e persistência.
- tests/AgendamentoArvoreRules.test.cjs — testes unitários das regras temporais, categorias e classificação.

### Arquivos alterados
- AgendamentoRepository.gs — cria e lê a 12ª coluna Previsao_Arvore, preserva a 11ª coluna K-NN e grava somente a previsão da árvore.
- AgendamentoKnnService.gs — integra a árvore ao fluxo atual de consulta, reutilizando os registros carregados.
- Index.html — exibe a coluna Risco de falta (Árvore).
- PROJECT_STATUS.md — registra esta etapa.

### Arquivos mantidos
- AgendamentoKnnRules.gs, AgendamentoKnnService.gs e Previsao_KNN continuam disponíveis.
- AgendamentoService.gs, AgendamentoRules.gs, AgendamentoValidator.gs e os dez campos originais da AGENDA permanecem preservados.
- PROJECT_GUIDE.md não foi alterado.
- Nenhum arquivo foi excluído.

### Validação
- Testes unitários novos cobrem risco, ausência de risco, histórico insuficiente, exclusão de status não elegíveis, exclusão de atendimentos futuros, data brasileira e exclusão de código/status das características.
- Suíte completa validada no GitHub Actions: execução 43347942212 no pull request e execução 43347972607 após a integração, ambas concluídas com sucesso.
- Código integrado à main pelo pull request #5, commit 411df2ff9665bc826b33d9799a72070939197fbb.
- Publicação no Google Apps Script concluída pelo workflow 43347972480: 41 arquivos enviados, versão 52 criada e implantação existente atualizada com sucesso.
- O desempenho real do modelo ainda precisa ser avaliado com dados históricos representativos; o rótulo não é garantia de falta.

### Como testar
1. Executar npm test e confirmar todos os testes aprovados.
2. Integrar a branch à main após a verificação do workflow.
3. Conferir no GitHub Actions o workflow Publicar Apps Script e o número de versão implantado.
4. Abrir a AGENDA e confirmar a criação da coluna Previsao_Arvore.
5. Conferir agendamentos futuros com pelo menos oito resultados reais anteriores.
6. Confirmar que registros concluídos, cancelados e reagendados não recebem previsão ativa e que o Status não é alterado.
7. Validar com amostras reais e revisar falsos positivos/negativos antes de usar o indicador para decisões operacionais.

### Próximo passo
- Realizar teste funcional manual na aplicação publicada, confirmando a coluna Previsao_Arvore e os resultados com dados da planilha real.
- Avaliar falsos positivos e falsos negativos com histórico representativo antes de usar o indicador como critério operacional.


## Etapa em implementação — previsão de faltas com Regressão Logística

### Objetivo
Adicionar à aba AGENDA a coluna `Previsao_Regressao_Logistica`, com a probabilidade estimada de falta, preservando as previsões K-NN e Árvore de Decisão e o Status real.

### Regras previstas
- Classe 0: Compareceu; classe 1: Faltou.
- O treinamento considera apenas resultados reais anteriores ao instante da previsão.
- O código do agendamento e o Status não são características do modelo.
- Características: cliente, serviço, funcionário, período, dia da semana, mês, horário, antecedência da reserva e valor.
- Categorias são codificadas como indicadores; características numéricas são padronizadas.
- O modelo usa regressão logística com descida do gradiente e regularização L2.
- Exige pelo menos 20 resultados válidos, com no mínimo cinco exemplos de cada classe.
- A coluna apresenta percentual estimado e faixa de risco: baixo (menos de 30%), moderado (30% a 59%) ou alto (60% ou mais).
- A previsão não substitui nem altera o Status, K-NN ou Árvore de Decisão.

### Arquivos criados
- `AgendamentoRegressaoLogisticaRules.gs` — extração de características, treinamento e cálculo da probabilidade.
- `AgendamentoRegressaoLogisticaService.gs` — coordena a previsão e sua persistência.
- `tests/AgendamentoRegressaoLogisticaRules.test.cjs` — testes unitários do modelo.

### Arquivos alterados
- `AgendamentoRepository.gs` — cria, lê e atualiza a 13ª coluna.
- `AgendamentoKnnService.gs` — integra o serviço da regressão logística após K-NN e Árvore.
- `Index.html` — exibe a probabilidade estimada na tabela da agenda.
- `PROJECT_STATUS.md` — registra esta etapa.

### Arquivos mantidos
- `AgendamentoKnnRules.gs`, `AgendamentoKnnService.gs`, `AgendamentoArvoreRules.gs` e `AgendamentoArvoreService.gs` permanecem como modelos independentes.
- `AgendamentoService.gs`, `AgendamentoRules.gs`, `AgendamentoValidator.gs` e os dez campos originais permanecem preservados.
- `PROJECT_GUIDE.md` não foi alterado.
- Nenhum arquivo foi excluído.

### Como testar
1. Executar `npm test` e confirmar todos os testes.
2. Confirmar no GitHub Actions que os testes passam na branch e no pull request.
3. Publicar no Apps Script após a integração e conferir a criação da coluna 13.
4. Abrir a AGENDA e confirmar que registros futuros exibem percentual e faixa de risco quando há histórico suficiente.
5. Confirmar que registros concluídos, cancelados e reagendados mostram previsão não aplicável.
6. Confirmar que o Status e as outras duas previsões permanecem inalterados.
7. Avaliar calibração, falsos positivos e falsos negativos com dados históricos representativos antes de usar o percentual como critério operacional.

### Validação e ressalvas
- Os testes unitários do modelo cobrem treinamento, classes, probabilidade, histórico insuficiente, exclusão de registros inelegíveis e prevenção de vazamento temporal.
- A probabilidade é uma estimativa do modelo, não uma garantia de falta nem uma probabilidade calibrada até que seja avaliada em dados separados.
- A validação integrada com Google Sheets e a publicação ainda precisam ser confirmadas.

### Próximo passo
- Executar a suíte completa, revisar o pull request e confirmar a publicação automática do Apps Script.


### Registro de validação incremental
- Primeira execução da suíte após a integração encontrou 1 falha entre 83 testes: as probabilidades para duas categorias de cliente não se diferenciavam como esperado.
- A causa foi a codificação de todas as categorias junto com o intercepto do modelo, gerando colinearidade.
- Correção aplicada em `AgendamentoRegressaoLogisticaRules.gs`: codificação por categoria de referência, omitindo a primeira categoria para evitar colinearidade perfeita.
- Nova execução iniciada no GitHub Actions, workflow 44633821811; resultado ainda pendente no momento desta atualização.


## Conclusão da implementação — previsão de faltas com Regressão Logística

### Implementação e integração
- Pull Request #6 integrado à branch `main` em 19/11/2026 pelo método Squash.
- Commit de integração: `9f43137de9e9ee007dc667561be4cacc104e2f93`.
- A AGENDA passa a incluir a 13ª coluna `Previsao_Regressao_Logistica`, independente do Status real, da previsão K-NN e do risco da Árvore de Decisão.
- O modelo utiliza resultados anteriores com Status `Compareceu` e `Faltou`, com mínimo de 20 amostras e pelo menos cinco por classe.
- A estimativa apresenta percentual e faixa de risco baixo, moderado ou alto. Não representa garantia nem probabilidade calibrada sem avaliação em dados separados.

### Validação automatizada
- Suíte completa: 83 testes aprovados e 0 falhas.
- Execução no push da branch: https://github.com/MiguelBona13/agendaservicos/actions/runs/44634571888.
- Execução no pull request: https://github.com/MiguelBona13/agendaservicos/actions/runs/44634581563.
- O teste de comparação entre categorias foi ajustado para manter o mesmo dia da semana nos exemplos, isolando o efeito da categoria de cliente. A codificação categórica também omite a categoria de referência para evitar colinearidade com o intercepto.

### Publicação no Google Apps Script
- Workflow de publicação: https://github.com/MiguelBona13/agendaservicos/actions/runs/44634668521.
- Publicação concluída com sucesso: 43 arquivos enviados, versão 57 criada e implantação existente atualizada.
- O manifesto e a configuração de publicação não precisaram ser alterados.
- `PROJECT_GUIDE.md` permaneceu inalterado.

### Arquivos criados
- `AgendamentoRegressaoLogisticaRules.gs` — características, treinamento e cálculo da probabilidade.
- `AgendamentoRegressaoLogisticaService.gs` — coordenação da previsão e persistência.
- `tests/AgendamentoRegressaoLogisticaRules.test.cjs` — testes unitários do modelo.

### Arquivos alterados
- `AgendamentoRepository.gs` — leitura, gravação e atualização da 13ª coluna.
- `AgendamentoKnnService.gs` — integração da regressão logística ao fluxo de consulta da agenda.
- `Index.html` — exibição da probabilidade de falta.
- `PROJECT_STATUS.md` — registro da conclusão.

### Arquivos mantidos e exclusões
- Mantidos K-NN, Árvore de Decisão, os serviços e regras centrais de Agendamento e os dez campos originais da agenda.
- Nenhum arquivo foi excluído.
- `PROJECT_GUIDE.md` não foi alterado.

### Como testar no ambiente funcional
1. Abrir a aplicação publicada e consultar a AGENDA.
2. Confirmar a existência da coluna `Previsao_Regressao_Logistica`.
3. Conferir agendamentos futuros quando houver histórico suficiente, observando percentual e faixa de risco.
4. Conferir que agendamentos concluídos, cancelados ou reagendados não recebem previsão ativa.
5. Confirmar que Status, K-NN e Árvore de Decisão permanecem independentes.
6. Comparar as previsões com resultados reais posteriores e avaliar calibração, falsos positivos e falsos negativos.

### Situação e próximo passo
- A implementação está integrada à `main` e publicada no Apps Script, versão 57.
- A validação funcional manual com a planilha real ainda não foi realizada.
- A avaliação de desempenho e calibração com dados históricos separados permanece pendente.


## Otimização incremental — persistência das previsões da agenda

### Análise
- A consulta `consultarAgendamentos()` executava os três classificadores em sequência.
- K-NN, Árvore de Decisão e Regressão Logística faziam gravações individuais por registro, aumentando o número de chamadas ao Google Sheets.
- A rotina de garantia de cabeçalhos também regravava os cinco títulos em todas as consultas, mesmo quando já estavam corretos.

### Alterações propostas nesta etapa
- Os três serviços calculam as previsões em memória, sem gravar individualmente.
- Ao final do fluxo, o Repository compara as três colunas com os valores existentes e persiste as alterações em uma única operação `setValues`.
- Cabeçalhos só são escritos quando o valor atual é diferente do esperado.
- Não foram alterados os algoritmos, os critérios de treinamento ou os textos das previsões.

### Arquivos alterados
- `AgendamentoRepository.gs` — verificação condicional de cabeçalhos e nova função de persistência em lote.
- `AgendamentoKnnService.gs` — coordena os três modelos e solicita uma única persistência ao final.
- `AgendamentoArvoreService.gs` — remove gravações individuais.
- `AgendamentoRegressaoLogisticaService.gs` — remove gravações individuais.
- `PROJECT_STATUS.md` — registro da otimização e validação.

### Arquivo criado
- `tests/AgendamentoRepositoryPrevisoes.test.cjs` — verifica gravação única, preservação de linhas, ausência de gravação quando não há mudanças e rejeição de linhas inválidas.

### Validação automatizada
- GitHub Actions: 86 testes aprovados e 0 falhas.
- Execução: https://github.com/MiguelBona13/agendaservicos/actions/runs/44636757849.

### Arquivos mantidos e exclusões
- Os três modelos e suas regras permanecem inalterados.
- Nenhum arquivo foi excluído.
- `PROJECT_GUIDE.md` permanece inalterado.

### Situação
- Alterações disponíveis na branch `perf/otimizar-carregamento-agenda`.
- Aguardando revisão e integração.
- Não publicada no Google Apps Script nesta etapa; a versão publicada permanece inalterada.

### Como validar após integração e publicação
1. Abrir a aba Agenda e medir o tempo até a tabela aparecer.
2. Atualizar a página e repetir a medição.
3. Conferir se as três colunas de previsão continuam preenchidas.
4. Conferir se status reais, cancelamentos e reagendamentos continuam com os textos esperados.
5. Comparar o tempo com a versão anterior usando quantidade semelhante de registros.


## Correção — erro ao formatar colunas tipadas na persistência em lote

### Diagnóstico
- Após o cadastro, a interface confirmou a gravação do agendamento, mas a consulta subsequente falhou.
- A mensagem do Google Sheets informa que não é permitido definir formato numérico em uma coluna configurada com tipo.
- Na implementação de persistência em lote, o Repository chamava `setNumberFormat("@")` sobre o intervalo das três colunas de previsão.
- Essa formatação é desnecessária para atualizar os textos das previsões e pode conflitar com colunas tipadas da planilha.

### Correção aplicada na branch de otimização
- Removida a chamada `setNumberFormat("@")` da gravação em lote.
- O Repository continua lendo as três colunas, comparando os valores e executando `setValues` apenas quando há diferenças.
- O formato e o tipo configurados na planilha são preservados.
- Adicionado ajuste ao teste unitário para não permitir dependência de formatação na persistência.

### Arquivos alterados
- `AgendamentoRepository.gs` — remove a redefinição de formato do intervalo de previsões.
- `tests/AgendamentoRepositoryPrevisoes.test.cjs` — teste da gravação em lote sem operação de formatação.
- `PROJECT_STATUS.md` — registro do diagnóstico e da correção.

### Situação
- Correção enviada à branch `perf/otimizar-carregamento-agenda`.
- Pull Request #7 permanece aberto; a correção ainda não está na `main`.
- Nenhuma nova versão foi publicada no Google Apps Script nesta etapa.
- O cadastro informado pelo usuário foi confirmado pela própria mensagem da interface; a falha ocorreu na consulta dos registros após a gravação.

### Como testar
1. Executar a suíte automatizada e confirmar a ausência de chamadas a `setNumberFormat` na gravação em lote.
2. Após integrar e publicar, criar um novo agendamento.
3. Confirmar que a mensagem de sucesso é exibida e que a lista é carregada sem erro.
4. Confirmar que as três colunas de previsão permanecem atualizadas e que os tipos/formatações da planilha não foram alterados.


### Complemento da correção de colunas tipadas
- A mesma redefinição de formato existia nos três métodos de atualização individual de previsão do K-NN, da Árvore e da Regressão Logística.
- As chamadas `setNumberFormat("@")` também foram removidas desses métodos. Eles passam a atualizar somente o valor, preservando o tipo da coluna.
- A gravação do cadastro e as demais colunas não foram modificadas.


## Conclusão — otimização e correção de colunas tipadas

### Integração
- Pull Request #7 integrado à `main` em 19/11/2026.
- Commit: `2e31f2e7035da28e4833fd6d812065c7ada1be5c`.
- A branch de trabalho foi incorporada pelo método Squash.

### Validação
- Suíte automatizada executada no commit integrado: sucesso.
- Execução: https://github.com/MiguelBona13/agendaservicos/actions/runs/44638545829.
- A correção remove as chamadas `setNumberFormat("@")` da persistência em lote e dos métodos individuais das três previsões.
- A persistência em lote preserva o formato/tipo existente e atualiza somente os valores necessários.

### Publicação
- Workflow: https://github.com/MiguelBona13/agendaservicos/actions/runs/44638545926.
- 43 arquivos enviados ao Apps Script.
- Versão 60 criada e implantação existente atualizada com sucesso.
- Commit publicado: `2e31f2e7035da28e4833fd6d812065c7ada1be5c`.

### Arquivos alterados
- `AgendamentoRepository.gs` — gravação em lote sem redefinir formato de colunas.
- `AgendamentoKnnService.gs` — coordenação dos três modelos e persistência única.
- `AgendamentoArvoreService.gs` — remove gravação individual no fluxo coordenado.
- `AgendamentoRegressaoLogisticaService.gs` — remove gravação individual no fluxo coordenado.
- `tests/AgendamentoRepositoryPrevisoes.test.cjs` — testes de persistência em lote sem formatação forçada.
- `PROJECT_STATUS.md` — atualização do estado real da integração e publicação.

### Arquivos criados e excluídos
- Criado nesta etapa: `tests/AgendamentoRepositoryPrevisoes.test.cjs`.
- Nenhum arquivo excluído.
- `PROJECT_GUIDE.md` permaneceu inalterado.

### Validação funcional pendente
- Criar um agendamento de teste e confirmar que a lista carrega sem erro.
- Conferir que as três colunas de previsão são atualizadas e que os tipos das colunas permanecem preservados.
- Medir o tempo de carregamento da agenda antes e depois da otimização.


## Etapa em andamento — CRUD de cadastros (Funcionários)

### Escopo geral
Implementar Criar, Consultar, Atualizar e Excluir (CRUD) nos cadastros de Funcionários, Serviços, Clientes, Cidades e Bairros, em etapas por entidade. Agendamentos já possuem criação, consulta, edição e cancelamento.

### Etapa concluída — Funcionários
- A inclusão e a consulta foram preservadas.
- Adicionada edição do nome do funcionário pela interface.
- Adicionada exclusão com confirmação.
- A exclusão é bloqueada quando há agendamentos associados, preservando o histórico.
- A geração do próximo código passou a consultar o Repository.
- As operações de inclusão, atualização e exclusão são coordenadas pelo Service e protegidas por LockService.
- A interface mantém o código imutável durante a edição.

### Arquivos criados
- `FuncionarioRepository.gs` — leitura, inclusão, atualização, verificação de vínculos e exclusão.
- `FuncionarioRules.gs` — regra para impedir exclusão com agendamentos vinculados.
- `FuncionarioValidator.gs` — validação de código e nome.
- `FuncionarioService.gs` — coordenação das operações CRUD.
- `tests/FuncionarioValidator.test.cjs`
- `tests/FuncionarioRules.test.cjs`
- `tests/FuncionarioService.test.cjs` — testes dos casos de uso do Service.

### Arquivos alterados
- `Funcionarios.js` — funções públicas legadas delegam ao Service.
- `Index.html` — ações Editar e Excluir e modo de edição do formulário de funcionários.
- `PROJECT_STATUS.md` — registro desta etapa.

### Arquivos mantidos
- `AgendamentoService.gs`, `AgendamentoRepository.gs`, `AgendamentoValidator.gs`, `AgendamentoRules.gs` e demais entidades não foram alterados nesta etapa.
- `PROJECT_GUIDE.md` permanece sem alterações.
- Nenhum arquivo foi excluído.

### Como testar
1. Executar `npm test).
2. Abrir a aba Funcionários e cadastrar um funcionário de teste.
3. Editar o nome e confirmar a atualização na lista.
4. Tentar excluir um funcionário sem agendamentos e confirmar a remoção.
5. Tentar excluir um funcionário vinculado a um agendamento e confirmar que o sistema bloqueia a operação.
6. Confirmar que o código sequencial continua sendo gerado corretamente.

### Próximas etapas
- Serviços: criar, listar, editar e excluir com bloqueio quando houver agendamentos vinculados.
- Clientes: criar, listar, editar e excluir com bloqueio quando houver agendamentos vinculados.
- Cidades: criar, listar, editar e excluir com bloqueio quando houver bairros vinculados.
- Bairros: criar, listar, editar e excluir com bloqueio quando houver clientes vinculados.
- Validar a integração das cinco entidades e os seletores usados pela agenda.


## Etapa incremental — primeira camada do CRUD de Serviços

### Análise realizada
- O cadastro antigo de Serviços validava os campos e gravava diretamente na aba SERVICOS.
- A interface ainda não possui formulário de criação/edição nem ações de exclusão para Serviços.
- A aba AGENDA armazena o código do serviço na sexta coluna; por isso, a exclusão deve ser bloqueada quando houver histórico vinculado.
- O fluxo existente de consulta genérica permanece preservado.

### Alterações realizadas nesta etapa
- Criadas as camadas ServicoValidator, ServicoRules, ServicoRepository e ServicoService.
- O Repository concentra leitura, inclusão, atualização e exclusão na aba SERVICOS, além da consulta de vínculos na AGENDA.
- O Service coordena operações com LockService, validação, verificação de duplicidade e proteção do histórico.
- O código do serviço permanece imutável durante a edição.
- Servicos.js mantém a função pública cadastrarServico e passa a delegar para ServicoService; também expõe funções de geração de código, atualização e exclusão para a próxima etapa da interface.
- Criados testes unitários para Validator, Rules e Service.

### Arquivos criados
- ServicoValidator.gs
- ServicoRules.gs
- ServicoRepository.gs
- ServicoService.gs
- tests/ServicoValidator.test.cjs
- tests/ServicoRules.test.cjs
- tests/ServicoService.test.cjs

### Arquivo alterado
- Servicos.js — funções legadas delegam à nova camada Service.

### Arquivos mantidos
- Index.html — ainda sem alterações; o formulário e as ações de Serviços serão adicionados em etapa própria.
- Consultas.js — consulta genérica preservada.
- Config.js e Utils.js — mantidos como dependências atuais.
- Nenhum arquivo foi excluído.

### Validação automatizada
- GitHub Actions: execução concluída com sucesso para o HEAD atual da PR.
- Execução: https://github.com/MiguelBona13/agendaservicos/actions/runs/44649434339
- Os testes desta etapa cobrem validação de código/nome/valor, valores decimais, bloqueio de exclusão com agendamentos e operações coordenadas pelo Service.

### Como testar
1. Executar npm test e confirmar que toda a suíte passa.
2. No Apps Script de teste, confirmar que servicoServiceGerarCodigo retorna o próximo código.
3. Cadastrar um serviço com nome e valor válidos e conferir a aba SERVICOS.
4. Tentar cadastrar código duplicado, valor vazio, texto não numérico e valor negativo; todos devem ser rejeitados.
5. Atualizar nome e valor e confirmar que o código não muda.
6. Tentar excluir um serviço referenciado na aba AGENDA e confirmar que a exclusão é bloqueada.
7. Excluir um serviço sem vínculo e confirmar a remoção.

### Pendências
- Adicionar formulário e ações de CRUD de Serviços à interface.
- Refatorar Clientes, Cidades e Bairros, incluindo integridade das referências entre cadastros.
- Revisar a entidade Funcionários e executar a suíte completa no HEAD final.
- Realizar testes integrados no Apps Script antes de integrar e publicar.

### Próximo passo
- Concluir a interface de Serviços e validar o fluxo ponta a ponta antes de iniciar a entidade seguinte.


## Conclusão da implementação — CRUD dos cinco cadastros (branch de trabalho)

### Escopo concluído na branch
Implementadas as operações de Criar, Consultar, Atualizar e Excluir (CRUD) para:
- Funcionários;
- Serviços;
- Clientes;
- Cidades;
- Bairros.

A implementação preserva os formulários e validações já existentes e mantém os códigos dos registros imutáveis durante a edição.

### Regras de integridade preservadas
- Funcionário: exclusão bloqueada quando há agendamentos vinculados.
- Serviço: exclusão bloqueada quando há agendamentos vinculados.
- Cliente: exclusão bloqueada quando há agendamentos vinculados.
- Cidade: exclusão bloqueada quando há bairros ou clientes vinculados.
- Bairro: exclusão bloqueada quando há clientes vinculados.
- Bairro: mudança de cidade bloqueada quando existem clientes associados ao bairro.
- Cliente: CPF, data de aniversário, número do endereço, cidade, bairro, CEP, celular, e-mail e status financeiro continuam validados. O bairro precisa pertencer à cidade selecionada.

### Arquitetura aplicada
- Interface (Index.html) chama funções públicas de compatibilidade.
- Services coordenam os casos de uso e utilizam LockService nas operações de escrita.
- Validators normalizam e validam os dados.
- Rules concentram as regras de integridade e exclusão.
- Repositories concentram leitura e escrita no Google Sheets.
- Consultas.js mantém as funções públicas de consulta, delegando as listagens e seletores aos Services/Repositories correspondentes.
- PROJECT_GUIDE.md não foi alterado.

### Arquivos criados
- CidadeService.gs
- CidadeRules.gs
- CidadeValidator.gs
- CidadeRepository.gs
- BairroService.gs
- BairroRules.gs
- BairroValidator.gs
- BairroRepository.gs
- ClienteRules.gs
- tests/CidadeValidator.test.cjs
- tests/CidadeRules.test.cjs
- tests/CidadeService.test.cjs
- tests/BairroValidator.test.cjs
- tests/BairroRules.test.cjs
- tests/BairroService.test.cjs
- tests/ClienteCrudValidator.test.cjs
- tests/ClienteRules.test.cjs
- tests/ClienteCrudService.test.cjs
- tests/IndexScriptSyntax.test.cjs

### Arquivos alterados
- Index.html — formulários de Serviços, Cidades e Bairros; edição e exclusão dos cinco cadastros; edição de clientes; ações de atualização das listas.
- Consultas.js — listagens e seletores delegados aos Repositories/Services.
- Clientes.js — preserva as funções públicas e delega o CRUD ao ClienteService.
- ClienteService.gs — mantém o envio de e-mail de teste e acrescenta os casos de uso CRUD.
- ClienteValidator.gs — mantém a validação do e-mail e acrescenta a validação completa do cadastro.
- ClienteRepository.gs — mantém a consulta de contato para e-mail e acrescenta persistência e consultas CRUD.
- Cidades.js — delega as operações públicas ao CidadeService.
- Bairros.js — delega as operações públicas ao BairroService.
- Servicos.js — delega as operações públicas ao ServicoService.
- ServicoRepository.gs — acrescenta consulta tabular para a interface.
- FuncionarioRepository.gs — acrescenta consulta tabular para a interface.
- CidadeRepository.gs, BairroRepository.gs e ClienteRepository.gs — acrescentam consulta tabular e mantêm acesso à planilha centralizado.
- PROJECT_STATUS.md — registro desta etapa.

### Arquivos mantidos
- Funcionarios.js, FuncionarioService.gs, FuncionarioRules.gs e FuncionarioValidator.gs — implementação anterior de Funcionários preservada.
- ServicoService.gs, ServicoRules.gs e ServicoValidator.gs — camadas implementadas na etapa anterior preservadas.
- Config.js e Utils.js — mantidos como configuração e acesso compartilhado à planilha.
- AgendamentoService.gs, AgendamentoRules.gs, AgendamentoValidator.gs, AgendamentoRepository.gs, Agenda.js e os arquivos de e-mail, WhatsApp e previsões — não alterados nesta etapa.
- ClienteService.gs continua oferecendo o envio de e-mail de teste.
- Nenhum arquivo foi excluído.

### Validação automatizada
- GitHub Actions executado no HEAD da branch: sucesso.
- Execução: https://github.com/MiguelBona13/agendaservicos/actions/runs/44651602918
- Resultado: 125 testes aprovados e 0 falhas no HEAD 32da0de9256208f265ccf62de3ca7e4208a96858.
- A suíte inclui validações e regras das entidades, testes de Services e verificação sintática do JavaScript embutido em Index.html.

### Como testar no ambiente integrado
1. Atualizar o projeto de teste no Google Apps Script com os arquivos desta branch, sem alterar a implantação de produção.
2. Confirmar que as abas FUNCIONARIOS, SERVICOS, CLIENTES, CIDADES, BAIRROS e AGENDA possuem os cabeçalhos e a ordem de colunas atuais.
3. Em cada cadastro, criar um registro de teste, atualizar seus dados e conferir a tabela e a planilha.
4. Tentar excluir funcionário, serviço e cliente com agendamentos vinculados; as três operações devem ser bloqueadas.
5. Tentar excluir cidade com bairros ou clientes vinculados; a operação deve ser bloqueada.
6. Tentar excluir bairro com clientes vinculados ou mudar sua cidade; as operações devem ser bloqueadas.
7. Excluir registros de teste sem vínculos e confirmar a remoção.
8. Cadastrar e editar cliente com CPF, data, CEP, celular, e-mail e bairro/cidade válidos; testar também dados inválidos e CPF duplicado.
9. Abrir a Agenda e confirmar que os seletores de funcionários, clientes, serviços, cidades e bairros continuam carregando corretamente.
10. Testar o envio de e-mail de teste ao cliente e a criação/edição/cancelamento de agendamentos para confirmar que as funcionalidades preexistentes permanecem disponíveis.

### Situação de integração e publicação
- PR #8: https://github.com/MiguelBona13/agendaservicos/pull/8
- Branch: feat/crud-cadastros-incremental.
- HEAD validado: 32da0de9256208f265ccf62de3ca7e4208a96858.
- PR permanece aberta como rascunho; não foi integrada à main.
- Nenhuma publicação no Google Apps Script foi executada nesta etapa.
- A versão de produção permanece na versão 60, conforme último registro confirmado antes desta PR.

### Pendências antes de integrar/publicar
- Executar testes integrados no projeto de teste do Google Apps Script com uma cópia controlada da planilha.
- Conferir o comportamento real de edição e exclusão com dados de teste e vínculos existentes.
- Revisar a PR após os testes integrados.
- Somente então retirar o rascunho, integrar e executar o workflow de publicação.

### Próximo passo
- Executar a bateria de testes integrados em ambiente de teste e revisar a PR #8 antes da integração.


## Etapa em andamento — Dashboard de Deep Learning para previsão de novos agendamentos

### Objetivo
Integrar ao sistema um dashboard educacional que estima a quantidade diária de novos agendamentos com uma rede neural MLP, usando a data de cadastro dos registros.

### Implementação realizada na branch
- Criado o módulo de regras com série diária contínua, preenchimento de dias sem cadastros com zero, atributos cíclicos de dia da semana e média móvel.
- Implementada uma rede MLP com uma camada oculta, ativação configurável (tanh ou ReLU), saída linear, normalização baseada exclusivamente no conjunto de treinamento e retropropagação com atualização de pesos e vieses.
- Treinamento reproduzível por semente aleatória.
- Divisão cronológica entre treinamento e validação.
- Métricas MAE da rede e da média histórica.
- Avaliação adicional de horizonte por origens móveis, com previsões recursivas e uso das previsões anteriores como entradas dos passos seguintes.
- Previsões futuras não negativas e tabela com valores decimais, arredondados e média da janela.
- Repository identifica a coluna de data de cadastro por cabeçalho, tolerando acentos, caixa, espaços e variações com/sem a preposição “de”.
- Leitura somente; o módulo não cria abas, não grava colunas e não altera dados existentes.
- Dashboard integrado ao menu atual, com parâmetros configuráveis, indicadores, quatro gráficos em canvas e tabela de previsões.
- Mensagens explícitas para histórico insuficiente, cabeçalho ausente e parâmetros ainda não aplicados.

### Arquivos criados
- `AgendamentoDeepLearningRules.gs` — preparação da série, MLP, treinamento, avaliação e previsão recursiva.
- `AgendamentoDeepLearningValidator.gs` — validação dos parâmetros.
- `AgendamentoDeepLearningRepository.gs` — leitura adaptativa da data de cadastro e diagnóstico da qualidade dos registros.
- `AgendamentoDeepLearningService.gs` — coordenação do diagnóstico, treinamento e previsão.
- `tests/AgendamentoDeepLearningRules.test.cjs`
- `tests/AgendamentoDeepLearningRepository.test.cjs`
- `tests/AgendamentoDeepLearningService.test.cjs`

### Arquivos alterados
- `Index.html` — nova opção de navegação, painel de parâmetros, indicadores, gráficos e tabela.
- `PROJECT_STATUS.md` — registro desta etapa.

### Arquivos mantidos
- Os modelos existentes K-NN, Árvore de Decisão e Regressão Logística permanecem independentes e sem alterações.
- `AgendamentoService.gs`, `AgendamentoRepository.gs`, cadastro, cancelamento, edição, bot e integração com Gmail permanecem sem alterações nesta etapa.
- `PROJECT_GUIDE.md` permanece inalterado.
- Nenhum arquivo foi excluído.

### Validação automatizada
- GitHub Actions: 138 testes aprovados e 0 falhas.
- Execução: https://github.com/MiguelBona13/agendaservicos/actions/runs/45525394881
- O teste de sintaxe do JavaScript embutido em `Index.html` também passou.

### Limitações e pendências
- Na etapa inicial, a planilha real ainda não havia sido disponibilizada. Essa pendência foi parcialmente resolvida com a exportação `Agenda de Servicos.xlsx`, analisada em 24/11/2026; a validação cobre o arquivo exportado, não uma conexão ao vivo com o Google Sheets.
- O teste automatizado usa dados simulados e não substitui a validação integrada com a planilha real e o Apps Script.
- O treinamento é executado sob demanda no servidor; o modelo treinado não é persistido entre recargas da página.
- A interface ainda precisa ser verificada visualmente no navegador e em telas móveis.
- A publicação no Apps Script e a integração à `main` não foram executadas.

### Como testar após revisão e implantação em ambiente de teste
1. Executar `npm test` e confirmar os 138 testes.
2. Implantar a branch em um projeto Apps Script de teste conectado a uma cópia da planilha.
3. Abrir **Deep Learning** no menu e conferir se o Repository localiza o cabeçalho de data de cadastro correto.
4. Confirmar que a data do atendimento não é utilizada como data de cadastro.
5. Verificar dias sem cadastros, registros duplicados, datas vazias e inválidas.
6. Treinar com os parâmetros padrão e confirmar os indicadores, a curva de erro, a validação e as previsões futuras.
7. Alterar parâmetros, confirmar o aviso de modelo desatualizado e treinar novamente.
8. Comparar MAE de um passo e MAE do horizonte recursivo; não presumir que a rede supera a média.
9. Confirmar que nenhuma aba, coluna ou registro existente foi alterado.
10. Regressar as telas de cadastros e Agenda para confirmar que continuam funcionando.

### Situação de integração
- Branch: `feat/dashboard-deep-learning`.
- Implementação disponível para revisão; não integrada à `main`.
- Nenhuma publicação no Google Apps Script foi executada.
- Nenhum arquivo antigo foi considerado obsoleto ou recomendado para exclusão.

### Próximo passo
- Executar teste integrado com uma cópia da planilha real, revisar o dashboard no navegador e então decidir a integração da branch e a publicação no Apps Script.


## Validação com a exportação real da planilha — 24/11/2026

### Fonte analisada
- Arquivo recebido na conversa: `Agenda de Servicos.xlsx`.
- Abas encontradas: FUNCIONARIOS, SERVICOS, CLIENTES, AGENDA, Historico_Diario, Neoronio, CIDADES, BAIRROS, PERIODOS e Configurações.
- A aba de dados correta é `AGENDA`; o cabeçalho `Data_Cadastro` está na coluna J.
- A aba `Historico_Diario` contém 324 dias consecutivos, de 31/12/2025 a 19/11/2026.

### Qualidade e consistência
- 202 linhas de agendamentos.
- 202 códigos únicos; nenhuma duplicidade.
- Nenhuma data de cadastro vazia ou inválida.
- 202 registros contabilizados.
- A contagem diária derivada de `AGENDA.Data_Cadastro` coincide com `Historico_Diario.Novos agendamentos` em todos os 324 dias.
- 182 dias sem novos cadastros e 142 dias com cadastros.
- Total: 202 novos agendamentos; média diária: 0,6235; máximo diário: 3.
- O arquivo termina em 19/11/2026. Como a análise ocorreu em 24/11/2026, os dados exportados estão cinco dias atrás da data corrente e as previsões calculadas a partir do arquivo são apenas uma simulação histórica, não uma previsão atualizada para implantação.

### Teste preliminar do modelo com os dados exportados
- Parâmetros padrão: 5 neurônios ocultos, 500 épocas, taxa 0,05, janela 7, 80% treino, ativação tanh, semente 12345 e horizonte 10 dias.
- Amostras supervisionadas: 317; treino: 253; validação: 64.
- MAE de um passo: rede 0,7322; média histórica 0,6997. A rede não superou a referência neste teste.
- Backtest recursivo de 10 dias: rede 0,6335; média histórica 0,6877; 55 origens avaliadas. Resultado favorável à rede nesta avaliação específica, ainda sem garantia de generalização.
- Os números são uma execução local reproduzindo as regras e parâmetros do código; não representam execução integrada no Apps Script.

### Correção incremental após análise
- `AgendamentoDeepLearningRules.gs` agora treina um modelo final adicional com todas as amostras históricas depois de calcular as métricas de validação. Assim, os 20% reservados à validação continuam fora da avaliação, mas podem ser aproveitados no modelo usado para previsões futuras.
- `diasTreinamentoFinal` informa quantas amostras foram usadas no ajuste final.
- `tests/AgendamentoDeepLearningRules.test.cjs` verifica que o modelo final utiliza toda a série supervisionada disponível.
- GitHub Actions: 138 testes aprovados, 0 falhas.
- Execução: https://github.com/MiguelBona13/agendaservicos/actions/runs/45526091396

### Arquivos alterados nesta correção
- `AgendamentoDeepLearningRules.gs` — ajuste final com o histórico completo, sem alterar a validação temporal.
- `tests/AgendamentoDeepLearningRules.test.cjs` — teste da quantidade de amostras usadas no modelo final.
- `PROJECT_STATUS.md` — registro da validação com o arquivo real.

### Arquivos mantidos
- `Agenda de Servicos.xlsx` foi apenas lido; nenhuma célula ou aba foi alterada.
- Nenhum arquivo da aplicação principal, dos modelos K-NN/Árvore/Regressão Logística ou do `PROJECT_GUIDE.md` foi modificado nesta correção.
- Nenhum arquivo foi excluído.

### Pendências para concluir a integração
- Atualizar/obter uma exportação mais recente, pois a atual termina em 19/11/2026.
- Executar no Apps Script de teste conectado à planilha real e conferir o diagnóstico apresentado pelo Repository.
- Verificar o dashboard visualmente em desktop e celular.
- Medir o tempo de treinamento com os dados do ambiente real.
- Após testes integrados, revisar a PR e decidir integração à `main` e publicação no Apps Script.

### Próximo passo
- Fazer teste integrado em uma cópia controlada da planilha; não publicar em produção antes dessa verificação.


## Evolução da rede — duas camadas ocultas (25/11/2026)

### Objetivo
Evoluir a MLP anterior, que possuía uma camada oculta, para uma rede com duas camadas ocultas conectadas em sequência. A quantidade configurada no dashboard representa o número de neurônios em cada uma das duas camadas.

### Análise e implementação
- A rede anterior tinha somente uma camada oculta; por isso, era uma MLP rasa e não atendia à intenção de usar uma arquitetura com múltiplas camadas ocultas.
- `AgendamentoDeepLearningRules.gs` agora cria duas camadas ocultas, cada uma com a quantidade de neurônios configurada.
- A passagem direta propaga os valores pelas duas camadas.
- A retropropagação calcula os gradientes da camada de saída e das duas camadas ocultas antes de atualizar seus pesos e vieses.
- A inicialização dos pesos usa limites calculados conforme as dimensões de cada camada.
- A normalização, divisão temporal, avaliação sem vazamento e ajuste final com todo o histórico foram preservados.
- `Index.html` esclarece que o parâmetro de neurônios se aplica a cada camada oculta.

### Arquivos alterados
- `AgendamentoDeepLearningRules.gs` — arquitetura de duas camadas ocultas e retropropagação correspondente.
- `tests/AgendamentoDeepLearningRules.test.cjs` — teste da estrutura, dimensões, passagem direta e treinamento das duas camadas.
- `Index.html` — rótulo e explicação do parâmetro de neurônios.
- `PROJECT_STATUS.md` — registro desta evolução.

### Validação automatizada
- GitHub Actions: 139 testes aprovados e 0 falhas.
- Execução: https://github.com/MiguelBona13/agendaservicos/actions/runs/45526835335.
- O teste de sintaxe da interface também foi executado no mesmo workflow.

### Reavaliação com a exportação real
Com os parâmetros padrão e a exportação analisada anteriormente (324 dias até 19/11/2026), a rede de duas camadas apresentou:
- MAE de um passo: 0,8212 para a rede e 0,6997 para a média histórica.
- MAE no backtest recursivo de 10 dias: 0,7490 para a rede e 0,6877 para a média histórica, em 55 origens.
- Nesta configuração e nesta série, a rede profunda não superou a referência de média histórica nas duas métricas. Portanto, a implementação comprova a mudança arquitetural, mas não comprova vantagem preditiva. Os valores precisam ser reavaliados com dados atualizados e eventual ajuste de hiperparâmetros, sem escolher parâmetros apenas para favorecer o resultado.

### Arquivos mantidos e exclusões
- Os modelos K-NN, Árvore de Decisão e Regressão Logística permanecem intocados.
- Repository, Service e Validator do dashboard foram mantidos.
- Nenhum arquivo foi excluído.
- `PROJECT_GUIDE.md` não foi alterado.
- A exportação Excel foi somente lida; nenhuma célula ou aba foi modificada.

### Como testar
1. Executar `npm test` e confirmar 139 testes aprovados.
2. Abrir o dashboard no projeto Apps Script de teste.
3. Treinar com os parâmetros padrão e conferir o histórico de erro, métricas e previsões.
4. Alterar a quantidade de neurônios e confirmar que ambas as camadas usam a nova dimensão.
5. Conferir o funcionamento com as ativações tanh e ReLU.
6. Verificar o dashboard em desktop e celular e medir o tempo de execução no Apps Script.
7. Confirmar que nenhuma aba ou coluna da planilha foi alterada.

### Situação e próximo passo
- Alterações enviadas à branch `feat/dashboard-deep-learning`, na PR #9.
- PR continua aberta; não integrada à `main`.
- Nenhuma publicação no Google Apps Script foi realizada.
- Próximo passo: executar a validação integrada em cópia controlada da planilha e revisão visual; só depois decidir integração e publicação.


---

## Atualização — CRUD da entidade Período (Etapa 1: Repository)

### Objetivo
Iniciar a implementação do CRUD de períodos sem alterar o contrato utilizado pelos agendamentos existentes.

### Concluído
- Criado `PeriodoRepository.gs` para centralizar leitura e persistência na aba `PERIODOS`.
- Implementadas operações de listagem, busca por código, obtenção do maior código, inclusão, atualização, localização de linha, verificação de vínculos com a agenda, exclusão e consulta tabular.
- A verificação de vínculos considera qualquer registro da aba `AGENDA`, inclusive histórico e agendamentos cancelados.
- A função pública `consultarPeriodos()` foi preservada em `Consultas.js`, mas agora delega a leitura ao novo Repository.
- `AgendamentoRepository.gs` passou a reutilizar `periodoRepositoryListar()` no carregamento de cadastros para importação por e-mail, removendo a leitura duplicada da aba `PERIODOS`.
- Criado teste automatizado para as operações do novo Repository.
- Adaptado o teste de integração do repositório de agendamentos para carregar o Repository de períodos.

### Arquivos criados
- `PeriodoRepository.gs`
- `tests/PeriodoRepository.test.cjs`

### Arquivos alterados
- `Consultas.js`
- `AgendamentoRepository.gs`
- `tests/AgendamentoRepositoryEmail.test.cjs`

### Arquivos mantidos
- `AgendamentoService.gs` — permanece utilizando a função pública `consultarPeriodos()`.
- `Index.html` — interface ainda não foi alterada.
- `Config.js` — já possui a constante `CONFIG.ABAS.PERIODOS`.
- `PROJECT_GUIDE.md` — mantido sem alterações.

### Arquivos removidos
- Nenhum.

### Validação
- Os testes automatizados foram adicionados, mas ainda precisam ser executados no ambiente local do projeto.
- A revisão do código confirmou que `Consultas.js` e `AgendamentoRepository.gs` não fazem mais leitura direta da aba `PERIODOS`.
- A interface e os fluxos existentes ainda precisam ser testados após a implementação das próximas camadas.

### Próximo passo
Implementar as camadas `PeriodoValidator.gs`, `PeriodoRules.gs` e `PeriodoService.gs`, incluindo as regras de validação, geração de código e bloqueio de exclusão quando houver agendamentos vinculados. Depois, integrar a aba PERIODOS à interface.
