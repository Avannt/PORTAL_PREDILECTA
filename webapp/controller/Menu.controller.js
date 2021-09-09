/*eslint-disable no-console, no-alert */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel"

], function (Controller, BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("application.controller.Menu", {

		onInit: function () {
			// sap.ui.getCore().byId("__component0---app--MyShell").setHeaderVisible(false);
			// this.setShellHeader(true);
			this.getRouter().getRoute("menu").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function (oEvent) {

			var that = this;
			var CodRepres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			var Cliente = "";
			var Envio = true;
			var Count = true;
			
			that.oModel = that.getModel();

			new Promise(function (res, rej) {

				that.onBuscarPedidos(Cliente, CodRepres, Envio, res, rej, that, Count);

			}).then(function (result) {

				that.getModelGlobal("modelAux").setProperty("/PedidosPend", result);

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

					if (menu[i].IdMenu == "P02") { //Envio de pedidos

						vetorGeral.number = that.getModelGlobal("modelAux").getProperty("/PedidosPend");
					} else {

						vetorGeral.number = menu[i].Numero;
					}

					if (posicao == "01") {
						objGeral.Principal.push(vetorGeral);
					} else if (posicao == "02") {
						objGeral.Consultas.push(vetorGeral);
					} else if (posicao == "03") {
						objGeral.Relatorios.push(vetorGeral);
					}
				}
				that.getModel("menu").setData(objGeral);

			}).catch(function (error) {

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