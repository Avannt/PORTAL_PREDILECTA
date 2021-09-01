sap.ui.define(["application/controller/BaseController","sap/ui/model/Filter","sap/ui/model/FilterOperator","sap/ui/core/routing/History"],function(e,t,o){"use strict";var i=[];return e.extend("application.controller.clienteConsultas",{onInit:function(){this.getRouter().getRoute("clienteConsultas").attachPatternMatched(this._onCreateModel,this)},_onCreateModel:function(){var e=new sap.ui.model.json.JSONModel;this.getView().setModel(e);this.getOwnerComponent().setModel(e,"modelCliente");var t=[];var o=this;this.byId("searchField").setValue("")},onNavBack:function(){sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas")},onSearch:function(e){var t=e.getSource().getValue();var o=[];var i=[new sap.ui.model.Filter("kunnr",sap.ui.model.FilterOperator.StartsWith,t),new sap.ui.model.Filter("name1",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("stras",sap.ui.model.FilterOperator.StartsWith,t),new sap.ui.model.Filter("ort01",sap.ui.model.FilterOperator.StartsWith,t),new sap.ui.model.Filter("regio",sap.ui.model.FilterOperator.StartsWith,t),new sap.ui.model.Filter("stcd1",sap.ui.model.FilterOperator.StartsWith,t)];var r=new sap.ui.model.Filter(i,false);o.push(r);this.byId("table_clientes").getBinding("items").filter(o,"Application")},onSelectionChange:function(e){var t=e.getParameter("listItem")||e.getSource();this.getOwnerComponent().getModel("modelCliente").setProperty("/codigoCliente",t.getBindingContext("clientesCadastrados").getProperty("kunnr"));sap.ui.core.UIComponent.getRouterFor(this).navTo("clienteConsultasDetalhe")}})});