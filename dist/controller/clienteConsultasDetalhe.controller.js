sap.ui.define(["application/controller/BaseController","sap/ui/model/json/JSONModel","sap/ui/core/routing/History"],function(t,e,o){"use strict";return t.extend("application.controller.clienteConsultasDetalhe",{onInit:function(t){this.getRouter().getRoute("clienteConsultasDetalhe").attachPatternMatched(this._onLoadFields,this)},onAfterRendering:function(){},onNavBack:function(t){var e,r;e=o.getInstance();r=e.getPreviousHash();if(r!==undefined){window.history.go(-1)}else{this.getRouter().navTo("clienteConsultas",{},true)}},_onLoadFields:function(){var t=this;this.byId("idTopLevelIconTabBar").setSelectedKey("tab1");var o=this.getOwnerComponent().getModel("modelCliente").getProperty("/codigoCliente");var r=t.getModelGlobal("modelAux").getProperty("/CodRepres");t.oModel=t.getModelGlobal("modelAux").getProperty("/DBModel");t.vetorCliente=[];t.vetorTbPreco=[];t.oModel.read("/ClienteR(IvUsuario='"+r+"',IvCliente='"+o+"')",{success:function(o){t.vetorCliente=o;var r=new e(t.vetorCliente);t.setModel(r,"modelCliente");var l=new e(t.vetorTbPreco);t.setModel(l,"modelTbPreco");var a={Kunnr:o.Kunnr,Name1:o.Name1,Pltyp:o.Pltyp,Ptext:o.DescPltyp};t.vetorTbPreco.push(a);t.getModel("modelTbPreco").setData(t.vetorTbPreco)},error:function(e){t.onMensagemErroODATA(e)}});t.oModel.read("/Contratos",{urlParameters:{$filter:"IvUsuario eq '"+r+"'"},success:function(o){t.vetorContratosTotal=o.results;var r=t.getModel("modelCliente").getProperty("/Kvgr4");t.vetorContratos=t.vetorContratosTotal.filter(function(t){if(t.Kvgr4==r){return t}});var l=new e(t.vetorContratos);t.setModel(l,"modelContratos")},error:function(e){t.onMensagemErroODATA(e)}});t.oModel.read("/TitulosAbertos",{urlParameters:{$filter:"IvUsuario eq '"+r+"'"},success:function(o){t.vetorTitulosTotal=o.results;var r=t.getModel("modelCliente").getProperty("/Kunnr");t.vetorTitulos=t.vetorTitulosTotal.filter(function(t){if(t.Kunnr==r){return t}});var l=new e(t.vetorTitulos);t.setModel(l,"modelTitulos");t.vetorTitulosTotal=[];var a=new e(t.vetorTitulosTotal);t.setModel(a,"modelTitulosTotal");var s=0;for(var n=0;n<t.vetorTitulos.length;n++){var i=false;for(var u=0;u<t.vetorTitulosTotal.length;u++){if(t.vetorTitulos[n].Bukrs==t.vetorTitulosTotal[u].Bukrs){i=true;t.vetorTitulosTotal[u].ValTotal=parseFloat(t.vetorTitulosTotal[u].ValTotal)+Math.round(parseFloat(t.vetorTitulos[n].Dmbtr)*100)/100;t.vetorTitulosTotal[u].ValTotal=parseFloat(t.vetorTitulosTotal[u].ValTotal).toFixed(2)}}if(i==false){var v={Bukrs:t.vetorTitulos[n].Bukrs,Butxt:t.vetorTitulos[n].Butxt,ValTotal:parseFloat(t.vetorTitulos[n].Dmbtr)};t.vetorTitulosTotal.push(v)}s+=parseFloat(t.vetorTitulos[n].ValTotal)}t.getModel("modelTitulosTotal").setData(t.vetorTitulosTotal)},error:function(e){t.onMensagemErroODATA(e)}})}})});