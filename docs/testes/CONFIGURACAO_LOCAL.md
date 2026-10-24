# Configurar testes automáticos antes do commit

Este procedimento ativa o hook local do Git para executar `npm test` antes de cada commit.

## Pré-requisitos

- Node.js e npm instalados.
- Git instalado.
- Dependências/configurações do projeto já disponíveis localmente.
- Os testes passam ao executar `npm test`.

## Configuração no Windows

Abra o Git Bash ou o terminal usado para os comandos Git, entre na pasta do repositório e execute:

```bash
git pull
git config core.hooksPath .githooks
npm test
```

O comando `git config core.hooksPath .githooks` configura o repositório local para procurar os hooks na pasta versionada `.githooks`. Essa configuração é local à cópia do repositório e precisa ser feita uma vez em cada clone.

## Como validar

1. Faça uma alteração pequena e segura em um arquivo de teste ou código.
2. Adicione a alteração com `git add`.
3. Execute `git commit -m "teste do hook automático"`.
4. Confira se a mensagem de execução dos testes aparece antes da criação do commit.

Se os testes falharem, o hook deve cancelar o commit. Corrija o problema e tente novamente.

## Importante

- O hook local é uma proteção adicional; não substitui o GitHub Actions.
- O GitHub Actions continua executando os testes depois do push e em pull requests compatíveis com os caminhos configurados.
- Hooks locais podem ser ignorados por alguém que use opções como `git -c core.hooksPath=/dev/null commit`; por isso, a verificação no GitHub é necessária.
- Este conjunto de testes cobre regras isoladas de agendamento e não confirma a integração real com Google Apps Script ou Google Sheets.
