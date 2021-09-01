sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/routing/History"
], function (BaseController, History, ShellHeadUserItem) {
	"use strict";

	return BaseController.extend("application.controller.MenuRelatorios", {

		onInit: function () {
			// set explored app's demo model on this sample
			this.getRouter().getRoute("menuRelatorios").attachPatternMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function () {
			//this.getOwnerComponent().getModel("helper").setProperty("/showShellHeader", true);
		},

		onTileRelatorios: function (oEvent) {

			switch (oEvent.getSource().data("opcao")) {
			case "R01":
				sap.ui.core.UIComponent.getRouterFor(this).navTo("relatorioPedidos");
				break;
			case "R02":
				sap.ui.core.UIComponent.getRouterFor(this).navTo("verbaConsultas");
				break;
			case "R03":
				sap.ui.core.UIComponent.getRouterFor(this).navTo("relatorioTitulos");
				break;
			case "R04":
				sap.ui.core.UIComponent.getRouterFor(this).navTo("relatorioFaturamentoClientes");
				break;	
			default:
				sap.ui.core.UIComponent.getRouterFor(this).navTo("notFound");
				break;
			}
		}
	});
});