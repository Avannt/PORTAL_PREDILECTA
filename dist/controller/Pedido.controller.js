sap.ui.define(["jquery.sap.global","sap/m/MessageToast","sap/ui/core/Fragment","application/controller/BaseController","sap/ui/model/Filter","sap/ui/model/FilterOperator","sap/m/MessageBox","sap/ui/model/json/JSONModel"],function(e,o,t,i,s,r,n,a){"use strict";return i.extend("application.controller.Pedido",{onInit:function(){this.getRouter().getRoute("pedido").attachPatternMatched(this._onLoadFields,this)},_onLoadFields:function(){var e=this;this.vetorClientes=[];this.oPrePedidos=[];this.oVetorTitulos=[];var o=this.getModelGlobal("modelAux").getProperty("/CodRepres");this.onInicializaModels();new Promise(function(t,i){e.onBuscarClientes(o,t,i,e)}).then(function(o){var t=new a(o);e.setModel(t,"Clientes");e.byId("master").setBusy(false)}).catch(function(o){e.byId("master").setBusy(false);e.onMensagemErroODATA(o)})},onEditarPress:function(e){var o=this;var t=e.getParameter("listItem")||e.getSource();var i=t.getBindingContext("Pedidos").getObject();if(i.IdStatusPedido==3){n.show("Não é possível realizar a edição de pedidos já integrados! ",{icon:n.Icon.ERROR,title:"Ação não permitida!",actions:[n.Action.OK]})}else if(i.Usuario!=o.getModelGlobal("modelAux").getProperty("/CodRepres")){n.show("Não é possível realizar a edição. Usuario criação: "+i.Usuario+", Usuario edição: "+o.getModelGlobal("modelAux").getProperty("/CodRepres")+".",{icon:n.Icon.ERROR,title:"Ação não permitida!",actions:[n.Action.OK]})}else if(i.IdStatusPedido==2){n.show("Deseja reabrir o pedido?",{icon:n.Icon.WARNING,title:"Detalhamento do pedido!",actions:["Reabrir","Visualizar",sap.m.MessageBox.Action.CANCEL],onClose:function(e){if(e=="Reabrir"){new Promise(function(e,t){o.byId("table_pedidos").setBusy(true);o.onBuscarPedido(i.NrPedido,e,t,o)}).then(function(e){var t=o.onDataHora();e.SituacaoPedido="EM DIGITAÇÃO";e.IdStatusPedido=1;e.DataFim=t[0];e.HoraFim=t[1];e.Completo=false;e=o.onFormatNumberPedido(e);delete e.__metadata;new Promise(function(t,i){o.onInserirPedido(e,t,i,o)}).then(function(t){o.byId("table_pedidos").setBusy(false);o.getModelGlobal("modelAux").setProperty("/NrPedido",e.NrPedido)}).catch(function(e){o.byId("table_pedidos").setBusy(false);o.onMensagemErroODATA(e)})}).catch(function(e){o.byId("table_pedidos").setBusy(false);o.onMensagemErroODATA(e)})}else if(e=="Visualizar"){o.getModelGlobal("modelAux").setProperty("/NrPedido",i.NrPedido);sap.ui.core.UIComponent.getRouterFor(o).navTo("pedidoDetalhe")}else{o.getModelGlobal("modelAux").setProperty("/NrPedido","")}}})}else{o.getModelGlobal("modelAux").setProperty("/NrPedido",i.NrPedido);sap.ui.core.UIComponent.getRouterFor(o).navTo("pedidoDetalhe")}},onInicializaModels:function(){this.byId("master").setBusy(true);this.getModelGlobal("modelAux").setProperty("/NrPedCli","");this.getModelGlobal("modelAux").setProperty("/Kunnr","");this.oModel=this.getView().getModel();var e={Kunnr:"",Name1:"Nenhum cliente selecionado",Stcd1:"",Stcd2:""};var o=new sap.ui.model.json.JSONModel(e);this.setModel(o,"Cliente");this.setModelGlobal(o,"Cliente_G");var t=new a;this.setModel(t,"Pedidos");this.getModelGlobal("modelAux").setProperty("/NrPedido","")},onNavBack:function(){sap.ui.core.UIComponent.getRouterFor(this).navTo("menu")},formatRentabilidade:function(e){if(e==0){this.byId("table_pedidos").getColumns()[6].setVisible(false);return e}else if(e>-3){this.byId("table_pedidos").getColumns()[6].setVisible(false);return""}else{this.byId("table_pedidos").getColumns()[6].setVisible(true);return e}},onAfterRendering:function(){var o=this.getSplitContObj(),t=o.getDomRef()&&o.getDomRef().parentNode;if(t&&!t._sapui5_heightFixed){t._sapui5_heightFixed=true;while(t&&t!==document.documentElement){var i=e(t);if(i.attr("data-sap-ui-root-content")){break}if(!t.style.height){t.style.height="100%"}t=t.parentNode}}},getSplitContObj:function(){var o=this.byId("SplitCont");if(!o){e.sap.log.error("SplitApp object can't be found")}return o},onPressNavToDetail:function(){this.getSplitContObj().to(this.createId("detailDetail"))},navBack2:function(){var e=this.getOwnerComponent().getModel("modelAux").getProperty("/isTablet");if(e==true){sap.ui.core.UIComponent.getRouterFor(this).navTo("menu")}else{this.byId("listClientes").removeSelections(true);this.onPressDetailBack()}},onPressDetailBack:function(){this.getSplitContObj().backDetail()},onSelectionChange:function(e){var o=this;o.vetorPedidos=[];this.byId("table_pedidos").setBusy(true);var t=e.getParameter("listItem")||e.getSource();var i=t.getBindingContext("Clientes").getObject();o.getModelGlobal("Cliente_G").setData(i);this.getModelGlobal("modelAux").setProperty("/Usuario",i.Lifnr);this.getModelGlobal("modelAux").setProperty("/Lifnr",i.Lifnr);this.getSplitContObj().toDetail(this.createId("detail"));this.oModel.read("/P_PedidoQ",{urlParameters:{$filter:"IvUsuario eq '"+this.getModelGlobal("modelAux").getProperty("/Usuario")+"' and IvKunnr eq '"+i.Kunnr+"'"},success:function(e){o.vetorPedidos=e.results;var t=new a(o.vetorPedidos);o.getView().setModel(t,"Pedidos");o.byId("table_pedidos").setBusy(false)},error:function(e){o.byId("table_pedidos").setBusy(false);o.onMensagemErroODATA(e)}});this.getSplitContObj().toDetail(this.createId("detail"))},onSearch:function(e){var o=e.getSource().getValue();var t=[];var i=[new sap.ui.model.Filter("Kunnr",sap.ui.model.FilterOperator.Contains,o),new sap.ui.model.Filter("Name1",sap.ui.model.FilterOperator.Contains,o),new sap.ui.model.Filter("Lifnr",sap.ui.model.FilterOperator.Contains,o),new sap.ui.model.Filter("Ort01",sap.ui.model.FilterOperator.Contains,o),new sap.ui.model.Filter("Regio",sap.ui.model.FilterOperator.StartsWith,o),new sap.ui.model.Filter("Stcd1",sap.ui.model.FilterOperator.StartsWith,o),new sap.ui.model.Filter("Stcd2",sap.ui.model.FilterOperator.StartsWith,o)];var s=new sap.ui.model.Filter(i,false);t.push(s);this.byId("listClientes").getBinding("items").filter(t,"Application")},onAddPedido:function(){var e="";var o=this;var t=this.getModel("Cliente").getData();if(t.Kunnr==""){n.show("Nenhum cliente selecionado! Selecione um cliente!",{icon:sap.m.MessageBox.Icon.WARNING,title:"Nenhum cliente selecionado",actions:[n.Action.OK]})}else{this.oModel.read("/P_CheckPedidoR(IvUsuario='"+this.getModelGlobal("modelAux").getProperty("/Usuario")+"',IvKunnr='"+t.Kunnr+"')",{success:function(t){e=t;if(e.TipoErro=="E"){n.show("O Pedido: "+e.NrPedido+", Cliente: "+e.Kunnr+" está em aberto.",{icon:n.Icon.ERROR,details:"<li> Curioso! </li>",title:"Pedido em aberto",actions:[n.Action.OK]})}else{if(e.TipoErro=="S"&&e.MsgErro==""){sap.ui.core.UIComponent.getRouterFor(o).navTo("pedidoDetalhe")}else{n.show(e.MsgErro,{icon:sap.m.MessageBox.Icon.WARNING,title:"Títulos em Aberto!",actions:["Ver Titulo","Continuar","Cancelar"],onClose:function(e){if(e=="Ver Titulo"){o.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr");sap.ui.core.UIComponent.getRouterFor(o).navTo("relatorioTitulos")}else if(e=="Continuar"){sap.ui.core.UIComponent.getRouterFor(o).navTo("pedidoDetalhe")}}})}}},error:function(e){o.byId("table_pedidos").setBusy(false);o.onMensagemErroODATA(e)}})}},onItemPress:function(e){var o=this;var t=e.getParameter("listItem")||e.getSource();var i=t.getBindingContext("Pedidos").getProperty("NrPedido");var s=t.getBindingContext("Pedidos").getObject();if(s.Usuario!=o.getModelGlobal("modelAux").getProperty("/CodRepres")&&(s.IdStatusPedido==1||s.IdStatusPedido==2)){n.show("Não é possível realizar a edição. Usuario criação: "+s.Usuario+", Usuario edição: "+o.getModelGlobal("modelAux").getProperty("/CodRepres")+".",{icon:n.Icon.ERROR,title:"Ação não permitida!",actions:[n.Action.OK]})}else{o.getModelGlobal("modelAux").setProperty("/NrPedido",i);sap.ui.core.UIComponent.getRouterFor(o).navTo("pedidoDetalhe")}},onExcluirPedido:function(e){var o=this;var t=false;var i=e.getParameter("listItem")||e.getSource();var s=i.getBindingContext("Pedidos").getProperty("NrPedido");var r=i.getBindingContext("Pedidos").getProperty("Bukrs");var d=i.getBindingContext("Pedidos").getProperty("IdStatusPedido");if(d==3){var l="Não é possível deletar pedidos que já foram integrados!";n.error(l,{icon:n.Icon.ERROR,title:"Deleção de pedido.",actions:[sap.m.MessageBox.Action.OK]})}else{n.show("Deseja mesmo excluir o pedido?",{icon:n.Icon.WARNING,title:"Exclusão de Pedidos",actions:[n.Action.YES,sap.m.MessageBox.Action.CANCEL],onClose:function(e){if(e==sap.m.MessageBox.Action.YES){o.byId("table_pedidos").setBusy(true);new Promise(function(e,t){o.onExcluirPed(s,e,t)}).then(function(){var e=o.getModelGlobal("Cliente_G").getData();var t=o.getModelGlobal("modelAux").getProperty("/CodRepres");var i=false;new Promise(function(s,r){o.onBuscarPedidos(e.Kunnr,t,i,s,r,o)}).then(function(e){o.vetorPedidos=e;var t=new a(o.vetorPedidos);o.getView().setModel(t,"Pedidos");o.byId("table_pedidos").setBusy(false)}).catch(function(e){o.byId("table_pedidos").setBusy(false);o.onMensagemErroODATA(e)})}).catch(function(e){o.byId("table_pedidos").setBusy(false);o.onMensagemErroODATA(e)})}}})}},handleLinkPress:function(){var e=this.getOwnerComponent().getModel("modelAux").getProperty("/CodCliente");this.getOwnerComponent().getModel("modelAux").setProperty("/telaPedido",true);sap.ui.core.UIComponent.getRouterFor(this).navTo("relatorioTitulos")}})});