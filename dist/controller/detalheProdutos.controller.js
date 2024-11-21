sap.ui.define(["application/controller/BaseController","sap/ui/model/json/JSONModel","sap/ui/model/Filter","sap/ui/model/FilterOperator","sap/ui/core/routing/History"],function(e,t,jQuery,o,r){"use strict";return e.extend("application.controller.detalheProdutos",{onInit:function(){this.getRouter().getRoute("detalheProdutos").attachPatternMatched(this._onCreateModel,this)},_onCreateModel:function(){var e=this;var o=e.getModelGlobal("modelAux").getProperty("/CodRepres");e.oModel=e.getModelGlobal("modelAux").getProperty("/DBModel");e.oModel.read("/Centros",{urlParameters:{$filter:"IvUsuario eq '"+o+"'"},success:function(o){var r=[];e.vetorCentros=o.results;var s=new t(e.vetorCentros);e.setModel(s,"modelCentros")},error:function(t){e.onMensagemErroODATA(t)}});var r={Werks:""};var s=new t(r);e.setModel(s,"modelTela");var a=new t;e.setModel(a,"modelProduto");var l=new t;e.setModel(l,"modelProdutos")},onChangeCentro:function(e){var t=this;var o=t.getModelGlobal("modelAux").getProperty("/CodRepres");t.oModel=t.getModelGlobal("modelAux").getProperty("/DBModel");var r=e.getSource().getSelectedKey();t.byId("masterProdutos").setBusy(true);t.oModel.read("/Produtos",{urlParameters:{$filter:"Usuario eq '"+o+"' and Werks eq '"+r+"'"},success:function(e){t.vetorProdutosAux=e.results;t.vetorProdutos=[];for(var o=0;o<t.vetorProdutosAux.length;o++){if(t.vetorProdutosAux[o].Werks==r){t.vetorProdutosAux[o].PathImg="https://www.predilecta.com.br/images/produtos_portal/"+t.vetorProdutosAux[o].Matnr+".png";t.vetorProdutos.push(t.vetorProdutosAux[o])}}t.byId("masterProdutos").setBusy(false);t.getModel("modelProdutos").setData(t.vetorProdutos);t.onFilterCentro(r)},error:function(e){t.byId("masterProdutos").setBusy(false);t.onMensagemErroODATA(e)}})},onFilterCentro:function(e){var t=[];var o=[new sap.ui.model.Filter("Werks",sap.ui.model.FilterOperator.StartsWith,e)];var r=new sap.ui.model.Filter(o,false);t.push(r);this.byId("list").getBinding("items").filter(t,"Application")},onSelectionChange:function(e){var t=this;var o=e.getParameter("listItem")||e.getSource();var r=o.getBindingContext("modelProdutos").getObject();this.getModel("modelProduto").setData(r);this.getSplitContObj().toDetail(this.createId("detail"))},onNavBack:function(){sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas")},onPressDetailBack:function(){this.byId("list").removeSelections(true);this.getSplitContObj().backDetail()},onSearch:function(e){var t=e.getSource().getValue();var o=[];var r=[new sap.ui.model.Filter("Matnr",sap.ui.model.FilterOperator.StartsWith,t),new sap.ui.model.Filter("Maktx",sap.ui.model.FilterOperator.Contains,t)];var s=new sap.ui.model.Filter(r,false);o.push(s);this.byId("list").getBinding("items").filter(o,"Application")},onPressModeBtn:function(e){var t=e.getSource().getSelectedButton().getCustomData()[0].getValue();this.getSplitContObj().setMode(t)},getSplitContObj:function(){var e=this.byId("SplitContDemoProdutos");if(!e){jQuery.sap.log.error("SplitApp object can't be found")}return e}})});
//# sourceMappingURL=detalheProdutos.controller.js.map