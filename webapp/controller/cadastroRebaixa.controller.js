/*eslint-disable no-unused-vars, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"application/model/formatter",
	"sap/ui/core/util/MockServer",
	"sap/ui/export/library",
	"sap/ui/export/Spreadsheet",
	"sap/ui/model/odata/v2/ODataModel"

], function (BaseController, JSONModel, MessageBox, formatter, MockServer, exportLibrary, Spreadsheet, ODataModel) {
	"use strict";

	var oDuplicataRelatorio = [];
	var EdmType = exportLibrary.EdmType;

	return BaseController.extend("application.controller.cadastroRebaixa", {

		onInit: function () {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("cadastroRebaixa").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {

			var that = this;

			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			var vAux = {
				WerksIni: "",
				WerksFim: "",
				KunnrIni: "",
				KunnrFim: "",
				Kvgr4Ini: "",
				Kvgr4Fim: "",
				Kvgr5Ini: "",
				Kvgr5Fim: "",
				VBelnIni: "",
				VBelnFim: "",
				RepreIni: "",
				RepreFim: "",
				MatnrIni: "",
				MatnrFim: "",
				Mvgr1Ini: "",
				Mvgr1Fim: "",
				Mvgr2Ini: "",
				Mvgr2Fim: "",
				Mvgr3Ini: "",
				Mvgr3Fim: "",
				Mvgr5Ini: "",
				Mvgr5Fim: "",
				Periodo: ""
			};

			var omodelParametros = new JSONModel(vAux);
			that.setModel(omodelParametros, "modelParametros");

			var oModel = new JSONModel(that.vetorCentros);
			that.setModel(oModel, "modelCentros");
			
			that.byId("idCentro").setBusy(true);
			new Promise(function (res, rej) {

				that.onBuscarCentros(repres, res, rej, that);

			}).then(function (data) {

				var oModelRepres = new JSONModel(data);
				that.setModel(oModelRepres, "modelCentros");
				that.byId("master").setBusy(false);

			}).catch(function (error) {

				that.byId("master").setBusy(false);
				that.onMensagemErroODATA(error);
			});
		},
		
		onCentroChange: function (evt){
			
			var that = this;
			
			var Bukrs = evt.getSource().getBindingContext("modelCentros").getObject();
			
			that.oModel.read("/MsgNF", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + that.CodRepres + "' and IvBukrs eq '" + Bukrs + "1'."
				},
				success: function (result) {

					var oModelRepres = new JSONModel(result.results);
					that.getModel("modelRepres").setData(oModelRepres);
				},
				error: function (error) {
					
					that.onMensagemErroODATA(error);
				}
			});
		},

		// ongetHeaderGroupLifnr: function (oContext) {
		// 	return oContext.getProperty("Lifnr");
		// },

		// ongetHeaderGroupBukrs: function (oContext) {
		// 	return oContext.getProperty("Bukrs") + ' - ' + oContext.getProperty("Butxt");
		// },

		createColumnConfig: function () {
			
			var aCols = [];

			aCols.push({
				label: "Repres",
				property: "Lifnr",
				type: EdmType.Number
			});

			aCols.push({
				label: "Nome Repres",
				property: "Name1Rep",
				type: EdmType.String
			});

			aCols.push({
				label: "Empresa",
				property: "Bukrs",
				type: EdmType.String
			});

			aCols.push({
				label: "Nome Empresa",
				property: "Butxt",
				type: EdmType.String
			});

			aCols.push({
				label: "Material",
				property: "Matnr",
				type: EdmType.String
			});

			aCols.push({
				label: "Descrição Material",
				property: "Maktx",
				type: EdmType.String
			});

			aCols.push({
				label: "UM",
				property: "Meins",
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
				label: "Marca",
				property: "Mvgr5",
				type: EdmType.String
			});

			aCols.push({
				label: "Descrição Marca",
				property: "Mvgr5Text",
				type: EdmType.String
			});

			aCols.push({
				label: "Qtd Faturada",
				property: "QtdFaturada",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "Vlr Faturado",
				property: "ValFaturado",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "%Partic.",
				property: "PctPartic",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "Qtde Pedidos",
				property: "QtdPedidos",
				type: EdmType.Number,
				scale: 0,
				delimiter: true
			});

			aCols.push({
				property: "PctRentab",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				property: "UltPreco",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				property: "MedPreco",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			return aCols;
		},

		onExport: function () {
			var aCols, oRowBinding, oSettings, oSheet, oTable;

			if (!this._oTable) {
				this._oTable = this.byId("idtableFatItens");
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
				fileName: "Rel_Fat_Item.xlsx",
				worker: false // We need to disable worker because we are using a MockServer as OData Service
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function () {
				oSheet.destroy();
			});
		},

		onSuggestCentroIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("NomeCentro", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idCentroIni").getBinding("suggestionItems").filter(aFilters);
			this.byId("idCentroIni").suggest();
		},

		onPressBtnFiltrar: function () {

			var that = this;

			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			var parametros = that.getModel("modelParametros").getData();

			var PerioAux = that.getModel("modelParametros").getProperty("/Periodo");
			var PerioSplit = PerioAux.split(" - ");
			var PerioIni = PerioSplit[0];
			var PerioFim = PerioSplit[1];

			that.byId("master").setBusy(true);

			that.oModel.read("/FatItens", {
				urlParameters: {

					"$filter": "Usuario eq '" + repres +
						"' and WerksIni eq '" + parametros.WerksIni +
						"' and WerksFim eq '" + parametros.WerksFim +
						"' and KunnrIni eq '" + parametros.KunnrIni +
						"' and KunnrFim eq '" + parametros.KunnrFim +
						"' and Kvgr4Ini eq '" + parametros.Kvgr4Ini +
						"' and Kvgr4Fim eq '" + parametros.Kvgr4Fim +
						"' and Kvgr5Ini eq '" + parametros.Kvgr5Ini +
						"' and Kvgr5Fim eq '" + parametros.Kvgr5Fim +
						"' and RepreIni eq '" + parametros.RepreIni +
						"' and RepreFim eq '" + parametros.RepreFim +
						"' and MatnrIni eq '" + parametros.MatnrIni +
						"' and MatnrFim eq '" + parametros.MatnrFim +
						"' and Mvgr1Ini eq '" + parametros.Mvgr1Ini +
						"' and Mvgr1Fim eq '" + parametros.Mvgr1Fim +
						"' and Mvgr2Ini eq '" + parametros.Mvgr2Ini +
						"' and Mvgr2Fim eq '" + parametros.Mvgr2Fim +
						"' and Mvgr3Ini eq '" + parametros.Mvgr3Ini +
						"' and Mvgr3Fim eq '" + parametros.Mvgr3Fim +
						"' and Mvgr5Ini eq '" + parametros.Mvgr5Ini +
						"' and Mvgr5Fim eq '" + parametros.Mvgr5Fim +
						"' and PerioIni eq '" + PerioIni +
						"' and PerioFim eq '" + PerioFim + "'"
				},
				success: function (retorno) {

					that.vetorFatItems = [];
					that.vetorResumoEmpresa = [];

					that.vetorFatItems = retorno.results;

					that.getModel("modelFatItens").setData(that.vetorFatItems);

					var vTotalEmp = 0;
					for (var i = 0; i < that.vetorFatItems.length; i++) {
						var vAchouEmpresa = false;
						for (var j = 0; j < that.vetorResumoEmpresa.length; j++) {

							if (that.vetorFatItems[i].Bukrs == that.vetorResumoEmpresa[j].Bukrs) {

								vAchouEmpresa = true;

								that.vetorResumoEmpresa[j].ValFaturado = parseFloat(that.vetorResumoEmpresa[j].ValFaturado) + Math.round(parseFloat(that.vetorFatItems[
									i].ValFaturado) * 100) / 100;
								that.vetorResumoEmpresa[j].ValFaturado = parseFloat(that.vetorResumoEmpresa[j].ValFaturado).toFixed(2);

							}
						}
						if (vAchouEmpresa == false) {
							var vAux = {
								Bukrs: that.vetorFatItems[i].Bukrs,
								Butxt: that.vetorFatItems[i].Butxt,
								ValFaturado: parseFloat(that.vetorFatItems[i].ValFaturado)
							};

							that.vetorResumoEmpresa.push(vAux);

						}
						vTotalEmp += parseFloat(that.vetorFatItems[i].ValFaturado);
					}

					if (vTotalEmp > 0) {
						var vAuxTot = {
							Bukrs: "",
							Butxt: "TOTAL",
							ValFaturado: parseFloat(vTotalEmp).toFixed(2)
						};

						that.vetorResumoEmpresa.push(vAuxTot);
					}

					that.byId("master").setBusy(false);
					that.getModel("modelResumoEmpresa").setData(that.vetorResumoEmpresa);
				},
				error: function (error) {
					that.byId("master").setBusy(false);
					that.onMensagemErroODATA(error);
				}
			});

		},

		onExpandFiltro: function () {

			if (this.byId("idPanelFiltro").getExpanded()) {
				this.byId("idPanelFiltro").setHeaderText("Ocultar Filtros");
			} else {
				this.byId("idPanelFiltro").setHeaderText("Exibir Filtros");
			}
		},

		onSuggestCentroFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("NomeCentro", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idCentroFim").getBinding("suggestionItems").filter(aFilters);
			this.byId("idCentroFim").suggest();
		},

		onSuggestClienteIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Name1", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idClienteIni").getBinding("suggestionItems").filter(aFilters);
			this.byId("idClienteIni").suggest();
		},

		onSuggestClienteFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Name1", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idClienteFim").getBinding("suggestionItems").filter(aFilters);
			this.byId("idClienteFim").suggest();
		},

		onSuggestRedeIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kvgr4", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescKvgr4", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idRedeIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idRedeIni").suggest();
		},

		onSuggestRedeFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kvgr4", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescKvgr4", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idRedeFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idRedeFim").suggest();
		},

		onSuggestBandeiraIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kvgr5", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescKvgr5", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idBandeiraIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idBandeiraIni").suggest();
		},

		onSuggestBandeiraFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kvgr5", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescKvgr5", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idBandeiraFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idBandeiraFim").suggest();
		},

		onSuggestRepresIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Lifnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Name1Rep", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idRepreIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idRepreIni").suggest();
		},

		onSuggestRepresFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Lifnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Name1Rep", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idRepreFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idRepreFim").suggest();
		},

		onSuggestMaterialIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idMaterialIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idMaterialIni").suggest();
		},

		onSuggestMaterialFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idMaterialFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idMaterialFim").suggest();
		},

		onSuggestCategoriaIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr1", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr1", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idCategoriaIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idCategoriaIni").suggest();
		},

		onSuggestCategoriaFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr1", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr1", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idCategoriaFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idCategoriaFim").suggest();
		},

		onSuggestSubCategoriaIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr2", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr2", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idSubCategoriaIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idSubCategoriaIni").suggest();
		},

		onSuggestSubCategoriaFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr2", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr2", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idSubCategoriaFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idSubCategoriaFim").suggest();
		},

		onSuggestFamiliaIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr3", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr3", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idFamiliaIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idFamiliaIni").suggest();
		},

		onSuggestFamiliaFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr3", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr3", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idFamiliaFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idFamiliaFim").suggest();
		},

		onSuggestMarcaIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr5", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr5", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idMarcaIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idMarcaIni").suggest();
		},

		onSuggestMarcaFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr5", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr5", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idMarcaFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idMarcaFim").suggest();
		},

	});
});