/*eslint-disable no-unused-vars, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"application/model/formatter",
	"sap/ui/model/odata/v2/ODataModel"

], function (BaseController, JSONModel, MessageBox, formatter, ODataModel) {
	"use strict";
	var oDuplicataRelatorio = [];

	return BaseController.extend("application.controller.relatorioFaturamentoClientes", {

		onInit: function () {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("relatorioFaturamentoClientes").attachPatternMatched(this._onLoadFields, this);
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
				Periodo: ""
			};

			var omodelParametros = new JSONModel(vAux);
			that.setModel(omodelParametros, "modelParametros");

			that.oModel.read("/Centros", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + repres + "'"
				},
				success: function (retorno) {
					var vetorCentros = retorno.results;
					var oModelCentros = new JSONModel(vetorCentros);
					that.setModel(oModelCentros, "modelCentros");
				},
				error: function (error) {
					that.onMensagemErroODATA(error);
				}
			});

			that.oModel.read("/ClienteQ", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + repres + "'"
				},
				success: function (retorno) {
					var vetorClientes = retorno.results;
					var vetorRede = [];
					var vetorBandeira = [];

					for (var i = 0; i < vetorClientes.length; i++) {
						var vAchouRede = false;
						var vAchouBandeira = false;

						for (var j = 0; j < vetorRede.length; j++) {

							if ((vetorClientes[i].Kvgr4 == vetorRede[j].Kvgr4) || vetorClientes[i].Kvgr4 == "") {
								vAchouRede = true;

								break;
							}
						}

						for (var j = 0; j < vetorBandeira.length; j++) {

							if ((vetorClientes[i].Kvgr5 == vetorBandeira[j].Kvgr5) || vetorClientes[i].Kvgr5 == "") {
								vAchouBandeira = true;

								break;
							}
						}

						if (vAchouRede == false) {
							vetorRede.push(vetorClientes[i]);
						}

						if (vAchouBandeira == false) {
							vetorBandeira.push(vetorClientes[i]);
						}
					}

					var oModelClientes = new JSONModel(vetorClientes);
					that.setModel(oModelClientes, "modelClientes");

					var oModelRede = new JSONModel(vetorRede);
					that.setModel(oModelRede, "modelRedes");

					var oModelBandeira = new JSONModel(vetorBandeira);
					that.setModel(oModelBandeira, "modelBandeiras");
				},
				error: function (error) {
					that.onMensagemErroODATA(error);
				}
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

		onPress: function () {
			
			var that = this;
			
			var repres  = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");
			
			var WerksIni = that.getModel("modelParametros").getProperty("/WerksIni");
			var WerksFim = that.getModel("modelParametros").getProperty("/WerksFim");
			var KunnrIni = that.getModel("modelParametros").getProperty("/KunnrIni");
			var KunnrFim = that.getModel("modelParametros").getProperty("/KunnrFim");
			var Kvgr4Ini = that.getModel("modelParametros").getProperty("/Kvgr4Ini");
			var Kvgr4Fim = that.getModel("modelParametros").getProperty("/Kvgr4Fim");
			var Kvgr5Ini = that.getModel("modelParametros").getProperty("/Kvgr5Ini");
			var Kvgr5Fim = that.getModel("modelParametros").getProperty("/Kvgr5Fim");
			var VbelnIni = "";
			var VbelnFim = "";
			var RepreIni = "";
			var RepreFim = "";
			var PerioIni = "";
			var PerioFim = "";
			
			that.oModel.read("/FatClientes", {
				urlParameters: {
					
					"$filter": "Usuario eq '" + repres + 
					
					"' and WerksIni eq '" + WerksIni + 
					"' and WerksFim eq '" + WerksFim +
					
					"' and KunnrIni eq '" + KunnrIni + 
					"' and KunnrFim eq '" + KunnrFim + 
					
					"' and Kvgr4Ini eq '" + Kvgr4Ini + 
					"' and Kvgr4Fim eq '" + Kvgr4Fim +
					
					"' and Kvgr5Ini eq '" + Kvgr5Ini + 
					"' and Kvgr5Fim eq '" + Kvgr5Fim +
					
					"' and VbelnIni eq '" + VbelnIni + 
					"' and VbelnFim eq '" + VbelnFim +
					
					"' and RepreIni eq '" + RepreIni + 
					"' and RepreFim eq '" + RepreFim +
					
					"' and PerioIni eq '" + PerioIni + 
					"' and PerioFim eq '" + PerioFim + "'"
				},
				success: function (retorno) {
					var vetorFatClientes = retorno.results;
					var oModelFatClientes = new JSONModel(vetorFatClientes);
					that.setModel(oModelFatClientes, "modelFatClientes");
				},
				error: function (error) {
					that.onMensagemErroODATA(error);
				}
			});

		},

		onExpandFiltro: function () {
			debugger;

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
	});
});