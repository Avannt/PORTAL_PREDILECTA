sap.ui.define(["application/controller/BaseController","sap/ui/model/json/JSONModel","sap/m/MessageBox","application/model/formatter","sap/ui/model/Filter"],function(e,t,o){"use strict";var r=[];var a;return e.extend("application.controller.relatorioPedidos",{onInit:function(){this.getRouter().getRoute("relatorioPedidos").attachPatternMatched(this._onLoadFields,this)},_onLoadFields:function(){var e=this;var t=[];r=[];this.byId("table_relatorio_pedidos").setBusy(true);var a=e.getOwnerComponent().getModel("modelAux").getProperty("/TipoAprovador");var i=e.getView().getModel("modelAux").getProperty("/CodRepres");var n=e.getOwnerComponent().getModel("modelAux").getProperty("/Usrped");var s=e.getOwnerComponent().getModel("modelAux").getProperty("/Usrapr");var l=this.getOwnerComponent().getModel("modelAux").getProperty("/DBModel");this.getView().getModel("modelAux");var d=indexedDB.open("VB_DataBase");d.onerror=function(){o.show(d.error.mensage,{icon:o.Icon.ERROR,title:"Banco não encontrado!",actions:[o.Action.OK]})};d.onsuccess=function(){var o=d.result;if(n==true){var a=o.transaction("StatusPedidos").objectStore("StatusPedidos");a.openCursor().onsuccess=function(i){var n=i.target.result;if(n!==null){if(n.value.ExibePedido){n.value.pathImg=sap.ui.require.toUrl("application/img/")+n.value.Aprovado+".png ";r.push(n.value)}n.continue()}else{a=o.transaction("Clientes").objectStore("Clientes");a.openCursor().onsuccess=function(o){var a=o.target.result;if(a){t.push(a.value);a.continue()}else{for(var i=0;i<r.length;i++){for(var n=0;n<t.length;n++){if(r[i].CodCliente==t[n].CodCliente){r[i].NomeCliente=t[n].NomeAbrev}}}l=new sap.ui.model.json.JSONModel(r);e.getView().setModel(l,"pedidoRelatorio");e.byId("table_relatorio_pedidos").setBusy(false)}}}}}else if(s==true){l.read("/AcompPedidos",{urlParameters:{$filter:"IRepres eq '"+i+"'"},success:function(i){var n=o.transaction("StatusPedidos","readwrite");var s=n.objectStore("StatusPedidos");for(var d=0;d<i.results.length;d++){var u=i.results[d].Nrpedcli.split(".");u=u[1];u=u.substring(6,8)+"/"+u.substring(4,6)+"/"+u.substring(0,4);var p={idStatusPedido:i.results[d].Nrpedcli,Nrpedcli:i.results[d].Nrpedcli,Kunnr:i.results[d].Kunnr,NameOrg1:i.results[d].NameOrg1,Erdat:u,Aprov:i.results[d].Aprov,AprovNome:i.results[d].AprovNome,Valtotpedido:i.results[d].Valtotpedido,Vlrexc:i.results[d].Vlrexc,Aprovado:i.results[d].Aprovado,PathImg:sap.ui.require.toUrl("application/img/")+i.results[d].Aprovado+".png ",Vbeln:i.results[d].Vbeln};var m="";switch(i.results[d].Aprovado){case"S":m="Aprovado";break;case"R":m="Reprovado";break;default:m="Pendente"}p.AprovadoDesc=m;r.push(p)}a=o.transaction("Clientes").objectStore("Clientes");a.openCursor().onsuccess=function(o){var a=o.target.result;if(a){t.push(a.value);a.continue()}else{for(var i=0;i<r.length;i++){for(var n=0;n<t.length;n++){if(r[i].CodCliente==t[n].CodCliente){r[i].NomeCliente=t[n].NomeAbrev}}}l=new sap.ui.model.json.JSONModel(r);e.getView().setModel(l,"pedidoRelatorio");e.byId("table_relatorio_pedidos").setBusy(false)}}},error:function(t){console.log(t);e.onMensagemErroODATA(t.statusCode)}})}}},handleChange:function(e){var t=[];var o=e.getSource();var r=e.getParameter("value");var a=e.getParameter("valid");if(a){o.setValueState(sap.ui.core.ValueState.None)}else{o.setValueState(sap.ui.core.ValueState.Error)}var i=[new sap.ui.model.Filter("Erdat",sap.ui.model.FilterOperator.EQ,r)];var n=new sap.ui.model.Filter(i,false);t.push(n);this.byId("table_relatorio_pedidos").getBinding("items").filter(t,"Application")},onSearch:function(e){var t=e.getSource().getValue();var o=[];var r=[new sap.ui.model.Filter("Kunnr",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Namecli",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Lifnr",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Namerep",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Nrpedcli",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("NameOrg1",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("AprovNome",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("AprovadoDesc",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Auart",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("PedInconsistente",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Vbeln",sap.ui.model.FilterOperator.Contains,t)];var a=new sap.ui.model.Filter(r,false);o.push(a);this.byId("table_relatorio_pedidos").getBinding("items").filter(o,sap.ui.model.FilterType.Application)},myFormatterName:function(e){if(e.length>28){return e.substring(0,20)+"..."}else{return e}},onNavBack:function(){sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas")},onItemPressPED:function(e){var t=this;var r=e;var a=r.getParameter("listItem")||e.getSource();var i=a.getBindingContext("pedidoRelatorio").getProperty("Nrpedcli");var n=a.getBindingContext("pedidoRelatorio").getProperty("NameOrg1");var s=a.getBindingContext("pedidoRelatorio").getProperty("Kunnr");o.show("Deseja abrir o item selecionado?",{icon:o.Icon.WARNING,title:"Editar",actions:["Sim","Cancelar"],onClose:function(e){if(e=="Sim"){t.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli",i);t.getOwnerComponent().getModel("modelAux").setProperty("/Kunnr",s);t.getOwnerComponent().getModel("modelAux").setProperty("/Namecli",n);sap.ui.core.UIComponent.getRouterFor(t).navTo("PedidoDetalheRel")}}})}})});