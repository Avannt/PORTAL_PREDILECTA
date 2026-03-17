/*eslint-disable no-unused-vars, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"application/model/formatter",
	"sap/ui/core/util/MockServer",
	"sap/ui/export/library",
	"sap/ui/export/Spreadsheet",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/m/library",
	"sap/ui/Device"

], function (BaseController, JSONModel, MessageBox, formatter, MockServer, exportLibrary, Spreadsheet, ODataModel, MobileLibrary, Device) {
	"use strict";

	var ListMode = MobileLibrary.ListMode,
		ListSeparators = MobileLibrary.ListSeparators;

	var EdmType = exportLibrary.EdmType;

	return BaseController.extend("application.controller.MsgPortal", {

		onInit: function () {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("MsgPortal").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {

			var that = this;

			that.onCriarModels();
			
			var CodRepres = this.getModelGlobal("modelAux").getProperty("/CodRepres");

			that.oModel.read("/P_Msgs", {
				urlParameters: {
					"$filter": "Usuario eq '" + CodRepres + "'"
				},
				success: function (retorno) {

					that.vetorMsg = retorno.results;

					that.getModel("modelMsg").setData(that.vetorMsg);
				},
				error: function (error) {
					that.onMensagemErroODATA(error);
				}
			});
		},

		onEditarPress: function (oEvent) {

			var that = this;
			var oList = oEvent.getParameter("listItem") || oEvent.getSource();
			var Msg = oList.getBindingContext("modelMsg").getObject();
			
			var oModel = new JSONModel(Msg);
			this.setModelGlobal(oModel, "Msg");
			
			sap.ui.core.UIComponent.getRouterFor(that).navTo("MsgPortalDetalhe");
		},
		
		onItemPress: function (oEvent) {

			var that = this;
			var oList = oEvent.getParameter("listItem") || oEvent.getSource();
			var Msg = oList.getBindingContext("modelMsg").getObject();
			
			var oModel = new JSONModel(Msg);
			this.setModelGlobal(oModel, "Msg");
			
			sap.ui.core.UIComponent.getRouterFor(that).navTo("MsgPortalDetalhe");
		},

		onCriarModels: function () {

			this.oModel = this.getModel();

			this.vetorMsg = {
				items: [] 
			};

			var oModel = new JSONModel(this.vetorMsg);
			this.setModel(oModel, "modelMsg");

			this.getView().setModel(new JSONModel(Device), "device");

			this.getView().setModel(new JSONModel({
				"maximumFilenameLength": 55,
				"maximumFileSize": 1000,
				"mode": ListMode.SingleSelectMaster,
				"uploadEnabled": false,
				"uploadButtonVisible": false,
				"enableEdit": false,
				"enableDelete": false,
				"visibleEdit": false,
				"visibleDelete": false,
				"listSeparatorItems": [
					ListSeparators.All,
					ListSeparators.None
				],
				"showSeparators": ListSeparators.All,
				"listModeItems": [{
					"key": ListMode.MultiSelect,
					"text": "Multi"
				}]
			}), "settings");

			this.getView().setModel(new JSONModel({
				"items": ["jpg", "txt", "ppt", "doc", "xls", "xlsx", "docx", "pdf", "png"],
				"selected": ["jpg", "txt", "ppt", "doc", "xls", "xlsx", "docx", "pdf", "png"]
			}), "fileTypes");
		},

		onSelectionChange: function () {

			var oUploadCollection = this.getView().byId("UploadCollection");

			if (oUploadCollection.getSelectedItems().length > 0) {
				this.getView().byId("downloadButton").setEnabled(true);

			} else {
				this.getView().byId("downloadButton").setEnabled(false);
			}
		},

		onDownloadItem: function () {

			var oUploadCollection = this.getView().byId("UploadCollection");

			var aSelectedItems = oUploadCollection.getSelectedItems();

			if (aSelectedItems) {

				for (var i = 0; i < aSelectedItems.length; i++) {

					aSelectedItems[i].setUrl(aSelectedItems[i].getBindingContext("modelMsg").getObject().url);
					oUploadCollection.downloadItem(aSelectedItems[i], true);
					aSelectedItems[i].setUrl("");
				}

			} else {

				sap.m.MessageBox.show(
					"Selecione um item para fazer o download!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Informação",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (oAction) {

						}
					}
				);
			}
		},
	});
});