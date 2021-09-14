sap.ui.define(["jquery.sap.global","application/controller/BaseController","application/model/formatter"],function(e,t,a){"use strict";return t.extend("application.controller.verbaConsultas",{formatter:a,onInit:function(){this.getRouter().getRoute("VerbaConsultas").attachPatternMatched(this._onLoadFields,this)},_onLoadFields:function(){var e=this;var t=indexedDB.open("VB_DataBase");t.onerror=function(){alert(t.error.mensage)};t.onsuccess=function(){var a=t.result;var o=a.transaction("SaldoVerba").objectStore("SaldoVerba");o.getAll().onsuccess=function(t){var a=[];a=t.target.result;for(var o=0;o<a.length;o++){if(a[o].TotalVm<0){a[o].linhaDescExc="0"}else{a[o].linhaDescExc="1"}}var n=new sap.ui.model.json.JSONModel(a);e.getView().setModel(n,"Verbas")}}},onNavBack:function(){sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas")},onSearch:function(e){var t=e.getSource().getValue();var a=[];var o=[new sap.ui.model.Filter("Reprs",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Name",sap.ui.model.FilterOperator.Contains,t)];var n=new sap.ui.model.Filter(o,false);a.push(n);this.byId("table_Verbas").getBinding("items").filter(a,sap.ui.model.FilterType.Application)},onItemPress:function(e){}})});