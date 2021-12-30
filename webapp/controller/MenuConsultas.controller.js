sap.ui.define([
	"application/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("application.controller.MenuConsultas", {
		
		onInit: function () {
			this.getRouter().getRoute("menu").attachPatternMatched(this._onRouteMatched, this);
		},
		
		_onRouteMatched: function() {
			// var empresa = this.getOwnerComponent().getModel("modelAux").getProperty("/IdBase");
			// var nomeEmpresa;
			// var icone;
			
			// if(empresa == 1){
			// 	nomeEmpresa = "Pred -Só Fruta -Lafer";
			// 	icone = "img/predilecta.png";
			// }
			// else if(empresa == 2){
			// 	nomeEmpresa = "Stella";
			// 	icone = "img/SD.png";
			// }
			// else if(empresa == 3){
			// 	nomeEmpresa = "Minas";
			// 	icone = "img/soFrutas.png";
			// }
			// this.getOwnerComponent().getModel("modelAux").setProperty("/nomeEmpresa", nomeEmpresa);
			// this.getOwnerComponent().getModel("modelAux").setProperty("/iconeEmpresa", icone);
			// this.getOwnerComponent().getModel("helper").setProperty("/showShellHeader", true);
		},
	
		onNavBack: function(){
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");
		},
		
		// onNavBack: function() {
		// 	console.log("onNavBack");
		// 	this.onNavBack();
		// },
		
		onAfterRendering: function() {
			//tive que colocar porque tem um bug no tile container que mostra uma tile 
			//só se deixar o showHeader da page=true na view
			this.byId("page").setShowHeader(true);
		},
		
		onTileConsultas: function(oEvent){
				// console.log(oEvent.getSource().data("opcao"));
			switch(oEvent.getSource().data("opcao")){
			
				case "C01":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("detalheProdutos");
					break;
				case "C02":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("clienteConsultas");
					break;
				case "C03":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("VerbaConsultas");
					break;
				case "C04":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("cadastroRebaixa");
					break;
				case "C05":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("MovVerbas");
					break;
				default:
					sap.ui.core.UIComponent.getRouterFor(this).navTo("notFound");
					break;
			}
		}
	});
});