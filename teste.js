function testeCodigoExiste() {
  Logger.log(
    codigoExiste(CONFIG.ABAS.FUNCIONARIOS, "001")
  );
}

function testeCidadeSemEstado() {
  cadastrarCidade("002", "Dourados", "");
}