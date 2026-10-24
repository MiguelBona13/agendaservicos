function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("Agenda de atendimento");
}
