sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel"

], function(BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("application.controller.detalheProdutos", {

		onInit: function() {
			console.log("pagina/controller");
			// var oModel = new sap.ui.model.json.JSONModel("./model/Predilecta.json");
			// 		this.getView().setModel(oModel);
		},
		_onObjectMatched: function(oEvent) {
			this.getView().bindElement({
				path: "/" + oEvent.getParameter("arguments").invoicePath,
				model: "Predilecta"
			});
		}
	});
});