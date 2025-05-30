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

		onInit: function () {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("detalhesRelatorioTabelas").attachPatternMatched(this._onLoadFields, this);
		},

		_handleValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.Contains, sValue), new sap.ui.model.Filter(
				"Maktx", sap.ui.model.FilterOperator.Contains, sValue)];
			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("idtablePrecos").getBinding("items").filter(aFilters);
			this.byId("idtablePrecos").suggest();
		},

		onItemChange: function (oEvent) {

			filtroGrid = [];
			var codItemSelecionado = oEvent.getSource().getValue();

			var oModel = new sap.ui.model.json.JSONModel(filtroGrid);
			this.getOwnerComponent().setModel(oModel, "detalhesRelatorioTabelas");

			for (var i = 0; i < oProdutosTemplateGrid.length; i++) {
				if (codItemSelecionado == oProdutosTemplateGrid[i].ProdutoId) {
					filtroGrid.push(oProdutosTemplateGrid[i]);
				}
			}
			if (codItemSelecionado == "") {
				oModel = new sap.ui.model.json.JSONModel(oProdutosTemplateGridAux);
				this.getOwnerComponent().setModel(oModel, "detalhesRelatorioTabelas");

			} else {
				oModel = new sap.ui.model.json.JSONModel(filtroGrid);
				this.getOwnerComponent().setModel(oModel, "detalhesRelatorioTabelas");

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
				property: "Mvgr1Text",
				type: EdmType.String
			});

			aCols.push({
				label: "SubCategoria",
				property: "Mvgr2Text",
				type: EdmType.String
			});

			aCols.push({
				label: "Família",
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
				property: "ValPrecoOrig",
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
				property: "ValPrecoInform",
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
			var parametros = this.getModel("modelParametros").getData();
			
			var vFileName = "Lista_" + parametros.Centro + "_" + parametros.Cliente + "_Orig_" + parametros.UFOrigem + "_Dest_" + parametros.UFDestino + "_" + parametros.Frete;
			var dataAtual = this.onDataHora();

			var data = dataAtual[0].substring(0, 2) + "/" + dataAtual[0].substring(3, 5) + "/" + dataAtual[0].substring(6, 11);
			var horario = dataAtual[1].substring(0, 2) + ":" + dataAtual[1].substring(3, 5) + ":" + dataAtual[1].substring(6, 8);
			
			oSettings = {
				workbook: {
					columns: aCols,
					hierarchyLevel: "Level",
					context: {
					application: 'Portal Predilecta',
					version: '1.00.00',
					title: 'Relatório de Tabela de Preço',
					sheetName: 'Lista de Preço',
					modifiedBy: 'Administrador',
					metaSheetName: 'Parâmetros',
					metainfo: [{
						name: 'Parâmetros de Seleção',
						items: [{
							key: 'Centro',
							value: parametros.DescCentro
						}, {
							key: 'UF Origem',
							value: parametros.UFOrigem
						}, {
							key: 'Cliente',
							value: parametros.NomeCliente
						}, {
							key: 'UF Destino',
							value: parametros.UFDestino
						}, {
							key: 'Canal Atuação',
							value: parametros.CanalAtuacao
						}, {
							key: 'Tabela de Preço',
							value: parametros.DescTabelaPreco
						}, {
							key: 'Vencimento',
							value: parametros.DescVencto
						}, {
							key: 'Índice',
							value: parametros.Indice + "%"
						}, {
							key: 'Tipo Transporte',
							value: parametros.DescTipoFrete
						}, {
							key: 'Exibicao',
							value: parametros.Exibicao
						}, {	
							key: 'RCA',
							value: parametros.CodRepres
						}, {	
							key: 'Data Emissão Tabela',
							value: data + " - " + horario
						}
						]
					}]
				}},
				dataSource: oRowBinding,
				fileName: vFileName,
				worker: false // We need to disable worker because we are using a MockServer as OData Service
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function () {
				oSheet.destroy();
			});
		},

		_onLoadFields: function () {

			var that = this;

			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			var vAux = {
				CodRepres: that.getModelGlobal("modelTela").getProperty("/CodRepres"),
				Centro: that.getModelGlobal("modelTela").getProperty("/Werks"),
				DescCentro: that.getModelGlobal("modelTela").getProperty("/DescCentro"),
				UFOrigem: that.getModelGlobal("modelTela").getProperty("/UFOrigem"),
				Cliente: that.getModelGlobal("modelTela").getProperty("/Kunnr"),
				NomeCliente: that.getModelGlobal("modelTela").getProperty("/NomeCliente"),
				UFDestino: that.getModelGlobal("modelTela").getProperty("/UFDestino"),
				CanalAtuacao: that.getModelGlobal("modelTela").getProperty("/DescKvgr2"),
				TabPreco: that.getModelGlobal("modelTela").getProperty("/Pltyp"),
				DescTabelaPreco: that.getModelGlobal("modelTela").getProperty("/DescTabelaPreco"),
				Vencimento: that.getModelGlobal("modelTela").getProperty("/Vencimento"),
				DescVencto: that.getModelGlobal("modelTela").getProperty("/DescVencto"),
				Indice: that.getModelGlobal("modelTela").getProperty("/Indice"),
				Frete: that.getModelGlobal("modelTela").getProperty("/Inco1"),
				DescTipoFrete: that.getModelGlobal("modelTela").getProperty("/DescTipoFrete"),
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