# PROJECT_STATUS.md — Status do Projeto Agenda de Serviços

## Versão atual
Refatoração estrutural da entidade Agendamento preparada para instalação; testes integrados pendentes.

## Etapa atual
Consolidação das responsabilidades de Agendamento nas camadas Service, Rules, Validator e Repository.

## Concluído nesta entrega
- `AgendamentoService.gs` coordena criação e cancelamento.
- `AgendamentoRules.gs` contém a regra de conflito e normalização de data.
- `AgendamentoValidator.gs` valida os dados básicos do cadastro e o cancelamento.
- `AgendamentoRepository.gs` concentra as operações específicas de leitura e gravação da agenda e a busca do valor do serviço.
- `Agenda.js` mantém os pontos de entrada usados pela interface e delega o cadastro ao Service.
- `Consultas.js` foi ajustado para usar a função de normalização em `AgendamentoRules.gs`, evitando dependência de uma função removida da interface antiga.

## Arquitetura pretendida
Interface → Service → Rules / Validator → Repository → Google Sheets

## Arquivos criados
- `AgendamentoRules.gs` (introduzido na etapa anterior).

## Arquivos alterados nesta entrega
- `AgendamentoService.gs`
- `Agenda.js`
- `Consultas.js`

## Arquivos mantidos
- `AgendamentoValidator.gs`
- `AgendamentoRepository.gs`
- os demais arquivos existentes do projeto.

## Arquivos que podem ser excluídos
- Nenhum recomendado nesta fase. `Utils.js` ainda é usado por outros fluxos e o código de períodos permanece em `Consultas.js`.

## Pendências e ressalvas
- A entrega foi preparada com base no pacote `Fontes_etapa2_rules.zip`, não em uma exportação posterior do projeto já instalado.
- Testes no Google Apps Script ainda precisam ser executados; portanto, a refatoração não deve ser considerada validada em produção.
- O acesso a períodos e a verificação da existência de funcionários/clientes ainda usam funções compartilhadas existentes (`consultarPeriodos()` e `codigoExiste()`). Uma migração adicional para repositórios específicos pode ser feita depois de validar esta versão.

## Como testar
1. Fazer uma cópia de segurança dos arquivos atuais.
2. Substituir os arquivos indicados no pacote.
3. Criar um agendamento válido.
4. Tentar reservar o mesmo período para o mesmo funcionário.
5. Tentar reservar o mesmo período para o mesmo cliente.
6. Cancelar um agendamento e confirmar que o horário fica disponível.
7. Tentar cancelar novamente o mesmo código.
8. Consultar a agenda e confirmar que datas e status continuam aparecendo corretamente.

## Próximo passo
Executar os testes integrados e corrigir eventuais diferenças antes de excluir ou migrar qualquer arquivo adicional.


---

## Registro adicional — Documentação do Agente Testador

### Concluído
- Criada a documentação do agente de IA para revisar e testar código do Agenda de Serviços.
- Registrado o roteiro de testes de aceitação do agente.
- Documentado como configurar as instruções em um GPT personalizado no ChatGPT.

### Arquivos criados
- `docs/agente-testador/INSTRUCOES.md`
- `docs/agente-testador/ROTEIRO_DE_TESTES.md`
- `docs/agente-testador/README.md`

### Arquivos alterados
- `PROJECT_STATUS.md` — registro desta entrega documental.

### Arquivos mantidos
- Todos os arquivos da aplicação e os documentos existentes foram mantidos sem alteração nesta etapa.

### Arquivos que podem ser excluídos
- Nenhum.

### Validação
- Confirmada a criação dos três documentos no repositório GitHub.
- O roteiro descreve testes para erro aritmético conhecido, falta de contexto, respeito à arquitetura, preservação de funcionalidades e honestidade sobre testes.
- O agente personalizado ainda precisa ser configurado na interface do ChatGPT e validado executando o roteiro.

### Próximo passo
- Criar/configurar o GPT personalizado usando `docs/agente-testador/INSTRUCOES.md`.
- Executar os cenários de `docs/agente-testador/ROTEIRO_DE_TESTES.md` e registrar os resultados.
