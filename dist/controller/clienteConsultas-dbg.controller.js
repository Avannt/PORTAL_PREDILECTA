/*eslint-disable no-console, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/routing/History"
], function(BaseController, History, ShellHeadUserItem) {
	"use strict";
	var vetorCliente = [];

	return BaseController.extend("application.controller.clienteConsultas", {

		onInit: function() {
			// set explored app's demo model on this sample
			this.getRouter().getRoute("clienteConsultas").attachPatternMatched(this._onCreateModel, this);
		},

		_onCreateModel: function() {

			var oModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oModel);
			this.getOwnerComponent().setModel(oModel, "modelCliente");
			
			var oItem = [];
			var that = this;
			this.byId("searchField").setValue("");
		},

		onNavBack: function() {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas");
		},

		onSearch: function(oEvent) {
			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("kunnr", sap.ui.model.FilterOperator.StartsWith, sValue),
				new sap.ui.model.Filter("name1", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("stras", sap.ui.model.FilterOperator.StartsWith, sValue),
				new sap.ui.model.Filter("ort01", sap.ui.model.FilterOperator.StartsWith, sValue),
				new sap.ui.model.Filter("regio", sap.ui.model.FilterOperator.StartsWith, sValue),
				new sap.ui.model.Filter("stcd1", sap.ui.model.FilterOperator.StartsWith, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("table_clientes").getBinding("items").filter(aFilters, "Application");
		},

		onSelectionChange: function(oEvent) {
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();

			this.getOwnerComponent().getModel("modelCliente").setProperty("/codigoCliente", oItem.getBindingContext("clientesCadastrados").getProperty("kunnr"));
				
			sap.ui.core.UIComponent.getRouterFor(this).navTo("clienteConsultasDetalhe");
		}
	});
});