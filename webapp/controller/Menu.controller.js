/*eslint-disable no-console, no-alert */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"application/controller/BaseController"

], function (Controller, BaseController) {
	"use strict";

	return BaseController.extend("application.controller.Menu", {

		onInit: function () {
			// sap.ui.getCore().byId("__component0---app--MyShell").setHeaderVisible(false);
			// this.setShellHeader(true);
			this.getRouter().getRoute("menu").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function (oEvent) {

			var that = this;

			this.oModel = this.getView().getModel();
			var CodRepres = this.getModelGlobal("modelAux").getProperty("/CodRepres");
			var Cliente = "";
			var Envio = true;

			this.byId("idPage").setBusy(true);

			new Promise(function (res, rej) {

				that.oModel.read("/P_PedidoQ/$count", {
					urlParameters: {
						"$filter": "IvUsuario eq '" + CodRepres + "' and IvKunnr eq '" + Cliente + "' and IvEnvio eq " + Envio
					},
					success: function (data) {

						res(data);
					},
					error: function (error) {

						rej(error);
					}
				});

			}).then(function (data) {

				var menu = that.getModelGlobal("modelMenu").getData();

				var objGeral = {
					Principal: [], //posição 01
					Consultas: [], //posição 02
					Relatorios: [] //posição 03
				};

				for (var i = 0; i < menu.length; i++) {
					var posicao = menu[i].Posicao;

					var vetorGeral = {
						"id": "",
						"icon": "",
						"title": "",
						"info": "",
						"visible": "",
						"number": ""
					};

					vetorGeral.id = menu[i].IdMenu;
					vetorGeral.icon = menu[i].Icone;
					vetorGeral.title = menu[i].DescMenu;
					vetorGeral.info = menu[i].InfoAdic;
					vetorGeral.visible = menu[i].Ativo;
					vetorGeral.number = menu[i].Numero;

					if (posicao == "01") {

						if (vetorGeral.id == "P02") {
							vetorGeral.number = data;
						}

						objGeral.Principal.push(vetorGeral);

					} else if (posicao == "02") {

						objGeral.Consultas.push(vetorGeral);
					} else if (posicao == "03") {

						objGeral.Relatorios.push(vetorGeral);
					}
				}

				that.getModel("menu").setData(objGeral);
				that.byId("idPage").setBusy(false);

			}).catch(function (error) {

				that.byId("idPage").setBusy(false);
				that.onMensagemErroODATA(error);
			});

		},

		onTile: function (oEvent) {

			switch (oEvent.getSource().data("opcao")) {
			case "P01":
				sap.ui.core.UIComponent.getRouterFor(this).navTo("pedido");
				break;
			case "P02":
				sap.ui.core.UIComponent.getRouterFor(this).navTo("enviarPedidos");
				break;
			case "P03":
				sap.ui.core.UIComponent.getRouterFor(this).navTo("menuRelatorios");
				break;
			case "P04":
				sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas");
				break;
			default:
				sap.ui.core.UIComponent.getRouterFor(this).navTo("NotFound");
				break;
			}
		},

		onMenu: function () {

		},

		onDialogCloseImagem: function () {

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}
		},

		onAfterRendering: function () {

		}
	});

});