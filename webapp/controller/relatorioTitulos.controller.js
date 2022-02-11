/*eslint-disable no-unused-vars, no-alert */
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

	var oDuplicataRelatorio = [];
	var EdmType = exportLibrary.EdmType;

	return BaseController.extend("application.controller.relatorioTitulos", {

		onInit: function () {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("relatorioTitulos").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {

			var that = this;
			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			var vAux = {
				BukrsIni: "",
				BukrsFim: "",
				KunnrIni: "",
				KunnrFim: "",
				Kvgr4Ini: "",
				Kvgr4Fim: "",
				Kvgr5Ini: "",
				Kvgr5Fim: "",
				BelnrIni: "",
				BelnrFim: "",
				LifnrIni: "",
				LifnrFim: "",
				PeriodoIni: "",
				PeriodoFim: ""
			};

			var omodelParametros = new JSONModel(vAux);
			that.setModel(omodelParametros, "modelParametros");

			that.vetorTitulos = [];
			var omodelTitulos = new JSONModel(that.vetorTitulos);
			that.setModel(omodelTitulos, "modelTitulos");

			var CodCliente = that.getModelGlobal("modelAux").getProperty("/Kunnr");
			that.getModel("modelParametros").setProperty("/KunnrIni", CodCliente);
			that.getModel("modelParametros").setProperty("/KunnrFim", CodCliente);

			// that.vetorResumoEmpresa = [];
			// var oModelResumoEmpresa = new JSONModel(that.vetorResumoEmpresa);
			// that.setModel(oModelResumoEmpresa, "modelResumoEmpresa");

			new Promise(function (res, rej) {

				that.onBuscarClientes(repres, res, rej, that);

			}).then(function (retorno) {

				var vetorClientes = retorno;
				var vetorRede = [];
				var vetorBandeira = [];
				var vetorRepres = [];

				for (var i = 0; i < vetorClientes.length; i++) {
					var vAchouRede = false;
					var vAchouBandeira = false;
					var vAchouRepres = false;

					for (var j = 0; j < vetorRede.length; j++) {

						if ((vetorClientes[i].Kvgr4 == vetorRede[j].Kvgr4) || vetorClientes[i].Kvgr4 == "") {
							vAchouRede = true;

							break;
						}
					}

					for (var k = 0; k < vetorBandeira.length; k++) {

						if ((vetorClientes[i].Kvgr5 == vetorBandeira[k].Kvgr5) || vetorClientes[i].Kvgr5 == "") {
							vAchouBandeira = true;

							break;
						}
					}

					for (var m = 0; m < vetorRepres.length; m++) {

						if ((vetorClientes[i].Lifnr == vetorRepres[m].Lifnr) || vetorClientes[i].Lifnr == "") {
							vAchouRepres = true;

							break;
						}
					}
					if (vAchouRede == false) {
						vetorRede.push(vetorClientes[i]);
					}
					if (vAchouBandeira == false) {
						vetorBandeira.push(vetorClientes[i]);
					}
					if (vAchouRepres == false) {
						vetorRepres.push(vetorClientes[i]);
					}
				}

				var oModelClientes = new JSONModel(vetorClientes);
				that.setModel(oModelClientes, "modelClientes");

				var oModelRede = new JSONModel(vetorRede);
				that.setModel(oModelRede, "modelRedes");

				var oModelBandeira = new JSONModel(vetorBandeira);
				that.setModel(oModelBandeira, "modelBandeiras");

				var oModelRepres = new JSONModel(vetorRepres);
				that.setModel(oModelRepres, "modelRepres");

			}).catch(function (error) {

				that.onMensagemErroODATA(error);
			});

			that.oModel.read("/Centros", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + repres + "'"
				},
				success: function (retorno) {

					// var vetorCentros = retorno.results;
					// var oModelCentros = new JSONModel(vetorCentros);
					// that.setModel(oModelCentros, "modelCentros");

					that.vetorEmpresas = [];
					that.vetorCentrosAux = retorno.results;

					for (var i = 0; i < that.vetorCentrosAux.length; i++) {

						var vAchouEmpresa = false;

						for (var j = 0; j < that.vetorEmpresas.length; j++) {

							if (that.vetorEmpresas[j].Bukrs == that.vetorCentrosAux[i].Bukrs) {

								vAchouEmpresa = true;
							}
						}

						if (vAchouEmpresa == false) {

							var vAux = {
								Bukrs: that.vetorCentrosAux[i].Bukrs,
								Butxt: that.vetorCentrosAux[i].Butxt
							};
							that.vetorEmpresas.push(vAux);
						}
					}

					var oModelEmpresa = new JSONModel(that.vetorEmpresas);
					that.setModel(oModelEmpresa, "modelEmpresas");

				},
				error: function (error) {
					that.onMensagemErroODATA(error);
				}
			});
		},

		ongetHeaderGroupLifnr: function (oContext) {
			return oContext.getProperty("Lifnr");
		},

		ongetHeaderGroupBukrs: function (oContext) {
			return oContext.getProperty("Bukrs") + ' - ' + oContext.getProperty("Butxt");
		},

		createColumnConfig: function () {
			var aCols = [];

			// aCols.push({
			// 	label: "Repres",
			// 	property: "Lifnr",
			// 	type: EdmType.Number
			// });

			// aCols.push({
			// 	label: "Nome Repres",
			// 	property: "Name1Rep",
			// 	type: EdmType.String
			// });

			// aCols.push({
			// 	label: "Vocativo",
			// 	property: "TitleLet",
			// 	type: EdmType.String
			// });

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
				label: "Doc Contábil",
				property: "Belnr",
				type: EdmType.String
			});

			aCols.push({
				label: "Lançto",
				property: "Budat",
				type: EdmType.DateTime,
				format: 'dd/mm/yyyy'
			});

			aCols.push({
				label: "Cliente",
				property: "Kunnr",
				type: EdmType.String
			});

			aCols.push({
				label: "Razão Social",
				property: "Name1Cli",
				type: EdmType.String
			});

			aCols.push({
				label: "CNPJ",
				property: "Stcd1",
				type: EdmType.String
			});

			aCols.push({
				label: "CPF",
				property: "Stcd2",
				type: EdmType.String
			});
			
			aCols.push({
				label: "Rede",
				property: "Kvgr4",
				type: EdmType.String
			});

			aCols.push({
				label: "Descrição Rede",
				property: "Kvgr4Text",
				type: EdmType.String
			});

			aCols.push({
				label: "Bandeira",
				property: "Kvgr5",
				type: EdmType.String
			});

			aCols.push({
				label: "Descrição Bandeira",
				property: "Kvgr5Text",
				type: EdmType.String
			});

			aCols.push({
				label: "UF",
				property: "Region",
				type: EdmType.String
			});

			aCols.push({
				label: "Cidade",
				property: "City1",
				type: EdmType.String
			});
			
			aCols.push({
				label: "Nº Docto",
				property: "DocNum",
				type: EdmType.String
			});
			
			aCols.push({
				label: "Referência Cliente",
				property: "Bstkd",
				type: EdmType.String
			});
			
			aCols.push({
				label: "Nº Fat",
				property: "DocFat",
				type: EdmType.String
			});
			
			aCols.push({
				label: "Dias Atraso",
				property: "DiasAtraso",
				type: EdmType.String
			});

			aCols.push({
				label: "Vl.Título",
				property: "Dmbtr",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});
			
			aCols.push({
				label: "Data Últ Advt.",
				property: "Madat",
				type: EdmType.DateTime,
				format: 'dd/mm/yyyy'
			});

			return aCols;
		},

		onExport: function () {
			var aCols, oRowBinding, oSettings, oSheet, oTable;

			if (!this._oTable) {
				this._oTable = this.byId("idtableTitulos");
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
				fileName: "Rel_Titulos_Abertos.xlsx",
				worker: false // We need to disable worker because we are using a MockServer as OData Service
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function () {
				oSheet.destroy();
			});
		},

		onDialogClose: function () {

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}
		},

		onPressBtnFiltrar: function () {

			var that = this;

			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			var parametros = that.getModel("modelParametros").getData();
			var PerioAux = that.getModel("modelParametros").getProperty("/Periodo");

			try {

				var PerioSplit = PerioAux.split(" - ");
				parametros.PeriodoIni = PerioSplit[0];
				parametros.PeriodoFim = PerioSplit[1];

			} catch (x) {
				
				console.log(x);
			}

			that.byId("master").setBusy(true);

			that.oModel.read("/P_RelTitulos", {
				urlParameters: {

					"$filter": "Usuario eq '" + repres +
						"' and BukrsIni eq '" + parametros.BukrsIni +
						"' and BukrsFim eq '" + parametros.BukrsFim +
						"' and KunnrIni eq '" + parametros.KunnrIni +
						"' and KunnrFim eq '" + parametros.KunnrFim +
						"' and Kvgr4Ini eq '" + parametros.Kvgr4Ini +
						"' and Kvgr4Fim eq '" + parametros.Kvgr4Fim +
						"' and Kvgr5Ini eq '" + parametros.Kvgr5Ini +
						"' and Kvgr5Fim eq '" + parametros.Kvgr5Fim +
						"' and BelnrIni eq '" + parametros.BelnrIni +
						"' and BelnrFim eq '" + parametros.BelnrFim +
						"' and RepreIni eq '" + parametros.LifnrIni +
						"' and RepreFim eq '" + parametros.LifnrFim +
						"' and PerioIni eq '" + parametros.PeriodoIni +
						"' and PerioFim eq '" + parametros.PeriodoFim + "'"
				},
				success: function (retorno) {

					// that.vetorTitulos = [];

					that.vetorTitulos = retorno.results;

					that.getModel("modelTitulos").setData(that.vetorTitulos);

					that.byId("master").setBusy(false);

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

		// onSuggestCentroIni: function (evt) {

		// 	var sValue = evt.getSource().getValue();
		// 	var aFilters = [];
		// 	var oFilter = [new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.Contains, sValue),
		// 		new sap.ui.model.Filter("NomeCentro", sap.ui.model.FilterOperator.Contains, sValue)
		// 	];

		// 	var allFilters = new sap.ui.model.Filter(oFilter, false);

		// 	aFilters.push(allFilters);
		// 	this.byId("idCentroIni").getBinding("suggestionItems").filter(aFilters);
		// 	this.byId("idCentroIni").suggest();
		// },

		// onSuggestCentroFim: function (evt) {

		// 	var sValue = evt.getSource().getValue();
		// 	var aFilters = [];
		// 	var oFilter = [new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.Contains, sValue),
		// 		new sap.ui.model.Filter("NomeCentro", sap.ui.model.FilterOperator.Contains, sValue)
		// 	];

		// 	var allFilters = new sap.ui.model.Filter(oFilter, false);

		// 	aFilters.push(allFilters);
		// 	this.byId("idCentroFim").getBinding("suggestionItems").filter(aFilters);
		// 	this.byId("idCentroFim").suggest();
		// },

		onSuggestEmpresaIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Bukrs", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Butxt", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idEmpresaIni").getBinding("suggestionItems").filter(aFilters);
			this.byId("idEmpresaIni").suggest();
		},

		onSuggestEmpresaFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Bukrs", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Butxt", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idEmpresaFim").getBinding("suggestionItems").filter(aFilters);
			this.byId("idEmpresaFim").suggest();
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
	});
});