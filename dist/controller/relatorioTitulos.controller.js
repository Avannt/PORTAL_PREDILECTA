sap.ui.define(["application/controller/BaseController","sap/m/MessageBox","application/model/formatter","sap/ui/core/mvc/Controller","sap/m/TablePersoController","sap/ui/core/util/Export","sap/ui/core/util/ExportTypeCSV","sap/ui/model/json/JSONModel"],function(e,t,i){"use strict";var a=[];return e.extend("application.controller.relatorioTitulos",{onInit:function(){this.getRouter().getRoute("relatorioTitulos").attachPatternMatched(this._onLoadFields,this)},onItemChange2:function(e){var t=e.getParameters().from;var i=e.getParameters().to;var a=[];var o=[new sap.ui.model.Filter("zfbdt",sap.ui.model.FilterOperator.BT,t,i)];var r=new sap.ui.model.Filter(o,false);a.push(r);this.byId("idtableTitulos").getBinding("items").filter(a,sap.ui.model.FilterType.Application)},onItemChange:function(e){var t=this.byId("idClientesRelatorio").getValue();var i=[];var a=[new sap.ui.model.Filter("kunnr",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("name1",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("status",sap.ui.model.FilterOperator.Contains,t)];var o=new sap.ui.model.Filter(a,false);i.push(o);this.byId("idtableTitulos").getBinding("items").filter(i,sap.ui.model.FilterType.Application)},_onLoadFields:function(){var e=this;var t=[];var i=[];var o=[];a=[]}})});