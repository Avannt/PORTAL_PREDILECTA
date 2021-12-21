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
	var EdmType = exportLibrary.EdmType;
	
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
		
		createColumnConfig: function () {
			var aCols = [];

			aCols.push({
				label: "Material",
				property: "Matnr",
				type: EdmType.String
			});

			aCols.push({
				label: "Descrição",
				property: "Maktx",
				type: EdmType.String
			});
			
			aCols.push({
				label: "Categoria",
				property: "Mvgr1",
				type: EdmType.String
			});
			
			aCols.push({
				label: "Descrição Categoria",
				property: "Mvgr1Text",
				type: EdmType.String
			});
			
			aCols.push({
				label: "SubCategoria",
				property: "Mvgr2",
				type: EdmType.String
			});
			
			aCols.push({
				label: "Descrição SubCategoria",
				property: "Mvgr2Text",
				type: EdmType.String
			});
			
			aCols.push({
				label: "Família",
				property: "Mvgr3",
				type: EdmType.String
			});
			
			aCols.push({
				label: "Descrição Família",
				property: "Mvgr3Text",
				type: EdmType.String
			});
			
			aCols.push({
				label: "Pallet",
				property: "QntPallet",
				type: EdmType.Integer
			});

			aCols.push({
				label: "CXs",
				property: "QntCaixa",
				type: EdmType.String
			});

			aCols.push({
				label: "Preço Bruto",
				property: "ValPrecoVenda",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});
			
			aCols.push({
				label: "%Canal",
				property: "PercCanal",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});
			
			aCols.push({
				label: "%Promocional",
				property: "PercPromoMax",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});
			
			aCols.push({
				label: "Preço Líquido",
				property: "ValLiqItem",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});
			
			aCols.push({
				label: "Preço c/ST",
				property: "ValPrecoUnitSt",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});
			
			aCols.push({
				label: "%ST",
				property: "PerSubTri",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});
			
			aCols.push({
				label: "%Contrato",
				property: "PctDescContrato",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			return aCols;
		},
		
		onExport: function () {
			var aCols, oRowBinding, oSettings, oSheet, oTable;

			if (!this._oTable) {
				this._oTable = this.byId("idtablePrecos");
			}

			oTable = this._oTable;
			oRowBinding = oTable.getBinding("items");
			aCols = this.createColumnConfig();

			oSettings = {
				workbook: {
					columns: aCols,
					hierarchyLevel: "Level"
				},
				dataSource: oRowBinding,
				fileName: "Rel_Tabela_Preço.xlsx",
				worker: false // We need to disable worker because we are using a MockServer as OData Service
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function () {
				oSheet.destroy();
			});
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
					var oModelTabPreco = new JSONModel(that.vetorTabPreco);
					that.setModel(oModelTabPreco, "modelTabPreco");
					
				},
				error: function (error) {
					that.byId("master").setBusy(false);
					that.onMensagemErroODATA(error);
				}
			});
		}
	});
});