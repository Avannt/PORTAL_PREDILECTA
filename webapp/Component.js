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
			// call the init function of the parent
			UIComponent.prototype.init.apply(this, arguments);

			// additional initialization can be done here
			this.getRouter().initialize();

			var oModel = new sap.ui.model.json.JSONModel("./model/Menu.json");
			this.setModel(oModel, "menu");

			sap.ui.getCore().getConfiguration().setLanguage("pt-BR");

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		}
	});
});