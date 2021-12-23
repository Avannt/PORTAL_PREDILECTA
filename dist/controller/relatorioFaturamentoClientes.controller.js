sap.ui.define(["application/controller/BaseController","sap/ui/model/json/JSONModel","sap/m/MessageBox","application/model/formatter","sap/ui/core/util/MockServer","sap/ui/export/library","sap/ui/export/Spreadsheet","sap/ui/model/odata/v2/ODataModel"],function(e,t,r,i,a,o,n,l){"use strict";var s=[];var v=o.EdmType;return e.extend("application.controller.relatorioFaturamentoClientes",{onInit:function(){this.getRouter().getRoute("relatorioFaturamentoClientes").attachPatternMatched(this._onLoadFields,this)},_onLoadFields:function(){var e=this;var r=e.getModelGlobal("modelAux").getProperty("/CodRepres");e.oModel=e.getModelGlobal("modelAux").getProperty("/DBModel");var i={WerksIni:"",WerksFim:"",KunnrIni:"",KunnrFim:"",Kvgr4Ini:"",Kvgr4Fim:"",Kvgr5Ini:"",Kvgr5Fim:"",VBelnIni:"",VBelnFim:"",RepreIni:"",Periodo:""};var a=new t(i);e.setModel(a,"modelParametros");e.vetorFatClientes=[];var o=new t(e.vetorFatClientes);e.setModel(o,"modelFatClientes");e.vetorFatClientesExcel=[];var n=new t(e.vetorFatClientesExcel);e.setModel(n,"modelFatClientesExcel");new Promise(function(t,i){e.onBuscarClientes(r,t,i,e)}).then(function(r){var i=r;var a=[];var o=[];var n=[];for(var l=0;l<i.length;l++){var s=false;var v=false;var d=false;for(var u=0;u<a.length;u++){if(i[l].Kvgr4==a[u].Kvgr4||i[l].Kvgr4==""){s=true;break}}for(var p=0;p<o.length;p++){if(i[l].Kvgr5==o[p].Kvgr5||i[l].Kvgr5==""){v=true;break}}for(var g=0;g<n.length;g++){if(i[l].Lifnr==n[g].Lifnr||i[l].Lifnr==""){d=true;break}}if(s==false){a.push(i[l])}if(v==false){o.push(i[l])}if(d==false){n.push(i[l])}}var F=new t(i);e.setModel(F,"modelClientes");var m=new t(a);e.setModel(m,"modelRedes");var C=new t(o);e.setModel(C,"modelBandeiras");var c=new t(n);e.setModel(c,"modelRepres")}).catch(function(t){e.onMensagemErroODATA(t)});e.oModel.read("/Centros",{urlParameters:{$filter:"IvUsuario eq '"+r+"'"},success:function(r){var i=r.results;var a=new t(i);e.setModel(a,"modelCentros")},error:function(t){e.onMensagemErroODATA(t)}})},ongetHeaderGroupLifnr:function(e){return e.getProperty("Lifnr")},ongetHeaderGroupBukrs:function(e){return e.getProperty("Bukrs")+" - "+e.getProperty("Butxt")},createColumnConfig:function(){var e=[];e.push({label:"Repres",property:"Lifnr",type:v.Number});e.push({label:"Nome Repres",property:"Name1Rep",type:v.String});e.push({label:"Vocativo",property:"TitleLet",type:v.String});e.push({label:"Empresa",property:"Bukrs",type:v.String});e.push({label:"Nome Empresa",property:"Butxt",type:v.String});e.push({label:"Cliente",property:"Kunnr",type:v.String});e.push({label:"Razão Social",property:"Name1Cli",type:v.String});e.push({label:"CNPJ",property:"Stcd1",type:v.String});e.push({label:"CPF",property:"Stcd2",type:v.String});e.push({label:"Canal Atuação",property:"Kvgr2",type:v.String});e.push({label:"Descrição Canal Atuação",property:"Kvgr2Text",type:v.String});e.push({label:"Rede",property:"Kvgr4",type:v.String});e.push({label:"Descrição Rede",property:"Kvgr4Text",type:v.String});e.push({label:"Bandeira",property:"Kvgr5",type:v.String});e.push({label:"Descrição Bandeira",property:"Kvgr5Text",type:v.String});e.push({label:"UF",property:"Region",type:v.String});e.push({label:"Cidade",property:"City1",type:v.String});e.push({label:"Qtd Faturada",property:"Menge",type:v.Number,scale:2,delimiter:true});e.push({label:"Vlr Faturado",property:"Netwrt",type:v.Number,scale:2,delimiter:true});e.push({label:"%Partic.",property:"PctPartic",type:v.Number,scale:2,delimiter:true});e.push({label:"Qtde Pedidos",property:"QtdPedidos",type:v.Number,scale:0,delimiter:true});e.push({property:"PctRentab",type:v.Number,scale:2,delimiter:true});return e},onExport:function(){var e,t,r,i,a;if(!this._oTable){this._oTable=this.byId("idtableFatClientes")}a=this._oTable;t=a.getBinding("items");e=this.createColumnConfig();var o=this.getModel("modelParametros").getData();r={workbook:{columns:e,hierarchyLevel:"Level",context:{application:"Portal Predilecta",version:"1.00.00",title:"Relatório de Faturamento de Clientes",modifiedBy:"Administrador",metaSheetName:"Parâmetros",metainfo:[{name:"Parâmetros de Seleção",items:[{key:"Centro",value:o.Centro},{key:"UF Origem",value:o.UFOrigem},{key:"Cliente",value:o.Cliente},{key:"UF Destino",value:o.UFDestino},{key:"Canal Atuação",value:o.CanalAtuacao},{key:"Tabela de Preço",value:o.TabPreco},{key:"Vencimento",value:o.Vencimento},{key:"Índice",value:o.Indice},{key:"Tipo Transporte",value:o.Frete},{key:"Exibição",value:o.Exibicao}]}]}},dataSource:t,fileName:"Rel_Fat_Cliente.xlsx",worker:false};i=new n(r);i.build().finally(function(){i.destroy()})},onSuggestCentroIni:function(e){var t=e.getSource().getValue();var r=[];var i=[new sap.ui.model.Filter("Werks",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("NomeCentro",sap.ui.model.FilterOperator.Contains,t)];var a=new sap.ui.model.Filter(i,false);r.push(a);this.byId("idCentroIni").getBinding("suggestionItems").filter(r);this.byId("idCentroIni").suggest()},onPressBtnFiltrar:function(){var e=this;var t=e.getModelGlobal("modelAux").getProperty("/CodRepres");e.oModel=e.getModelGlobal("modelAux").getProperty("/DBModel");var r=e.getModel("modelParametros").getData();var i=e.getModel("modelParametros").getProperty("/Periodo");var a=i.split(" - ");var o=a[0];var n=a[1];e.byId("master").setBusy(true);e.oModel.read("/P_RelFatClientes",{urlParameters:{$filter:"Usuario eq '"+t+"' and WerksIni eq '"+r.WerksIni+"' and WerksFim eq '"+r.WerksFim+"' and KunnrIni eq '"+r.KunnrIni+"' and KunnrFim eq '"+r.KunnrFim+"' and Kvgr4Ini eq '"+r.Kvgr4Ini+"' and Kvgr4Fim eq '"+r.Kvgr4Fim+"' and Kvgr5Ini eq '"+r.Kvgr5Ini+"' and Kvgr5Fim eq '"+r.Kvgr5Fim+"' and RepreIni eq '"+r.RepreIni+"' and RepreFim eq '"+r.RepreFim+"' and PerioIni eq '"+o+"' and PerioFim eq '"+n+"'"},success:function(t){e.vetorTreeRepres=[];e.vetorTreeEmpresa=[];e.vetorTreeRede=[];e.vetorTreeCliente=[];e.vetorFatClientes=[];e.vetorFatClientes=t.results;for(var r=0;r<e.vetorFatClientes.length;r++){if(e.vetorFatClientes[r].HierarchyLevel==0){var i={Lifnr:e.vetorFatClientes[r].Lifnr,Name1Rep:e.vetorFatClientes[r].Name1Rep,Menge:parseFloat(e.vetorFatClientes[r].Menge),Netwrt:parseFloat(e.vetorFatClientes[r].Netwrt),PctPartic:parseFloat(e.vetorFatClientes[r].PctPartic),QtdPedidos:parseFloat(e.vetorFatClientes[r].QtdPedidos),PctRentab:parseFloat(e.vetorFatClientes[r].PctRentab),NodeID:e.vetorFatClientes[r].NodeID,HierarchyLevel:[],Description:e.vetorFatClientes[r].Description,ParentNodeID:e.vetorFatClientes[r].ParentNodeID};e.vetorTreeRepres.push(i)}if(e.vetorFatClientes[r].HierarchyLevel==1){var a={Lifnr:e.vetorFatClientes[r].Lifnr,Name1Rep:e.vetorFatClientes[r].Name1Rep,Bukrs:e.vetorFatClientes[r].Bukrs,Butxt:e.vetorFatClientes[r].Butxt,Menge:parseFloat(e.vetorFatClientes[r].Menge),Netwrt:parseFloat(e.vetorFatClientes[r].Netwrt),PctPartic:parseFloat(e.vetorFatClientes[r].PctPartic),QtdPedidos:parseFloat(e.vetorFatClientes[r].QtdPedidos),PctRentab:parseFloat(e.vetorFatClientes[r].PctRentab),NodeID:e.vetorFatClientes[r].NodeID,HierarchyLevel:[],Description:e.vetorFatClientes[r].Description,ParentNodeID:e.vetorFatClientes[r].ParentNodeID};e.vetorTreeEmpresa.push(a)}if(e.vetorFatClientes[r].HierarchyLevel==2){var o={Lifnr:e.vetorFatClientes[r].Lifnr,Name1Rep:e.vetorFatClientes[r].Name1Rep,Bukrs:e.vetorFatClientes[r].Bukrs,Butxt:e.vetorFatClientes[r].Butxt,Kunnr:e.vetorFatClientes[r].Kunnr,Kvgr4:e.vetorFatClientes[r].Kvgr4,Kvgr4Text:e.vetorFatClientes[r].Kvgr4Text,Menge:parseFloat(e.vetorFatClientes[r].Menge),Netwrt:parseFloat(e.vetorFatClientes[r].Netwrt),PctPartic:parseFloat(e.vetorFatClientes[r].PctPartic),QtdPedidos:parseFloat(e.vetorFatClientes[r].QtdPedidos),PctRentab:parseFloat(e.vetorFatClientes[r].PctRentab),NodeID:e.vetorFatClientes[r].NodeID,HierarchyLevel:[],Description:e.vetorFatClientes[r].Description,ParentNodeID:e.vetorFatClientes[r].ParentNodeID};e.vetorTreeRede.push(o)}if(e.vetorFatClientes[r].HierarchyLevel==3){var n={Lifnr:e.vetorFatClientes[r].Lifnr,Name1Rep:e.vetorFatClientes[r].Name1Rep,Bukrs:e.vetorFatClientes[r].Bukrs,Butxt:e.vetorFatClientes[r].Butxt,Kunnr:e.vetorFatClientes[r].Kunnr,Name1Cli:e.vetorFatClientes[r].Name1Cli,Stcd1:e.vetorFatClientes[r].Stcd1,Stcd2:e.vetorFatClientes[r].Stcd2,Street:e.vetorFatClientes[r].Street,HouseNum1:e.vetorFatClientes[r].HouseNum1,City1:e.vetorFatClientes[r].City1,Region:e.vetorFatClientes[r].Region,Kvgr2:e.vetorFatClientes[r].Kvgr2,Kvgr2Text:e.vetorFatClientes[r].Kvgr2Text,Kvgr4:e.vetorFatClientes[r].Kvgr4,Kvgr4Text:e.vetorFatClientes[r].Kvgr4Text,Kvgr5:e.vetorFatClientes[r].Kvgr5,Kvgr5Text:e.vetorFatClientes[r].Kvgr5Text,Menge:parseFloat(e.vetorFatClientes[r].Menge),Netwrt:parseFloat(e.vetorFatClientes[r].Netwrt),PctPartic:parseFloat(e.vetorFatClientes[r].PctPartic),QtdPedidos:parseFloat(e.vetorFatClientes[r].QtdPedidos),PctRentab:parseFloat(e.vetorFatClientes[r].PctRentab),NodeID:e.vetorFatClientes[r].NodeID,HierarchyLevel:[],Description:e.vetorFatClientes[r].Description,ParentNodeID:e.vetorFatClientes[r].ParentNodeID};e.vetorTreeCliente.push(n);e.vetorFatClientesExcel.push(e.vetorFatClientes[r])}}e.vetorFatClientes=[];for(var l=0;l<e.vetorTreeRepres.length;l++){e.vetorFatClientes.push(e.vetorTreeRepres[l]);for(var s=0;s<e.vetorTreeEmpresa.length;s++){if(e.vetorTreeEmpresa[s].Lifnr==e.vetorTreeRepres[l].Lifnr){e.vetorFatClientes[l].HierarchyLevel.push(e.vetorTreeEmpresa[s])}}}for(var l=0;l<e.vetorFatClientes.length;l++){for(var r=0;r<e.vetorFatClientes[l].HierarchyLevel.length;r++){for(var v=0;v<e.vetorTreeRede.length;v++){if(e.vetorTreeRede[v].Lifnr==e.vetorFatClientes[l].HierarchyLevel[r].Lifnr&&e.vetorTreeRede[v].Bukrs==e.vetorFatClientes[l].HierarchyLevel[r].Bukrs){e.vetorFatClientes[l].HierarchyLevel[r].HierarchyLevel.push(e.vetorTreeRede[v])}}}}for(var l=0;l<e.vetorFatClientes.length;l++){for(var r=0;r<e.vetorFatClientes[l].HierarchyLevel.length;r++){for(var v=0;v<e.vetorFatClientes[l].HierarchyLevel[r].HierarchyLevel.length;v++){if(e.vetorFatClientes[l].HierarchyLevel[r].HierarchyLevel[v].Lifnr==e.vetorFatClientes[l].HierarchyLevel[r].Lifnr&&e.vetorFatClientes[l].HierarchyLevel[r].HierarchyLevel[v].Bukrs==e.vetorFatClientes[l].HierarchyLevel[r].Bukrs){for(var d=0;d<e.vetorTreeCliente.length;d++){if(e.vetorTreeCliente[d].Lifnr==e.vetorFatClientes[l].HierarchyLevel[r].HierarchyLevel[v].Lifnr&&e.vetorTreeCliente[d].Bukrs==e.vetorFatClientes[l].HierarchyLevel[r].HierarchyLevel[v].Bukrs&&e.vetorTreeCliente[d].Kvgr4==e.vetorFatClientes[l].HierarchyLevel[r].HierarchyLevel[v].Kvgr4){e.vetorFatClientes[l].HierarchyLevel[r].HierarchyLevel[v].HierarchyLevel.push(e.vetorTreeCliente[d])}}}}}}e.byId("master").setBusy(false);e.getModel("modelFatClientes").setData(e.vetorFatClientes);e.getModel("modelFatClientesExcel").setData(e.vetorFatClientesExcel)},error:function(t){e.byId("master").setBusy(false);e.onMensagemErroODATA(t)}})},onExpandFiltro:function(){if(this.byId("idPanelFiltro").getExpanded()){this.byId("idPanelFiltro").setHeaderText("Ocultar Filtros")}else{this.byId("idPanelFiltro").setHeaderText("Exibir Filtros")}},onSuggestCentroFim:function(e){var t=e.getSource().getValue();var r=[];var i=[new sap.ui.model.Filter("Werks",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("NomeCentro",sap.ui.model.FilterOperator.Contains,t)];var a=new sap.ui.model.Filter(i,false);r.push(a);this.byId("idCentroFim").getBinding("suggestionItems").filter(r);this.byId("idCentroFim").suggest()},onSuggestClienteIni:function(e){var t=e.getSource().getValue();var r=[];var i=[new sap.ui.model.Filter("Kunnr",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Name1",sap.ui.model.FilterOperator.Contains,t)];var a=new sap.ui.model.Filter(i,false);r.push(a);this.byId("idClienteIni").getBinding("suggestionItems").filter(r);this.byId("idClienteIni").suggest()},onSuggestClienteFim:function(e){var t=e.getSource().getValue();var r=[];var i=[new sap.ui.model.Filter("Kunnr",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Name1",sap.ui.model.FilterOperator.Contains,t)];var a=new sap.ui.model.Filter(i,false);r.push(a);this.byId("idClienteFim").getBinding("suggestionItems").filter(r);this.byId("idClienteFim").suggest()},onSuggestRedeIni:function(e){var t=e.getSource().getValue();var r=[];var i=[new sap.ui.model.Filter("Kvgr4",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("DescKvgr4",sap.ui.model.FilterOperator.Contains,t)];var a=new sap.ui.model.Filter(i,false);r.push(a);this.byId("idRedeIni").getBinding("suggestionItems").filter(r);this.byId("idRedeIni").suggest()},onSuggestRedeFim:function(e){var t=e.getSource().getValue();var r=[];var i=[new sap.ui.model.Filter("Kvgr4",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("DescKvgr4",sap.ui.model.FilterOperator.Contains,t)];var a=new sap.ui.model.Filter(i,false);r.push(a);this.byId("idRedeFim").getBinding("suggestionItems").filter(r);this.byId("idRedeFim").suggest()},onSuggestBandeiraIni:function(e){var t=e.getSource().getValue();var r=[];var i=[new sap.ui.model.Filter("Kvgr5",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("DescKvgr5",sap.ui.model.FilterOperator.Contains,t)];var a=new sap.ui.model.Filter(i,false);r.push(a);this.byId("idBandeiraIni").getBinding("suggestionItems").filter(r);this.byId("idBandeiraIni").suggest()},onSuggestBandeiraFim:function(e){var t=e.getSource().getValue();var r=[];var i=[new sap.ui.model.Filter("Kvgr5",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("DescKvgr5",sap.ui.model.FilterOperator.Contains,t)];var a=new sap.ui.model.Filter(i,false);r.push(a);this.byId("idBandeiraFim").getBinding("suggestionItems").filter(r);this.byId("idBandeiraFim").suggest()},onSuggestRepresIni:function(e){var t=e.getSource().getValue();var r=[];var i=[new sap.ui.model.Filter("Lifnr",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Name1Rep",sap.ui.model.FilterOperator.Contains,t)];var a=new sap.ui.model.Filter(i,false);r.push(a);this.byId("idRepreIni").getBinding("suggestionItems").filter(r);this.byId("idRepreIni").suggest()},onSuggestRepresFim:function(e){var t=e.getSource().getValue();var r=[];var i=[new sap.ui.model.Filter("Lifnr",sap.ui.model.FilterOperator.Contains,t),new sap.ui.model.Filter("Name1Rep",sap.ui.model.FilterOperator.Contains,t)];var a=new sap.ui.model.Filter(i,false);r.push(a);this.byId("idRepreFim").getBinding("suggestionItems").filter(r);this.byId("idRepreFim").suggest()}})});