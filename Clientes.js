/**
 * Entidade: Cliente
 * Camada: Interface legada — compatibilidade pública.
 * Responsabilidade: preservar os nomes de funções usados pela interface e delegar
 * operações de cadastro às camadas ClienteService, ClienteValidator e ClienteRepository.
 */
/** Retorna o próximo código sequencial. @return {string} Código. */
function gerarCodigoCliente(){return clienteServiceGerarCodigo();}
/** Mantém a assinatura pública anterior do formulário de clientes. */
function cadastrarCliente(codigo,nome,cpf,dataAniversario,numero,codigoCidade,codigoBairro,cep,celular,email,statusFinanceiro){
  return clienteServiceCriarCadastro({codigo,nome,cpf,dataAniversario,numero,codigoCidade,codigoBairro,cep,celular,email,statusFinanceiro});
}
/** Atualiza cadastro completo sem trocar código. @param {Object} dados Dados. */
function atualizarCliente(dados){return clienteServiceAtualizarCadastro(dados);}
/** Exclui cliente sem histórico de agendamentos. @param {string} codigo Código. */
function excluirCliente(codigo){return clienteServiceExcluirCadastro(codigo);}
/** Compatibilidade para consumidores legados da validação de CPF. @param {string} cpf CPF. @return {boolean} Validade. */
function validarCPF(cpf){return clienteValidatorCpfValido(String(cpf||"").replace(/\D/g,""));}
