sap.ui.define(["application/controller/BaseController"],function(e){"use strict";return e.extend("application.controller.MenuConsultas",{onInit:function(){this.getRouter().getRoute("menu").attachPatternMatched(this._onRouteMatched,this)},_onRouteMatched:function(){},onNavBack:function(){sap.ui.core.UIComponent.getRouterFor(this).navTo("menu")},onAfterRendering:function(){this.byId("page").setShowHeader(true)},onTileConsultas:function(e){switch(e.getSource().data("opcao")){case"C01":sap.ui.core.UIComponent.getRouterFor(this).navTo("detalheProdutos");break;case"C02":sap.ui.core.UIComponent.getRouterFor(this).navTo("clienteConsultas");break;case"C03":sap.ui.core.UIComponent.getRouterFor(this).navTo("VerbaConsultas");break;case"C04":sap.ui.core.UIComponent.getRouterFor(this).navTo("cadastroRebaixa");break;case"C05":sap.ui.core.UIComponent.getRouterFor(this).navTo("MovVerbas");break;default:sap.ui.core.UIComponent.getRouterFor(this).navTo("notFound");break}}})});
//# sourceMappingURL=MenuConsultas.controller.js.map