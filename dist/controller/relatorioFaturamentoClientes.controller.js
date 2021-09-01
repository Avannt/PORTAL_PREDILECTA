sap.ui.define(["application/controller/BaseController","sap/ui/model/json/JSONModel","sap/m/MessageBox","application/model/formatter","sap/ui/model/odata/v2/ODataModel"],function(e,r,t,i,a){"use strict";var o=[];return e.extend("application.controller.relatorioFaturamentoClientes",{onInit:function(){this.getRouter().getRoute("relatorioFaturamentoClientes").attachPatternMatched(this._onLoadFields,this)},_onLoadFields:function(){var e=this;var t=e.getModelGlobal("modelAux").getProperty("/CodRepres");e.oModel=e.getModelGlobal("modelAux").getProperty("/DBModel");var i={WerksIni:"",WerksFim:"",KunnrIni:"",KunnrFim:"",Kvgr4Ini:"",Kvgr4Fim:"",Kvgr5Ini:"",Kvgr5Fim:"",VBelnIni:"",VBelnFim:"",RepreIni:"",Periodo:""};var a=new r(i);e.setModel(a,"modelParametros");e.oModel.read("/Centros",{urlParameters:{$filter:"IvUsuario eq '"+t+"'"},success:function(t){var i=t.results;var a=new r(i);e.setModel(a,"modelCentros")},error:function(r){e.onMensagemErroODATA(r)}});e.oModel.read("/ClienteQ",{urlParameters:{$filter:"IvUsuario eq '"+t+"'"},success:function(t){var i=t.results;var a=[];var o=[];for(var n=0;n<i.length;n++){var s=false;var l=false;for(var d=0;d<a.length;d++){if(i[n].Kvgr4==a[d].Kvgr4||i[n].Kvgr4==""){s=true;break}}for(var d=0;d<o.length;d++){if(i[n].Kvgr5==o[d].Kvgr5||i[n].Kvgr5==""){l=true;break}}if(s==false){a.push(i[n])}if(l==false){o.push(i[n])}}var u=new r(i);e.setModel(u,"modelClientes");var g=new r(a);e.setModel(g,"modelRedes");var m=new r(o);e.setModel(m,"modelBandeiras")},error:function(r){e.onMensagemErroODATA(r)}})},onSuggestCentroIni:function(e){var r=e.getSource().getValue();var t=[];var i=[new sap.ui.model.Filter("Werks",sap.ui.model.FilterOperator.Contains,r),new sap.ui.model.Filter("NomeCentro",sap.ui.model.FilterOperator.Contains,r)];var a=new sap.ui.model.Filter(i,false);t.push(a);this.byId("idCentroIni").getBinding("suggestionItems").filter(t);this.byId("idCentroIni").suggest()},onPress:function(){var e=this;var t=e.getModelGlobal("modelAux").getProperty("/CodRepres");e.oModel=e.getModelGlobal("modelAux").getProperty("/DBModel");var i=e.getModel("modelParametros").getProperty("/WerksIni");var a=e.getModel("modelParametros").getProperty("/WerksFim");var o=e.getModel("modelParametros").getProperty("/KunnrIni");var n=e.getModel("modelParametros").getProperty("/KunnrFim");var s=e.getModel("modelParametros").getProperty("/Kvgr4Ini");var l=e.getModel("modelParametros").getProperty("/Kvgr4Fim");var d=e.getModel("modelParametros").getProperty("/Kvgr5Ini");var u=e.getModel("modelParametros").getProperty("/Kvgr5Fim");var g="";var m="";var v="";var p="";var F="";var I="";e.oModel.read("/FatClientes",{urlParameters:{$filter:"Usuario eq '"+t+"' and WerksIni eq '"+i+"' and WerksFim eq '"+a+"' and KunnrIni eq '"+o+"' and KunnrFim eq '"+n+"' and Kvgr4Ini eq '"+s+"' and Kvgr4Fim eq '"+l+"' and Kvgr5Ini eq '"+d+"' and Kvgr5Fim eq '"+u+"' and VbelnIni eq '"+g+"' and VbelnFim eq '"+m+"' and RepreIni eq '"+v+"' and RepreFim eq '"+p+"' and PerioIni eq '"+F+"' and PerioFim eq '"+I+"'"},success:function(t){var i=t.results;var a=new r(i);e.setModel(a,"modelFatClientes")},error:function(r){e.onMensagemErroODATA(r)}})},onExpandFiltro:function(){debugger;if(this.byId("idPanelFiltro").getExpanded()){this.byId("idPanelFiltro").setHeaderText("Ocultar Filtros")}else{this.byId("idPanelFiltro").setHeaderText("Exibir Filtros")}},onSuggestCentroFim:function(e){var r=e.getSource().getValue();var t=[];var i=[new sap.ui.model.Filter("Werks",sap.ui.model.FilterOperator.Contains,r),new sap.ui.model.Filter("NomeCentro",sap.ui.model.FilterOperator.Contains,r)];var a=new sap.ui.model.Filter(i,false);t.push(a);this.byId("idCentroFim").getBinding("suggestionItems").filter(t);this.byId("idCentroFim").suggest()},onSuggestClienteIni:function(e){var r=e.getSource().getValue();var t=[];var i=[new sap.ui.model.Filter("Kunnr",sap.ui.model.FilterOperator.Contains,r),new sap.ui.model.Filter("Name1",sap.ui.model.FilterOperator.Contains,r)];var a=new sap.ui.model.Filter(i,false);t.push(a);this.byId("idClienteIni").getBinding("suggestionItems").filter(t);this.byId("idClienteIni").suggest()},onSuggestClienteFim:function(e){var r=e.getSource().getValue();var t=[];var i=[new sap.ui.model.Filter("Kunnr",sap.ui.model.FilterOperator.Contains,r),new sap.ui.model.Filter("Name1",sap.ui.model.FilterOperator.Contains,r)];var a=new sap.ui.model.Filter(i,false);t.push(a);this.byId("idClienteFim").getBinding("suggestionItems").filter(t);this.byId("idClienteFim").suggest()},onSuggestRedeIni:function(e){var r=e.getSource().getValue();var t=[];var i=[new sap.ui.model.Filter("Kvgr4",sap.ui.model.FilterOperator.Contains,r),new sap.ui.model.Filter("DescKvgr4",sap.ui.model.FilterOperator.Contains,r)];var a=new sap.ui.model.Filter(i,false);t.push(a);this.byId("idRedeIni").getBinding("suggestionItems").filter(t);this.byId("idRedeIni").suggest()},onSuggestRedeFim:function(e){var r=e.getSource().getValue();var t=[];var i=[new sap.ui.model.Filter("Kvgr4",sap.ui.model.FilterOperator.Contains,r),new sap.ui.model.Filter("DescKvgr4",sap.ui.model.FilterOperator.Contains,r)];var a=new sap.ui.model.Filter(i,false);t.push(a);this.byId("idRedeFim").getBinding("suggestionItems").filter(t);this.byId("idRedeFim").suggest()},onSuggestBandeiraIni:function(e){var r=e.getSource().getValue();var t=[];var i=[new sap.ui.model.Filter("Kvgr5",sap.ui.model.FilterOperator.Contains,r),new sap.ui.model.Filter("DescKvgr5",sap.ui.model.FilterOperator.Contains,r)];var a=new sap.ui.model.Filter(i,false);t.push(a);this.byId("idBandeiraIni").getBinding("suggestionItems").filter(t);this.byId("idBandeiraIni").suggest()},onSuggestBandeiraFim:function(e){var r=e.getSource().getValue();var t=[];var i=[new sap.ui.model.Filter("Kvgr5",sap.ui.model.FilterOperator.Contains,r),new sap.ui.model.Filter("DescKvgr5",sap.ui.model.FilterOperator.Contains,r)];var a=new sap.ui.model.Filter(i,false);t.push(a);this.byId("idBandeiraFim").getBinding("suggestionItems").filter(t);this.byId("idBandeiraFim").suggest()}})});