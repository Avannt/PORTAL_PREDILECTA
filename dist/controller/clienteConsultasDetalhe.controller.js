sap.ui.define(["application/controller/BaseController","sap/ui/core/routing/History"],function(e,t){"use strict";return e.extend("application.controller.clienteConsultasDetalhe",{onInit:function(e){this.getRouter().getRoute("clienteConsultasDetalhe").attachPatternMatched(this._onLoadFields,this)},onAfterRendering:function(){},onNavBack:function(e){var n,o;n=t.getInstance();o=n.getPreviousHash();if(o!==undefined){window.history.go(-1)}else{this.getRouter().navTo("clienteConsultas",{},true)}},_onLoadFields:function(){var e=this;var t=[];this.byId("idTopLevelIconTabBar").setSelectedKey("tab1");var n=this.getOwnerComponent().getModel("modelCliente").getProperty("/codigoCliente")}})});