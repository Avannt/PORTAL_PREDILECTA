/*eslint-disable no-console, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/routing/History"
], function (BaseController, JSONModel, jQuery, Controller, formatter) {
	"use strict";

	return BaseController.extend("application.controller.detalheProdutos", {

		onInit: function () {
			// set explored app's demo model on this sample
			this.getRouter().getRoute("detalheProdutos").attachPatternMatched(this._onCreateModel, this);
		},

		_onCreateModel: function () {

			var that = this;

			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			that.oModel.read("/Centros", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + repres + "'"
				},
				success: function (retorno) {
					var vetorCentros = [];
					that.vetorCentros = retorno.results;
					var oModelCentros = new JSONModel(that.vetorCentros);
					that.setModel(oModelCentros, "modelCentros");
				},
				error: function (error) {

					that.onMensagemErroODATA(error);
				}
			});

		},

		onChangeEmpresa: function (oEvent) {

			var that = this;

			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			var werks = oEvent.getSource().getSelectedKey();

			that.byId("masterProdutos").setBusy(true);

			that.oModel.read("/Produtos", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + repres + "'"
				},
				success: function (retorno) {
					
					var vetorProdutos = [];

					that.vetorProdutos = retorno.results;
					var oModelProdutos = new JSONModel(that.vetorProdutos);

					that.byId("masterProdutos").setBusy(false);
					that.setModel(oModelProdutos, "modelProdutos");
					that.onFilterEmpresa(werks);
				},
				error: function (error) {

					that.byId("masterProdutos").setBusy(false);
					that.onMensagemErroODATA(error);
				}
			});
		},

		onFilterEmpresa: function (oEvent) {
			var sValue = oEvent.getSource().getValue();
			var aFilters = [];

			var oFilter = [new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.StartsWith, sValue)];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);

			this.byId("list").getBinding("items").filter(aFilters, "Application");
		},

		onNavBack: function () {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas");
		},

		onPressDetailBack: function () {
			this.byId("list").removeSelections(true);
			this.getSplitContObj().backDetail();
		},

		onSearch: function (oEvent) {

			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("matnr", sap.ui.model.FilterOperator.StartsWith, sValue),
				new sap.ui.model.Filter("maktx", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("list").getBinding("items").filter(aFilters, "Application");
		},

		onPressModeBtn: function (oEvent) {
			var sSplitAppMode = oEvent.getSource().getSelectedButton().getCustomData()[0].getValue();

			this.getSplitContObj().setMode(sSplitAppMode);
		},

		getSplitContObj: function () {
			var result = this.byId("SplitContDemoProdutos");
			if (!result) {
				jQuery.sap.log.error("SplitApp object can't be found");
			}
			return result;
		}
	});
});