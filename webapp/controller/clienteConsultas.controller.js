/*eslint-disable no-console, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/routing/History"
], function(BaseController, JSONModel, History, ShellHeadUserItem) {
	"use strict";
	var vetorCliente = [];

	return BaseController.extend("application.controller.clienteConsultas", {

		onInit: function() {
			// set explored app's demo model on this sample
			this.getRouter().getRoute("clienteConsultas").attachPatternMatched(this._onCreateModel, this);
		},

		_onCreateModel: function() {

			var that = this;
			
			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			that.oModel.read("/ClienteQ", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + repres + "'"
				},
				success: function (retorno) {
					var vetorClientes = [];
					that.vetorClientes = retorno.results;
					var oModelClientes = new JSONModel(that.vetorClientes);
					that.setModelGlobal(oModelClientes, "modelCliente");
					that.setModel(oModelClientes, "modelClientes");
				},
				error: function (error) {

					that.onMensagemErroODATA(error);
				}
			});
			
			//that.onInicializaClientes();
			
			that.byId("searchField").setValue("");
			
		},

		onNavBack: function() {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas");
		},

		onSearch: function(oEvent) {
			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.StartsWith, sValue),
				new sap.ui.model.Filter("Name1", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Stras", sap.ui.model.FilterOperator.StartsWith, sValue),
				new sap.ui.model.Filter("Ort01", sap.ui.model.FilterOperator.StartsWith, sValue),
				new sap.ui.model.Filter("Regio", sap.ui.model.FilterOperator.StartsWith, sValue),
				new sap.ui.model.Filter("Stcd1", sap.ui.model.FilterOperator.StartsWith, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("table_clientes").getBinding("items").filter(aFilters, "Application");
		},
		
		onInicializaClientes: function(){
			
			var oModel = new sap.ui.model.json.JSONModel();
			this.setModelGlobal(oModel, "Cliente");
			this.setModel(oModel, "Clientes");
			
		},

		onSelectionChange: function(oEvent) {
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();

			this.getOwnerComponent().getModel("modelCliente").setProperty("/codigoCliente", oItem.getBindingContext("modelClientes").getProperty("Kunnr"));
				
			sap.ui.core.UIComponent.getRouterFor(this).navTo("clienteConsultasDetalhe");
		}
	});
});