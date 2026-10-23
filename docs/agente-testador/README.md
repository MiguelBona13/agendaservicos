# Agente Testador — Agenda de Serviços

Esta pasta documenta as instruções e o roteiro de validação do agente de IA usado para revisar código do projeto Agenda de Serviços.

## Arquivos

- [INSTRUCOES.md](./INSTRUCOES.md): comportamento esperado, contexto do projeto, critérios de análise e formato do parecer.
- [ROTEIRO_DE_TESTES.md](./ROTEIRO_DE_TESTES.md): testes de aceitação para verificar se o agente detecta defeitos e respeita as regras do projeto.

## Como configurar no ChatGPT

1. Crie um GPT personalizado com o nome **Agente Testador — Agenda de Serviços**.
2. Copie o conteúdo de [INSTRUCOES.md](./INSTRUCOES.md) para o campo de instruções do GPT.
3. Se possível, adicione `PROJECT_GUIDE.md` e `PROJECT_STATUS.md` ao conhecimento do GPT. Confira esses documentos novamente quando forem atualizados no repositório.
4. Use o roteiro em [ROTEIRO_DE_TESTES.md](./ROTEIRO_DE_TESTES.md) para testar o comportamento do agente.
5. Forneça os arquivos ou trechos de código que deseja analisar e peça um parecer, sem autorizar alterações automaticamente.

## Limitação importante

Versionar estes documentos no GitHub não cria nem publica automaticamente um GPT personalizado. A configuração do GPT continua sendo feita na interface do ChatGPT. Este repositório guarda uma cópia rastreável das instruções e dos testes, para facilitar manutenção e colaboração.

## Regras de uso

- Leia `PROJECT_GUIDE.md` antes de propor mudanças estruturais.
- Leia `PROJECT_STATUS.md` antes de continuar uma implementação.
- Não afirme que testes foram executados sem evidência.
- Preserve a arquitetura e as funcionalidades existentes.
