sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"application/model/formatter",
	"sap/ui/core/util/MockServer",
	"sap/ui/export/library",
	"sap/ui/export/Spreadsheet",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/m/MessageBox"

], function (BaseController, JSONModel, MessageBox, formatter, MockServer, exportLibrary, Spreadsheet, ODataModel) {
	"use strict";

	var oProdutosTemplate = [];
	var oItemTabPrecoTemplate = [];
	var oItemContrato = [];
	var oProdutosTemplateGrid = [];
	var substItem = [];
	var filtroGrid = [];
	var oProdutosTemplateGridAux = [];
	return BaseController.extend("application.controller.detalhesRelatorioTabelas", {

		onInit: function() {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("detalhesRelatorioTabelas").attachPatternMatched(this._onLoadFields, this);
		},

		_handleValueHelpSearch: function(oEvent) {
			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("ProdutoId", sap.ui.model.FilterOperator.Contains, sValue), new sap.ui.model.Filter(
				"Descricao", sap.ui.model.FilterOperator.Contains, sValue)];
			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("idProdutoRelatorio").getBinding("suggestionItems").filter(aFilters);
			this.byId("idProdutoRelatorio").suggest();
		},

		onItemChange: function(oEvent) {
			
			filtroGrid = [];
			var codItemSelecionado = oEvent.getSource().getValue();

			var oModel = new sap.ui.model.json.JSONModel(filtroGrid);
			this.getOwnerComponent().setModel(oModel, "relatorioTabelas");

			for (var i = 0; i < oProdutosTemplateGrid.length; i++) {
				if (codItemSelecionado == oProdutosTemplateGrid[i].ProdutoId) {
					filtroGrid.push(oProdutosTemplateGrid[i]);
				}
			}
			if (codItemSelecionado == "") {
				oModel = new sap.ui.model.json.JSONModel(oProdutosTemplateGridAux);
				this.getOwnerComponent().setModel(oModel, "relatorioTabelas");

			} else {
				oModel = new sap.ui.model.json.JSONModel(filtroGrid);
				this.getOwnerComponent().setModel(oModel, "relatorioTabelas");

			}
		},

		_onLoadFields: function() {
			
			var that = this;

			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			var vAux = {
				Centro: that.getModelGlobal("modelTela").getProperty("/Werks"),
				Cliente: that.getModelGlobal("modelTela").getProperty("/Kunnr"),
				TabPreco: that.getModelGlobal("modelTela").getProperty("/Pltyp"),
				Indice: that.getModelGlobal("modelTela").getProperty("/Indice"),
				Frete: that.getModelGlobal("modelTela").getProperty("/Inco1"),
				Exibicao: that.getModelGlobal("modelTela").getProperty("/Exibicao")
			};

			var omodelParametros = new JSONModel(vAux);
			that.setModel(omodelParametros, "modelParametros");
			
			that.vetorTabPrecoExcel = [];
			var oModelTabPrecoExcel = new JSONModel(that.vetorTabPrecoExcel);
			that.setModel(oModelTabPrecoExcel, "modelTabPrecoExcel");

			var parametros = that.getModel("modelParametros").getData();
			
			that.byId("master").setBusy(true);

			that.oModel.read("/P_RelTabPreco", {
				urlParameters: {

					"$filter": "Usuario eq '" + repres +
						"' and Centro eq '" + parametros.Centro +
						"' and Cliente eq '" + parametros.Cliente +
						"' and TabPreco eq '" + parametros.TabPreco +
						"' and Indice eq " + parametros.Indice +
						" and Frete eq '" + parametros.Frete + 
					    "' and Exibicao eq '" + parametros.Exibicao + "'"
				},
				success: function (retorno) {

					that.vetorTabPreco = retorno.results;
					
					that.byId("master").setBusy(false);
					that.getModel("modelTabPreco").setData(that.vetorTabPreco);
					that.getModel("modelTabPrecoExcel").setData(that.vetorTabPrecoExcel);
				},
				error: function (error) {
					that.byId("master").setBusy(false);
					that.onMensagemErroODATA(error);
				}
			});
		}
	});
});