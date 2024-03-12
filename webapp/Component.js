

sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"application/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("application.Component", {

		metadata: {
			manifest: "json",
			fullWidth: true
		},

		init: function () {
			
			UIComponent.prototype.init.apply(this, arguments);

			this.getRouter().initialize();

			var oModel = new sap.ui.model.json.JSONModel("./model/Menu.json");
			this.setModel(oModel, "menu");
			
			var oModel = new sap.ui.model.json.JSONModel("./model/StatusPedido.json");
			this.setModel(oModel, "StatusPedido");

			var oModel = new sap.ui.model.json.JSONModel("./model/Movidesk.json");
			this.setModel(oModel, "modelOcorrencias");

			sap.ui.getCore().getConfiguration().setLanguage("pt-BR");

			this.setModel(models.createDeviceModel(), "device");
		}
	});
});