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

	return BaseController.extend("application.controller.MsgPortalDetalhe", {

		onInit: function () {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("MsgPortalDetalhe").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {

			var that = this;

			that.onCriarModels();

			// that.oModel.read("/P_Msgs", {
			// 	// urlParameters: {
			// 	// 	"$filter": "IvUsuario eq '" + repres + "'"
			// 	// },
			// 	success: function (retorno) {

			// 		var vetorMsg = retorno.results;

			// 		for (var i = 0; i < vetorMsg.length; i++) {

			// 			var mimeType = vetorMsg[i].NmArquivoFisico.split(".");
			// 			mimeType = mimeType[mimeType.length - 1];

			// 			if (mimeType == "xlsx" && mimeType == "xls") {

			// 				mimeType = "application/vnd.ms-excel";

			// 			} else if (mimeType == "jpeg") {

			// 				mimeType = "image/jpeg";

			// 			} else if (mimeType == "txt") {

			// 				mimeType = "text/plain";

			// 			} else if (mimeType == "png") {

			// 				mimeType = "image/png";

			// 			} else if (mimeType == "docx") {

			// 				mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

			// 			} else if (mimeType == "pptx") {

			// 				mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

			// 			} else if (mimeType == "pdf") {

			// 				mimeType = "application/pdf";

			// 			} else {

			// 				mimeType = "application/octet-stream";
			// 			}

			// 			var status = "None";

			// 			if (vetorMsg[i].Prioridade == "01") {
			// 				status = "Success";
			// 			} else if (vetorMsg[i].Prioridade == "02") {
			// 				status = "Warning";
			// 			} else if (vetorMsg[i].Prioridade == "03") {
			// 				status = "Error";
			// 			}

			// 			var vAux = {
			// 				"documentId": vetorMsg[i].CodMensagem,
			// 				"fileName": vetorMsg[i].NmArquivoFisico,
			// 				"mimeType": mimeType,
			// 				"thumbnailUrl": "",
			// 				"url": vetorMsg[i].UrlDownload,
			// 				"attributes": [{
			// 					"title": "Título da Mensagem",
			// 					"text": vetorMsg[i].TituloMensagem,
			// 					"active": true
			// 				}, {
			// 					"title": "Texto",
			// 					"text": vetorMsg[i].TextoMensagem,
			// 					"active": true
			// 				}, {
			// 					"title": "Ini Validade",
			// 					"text": vetorMsg[i].DatIniValid,
			// 					"active": false
			// 				}, {
			// 					"title": "Fim Validade",
			// 					"text": vetorMsg[i].DatFimValid,
			// 					"active": false
			// 				}],
			// 				"statuses": [{
			// 					"title": "Prioridade",
			// 					"text": vetorMsg[i].DescPrioridade,
			// 					"state": status
			// 				}],
			// 				// "markers": [{
			// 				// }
			// 				// 	"type": "Flagged"
			// 				// ],
			// 				"selected": false
			// 			};

			// 			that.vetorMsg.items.push(vAux);
			// 		}

			// 		that.getModel("Msg").setData(that.vetorMsg);
			// 	},
			// 	error: function (error) {
			// that.onMensagemErroODATA(error);
			// 	}
			// });

			var Msg = this.getModelGlobal("Msg").getData();

			new Promise(function (res, rej) {

				that.onBuscarAnexos(Msg.CodMensagem, res, rej);

			}).then(function (data) {

				var vetorAnexos = {
					"Itens": []
				};

				// var Itens = [];
				// vetorAnexos.Itens = Itens;

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
							"title": "Enviado em",
							"data": data[i].Sydate,
							"hora": data[i].Sytime,
							"active": false
						}, {
							"title": "Tamanho Arquivo",
							"text": data[i].TamanhoArquivo,
							"active": false
						}],
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

					vetorAnexos.Itens.push(Anexo);
				}

				var oModelAnexos = new JSONModel(vetorAnexos);
				that.setModel(oModelAnexos, "modelAnexos");

				that.getModel("modelTela").setProperty("/QtdAnexo", vetorAnexos.Itens.length);

				that.byId("UploadCollection").setBusy(false);

			}).catch(function (error) {

				that.onMensagemErroODATA(error);
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

			this.vetorMsg = {
				items: []
			};

			var aux = {
				QtdAnexo: 0,
				Token: ""
			};

			var oModel = new JSONModel(aux);
			this.setModel(oModel, "modelTela");

			this.getView().setModel(new JSONModel(Device), "device");

			this.getView().setModel(new JSONModel({
				"maximumFilenameLength": 55,
				"maximumFileSize": 1000,
				"mode": ListMode.SingleSelectMaster,
				"uploadEnabled": true,
				"uploadButtonVisible": true,
				"enableEdit": false,
				"enableDelete": true,
				"visibleEdit": false,
				"visibleDelete": true,
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

			this.deleteItemById(oEvent.getParameter("documentId"));

		},

		deleteItemById: function (sItemToDeleteId) {

			var oData = this.getView().byId("UploadCollection").getModel().getData();
			var aItems = jQuery.extend(true, {}, oData).items;
			jQuery.each(aItems, function (index) {
				if (aItems[index] && aItems[index].documentId === sItemToDeleteId) {
					aItems.splice(index, 1);
				}
			});
			this.getView().byId("UploadCollection").getModel().setData({
				"items": aItems
			});

			this.getView().byId("attachmentTitle").setText(this.getAttachmentTitleText());
		},

		deleteMultipleItems: function (aItemsToDelete) {

			var oData = this.getView().byId("UploadCollection").getModel().getData();
			var nItemsToDelete = aItemsToDelete.length;
			var aItems = jQuery.extend(true, {}, oData).items;
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
				"items": aItems
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
			var aItems = jQuery.extend(true, {}, oData).items;
			var sDocumentId = oEvent.getParameter("documentId");

			jQuery.each(aItems, function (index) {
				if (aItems[index] && aItems[index].documentId === sDocumentId) {
					aItems[index].fileName = oEvent.getParameter("item").getFileName();
				}
			});
			this.getView().byId("UploadCollection").getModel().setData({
				"items": aItems
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

			oData.Itens.unshift({
				"documentId": idAnexo,
				"fileName": oEvent.getParameter("files")[0].fileName,
				"mimeType": "",
				"thumbnailUrl": "",
				"url": "",
				"attributes": [{
					"title": "Enviado em",
					"text": data[0],
					"active": false
				},{
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
				value: name + "|" + that.getModelGlobal("Msg").getProperty("/CodMensagem")
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