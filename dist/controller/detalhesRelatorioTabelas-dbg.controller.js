sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"application/model/formatter",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV"

], function(BaseController, MessageBox, ExportTypeCSV, Export) {
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
			oProdutosTemplate = "";
			oItemTabPrecoTemplate = "";
			oItemContrato = "";
			oProdutosTemplateGrid = "";
			substItem = "";
			filtroGrid = "";
			oProdutosTemplateGridAux = "";
			this.byId("idtablePrecos").setGrowingTriggerText("Próximo >>>");
	
			oProdutosTemplate = [];
			oItemTabPrecoTemplate = [];
			oItemContrato = [];
			oProdutosTemplateGrid = [];
			substItem = [];
			filtroGrid = [];
			oProdutosTemplateGridAux = [];
			
			var possueContrato = false;
			that.byId("idtablePrecos").setBusy(true);

			var cliente = this.getOwnerComponent().getModel("modelRelatorioTabela").getProperty("/cliente");
			var estabelecimento = this.getOwnerComponent().getModel("modelRelatorioTabela").getProperty("/estabelecimento");
			var origEstabel = that.getOwnerComponent().getModel("modelRelatorioTabela").getProperty("/origEstabel");

			var oModel = new sap.ui.model.json.JSONModel(oProdutosTemplateGridAux);
			this.getOwnerComponent().setModel(oModel, "produtoRenatorio");

			oModel = new sap.ui.model.json.JSONModel(oProdutosTemplateGrid);
			this.getOwnerComponent().setModel(oModel, "relatorioTabelas");

		}
	});
});