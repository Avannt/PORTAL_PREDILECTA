sap.ui.define(["application/controller/BaseController","sap/ui/model/json/JSONModel","sap/m/MessageBox","application/model/formatter","sap/ui/core/util/MockServer","sap/ui/export/library","sap/ui/export/Spreadsheet","sap/ui/model/odata/v2/ODataModel","sap/m/MessageBox"],function(e,t,a,i,r,s,o,n){"use strict";var l=[];var d=s.EdmType;return e.extend("application.controller.relatorioNotasFiscais",{onInit:function(){this.getRouter().getRoute("relatorioNotasFiscais").attachPatternMatched(this._onLoadFields,this)},_onLoadFields:function(){var e=this;var a=e.getModelGlobal("modelAux").getProperty("/CodRepres");e.oModel=e.getModelGlobal("modelAux").getProperty("/DBModel");var i={WerksIni:"",WerksFim:"",KunnrIni:"",KunnrFim:"",Kvgr4Ini:"",Kvgr4Fim:"",Kvgr5Ini:"",Kvgr5Fim:"",LifnrIni:"",LifnrFim:"",SeriesIni:"",SeriesFim:"",NfenumIni:"",NfenumFim:"",Periodo:""};var r=new t(i);e.setModel(r,"modelParametros");e.vetorNotasFiscais=[];var s=new t(e.vetorNotasFiscais);e.setModel(s,"modelNotasFiscais");e.vetorResumoEmpresa=[];var o=new t(e.vetorResumoEmpresa);e.setModel(o,"modelResumoEmpresa");new Promise(function(t,i){e.onBuscarClientes(a,t,i,e)}).then(function(a){var i=a;var r=[];var s=[];var o=[];for(var n=0;n<i.length;n++){var l=false;var d=false;var u=false;for(var g=0;g<r.length;g++){if(i[n].Kvgr4==r[g].Kvgr4||i[n].Kvgr4==""){l=true;break}}for(var p=0;p<s.length;p++){if(i[n].Kvgr5==s[p].Kvgr5||i[n].Kvgr5==""){d=true;break}}for(var m=0;m<o.length;m++){if(i[n].Lifnr==o[m].Lifnr||i[n].Lifnr==""){u=true;break}}if(l==false){r.push(i[n])}if(d==false){s.push(i[n])}if(u==false){o.push(i[n])}}var c=new t(i);e.setModel(c,"modelClientes");var v=new t(r);e.setModel(v,"modelRedes");var f=new t(s);e.setModel(f,"modelBandeiras");var F=new t(o);e.setModel(F,"modelRepres")}).catch(function(t){e.onMensagemErroODATA(t)});e.oModel.read("/Centros",{urlParameters:{$filter:"IvUsuario eq '"+a+"'"},success:function(a){var i=a.results;var r=new t(i);e.setModel(r,"modelCentros")},error:function(t){e.onMensagemErroODATA(t)}})},ongetHeaderGroupLifnr:function(e){return e.getProperty("Lifnr")},ongetHeaderGroupBukrs:function(e){return e.getProperty("Bukrs")+" - "+e.getProperty("Butxt")},createColumnConfig:function(){var e=[];e.push({label:"Repres",property:"Lifnr",type:d.Number});e.push({label:"Nome Repres",property:"Name1Rep",type:d.String});e.push({label:"Vocativo",property:"TitleLet",type:d.String});e.push({label:"Empresa",property:"Bukrs",type:d.String});e.push({label:"Nome Empresa",property:"Butxt",type:d.String});e.push({label:"Centro",property:"Werks",type:d.String});e.push({label:"Série",property:"Series",type:d.String});e.push({label:"NFe",property:"Nfenum",type:d.String});e.push({label:"Doc.Vendas",property:"Vbeln",type:d.String});e.push({label:"Referência Cliente",property:"Bstkd",type:d.String});e.push({label:"Dt Docto",property:"Docdat",type:d.DateTime,format:"dd/mm/yyyy"});e.push({label:"Cliente",property:"Kunnr",type:d.String});e.push({label:"Razão Social",property:"Name1Cli",type:d.String});e.push({label:"CNPJ",property:"Stcd1",type:d.String});e.push({label:"CPF",property:"Stcd2",type:d.String});e.push({label:"UF",property:"Region",type:d.String});e.push({label:"Cidade",property:"City1",type:d.String});e.push({label:"Cód.Transp",property:"ParidTransp",type:d.String});e.push({label:"Nom.Transp",property:"Name1Transp",type:d.String});e.push({label:"Cód.Redesp",property:"ParidRedesp",type:d.String});e.push({label:"Nom.Redesp",property:"Name1Redesp",type:d.String});e.push({label:"Vl.Tot.NF",property:"Netwrt",type:d.Number,scale:2,delimiter:true});e.push({label:"%Rentab",property:"PctRentab",type:d.Number,scale:2,delimiter:true});e.push({label:"Data Entrega",property:"Datent",type:d.DateTime,format:"dd/mm/yyyy"});return e},onExport:function(){var e,t,a,i,r;if(!this._oTable){this._oTable=this.byId("idtableNotasFiscais")}r=this._oTable;t=r.getBinding("items");e=this.createColumnConfig();a={workbook:{columns:e,hierarchyLevel:"Level"},dataSource:t,fileName:"Rel_Notas_Fiscais.xlsx",worker:false};i=new o(a);i.build().finally(function(){i.destroy()})},onSuggestCentroIni:function(e){var t=e.getSource().getValue();var a=[];var i=[new sap.ui.model.Filter("Werks",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("NomeCentro",sap.ui.model.FilterOperator.Contains,t)];var r=new sap.ui.model.Filter(i,false);a.push(r);this.byId("idCentroIni").getBinding("suggestionItems").filter(a);this.byId("idCentroIni").suggest()},onDialogOpen:function(e){var a=this;var i={Docnum:e.getSource().getBindingContext("modelNotasFiscais").getObject().Docnum,Nfenum:e.getSource().getBindingContext("modelNotasFiscais").getObject().Nfenum,Series:e.getSource().getBindingContext("modelNotasFiscais").getObject().Series};var r=new t(i);a.setModel(r,"modelParamDialog");if(a._ItemDialog){a._ItemDialog.destroy(true)}if(!a._CreateMaterialFragment){a._ItemDialog=sap.ui.xmlfragment("application.view.DialogEmail",a);a.getView().addDependent(a._ItemDialog)}a._ItemDialog.open()},onDialogClose:function(){if(this._ItemDialog){this._ItemDialog.destroy(true)}},onDialogOpenStatus:function(e){var a=this;var i={Nfenum:e.getSource().getBindingContext("modelNotasFiscais").getObject().Nfenum,Name1Redesp:e.getSource().getBindingContext("modelNotasFiscais").getObject().Name1Redesp,FoneRedesp:e.getSource().getBindingContext("modelNotasFiscais").getObject().FoneRedesp,EmailRedesp:e.getSource().getBindingContext("modelNotasFiscais").getObject().EmailRedesp};var r=new t(i);a.setModel(r,"modelParamDialog");var s=new t({view:false});this.getView().setModel(s,"modelDelay");if(this._ItemDialog){this._ItemDialog.destroy(true)}if(!this._CreateMaterialFragment){this._ItemDialog=sap.ui.xmlfragment("application.view.StatusPedido",this);this.getView().addDependent(this._ItemDialog)}this._ItemDialog.open()},onZoomIn:function(){this.oProcessFlow.zoomIn()},onZoomOut:function(){this.oProcessFlow.zoomOut()},onLoadStatus:function(){var e=this;debugger;var a=e.getModel("modelParamDialog").getProperty("/Nfenum");var i=e.getModel("modelParamDialog").getProperty("/Name1Redesp");var r=e.getModel("modelParamDialog").getProperty("/FoneRedesp");var s=e.getModel("modelParamDialog").getProperty("/EmailRedesp");this.oProcessFlow=this._ItemDialog.getContent("fnClass")[0];this.oProcessFlow.setZoomLevel(sap.suite.ui.commons.ProcessFlowZoomLevel.One);this._ItemDialog.setBusy(true);new Promise(function(t,i){e.onBuscarStatusPedido(a,t,i,e)}).then(function(a){console.log(a);e.onCriarModelStatus();var i=e.getModel("modelStatusPedido").getData();if(a.DataFaturamento!=""||a.DataFaturamento!="00/00/0000"&&a.DataFaturamento!="undefined"){i.lanes[0].state="Positive";i.nodes[0].state="Positive";i.nodes[0].stateText="OK - "+a.DataFaturamento;i.nodes[0].texts="Nota Fiscal emitida.";i.lanes[1].state="Positive";i.nodes[1].state="Positive";i.nodes[1].stateText="OK - "+a.DataFaturamento;i.nodes[1].texts="Frete contratado."}if(a.DataLibPortaria!=""&&a.DataLibPortaria!="00/00/0000"&&a.DataLibPortaria!="undefined"){i.lanes[2].state="Positive";i.nodes[2].state="Positive";i.nodes[2].stateText="OK - "+a.DataLibPortaria;i.nodes[2].texts="Mercadoria separada.";i.lanes[3].state="Positive";i.nodes[3].state="Positive";i.nodes[3].stateText="OK - "+a.DataLibPortaria;i.nodes[3].texts="Mercadoria saiu da fabrica.";debugger;if(a.Inco1=="FOB"){i.nodes.splice(4,1);i.lanes.splice(4,1);i.lanes[4].state="Positive";i.nodes[4].state="Positive";i.nodes[4].stateText="OK - "+a.DataLibPortaria;i.nodes[4].texts="Mercadoria entregue"}else{if(a.DataRedesp!=""&&a.DataRedesp!="00/00/0000"&&a.DataRedesp!="undefined"){i.nodes[3].children=[40,41];var r={id:"41",lane:"4",title:e.getModel("modelParamDialog").getProperty("/Name1Redesp"),titleAbbreviation:"TRANSP REDESP",children:null,state:"Positive",stateText:e.onFormatTelefone(e.getModel("modelParamDialog").getProperty("/FoneRedesp")),focused:false,texts:[e.getModel("modelParamDialog").getProperty("/EmailRedesp")]};i.nodes.splice(4,0,r);i.lanes[4].state="Positive";i.nodes[5].state="Positive";i.nodes[5].stateText="OK - "+a.DataRedesp;i.nodes[5].texts="Prev Redespacho: "+a.DataPrevRedesp;if(a.DataEntregaReal!=""&&a.DataEntregaReal!="00/00/0000"&&a.DataEntregaReal!="undefined"){i.lanes[5].state="Positive";i.nodes[6].state="Positive";i.nodes[5].focused=true;i.nodes[6].stateText="OK - "+a.DataEntregaReal;if(a.DataAgendada!=""&&a.DataAgendada!="00/00/0000"&&a.DataAgendada!="undefined"){i.nodes[6].texts=["Data agendada: "+a.DataAgendada]}else if(a.DataEstimadaEntrega!=""&&a.DataAgendada!="00/00/0000"&&a.DataAgendada!="undefined"){i.nodes[6].texts=["Prev Entrega: "+a.DataEstimadaEntrega]}}else{if(a.DataAgendada!=""&&a.DataAgendada!="00/00/0000"&&a.DataAgendada!="undefined"){i.nodes[6].texts=["Data agendada: "+a.DataAgendada]}else if(a.DataEstimadaEntrega!=""&&a.DataAgendada!="00/00/0000"&&a.DataAgendada!="undefined"){i.nodes[6].texts=["Prev Entrega: "+a.DataEstimadaEntrega]}}}else{if(a.DataEntregaReal!=""&&a.DataEntregaReal!="00/00/0000"&&a.DataEntregaReal!="undefined"){i.lanes[5].state="Positive";i.nodes[5].state="Positive";i.nodes[5].focused=true;i.nodes[5].stateText="OK - "+a.DataEntregaReal}}}}if(a.Inco1=="FOB"){if(a.DataAgendada!=""&&a.DataAgendada!="00/00/0000"&&a.DataAgendada!="undefined"){i.nodes[4].texts=["Data agendada: "+a.DataAgendada]}else if(a.DataEstimadaEntrega!=""&&a.DataAgendada!="00/00/0000"&&a.DataAgendada!="undefined"){i.nodes[4].texts=["Prev Entrega: "+a.DataEstimadaEntrega]}}else{if(a.DataAgendada!=""&&a.DataAgendada!="00/00/0000"&&a.DataAgendada!="undefined"){i.nodes[5].texts=["Data agendada: "+a.DataAgendada]}else if(a.DataEstimadaEntrega!=""&&a.DataAgendada!="00/00/0000"&&a.DataAgendada!="undefined"){i.nodes[5].texts=["Prev Entrega: "+a.DataEstimadaEntrega]}}var s=new t(i);e.setModel(s,"StatusPed");e.getModel("StatusPed").refresh();e._ItemDialog.setBusy(false)}).catch(function(t){e.onMensagemErroODATA(t);e._ItemDialog.setBusy(false)})},onDialogEnvioDanfe:function(){var e=this;var t=e.getModelGlobal("modelAux").getProperty("/CodRepres");var i=e.getModelGlobal("modelAux").getProperty("/NomeRepres").replaceAll(" ","_");var r=e.getModel("modelParamDialog").getProperty("/Docnum");var s=e.getModel("modelParamDialog").getProperty("/Nfenum");var o=e.getModel("modelParamDialog").getProperty("/Series");var n=e.getModelGlobal("modelAux").getProperty("/Email");sap.ui.getCore().byId("idDialogEmail").setBusy(true);e.oModel.read("/EnviaEmailDanfe(IvUsuario='"+t+"',IvDocnum='"+r+"',IvEmail='"+n+"',IvName1='"+i+"')",{success:function(t){sap.ui.getCore().byId("idDialogEmail").setBusy(false);a.show("NF-e "+s+" -"+o+" enviada para o e-mail "+n,{icon:a.Icon.SUCCESS,title:"Envio de Notas Fiscais",actions:[sap.m.MessageBox.Action.OK]});e.onDialogClose()},error:function(t){sap.ui.getCore().byId("idDialogEmail").setBusy(false);e.onMensagemErroODATA(t)}})},onPressBtnFiltrar:function(){var e=this;var t=e.getModelGlobal("modelAux").getProperty("/CodRepres");e.oModel=e.getModelGlobal("modelAux").getProperty("/DBModel");var a=e.getModel("modelParametros").getData();var i=e.getModel("modelParametros").getProperty("/Periodo");var r=i.split(" - ");var s=r[0];var o=r[1];e.byId("master").setBusy(true);e.oModel.read("/P_RelNotasFiscais",{urlParameters:{$filter:"Usuario eq '"+t+"' and WerksIni eq '"+a.WerksIni+"' and WerksFim eq '"+a.WerksFim+"' and KunnrIni eq '"+a.KunnrIni+"' and KunnrFim eq '"+a.KunnrFim+"' and Kvgr4Ini eq '"+a.Kvgr4Ini+"' and Kvgr4Fim eq '"+a.Kvgr4Fim+"' and Kvgr5Ini eq '"+a.Kvgr5Ini+"' and Kvgr5Fim eq '"+a.Kvgr5Fim+"' and SeriesIni eq '"+a.SeriesIni+"' and SeriesFim eq '"+a.SeriesFim+"' and NfenumIni eq '"+a.NfenumIni+"' and NfenumFim eq '"+a.NfenumFim+"' and RepreIni eq '"+a.LifnrIni+"' and RepreFim eq '"+a.LifnrFim+"' and PerioIni eq '"+s+"' and PerioFim eq '"+o+"'"},success:function(t){e.vetorNotasFiscais=[];e.vetorResumoEmpresa=[];e.vetorNotasFiscais=t.results;e.getModel("modelNotasFiscais").setData(e.vetorNotasFiscais);var a=0;for(var i=0;i<e.vetorNotasFiscais.length;i++){var r=false;for(var s=0;s<e.vetorResumoEmpresa.length;s++){if(e.vetorNotasFiscais[i].Bukrs==e.vetorResumoEmpresa[s].Bukrs){r=true;e.vetorResumoEmpresa[s].Netwrt=parseFloat(e.vetorResumoEmpresa[s].Netwrt)+Math.round(parseFloat(e.vetorNotasFiscais[i].Netwrt)*100)/100;e.vetorResumoEmpresa[s].Netwrt=parseFloat(e.vetorResumoEmpresa[s].Netwrt).toFixed(2)}}if(r==false){var o={Bukrs:e.vetorNotasFiscais[i].Bukrs,Butxt:e.vetorNotasFiscais[i].Butxt,Netwrt:parseFloat(e.vetorNotasFiscais[i].Netwrt)};e.vetorResumoEmpresa.push(o)}a+=parseFloat(e.vetorNotasFiscais[i].Netwrt)}if(a>0){var n={Bukrs:"",Butxt:"TOTAL",Netwrt:parseFloat(a).toFixed(2)};e.vetorResumoEmpresa.push(n)}e.byId("master").setBusy(false);e.getModel("modelResumoEmpresa").setData(e.vetorResumoEmpresa)},error:function(t){e.byId("master").setBusy(false);e.onMensagemErroODATA(t)}})},onExpandFiltro:function(){if(this.byId("idPanelFiltro").getExpanded()){this.byId("idPanelFiltro").setHeaderText("Ocultar Filtros")}else{this.byId("idPanelFiltro").setHeaderText("Exibir Filtros")}},onSuggestCentroFim:function(e){var t=e.getSource().getValue();var a=[];var i=[new sap.ui.model.Filter("Werks",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("NomeCentro",sap.ui.model.FilterOperator.Contains,t)];var r=new sap.ui.model.Filter(i,false);a.push(r);this.byId("idCentroFim").getBinding("suggestionItems").filter(a);this.byId("idCentroFim").suggest()},onSuggestClienteIni:function(e){var t=e.getSource().getValue();var a=[];var i=[new sap.ui.model.Filter("Kunnr",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Name1",sap.ui.model.FilterOperator.Contains,t)];var r=new sap.ui.model.Filter(i,false);a.push(r);this.byId("idClienteIni").getBinding("suggestionItems").filter(a);this.byId("idClienteIni").suggest()},onSuggestClienteFim:function(e){var t=e.getSource().getValue();var a=[];var i=[new sap.ui.model.Filter("Kunnr",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Name1",sap.ui.model.FilterOperator.Contains,t)];var r=new sap.ui.model.Filter(i,false);a.push(r);this.byId("idClienteFim").getBinding("suggestionItems").filter(a);this.byId("idClienteFim").suggest()},onSuggestRedeIni:function(e){var t=e.getSource().getValue();var a=[];var i=[new sap.ui.model.Filter("Kvgr4",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("DescKvgr4",sap.ui.model.FilterOperator.Contains,t)];var r=new sap.ui.model.Filter(i,false);a.push(r);this.byId("idRedeIni").getBinding("suggestionItems").filter(a);this.byId("idRedeIni").suggest()},onSuggestRedeFim:function(e){var t=e.getSource().getValue();var a=[];var i=[new sap.ui.model.Filter("Kvgr4",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("DescKvgr4",sap.ui.model.FilterOperator.Contains,t)];var r=new sap.ui.model.Filter(i,false);a.push(r);this.byId("idRedeFim").getBinding("suggestionItems").filter(a);this.byId("idRedeFim").suggest()},onSuggestBandeiraIni:function(e){var t=e.getSource().getValue();var a=[];var i=[new sap.ui.model.Filter("Kvgr5",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("DescKvgr5",sap.ui.model.FilterOperator.Contains,t)];var r=new sap.ui.model.Filter(i,false);a.push(r);this.byId("idBandeiraIni").getBinding("suggestionItems").filter(a);this.byId("idBandeiraIni").suggest()},onSuggestBandeiraFim:function(e){var t=e.getSource().getValue();var a=[];var i=[new sap.ui.model.Filter("Kvgr5",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("DescKvgr5",sap.ui.model.FilterOperator.Contains,t)];var r=new sap.ui.model.Filter(i,false);a.push(r);this.byId("idBandeiraFim").getBinding("suggestionItems").filter(a);this.byId("idBandeiraFim").suggest()},onSuggestRepresIni:function(e){var t=e.getSource().getValue();var a=[];var i=[new sap.ui.model.Filter("Lifnr",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Name1Rep",sap.ui.model.FilterOperator.Contains,t)];var r=new sap.ui.model.Filter(i,false);a.push(r);this.byId("idRepreIni").getBinding("suggestionItems").filter(a);this.byId("idRepreIni").suggest()},onSuggestRepresFim:function(e){var t=e.getSource().getValue();var a=[];var i=[new sap.ui.model.Filter("Lifnr",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Name1Rep",sap.ui.model.FilterOperator.Contains,t)];var r=new sap.ui.model.Filter(i,false);a.push(r);this.byId("idRepreFim").getBinding("suggestionItems").filter(a);this.byId("idRepreFim").suggest()},onCriarModelStatus:function(){var e=new t({nodes:[{id:"1",lane:"0",title:"Emissão da NF",titleAbbreviation:"NF",children:[10],state:"Negative",stateText:"-",focused:true,texts:null},{id:"10",lane:"1",title:"Em contratação de frete",titleAbbreviation:"CONT FRETE",children:[20],state:null,stateText:"-",focused:false,texts:null},{id:"20",lane:"2",title:"Mercadoria em separação",titleAbbreviation:"MERC TRANS",children:[30],state:null,stateText:"-",focused:false,texts:null},{id:"30",lane:"3",title:"Mercadoria saiu da fábrica",titleAbbreviation:"MERC FÁBRIC",children:[40],state:null,stateText:"-",focused:false,texts:null},{id:"40",lane:"4",title:"Transportadora de Redespacho",titleAbbreviation:"MERC REDESP",children:[50],state:null,stateText:"-",focused:false,texts:null},{id:"50",lane:"5",title:"Mercadoria entregue",titleAbbreviation:"MERC ENTRG",children:null,state:null,stateText:"-",focused:false,texts:null}],lanes:[{id:"0",icon:"sap-icon://order-status",label:"Emissão da NF",position:0},{id:"1",icon:"sap-icon://lead",label:"Em contratação de frete",position:1},{id:"2",icon:"sap-icon://customer-and-supplier",label:"Em separação de mercadoria",position:2},{id:"3",icon:"sap-icon://offsite-work",label:"Mercadoria saiu da fábrica",position:3},{id:"4",icon:"sap-icon://shipping-status",label:"Mercadoria em trânsito para entrega",position:4},{id:"5",icon:"sap-icon://task",label:"Mercadoria entregue",position:5}]});this.setModel(e,"modelStatusPedido")}})});