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

			that.oModel.read("/P_Msgs", {
				// urlParameters: {
				// 	"$filter": "IvUsuario eq '" + repres + "'"
				// },
				success: function (retorno) {

					var vetorMsg = retorno.results;

					for (var i = 0; i < vetorMsg.length; i++) {
						
						var filename = vetorMsg.NmArquivoFisico.split("/");
						filename = filename[filename.length-1];
						
						var status = "None";
						
						if(vetorMsg.Prioridade == "01"){
							status = "Success";
						} else if(vetorMsg.Prioridade == "02"){
							status = "Warning";
						} else if(vetorMsg.Prioridade == "03"){
							status = "Error";
						}
						 

						var vAux = {
							"documentId": vetorMsg.CodMensagem,
							"fileName": filename,
							"mimeType": "",
							"thumbnailUrl": "",
							"url": vetorMsg.NmArquivoFisico,
							"attributes": [{
								"title": "Título da Mensagem",
								"text": vetorMsg.TituloMensagem,
								"active": false
							}, {
								"title": "Texto",
								"text": vetorMsg.TextoMensagem,
								"active": false
							}
							// , {
							// 	"title": "File Size",
							// 	"text": "5",
							// 	"active": false
							// }
							],
							"statuses": [{
								"title": "Prioridade",
								"text": vetorMsg.DescPrioridade,
								"state": status
							}],
							// "markers": [{
							// 	"type": "Flagged"
							// }
							// ],
							"selected": false
						};

						that.vetorMsg.items.push(vAux);
					}

					that.getModel("modelMsg").setData(that.vetorMsg);

				},
				error: function (error) {
					that.onMensagemErroODATA(error);
				}
			});
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
				"uploadEnabled": true,
				"uploadButtonVisible": true,
				"enableEdit": true,
				"enableDelete": true,
				"visibleEdit": true,
				"visibleDelete": true,
				"listSeparatorItems": [
					ListSeparators.All,
					ListSeparators.None
				],
				"showSeparators": ListSeparators.All,
				"listModeItems": [{
					"key": ListMode.SingleSelectMaster,
					"text": "Single"
				}, {
					"key": ListMode.MultiSelect,
					"text": "Multi"
				}]
			}), "settings");

			this.getView().setModel(new JSONModel({
				"items": ["jpg", "txt", "ppt", "doc", "xls", "pdf", "png"],
				"selected": ["jpg", "txt", "ppt", "doc", "xls", "pdf", "png"]
			}), "fileTypes");
		}
	});
});