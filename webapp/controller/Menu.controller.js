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
			var menu = this.getModelGlobal("modelMenu").getData();
			
			var objGeral = {
				Principal: [], //posição 01
				Consultas: [], //posição 02
				Relatorios: [] //posição 03
			};
			
			for(var i=0; i<menu.length; i++){
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
				
				if(posicao == "01"){ 
					objGeral.Principal.push(vetorGeral);
				} else if(posicao == "02"){
				 	objGeral.Consultas.push(vetorGeral);
				} else if(posicao == "03"){
				 	objGeral.Relatorios.push(vetorGeral);
				}
			}
			
			this.getModel("menu").setData(objGeral);
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