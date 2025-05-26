/*eslint-disable no-console, no-alert */
/*eslint-disable no-console, sap-no-hardcoded-url */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"application/controller/BaseController",
	"sap/m/MessageBox"
],
	function (Controller, BaseController, MessageBox) {
		"use strict";
		var idbSupported = false;
		var ImeiResult = [];

		return BaseController.extend("application.controller.Login", {

			onInit: function () {
				this.getRouter().getRoute("login").attachPatternMatched(this._onLoadFields, this);
			},

			_onLoadFields: function () {

				var that = this;

				this.onInicializaModels();
				/*
				Alterar aqui o ambiente:
				PRD => ReleasePRD = TRUEa
				QAS => ReleasePRD = FALSE
				*/
				this.getModelGlobal("modelAux").setProperty("/ReleasePRD", false);
				this.getModelGlobal("modelAux").setProperty("/VersaoApp", "4.4");
				this.getModelGlobal("modelAux").setProperty("/Werks", "1000");
				this.getModelGlobal("modelAux").setProperty("/EditarIndexItem", 0);
				this.getModelGlobal("modelAux").setProperty("/bConectado", false);

				//Tipo de dispositivo:
				//01 - Android
				//02 - Portal
				//03 - Todos

				this.getModelGlobal("modelAux").setProperty("/SistemaOper", "02");

				var sUrl;
				//Versão App
				if (this.getModelGlobal("modelAux").getProperty("/ReleasePRD")) {

					//sUrl = "http://172.16.200.130:8000/sap/opu/odata/sap/ZSF_FV_SRV/"; // DEV 310
					sUrl = "http://srvaplsapqas.predilecta.com.br:8010/sap/opu/odata/sap/ZSF_FV_SRV/"; // QAS 410

					var oModel = new sap.ui.model.odata.ODataModel(sUrl, {
						user: "t_rcardilo",
						password: "sap123",
						headers: {
							"sap-client": "480",
							"sap-language": "PT",
							"Authorization": "Basic " + btoa("t_rcardilo" + ":" + "sap123"),
							"Access-Control-Allow-Origin": "*"
						}
					});

					this.getView().setModel(oModel);
					this.getModelGlobal("modelAux").setProperty("/DBModel", oModel);
					this.getModelGlobal("modelAux").setProperty("/Url", sUrl);

				} else { // QAS

					sUrl = "/sap/opu/odata/sap/ZSF_FV_SRV/";
					this.getModelGlobal("modelAux").setProperty("/DBModel", this.getView().getModel());
					this.getModelGlobal("modelAux").setProperty("/Url", sUrl);
				}
			},

			onInicializaModels: function () {

				var oModelAux = new sap.ui.model.json.JSONModel({
					CodRepres: "",
					Usuario: "",
					NomeRepres: "",
					Imei: "",
					VersaoApp: "",
					Login: "800126",
					Senha: "93MA56",
					SistemaOper: "02",
					DataAtualizacao: "",
					Kunnr: "",
					NrPedido: "",
					EditarIndexItem: "",
					bConectado: false,
					DBModel: "",
					ReleasePRD: "",
					Lifnr: "",
					Email: "",
					DiasPedPend: 0,
					MaxDiasEntrega: 0,
					Url: "/sap/opu/odata/sap/ZSF_FV_SRV/",
					ValTotPedPend: 0,
					MaxDiasBloqTitulo: 0
				});
				this.setModelGlobal(oModelAux, "modelAux");

				var oModel = new sap.ui.model.json.JSONModel();
				this.setModelGlobal(oModel, "modelCliente");
				this.setModelGlobal(oModel, "modelMenu");
			},

			retornaDataAtualizacao: function () {

				var date = new Date();
				var dia = String(date.getDate());
				var mes = String(date.getMonth() + 1);
				var ano = String(date.getFullYear());
				ano = ano.substring(2, 4);
				var minuto = String(date.getMinutes());
				var hora = String(date.getHours());
				var seg = String(date.getSeconds());

				if (dia.length == 1) {
					dia = "0" + String(dia);
				}

				if (mes.length == 1) {
					mes = "0" + String(mes);
				}

				if (minuto.length == 1) {
					minuto = "0" + String(minuto);
				}
				if (hora.length == 1) {
					hora = "0" + String(hora);
				}
				if (seg.length == 1) {
					seg = "0" + String(seg);
				}
				//HRIMP E DATIMP
				//var horario = String(hora) + ":" + String(minuto) + ":" + String(seg);
				var data = String(dia + "/" + mes + "/" + ano);
				var horario = String(hora) + ":" + String(minuto);

				return data + " - " + horario;
			},

			getPermissao: function () {
				var that = this;

				function successCallbackPermissao(result) {

					if (result == "OK") {

						that.getImei();

					} else {

						MessageBox.show(
							"A recusa do acesso resultará a falha na autenticação. Deseja permitir?", {
							icon: MessageBox.Icon.ERROR,
							title: "Erro ao atualizar bases.",
							actions: [MessageBox.Action.YES, MessageBox.Action.NO],
							onClose: function (value) {
								if (value == MessageBox.Action.YES) {

									that.getPermissao();
								}
							}
						});
					}
				}

				function errorCallbackPermissao(error) {
					console.log(error);
					// that.getImei();
				}

				if (window.device.platform === "Android") {
					window.plugins.sim.requestReadPermission(this.successCallbackPermissao, this.errorCallbackPermissao);

				}
			},

			getImei: function () {
				var that = this;
				var isTablet = this.getModelGlobal("modelAux").getProperty("/isTablet");
				var isTablet = "Android";
				window.plugins.sim.hasReadPermission(successCallbackTemPermissao, successCallbackTemPermissao);

				//checa permisao
				function successCallbackTemPermissao(result) {
					if (result == true) {

						window.plugins.sim.getSimInfo(successCallbackImei, errorCallbackImei);

					} else {

						window.plugins.sim.requestReadPermission(successCallback, errorCallback);

					}
				}

				function errorCallbackTemPermissao(error) {
					console.log(error);
				}
				//READ PERMISSION
				function successCallbackImei(result) {
					that.getModelGlobal("modelAux").setProperty("/Imei", result.deviceId);
					console.log(result);
				}

				function errorCallbackImei(error) {
					console.log(error);
				}

				//pega info device
				function successCallback(result) {
					console.log(result);
				}

				function errorCallback(error) {
					console.log(error);
				}
			},

			onAfterRendering: function () {

			},

			onBusyDialogClosed: function () {

				if (this._ItemDialog) {
					this._ItemDialog.destroy(true);
				}
			},

			onOpenMudarSenha: function () {
				var that = this;

				// if (this.getModelGlobal("modelAux").getProperty("/autenticado")) {

				if (that._ItemDialog) {
					that._ItemDialog.destroy(true);
				}

				if (!that._CreateMaterialFragment) {

					that._ItemDialog = sap.ui.xmlfragment(
						"application.view.AlterarSenha",
						that
					);

					that.getView().addDependent(that._ItemDialog);
				}

				that._ItemDialog.open();

			},

			onPularSenha: function () {
				sap.ui.getCore().byId("idSenha").focus();
			},

			onPularSenha1: function () {
				sap.ui.getCore().byId("idSenhaNova").focus();
			},

			onPularSenha2: function () {
				sap.ui.getCore().byId("idSenhaNova2").focus();
			},

			onDialogMudarSenha: function () {

				var that = this;

				var modelAux = this.getModelGlobal("modelAux").getData();

				// var codRrepres = sap.ui.getCore().byId("idCodRepres").getValue();
				// var Senha = sap.ui.getCore().byId("idSenha").getValue();
				var SenhaNova = sap.ui.getCore().byId("idSenhaNova").getValue();
				var SenhaNova2 = sap.ui.getCore().byId("idSenhaNova2").getValue();

				if (modelAux.CodRepres == "" || modelAux.CodRepres == "undefined") {

					sap.m.MessageBox.show(
						"Preencher o código do representante!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Corrija os Campos!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (oAction) {
							sap.ui.getCore().byId("idCodRepres").focus();
						}
					}
					);

				} else if (modelAux.Senha == "" || modelAux.Senha == "undefined") {

					sap.m.MessageBox.show(
						"Preencher a Senha atual!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Corrija os Campos!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (oAction) {
							sap.ui.getCore().byId("idSenha").focus();
						}
					}
					);

				} else if (SenhaNova != SenhaNova2) {

					sap.m.MessageBox.show(
						"As Senhas são diferentes!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Corrija os Campos!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (oAction) {
							sap.ui.getCore().byId("idSenhaNova").focus();
						}
					}
					);

				} else {

					// var modelAux = this.getModelGlobal("modelAux").getData();

					sap.ui.getCore().byId("idDialogAlterarSenha").setBusy(true);

					modelAux.DBModel.read("/TrocarSenha(IvUsuario='" + modelAux.CodRepres + "',IvSenha='" + modelAux.Senha + "',IvSistOper='" +
						modelAux.SistemaOper + "',IvImei='" + modelAux.Imei + "',IvVersaoApp='" + modelAux.VersaoApp + "',IvSenhaNova='" + SenhaNova +
						"')", {
						success: function (retorno) {

							MessageBox.show("Senha foi alterada com sucesso!", {
								icon: MessageBox.Icon.SUCCESS,
								title: "Confirmação",
								actions: [MessageBox.Action.OK],
								onClose: function () {

									if (that._ItemDialog) {
										that._ItemDialog.destroy(true);
									}

								}
							});

						},
						error: function (error) {

							sap.ui.getCore().byId("idDialogAlterarSenha").setBusy(false);
							that.onMensagemErroODATA(error);

						}
					});
				}
			},

			onFecharAlteracaoSenha: function () {

				if (this._ItemDialog) {
					this._ItemDialog.destroy(true);
				}

			},

			onStartWorking: function () {

				// var method = 'GET';
				// var filepath = 'https://drive.usercontent.google.com/u/0/uc?id=1GWtHIVZV_yeCJV6zzLkZsv3HaGJpBOtV&export=download';

				// $.ajax({
				// 	url: filepath,
				// 	type: 'get',
				// 	dataType: 'text',
				// 	success: function (data) {
				// 		
				// 		alert(data.query.results.body.p);
				// 	},
				// 	error: function (jqXHR, textStatus, errorThrow) {
				// 		
				// 		alert(jqXHR['responseText']);
				// 	}
				// });

				// $.ajax({
				// 	type: "GET",
				// 	url: filepath,
				// 	dataType: "text",
				// 	success: function (data) {
				// 		alert(data);
				// 		
				// 	},
				// 	error: function (xhr, ajaxOptions, thrownError) {
				// 		alert("Status: " + xhr.status + "     Error: " + thrownError);
				// 	}
				// });

				var that = this;

				// this.getView().byId("idPageLogin").setBusy(true);
				var CodRepres = this.byId("idLogin").getValue();
				var Senha = this.byId("idSenha").getValue();
				var Imei = "WEB";

				var VersaoApp = this.getModelGlobal("modelAux").getProperty("/VersaoApp");
				var oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");
				var SistemaOp = that.getModelGlobal("modelAux").getProperty("/SistemaOper");

				oModel.read("/Logins(IvUsuario='" + CodRepres + "',IvSenha='" + Senha + "',IvSistOper='" + SistemaOp +
					"',IvImei='" + Imei + "',IvVersaoApp='" + VersaoApp + "')", {
					success: function (retorno) {

						

						that.getModelGlobal("modelAux").setProperty("/CodRepres", CodRepres);
						that.getModelGlobal("modelAux").setProperty("/NomeRepres", retorno.EvNomeRepres);
						that.getModelGlobal("modelAux").setProperty("/Login", CodRepres);
						that.getModelGlobal("modelAux").setProperty("/Senha", Senha);
						that.getModelGlobal("modelAux").setProperty("/Lifnr", retorno.EvLifnr);
						that.getModelGlobal("modelAux").setProperty("/Email", retorno.EvEmail);
						that.getModelGlobal("modelAux").setProperty("/DiasPedPend", retorno.EvDiasPedPend);
						that.getModelGlobal("modelAux").setProperty("/MaxDiasEntrega", retorno.EvMaxDiasEntrg);
						that.getModelGlobal("modelAux").setProperty("/DiasTituloVenc", retorno.EvMDiasTituloVenc);

						oModel.read("/Menus", {
							urlParameters: {
								"$filter": "IvUsuario eq '" + CodRepres + "' and IvSistOper eq '" + SistemaOp + "'"
							},
							success: function (result) {
								var vetor = result.results.sort();
								that.getModelGlobal("modelMenu").setData(vetor);

								sap.ui.core.UIComponent.getRouterFor(that).navTo("menu");
								that.getView().byId("idPageLogin").setBusy(false);
							},
							error: function (error) {

								that.getView().byId("idPageLogin").setBusy(false);

								console.log(error);
								that.onMensagemErroODATA(error);
							}
						});
					},
					error: function (error) {

						that.getView().byId("idPageLogin").setBusy(false);
						console.log(error);
						that.onMensagemErroODATA(error);
					}
				});
			},

			onEntrarCSV: function () {

				let tokenClient;
				let accessToken = null;
				let pickerInited = false;
				let gisInited = false;

				const clientId = '';
				const apiKey = "";
				const scope = 'https://www.googleapis.com/auth/drive.readonly';
				const fileId = '1GWtHIVZV_yeCJV6zzLkZsv3HaGJpBOtV';

				var myHeaders = new Headers();
				myHeaders.append("Cookie", "__Host-GAPS=1:iHo03JcmT4tL39QdP1rD4vik5LhmVQ:mZZuPY6OdVBXjWbO");

				var requestOptions = {
					method: 'POST',
					headers: myHeaders,
					redirect: 'follow'
				};

				fetch("https://accounts.google.com/o/oauth2/v2/auth?client_id=934285555664-tg68esjee7uoa9kqq2ltpjha1h1l3a4d.apps.googleusercontent.com&refresh_token=&response_type=code&redirect_uri=https://port8080-workspaces-ws-mlqzn.br10.applicationstudio.cloud.sap&scope=https://www.googleapis.com/auth/drive.readonly", requestOptions)
					.then(response => response.text())
					.then(result => console.log(result))
					.catch(error => console.log('error', error));
			},

			onGetCSV: function () {
				debugger

				function updateSigninStatus(isSignedIn) {
					if (isSignedIn) {
						// Usuário autenticado, pode fazer chamadas à API
						listFiles();
					}
				}

				let tokenClient;
				let accessToken = null;
				let pickerInited = false;
				let gisInited = false;

				const clientId = '';
				const apiKey = '';
				const scope = 'https://www.googleapis.com/auth/drive.readonly';
				const fileId = '1GWtHIVZV_yeCJV6zzLkZsv3HaGJpBOtV';

				// initClient();

				// function initClient() {

				// 	gapi.load('auth2', function () {
				// 		gapi.auth2.init({
				// 			client_id: clientId
				// 		}).then(function (auth2) {
				// 			// Configurar o Google Sign-In
				// 			auth2.isSignedIn.listen(updateSigninStatus);
				// 			updateSigninStatus(auth2.isSignedIn.get());

				// 			handleAuthClick();
				// 		});
				// 	});
				// }


				// function updateSigninStatus(isSignedIn) {
				// 	if (isSignedIn) {
				// 		// Após a autenticação bem-sucedida, você pode fazer chamadas à API
				// 		listFiles();
				// 	}
				// }
				// function handleAuthClick() {
				// 	gapi.auth2.getAuthInstance().signIn();
				// }

				// function listFiles() {
				// 	gapi.client.drive.files.list({
				// 		pageSize: 10,
				// 		fields: "nextPageToken, files(id, name)"
				// 	}).then(function (response) {
				// 		const files = response.result.files;
				// 		if (files && files.length > 0) {
				// 			for (const file of files) {
				// 				console.log(`${file.name} (${file.id})`);
				// 			}
				// 		} else {
				// 			console.log('No files found.');
				// 		}
				// 	});
				// }

				// // Use the API Loader script to load google.picker
				// function onApiLoad() {
				// 	gapi.load('picker', onPickerApiLoad);
				// }

				// function onPickerApiLoad() {
				// 	pickerInited = true;
				// }

				// function gisLoaded(res, rej) {
				// 	// TODO(developer): Replace with your client ID and required scopes.
				// 	tokenClient = google.accounts.oauth2.initTokenClient({
				// 		client_id: clientId,
				// 		scope: scope,
				// 		callback: createPicker, // defined later
				// 	});
				// 	gisInited = true;
				// }

				// createPicker();

				// new Promise(function (res, rej) {

				// 	gisLoaded(res, rej);

				// }).then(function (dado) {

				// // createPicker();
				// // downloadFile();
				// }).catch(function (error) {

				// 	
				// });

				// onApiLoad();



				// function handleClientLoad() {
				// 	gapi.load('client:auth2', initClient);
				//   }

				//   function initClient() {
				// 	gapi.client.init({
				// 	  apiKey: apiKey,
				// 	  clientId: clientId,
				// 	  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
				// 	  scope: 'https://www.googleapis.com/auth/drive.readonly',
				// 	}).then(function () {

				// 		console.log("OK AUTENTICADO")
				// 	  // Faça a chamada da API após a autenticação ser bem-sucedida
				// 	  // ...
				// 	});
				//   }

				//   // Inicialize a biblioteca de autenticação ao carregar a página
				//   handleClientLoad();

				// gapi.load('client:auth2', initClient);

				// function initClient() {
				//   gapi.client.init({
				// 	apiKey: apiKey,
				// 	clientId: clientId,
				// 	discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
				// 	scope: scope
				//   }).then(function () {
				// 	document.getElementById('downloadButton').addEventListener('click', downloadFile);
				//   });
				// }

				function createPicker() {

					const picker = new google.picker.PickerBuilder()
						.addView(google.picker.ViewId.DOCS)
						.setOAuthToken(accessToken)
						.setDeveloperKey(apiKey)
						.setCallback(pickerCallback)
						.build();

					const showPicker = () => {
						// TODO(developer): Replace with your API key
						picker.setVisible(true);
					}


					// Request an access token.
					tokenClient.callback = async (response) => {
						if (response.error !== undefined) {
							throw (response);
						}
						accessToken = response.access_token;
						showPicker();
					};

					// if (accessToken === null) {
					// 	// Prompt the user to select a Google Account and ask for consent to share their data
					// 	// when establishing a new session.
					// 	tokenClient.requestAccessToken({ prompt: 'consent' });
					// } else {
					// 	// Skip display of account chooser and consent dialog for an existing session.
					// 	tokenClient.requestAccessToken({ prompt: '' });
					// }

					function pickerCallback(data) {
						debugger
						let url = 'nothing';
						if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
							let doc = data[google.picker.Response.DOCUMENTS][0];
							url = doc[google.picker.Document.URL];
						}
						let message = `You picked: ${url}`;
						document.getElementById('result').innerText = message;
					}
				}



				function downloadFile() {
					gapi.client.drive.files.get({
						fileId: fileId,
						alt: 'media'
					}).then(function (response) {
						const fileData = response.body;

						// Create a Blob from the file data
						const blob = new Blob([fileData], { type: 'application/octet-stream' });

						// Create a link element and trigger a download
						const link = document.createElement('a');
						link.href = window.URL.createObjectURL(blob);
						link.download = 'downloaded-file.txt';
						link.click();
					}, function (error) {
						console.error('Error downloading file:', error.result.error.message);
					});
				}

			},

			onLoginChange: function () {
				sap.ui.getCore().byId("idSenha").focus();
			},

			onDialogPromocoesCancelButton: function () {
				if (this._ItemDialog) {
					this._ItemDialog.destroy(true);
				}
			}
		});
	});