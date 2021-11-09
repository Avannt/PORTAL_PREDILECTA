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

			var modelTela = {
				Werks: ""
			};

			var model = new JSONModel(modelTela);
			that.setModel(model, "modelTela");

			var modelProduto = new JSONModel();
			that.setModel(modelProduto, "modelProduto");
			that.setModel(modelProduto, "modelProdutos");

		},

		onChangeCentro: function (oEvent) {

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

					that.vetorProdutosAux = retorno.results;
					that.vetorProdutos = [];
					// var oModelProdutos = new JSONModel(that.vetorProdutos);
					
					for (var i = 0; i < that.vetorProdutosAux.length; i++) {
						
							if (that.vetorProdutosAux[i].Werks == werks) {

							that.vetorProdutos.push(that.vetorProdutosAux[i]);

						}
						
						//that.vetorProdutos[i].PathImg = "http://189.57.15.163:81/predilecta/images_produtos/" + that.vetorProdutos[i].Matnr + ".png";
						
						//that.vetorProdutos[i].PathImg = sap.ui.require.toUrl("http://189.57.15.163:81/predilecta/images_produtos/0300.png");

					}

					that.byId("masterProdutos").setBusy(false);
					that.getModel("modelProdutos").setData(that.vetorProdutos);
					// that.setModel(oModelProdutos, "modelProdutos");
					that.onFilterCentro(werks);
					
				},
				error: function (error) {

					that.byId("masterProdutos").setBusy(false);
					that.onMensagemErroODATA(error);
				}
			});
		},

		onFilterCentro: function (werks) {

			var aFilters = [];

			var oFilter = [new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.StartsWith, werks)];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);

			this.byId("list").getBinding("items").filter(aFilters, "Application");
		},

		onSelectionChange: function (oEvent) {

			var that = this;
			that.byId("detailProdutos").setBusy(true);

			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var Produto = oItem.getBindingContext("modelProdutos").getObject();

			that.getModel("modelProduto").setData(Produto);
			that.getSplitContObj().toDetail(this.createId("detail"));

			this.getSplitContObj().toDetail(this.createId("detail"));
			that.byId("detailProdutos").setBusy(false);
		},

		onNavBack: function () {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas");
		},

		onPressDetailBack: function () {
			this.byId("list").removeSelections(true);
			this.getSplitContObj().backDetail();
		},

		onSearch: function (oEvent) {

			var that = this;

			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.StartsWith, sValue),
				new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, sValue)
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