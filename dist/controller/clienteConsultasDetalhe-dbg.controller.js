/*eslint-disable no-console, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/core/routing/History"
], function(BaseController, History) {
	"use strict";

	return BaseController.extend("application.controller.clienteConsultasDetalhe", {

		onInit: function(oEvent) {
			this.getRouter().getRoute("clienteConsultasDetalhe").attachPatternMatched(this._onLoadFields, this);
		},

		onAfterRendering: function() {

			// this.getView().
			// sap.m.QuickViewBase.getOwnerComponent().getModel("modelCliente").afterNavigate().getProperty("/codigoCliente");
		},

		onNavBack: function(oEvent) {

			var oHistory, sPreviousHash;
			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("clienteConsultas", {}, true);
			}
			// sap.ui.core.UIComponent.getRouterFor(this).navTo("clienteConsultas");
		},

		_onLoadFields: function() {
			var that = this;
			var oVetorTabPreco = [];
			this.byId("idTopLevelIconTabBar").setSelectedKey("tab1");
			var codigoCliente = this.getOwnerComponent().getModel("modelCliente").getProperty("/codigoCliente");

		}
	});
});