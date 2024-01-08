/*eslint-disable no-console, no-alert */
/*eslint-disable no-console, sap-no-hardcoded-url */
sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"application/controller/BaseController",
		"sap/m/MessageBox"
		// "application/js/index"
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
				this.getModelGlobal("modelAux").setProperty("/VersaoApp", "2.4");
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
					Login: "",
					Senha: "",
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

				var that = this;

				this.getView().byId("idPageLogin").setBusy(true);
				var CodRepres = this.byId("idLogin").getValue();
				var Senha = this.byId("idSenha").getValue();
				var Imei = "WEB";

				var VersaoApp = this.getModelGlobal("modelAux").getProperty("/VersaoApp");
				var oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");
				var SistemaOp = that.getModelGlobal("modelAux").getProperty("/SistemaOper");

				oModel.read("/Logins(IvUsuario='" + CodRepres + "',IvSenha='" + Senha + "',IvSistOper='" + SistemaOp +
					"',IvImei='" + Imei + "',IvVersaoApp='" + VersaoApp + "')", {
						success: function (retorno) {
							
							debugger;

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