/*eslint-disable no-console, no-alert */
/*eslint-disable no-eq-null, no-alert */
/*eslint-disable eqeqeq, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/core/mvc/Controller",
	"sap/m/Input"
], function(BaseController, MessageBox) {
	"use strict";

	return BaseController.extend("application.controller.App", {

		onInit: function(evt) {
			
		},

		onAfterRendering: function() {

		},

		handlePressHome: function(e) {
			var that = this;

			sap.ui.core.UIComponent.getRouterFor(that).navTo("menu");
			that.getOwnerComponent().getModel("modelAux").setProperty("/NrPedido", "");
		},

		showId: function() {
			
			var id = this.getModelGlobal("modelAux").getProperty("/CodRepres");
			
			if (id == "undefined" || id == "" || id == null) {
				sap.m.MessageToast.show("Selecione uma empresa e/ou faça login.", {
					duration: 5000
				});
			} else {
				sap.m.MessageToast.show("Usuário:" + id, {
					duration: 5000
				});
			}

		},

		showVersion: function () {

			var id = this.getModelGlobal("modelAux").getProperty("/VersaoApp");

			if (id == "undefined" || id == "" || id == null) {

				sap.m.MessageToast.show("Sem versões disponíveis. Contate o administrador.", {
					duration: 5000
				});
			} else {
				sap.m.MessageToast.show("Versão:" + id, {
					duration: 5000
				});
			}
		},
		
		handleLogoffPress: function() {
			
			var that = this; // RECONHECE O CONTROLER ATUAL CHAMADO.
			// if (sap.ui.core.UIComponent.getRouterFor(this) == "login") {
			var rota = this.getRouter().getRoute("login");
			if (rota._oRouter._sActiveRouteName == "login") {
				MessageBox.show("Você já está na página de login. Faça login!", {
					icon: MessageBox.Icon.Warning,
					title: "Faça o Login!",
					actions: [MessageBox.Action.OK]
				});
			} else {
				MessageBox.show("Você vai ser redirecionado para a página de inicial para fazer login novamente.", {
					icon: MessageBox.Icon.ERROR,
					title: "Logout realizado.",
					actions: [MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
					onClose: function(oAction) {
						if (oAction == sap.m.MessageBox.Action.YES) {
							// sap.ui.getCore().byId("usuario").setValue("PortalPredilecta");
							// sap.ui.getCore().byId("Senha").getValue("PortalPredilecta");
							that.getOwnerComponent().getModel("modelAux").setProperty("/homeVisible", false);
							sap.ui.core.UIComponent.getRouterFor(that).navTo("login");
							// that.onResetaCamposPrePedido();
						}
					}
				});
			}
		}
	});
});