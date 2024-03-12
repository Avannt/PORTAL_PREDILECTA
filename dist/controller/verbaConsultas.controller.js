sap.ui.define(["application/controller/BaseController","sap/ui/model/json/JSONModel","sap/m/MessageBox","application/model/formatter"],function(e,t,o,r){"use strict";return e.extend("application.controller.verbaConsultas",{formatter:r,onInit:function(){this.getRouter().getRoute("VerbaConsultas").attachPatternMatched(this._onLoadFields,this)},_onLoadFields:function(){var e=this;e.onInicializaModels();var o=e.getModelGlobal("modelAux").getProperty("/CodRepres");e.oModel=e.getModelGlobal("modelAux").getProperty("/DBModel");e.oModel.read("/Centros",{urlParameters:{$filter:"IvUsuario eq '"+o+"'"},success:function(o){var r=[];e.vetorCentros=o.results;var a=new t(e.vetorCentros);e.setModel(a,"modelCentros");e.onBuscarDados()},error:function(t){e.onMensagemErroODATA(t)}})},onBuscarDados:function(){var e=this;var o=e.getModelGlobal("modelAux").getProperty("/CodRepres");var r=e.getModelGlobal("modelAux").getProperty("/NomeRepres").replaceAll(" ","_");var a=this.getModel("modelTela").getProperty("/Bukrs");var s="0122021";e.byId("detail").setBusy(true);e.oModel.read("/P_SaldoVerbas",{urlParameters:{$filter:"IvUsuario eq '"+o+"'"},success:function(a){var l=a.results[0];var i=e.getModel("modelTela").getData();i.Cod=o;i.Nome=r;var n=new t(i);e.setModel(n,"modelTela");e.vetorVerbasAux=a.results;e.vetorVerbas=[];for(var d=0;d<e.vetorVerbasAux.length;d++){s=e.vetorVerbasAux[d].Periodo;break}for(var u=0;u<e.vetorVerbasAux.length;u++){e.vetorVerbas.push(e.vetorVerbasAux[u])}e.byId("detail").setBusy(false);e.getModel("Verbas").setData(e.vetorVerbas)},error:function(t){e.byId("detail").setBusy(false);e.onMensagemErroODATA(t)}})},onChangeEmpresa:function(){var e=this;var o=e.getModelGlobal("modelAux").getProperty("/CodRepres");var r=this.getModel("modelTela").getProperty("/Bukrs");e.onDialogCancelar();e.byId("detail").setBusy(true);e.oModel.read("/SaldoVerbas",{urlParameters:{$filter:"IvUsuario eq '"+o+"'"},success:function(o){var a=o.results[0];var s=e.getModel("modelTela").getData();s.Cod=a.Lifnr;s.Nome=a.Name1Rep;var l=new t(s);e.setModel(l,"modelTela");e.vetorVerbasAux=o.results;e.vetorVerbas=[];for(var i=0;i<e.vetorVerbasAux.length;i++){if(e.vetorVerbasAux[i].Bukrs==r){e.vetorVerbas.push(e.vetorVerbasAux[i])}}e.byId("detail").setBusy(false);e.getModel("Verbas").setData(e.vetorVerbas)},error:function(t){e.byId("detail").setBusy(false);e.onMensagemErroODATA(t)}})},onInicializaModels:function(){var e={Bukrs:"",Cod:"",Nome:"Nenhum Usuário selecionado",Email:""};var o=new t(e);this.setModel(o,"modelTela");var r=new t;this.setModel(r,"Verbas");var a={Bukrs:"",DatUltMovto:"",IdSaldo:"",IvUsuario:"",Lifnr:"",Name1Rep:"",Butxt:"",Periodo:"",Usuario:"",ValSdoCr:"",ValSdoDb:"",ValSdoFim:"",ValSdoIni:""};var s=new t(a);this.setModelGlobal(s,"modelVerba")},onAbrirCentros:function(){if(this._ItemDialog){this._ItemDialog.destroy(true)}if(!this._CreateMaterialFragment){this._ItemDialog=sap.ui.xmlfragment("application.view.centros",this);this.getView().addDependent(this._ItemDialog)}this._ItemDialog.open()},onDialogCancelar:function(){if(this._ItemDialog){this._ItemDialog.destroy(true)}},onSearch:function(e){var t=e.getSource().getValue();var o=[];var r=[new sap.ui.model.Filter("Repres",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Name",sap.ui.model.FilterOperator.Contains,t)];var a=new sap.ui.model.Filter(r,false);o.push(a);this.byId("table_Verbas").getBinding("items").filter(o,sap.ui.model.FilterType.Application)},onItemPress:function(e){var t=e.getParameter("listItem")||e.getSource();var o=t.getBindingContext("Verbas").getObject();delete o.__metadata;this.getModelGlobal("modelVerba").setData(o);sap.ui.core.UIComponent.getRouterFor(this).navTo("verbaConsultasDetalhe")}})});
//# sourceMappingURL=verbaConsultas.controller.js.map