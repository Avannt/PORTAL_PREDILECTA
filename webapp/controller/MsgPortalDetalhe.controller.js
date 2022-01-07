/*eslint-disable no-unused-vars, no-alert */
/*eslint-disable no-console, no-alert */
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

	return BaseController.extend("application.controller.MsgPortalDetalhe", {

		onInit: function () {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("MsgPortalDetalhe").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {

			var that = this;

			that.onCriarModels();

			var Msg = this.getModelGlobal("Msg").getData();

			new Promise(function (res, rej) {

				that.onBuscarAnexos(Msg.CodMensagem, res, rej);

			}).then(function (data) {

				for (var i = 0; i < data.length; i++) {

					var idAnexo = data[i].Filename + "|" + data[i].CodMensagem;

					var Anexo = {
						"documentId": idAnexo,
						"fileName": data[i].Filename,
						"mimeType": data[i].Mimetype,
						"thumbnailUrl": "",
						"url": "/sap/opu/odata/sap/ZSF_FV_SRV/Files('" + idAnexo + "')/$value",
						"attributes": [{
								"title": "Enviado por",
								"text": data[i].CriadoPor,
								"active": false
							}, {
								"title": "",
								"text": data[i].Nome,
								"active": false
							}, {
								"title": "Enviado em",
								"text": data[i].Sydate,
								"active": false
							}, {
								"title": "",
								"text": data[i].Sytime,
								"active": false
							}
							// {
							// 	"title": "Tamanho Arquivo",
							// 	"text": data[i].TamanhoArquivo,
							// 	"active": false
							// }
						],
						"statuses": [{
							"title": "Status",
							"text": "Enviado",
							"state": "Success"
						}],
						"markers": [{
							"type": "Locked"
						}],
						"selected": false
					};

					that.vetorAnexos.itens.push(Anexo);
				}

				var oModelAnexos = new JSONModel(that.vetorAnexos);
				that.setModel(oModelAnexos, "modelAnexos");

				that.getModel("modelTela").setProperty("/QtdAnexo", that.vetorAnexos.itens.length);

				new Promise(function (res, rej) {

					that.onBuscarAdmin(that.getModelGlobal("modelAux").getProperty("/CodRepres"), res, rej);

				}).then(function (dataAnexo) {

					if (dataAnexo.EvAdmin == true) {

						that.getModel("settings").setProperty("/visibleDelete", true);
						that.getModel("settings").setProperty("/enableDelete", true);
						that.getModel("settings").setProperty("/uploadEnabled", true);
						that.getModel("settings").setProperty("/uploadButtonVisible", true);

					} else {
						
						that.getModel("settings").setProperty("/visibleDelete", false);
						that.getModel("settings").setProperty("/enableDelete", false);
						that.getModel("settings").setProperty("/uploadEnabled", false);
						that.getModel("settings").setProperty("/uploadButtonVisible", false);
					}

					that.byId("UploadCollection").setBusy(false);

				}).catch(function (error) {

					that.onMensagemErroODATA(error);
				});

			}).catch(function (error) {

				that.onMensagemErroODATA(error);
			});
		},

		onBuscarAdmin: function (CodRepres, res, rej) {

			var that = this;

			that.getModel().read("/P_Admin_Anexos(IvCodRepres='" + CodRepres + "')", {
				success: function (data) {

					res(data);
				},
				error: function (errorLog) {

					rej(errorLog);
				}
			});
		},

		onBuscarAnexos: function (CodMsg, res, rej) {

			var that = this;

			that.byId("UploadCollection").setBusy(true);

			that.getModel().read("/P_AnexosQ", {
				urlParameters: {
					"$filter": "IvCodMensagem eq '" + CodMsg + "'"
				},
				success: function (data) {

					res(data.results);
				},
				error: function (errorLog) {

					that.byId("UploadCollection").setBusy(false);
					rej(errorLog);
				}
			});
		},

		onCriarModels: function () {

			this.oModel = this.getModel();

			this.vetorAnexos = {
				itens: []
			};

			var oModelAnexos = new JSONModel(this.vetorAnexos);
			this.setModel(oModelAnexos, "modelAnexos");

			var aux = {
				QtdAnexo: 0,
				Token: ""
			};

			var oModel = new JSONModel(aux);
			this.setModel(oModel, "modelTela");

			this.setModel(new JSONModel(Device), "device");

			this.setModel(new JSONModel({
				"maximumFilenameLength": 55,
				"maximumFileSize": 1000,
				"mode": ListMode.SingleSelectMaster,
				"uploadEnabled": true,
				"uploadButtonVisible": true,
				"enableEdit": false,
				"enableDelete": true,
				"visibleDelete": true,
				"visibleEdit": false,
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
			
			var tipo = {
				"items":    ["jpg", "jpeg", "txt", "ppt", "doc", "xls", "xlsx", "docx", "pdf", "png", "csv"],
				"selected": ["jpg", "jpeg", "txt", "ppt", "doc", "xls", "xlsx", "docx", "pdf", "png", "csv"]
			};
			
			var model = new JSONModel(tipo);
			
			try {
				
				this.setModel(model, "fileTypes");
				
			} catch(error){
				
				console.log(error);
			}
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

					aSelectedItems[i].setUrl(aSelectedItems[i].getBindingContext("modelAnexos").getObject().url);
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

		onChange: function (oEvent) {

			var that = this;
			var oUploadCollection = oEvent.getSource();
			var modelGlobal = this.getModelGlobal("modelAux").getData();

			if (modelGlobal.ReleasePrd == "true") {

				var url = modelGlobal.Url;

				$.ajax({
					url: url,
					type: "GET",
					async: false,
					crossDomain: true,
					beforeSend: function (xhr) {
						xhr.setRequestHeader("X-CSRF-Token", "Fetch");
					},
					complete: function (xhr) {

						var token = xhr.getResponseHeader("X-CSRF-Token");
						that.getModel("modelTela").setProperty("/Token", token);

						if (token === null) {

							$.ajax({
								url: url,
								type: "GET",
								async: false,
								beforeSend: function (xhr) {
									xhr.setRequestHeader("X-CSRF-Token", "Fetch");
								},
								complete: function (xhr) {

									token = xhr.getResponseHeader("X-CSRF-Token");
									that.getModel("modelTela").setProperty("/Token", token);

									var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
										name: "X-CSRF-Token",
										value: that.getModel("modelTela").getProperty("/Token")
									});

									oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

									var oCustomerHeaderToken1 = new sap.m.UploadCollectionParameter({
										name: "X-Requested-With",
										value: "X"
									});

									oUploadCollection.addHeaderParameter(oCustomerHeaderToken1);
								}
							});
						} else {

							var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
								name: "X-CSRF-Token",
								value: that.getModel("modelTela").getProperty("/Token")
							});

							oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

							var oCustomerHeaderToken1 = new sap.m.UploadCollectionParameter({
								name: "X-Requested-With",
								value: "X"
							});
							oUploadCollection.addHeaderParameter(oCustomerHeaderToken1);
						}
					}
				});

			} else {

				var token = this.oModel.getSecurityToken();
				that.getModel("modelTela").setProperty("/Token", token);

				var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
					name: "X-CSRF-Token",
					value: that.getModel("modelTela").getProperty("/Token")
				});

				oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

				var oCustomerHeaderToken1 = new sap.m.UploadCollectionParameter({
					name: "X-Requested-With",
					value: "X"
				});
				oUploadCollection.addHeaderParameter(oCustomerHeaderToken1);

			}
		},

		onFileDeleted: function (oEvent) {

			var that = this;

			var docId = oEvent.getParameter("documentId");
			var param = oEvent.getParameter("documentId").split("|");

			that.getModel().remove("/P_AnexosD(IvCodMensagem='" + param[1] + "',IvNomeArq='" + param[0] + "')", {
				// urlParameters: {
				// 	"$filter": "IvCodMensagem eq '" + CodMsg + "'"
				// },
				success: function (data) {

					that.deleteItemById(docId);
				},
				error: function (error) {

					that.byId("UploadCollection").setBusy(false);
					that.onMensagemErroODATA(error);
				}
			});

		},

		deleteItemById: function (sItemToDeleteId) {

			var oData = this.getView().byId("UploadCollection").getModel("modelAnexos").getData();
			var aItems = jQuery.extend(true, {}, oData).itens;
			jQuery.each(aItems, function (index) {
				if (aItems[index] && aItems[index].documentId === sItemToDeleteId) {
					aItems.splice(index, 1);
				}
			});

			this.getModel("modelTela").setProperty("/QtdAnexo", aItems.length);

			this.getView().byId("UploadCollection").getModel("modelAnexos").setData({
				"itens": aItems
			});

			// this.getView().byId("attachmentTitle").setText(this.getAttachmentTitleText());
		},

		deleteMultipleitens: function (aItemsToDelete) {

			var oData = this.getView().byId("UploadCollection").getModel().getData();
			var nItemsToDelete = aItemsToDelete.length;
			var aItems = jQuery.extend(true, {}, oData).itens;
			var i = 0;

			jQuery.each(aItems, function (index) {
				if (aItems[index]) {
					for (i = 0; i < nItemsToDelete; i++) {
						if (aItems[index].documentId === aItemsToDelete[i].getDocumentId()) {
							aItems.splice(index, 1);
						}
					}
				}
			});

			this.getView().byId("UploadCollection").getModel().setData({
				"itens": aItems
			});

			this.getView().byId("attachmentTitle").setText(this.getAttachmentTitleText());
		},

		getAttachmentTitleText: function () {
			var aItems = this.getView().byId("UploadCollection").getItems();
			return "Uploaded (" + aItems.length + ")";
		},

		onFilenameLengthExceed: function () {

			sap.m.MessageBox.show(
				"Renomeie o arquivo para um tamanho menor e sem acentuação! (max: 50 caracteres).", {
					icon: sap.m.MessageBox.Icon.WARNING,
					title: "Atenção!!",
					actions: [sap.m.MessageBox.Action.OK],
					onClose: function (oAction) {

					}
				}
			);
			// MessageToast.show("FilenameLengthExceed event triggered.");
		},

		onFileRenamed: function (oEvent) {

			var oData = this.getView().byId("UploadCollection").getModel().getData();
			var aItems = jQuery.extend(true, {}, oData).itens;
			var sDocumentId = oEvent.getParameter("documentId");

			jQuery.each(aItems, function (index) {
				if (aItems[index] && aItems[index].documentId === sDocumentId) {
					aItems[index].fileName = oEvent.getParameter("item").getFileName();
				}
			});
			this.getView().byId("UploadCollection").getModel().setData({
				"itens": aItems
			});
		},

		onFileSizeExceed: function () {

			sap.m.MessageBox.show(
				"O arquivo selecionado é muito grande! (max: 10 MB)", {
					icon: sap.m.MessageBox.Icon.WARNING,
					title: "Atenção",
					actions: [sap.m.MessageBox.Action.OK],
					onClose: function (oAction) {}
				}
			);
		},

		onTypeMissmatch: function () {

			sap.m.MessageBox.show(
				"Extensão do arquivo não permitida!", {
					icon: sap.m.MessageBox.Icon.WARNING,
					title: "Informação",
					actions: [sap.m.MessageBox.Action.OK],
					onClose: function (oAction) {

					}
				}
			);
		},

		onUploadComplete: function (oEvent) {

			var that = this;
			var CodMsg = this.getModel("Msg").getProperty("/CodMensagem");

			var oData1 = new Date();
			var min = String(oData1.getMinutes());
			if (min.length == 1) {
				min = "0" + min;
			}

			var seg = String(oData1.getSeconds());
			if (seg.length == 1) {
				seg = "0" + seg;
			}

			var hora = String(oData1.getHours());
			if (hora.length == 1) {
				hora = "0" + hora;
			}

			var data = that.onDataHora();

			var oHora = hora + ":" + min + ":" + seg;

			var oUploadCollection = this.getView().byId("UploadCollection");
			var oData = oUploadCollection.getModel("modelAnexos").getData();

			var idAnexo = oEvent.getParameter("files")[0].fileName + "|" + CodMsg;

			oData.itens.unshift({
				"documentId": idAnexo,
				"fileName": oEvent.getParameter("files")[0].fileName,
				"mimeType": "",
				"thumbnailUrl": "",
				"url": "",
				"attributes": [{
						"title": "Enviado em",
						"text": data[0],
						"active": false
					}, {
						"title": "",
						"text": data[1],
						"active": false
					},
					// {
					// 	"title": "Tamanho Arquivo",
					// 	"text": "505000",
					// 	"active": false
					// }
				],
				"statuses": [{
					"title": "Status",
					"text": "Enviado",
					"state": "Warning"
				}],
				"markers": [{}],
				"selected": false
			});

			this.getView().getModel("modelAnexos").refresh();

			// Sets the text to the label
			var QtdAnexo = oUploadCollection.getItems().length;
			this.getModel("modelTela").setProperty("/QtdAnexo", QtdAnexo);
		},

		onFormatFileName: function (fileName) {

			var nomeArq = fileName;
			nomeArq = nomeArq.toLowerCase();
			nomeArq = nomeArq.replace(/[^a-zA-Z0-9.]/g, ""); // Irá excluir todos exceto os que estão no regex
			nomeArq = nomeArq.replace(new RegExp('[ÁÀÂÃ]', 'gi'), 'a');
			nomeArq = nomeArq.replace(new RegExp('[ÉÈÊ]', 'gi'), 'e');
			nomeArq = nomeArq.replace(new RegExp('[ÍÌÎ]', 'gi'), 'i');
			nomeArq = nomeArq.replace(new RegExp('[ÓÒÔÕ]', 'gi'), 'o');
			nomeArq = nomeArq.replace(new RegExp('[ÚÙÛ]', 'gi'), 'u');
			nomeArq = nomeArq.replace(new RegExp('[Ç]', 'gi'), 'c');

			return nomeArq;
		},

		onBeforeUploadStarts: function (oEvent) {

			// var oUploadCollection = this.getView().byId("UploadCollection");
			var that = this;

			var name = oEvent.getParameter("fileName");

			name = this.onFormatFileName(name);

			var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
				name: "slug",
				value: name + "|" + that.getModelGlobal("Msg").getProperty("/CodMensagem") + "|" + that.getModelGlobal("modelAux").getProperty(
					"/CodRepres")
			});

			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);

			if (oEvent.getParameter("fileName").indexOf(".msg") > -1) {

				var oCustomerHeaderContent = new sap.m.UploadCollectionParameter({
					name: "Content-Type",
					value: "application/octet-stream"
				});

				oEvent.getParameters().addHeaderParameter(oCustomerHeaderContent);

			}
		},

		onUploadTerminated: function () {
			/*
			// get parameter file name
			var sFileName = oEvent.getParameter("fileName");
			// get a header parameter (in case no parameter specified, the callback function getHeaderParameter returns all request headers)
			var oRequestHeaders = oEvent.getParameters().getHeaderParameter();
			*/
		},

		onFileTypeChange: function (oEvent) {

			this.getView().byId("UploadCollection").setFileType(oEvent.getSource().getSelectedKeys());
		}
	});
});