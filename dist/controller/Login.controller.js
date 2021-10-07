sap.ui.define(["sap/ui/core/mvc/Controller","application/controller/BaseController","sap/m/MessageBox"],function(e,o,t){"use strict";var a=false;var i=[];return o.extend("application.controller.Login",{onInit:function(){this.getRouter().getRoute("login").attachPatternMatched(this._onLoadFields,this)},_onLoadFields:function(){var e=this;this.onInicializaModels();this.getModelGlobal("modelAux").setProperty("/ReleasePRD",false);this.getModelGlobal("modelAux").setProperty("/VersaoApp","1.0");this.getModelGlobal("modelAux").setProperty("/Werks","1000");this.getModelGlobal("modelAux").setProperty("/EditarIndexItem",0);this.getModelGlobal("modelAux").setProperty("/bConectado",false);this.getModelGlobal("modelAux").setProperty("/SistemaOper","02");var o;if(this.getModelGlobal("modelAux").getProperty("/ReleasePRD")){o="http://srvaplsapqas.predilecta.com.br:8010/sap/opu/odata/sap/ZSF_FV_SRV/";var t=new sap.ui.model.odata.ODataModel(o,{user:"t_rcardilo",password:"sap123",headers:{"sap-client":"410","sap-language":"PT",Authorization:"Basic "+btoa("t_rcardilo"+":"+"sap123"),"Access-Control-Allow-Origin":"*"}});this.getView().setModel(t);this.getModelGlobal("modelAux").setProperty("/DBModel",t);this.getModelGlobal("modelAux").setProperty("/Url",o)}else{o="/sap/opu/odata/sap/ZSF_FV_SRV/";this.getModelGlobal("modelAux").setProperty("/DBModel",this.getView().getModel());this.getModelGlobal("modelAux").setProperty("/Url",o)}},onInicializaModels:function(){var e=new sap.ui.model.json.JSONModel({CodRepres:"",NomeRepres:"",Imei:"",VersaoApp:"",Login:"",Senha:"",SistemaOper:"02",DataAtualizacao:"",Kunnr:"",NrPedido:"",EditarIndexItem:"",bConectado:false,DBModel:"",ReleasePRD:"",Lifnr:"",Email:"",Url:"/sap/opu/odata/sap/ZSF_FV_SRV/"});this.setModelGlobal(e,"modelAux");var o=new sap.ui.model.json.JSONModel;this.setModelGlobal(o,"modelCliente");this.setModelGlobal(o,"modelMenu")},retornaDataAtualizacao:function(){var e=new Date;var o=String(e.getDate());var t=String(e.getMonth()+1);var a=String(e.getFullYear());a=a.substring(2,4);var i=String(e.getMinutes());var s=String(e.getHours());var n=String(e.getSeconds());if(o.length==1){o="0"+String(o)}if(t.length==1){t="0"+String(t)}if(i.length==1){i="0"+String(i)}if(s.length==1){s="0"+String(s)}if(n.length==1){n="0"+String(n)}var r=String(o+"/"+t+"/"+a);var l=String(s)+":"+String(i);return r+" - "+l},getPermissao:function(){var e=this;function o(o){if(o=="OK"){e.getImei()}else{t.show("A recusa do acesso resultará a falha na autenticação. Deseja permitir?",{icon:t.Icon.ERROR,title:"Erro ao atualizar bases.",actions:[t.Action.YES,t.Action.NO],onClose:function(o){if(o==t.Action.YES){e.getPermissao()}}})}}function a(e){console.log(e)}if(window.device.platform==="Android"){window.plugins.sim.requestReadPermission(this.successCallbackPermissao,this.errorCallbackPermissao)}},getImei:function(){var e=this;var o=this.getModelGlobal("modelAux").getProperty("/isTablet");var o="Android";window.plugins.sim.hasReadPermission(t,t);function t(e){if(e==true){window.plugins.sim.getSimInfo(i,s)}else{window.plugins.sim.requestReadPermission(n,r)}}function a(e){console.log(e)}function i(o){e.getModelGlobal("modelAux").setProperty("/Imei",o.deviceId);console.log(o)}function s(e){console.log(e)}function n(e){console.log(e)}function r(e){console.log(e)}},onAfterRendering:function(){},onBusyDialogClosed:function(){if(this._ItemDialog){this._ItemDialog.destroy(true)}},onOpenMudarSenha:function(){var e=this;if(e._ItemDialog){e._ItemDialog.destroy(true)}if(!e._CreateMaterialFragment){e._ItemDialog=sap.ui.xmlfragment("application.view.AlterarSenha",e);e.getView().addDependent(e._ItemDialog)}e._ItemDialog.open()},onPularSenha:function(){sap.ui.getCore().byId("idSenha").focus()},onPularSenha1:function(){sap.ui.getCore().byId("idSenhaNova").focus()},onPularSenha2:function(){sap.ui.getCore().byId("idSenhaNova2").focus()},onDialogMudarSenha:function(){var e=this;var o=this.getModelGlobal("modelAux").getData();var a=sap.ui.getCore().byId("idSenhaNova").getValue();var i=sap.ui.getCore().byId("idSenhaNova2").getValue();if(o.CodRepres==""||o.CodRepres=="undefined"){sap.m.MessageBox.show("Preencher o código do representante!",{icon:sap.m.MessageBox.Icon.WARNING,title:"Corrija os Campos!",actions:[sap.m.MessageBox.Action.OK],onClose:function(e){sap.ui.getCore().byId("idCodRepres").focus()}})}else if(o.Senha==""||o.Senha=="undefined"){sap.m.MessageBox.show("Preencher a Senha atual!",{icon:sap.m.MessageBox.Icon.WARNING,title:"Corrija os Campos!",actions:[sap.m.MessageBox.Action.OK],onClose:function(e){sap.ui.getCore().byId("idSenha").focus()}})}else if(a!=i){sap.m.MessageBox.show("As Senhas são diferentes!",{icon:sap.m.MessageBox.Icon.WARNING,title:"Corrija os Campos!",actions:[sap.m.MessageBox.Action.OK],onClose:function(e){sap.ui.getCore().byId("idSenhaNova").focus()}})}else{sap.ui.getCore().byId("idDialogAlterarSenha").setBusy(true);o.DBModel.read("/TrocarSenha(IvUsuario='"+o.CodRepres+"',IvSenha='"+o.Senha+"',IvSistOper='"+o.SistemaOper+"',IvImei='"+o.Imei+"',IvVersaoApp='"+o.VersaoApp+"',IvSenhaNova='"+a+"')",{success:function(o){t.show("Senha foi alterada com sucesso!",{icon:t.Icon.SUCCESS,title:"Confirmação",actions:[t.Action.OK],onClose:function(){if(e._ItemDialog){e._ItemDialog.destroy(true)}}})},error:function(o){sap.ui.getCore().byId("idDialogAlterarSenha").setBusy(false);e.onMensagemErroODATA(o)}})}},onFecharAlteracaoSenha:function(){if(this._ItemDialog){this._ItemDialog.destroy(true)}},onStartWorking:function(){var e=this;this.getView().byId("idPageLogin").setBusy(true);var o=this.byId("idLogin").getValue();var t=this.byId("idSenha").getValue();var a="WEB";var i=this.getModelGlobal("modelAux").getProperty("/VersaoApp");var s=e.getModelGlobal("modelAux").getProperty("/DBModel");var n=e.getModelGlobal("modelAux").getProperty("/SistemaOper");s.read("/Logins(IvUsuario='"+o+"',IvSenha='"+t+"',IvSistOper='"+n+"',IvImei='"+a+"',IvVersaoApp='"+i+"')",{success:function(a){e.getModelGlobal("modelAux").setProperty("/CodRepres",o);e.getModelGlobal("modelAux").setProperty("/NomeRepres",a.EvNomeRepres);e.getModelGlobal("modelAux").setProperty("/Login",o);e.getModelGlobal("modelAux").setProperty("/Senha",t);e.getModelGlobal("modelAux").setProperty("/Lifnr",a.EvLifnr);e.getModelGlobal("modelAux").setProperty("/Email",a.EvEmail);s.read("/Menus",{urlParameters:{$filter:"IvUsuario eq '"+o+"' and IvSistOper eq '"+n+"'"},success:function(o){var t=o.results.sort();e.getModelGlobal("modelMenu").setData(t);sap.ui.core.UIComponent.getRouterFor(e).navTo("menu");e.getView().byId("idPageLogin").setBusy(false)},error:function(o){e.getView().byId("idPageLogin").setBusy(false);console.log(o);e.onMensagemErroODATA(o)}})},error:function(o){e.getView().byId("idPageLogin").setBusy(false);console.log(o);e.onMensagemErroODATA(o)}})},onLoginChange:function(){sap.ui.getCore().byId("idSenha").focus()},onDialogPromocoesCancelButton:function(){if(this._ItemDialog){this._ItemDialog.destroy(true)}}})});