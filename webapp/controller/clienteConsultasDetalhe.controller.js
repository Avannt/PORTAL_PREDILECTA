/*eslint-disable no-console, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History"
], function (BaseController, JSONModel, History) {
	"use strict";

	return BaseController.extend("application.controller.clienteConsultasDetalhe", {

		onInit: function (oEvent) {
			this.getRouter().getRoute("clienteConsultasDetalhe").attachPatternMatched(this._onLoadFields, this);
		},

		onAfterRendering: function () {

			// this.getView().
			// sap.m.QuickViewBase.getOwnerComponent().getModel("modelCliente").afterNavigate().getProperty("/codigoCliente");
		},

		onNavBack: function (oEvent) {

			var oHistory, sPreviousHash;
			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("clienteConsultas", {}, true);
			}
			// sap.ui.core.UIComponent.getRouterFor(this).navTo("clienteConsultas");
		},

		_onLoadFields: function () {

			var that = this;
			
			this.byId("idTopLevelIconTabBar").setSelectedKey("tab1");
			var codigoCliente = this.getOwnerComponent().getModel("modelCliente").getProperty("/codigoCliente");
			
			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");
			
			that.vetorContratos = [];
			that.vetorTitulos = [];
			that.vetorCentros = [];

			this.byId("table_ContratosAtivos").setBusy(true);
			this.byId("idTopLevelIconTabBar").setSelectedKey("tab1");

			var TabPreco = this.getModelGlobal("Cliente").getProperty("/Pltyp");
			var chaveContrato = that.getModel("Cliente").getProperty("/Kvgr4");
			
			// that.oModel.read("/TabPrecos", {
			// 	urlParameters: {
			// 		"$filter": "IvUsuario eq '" + repres + "'"
			// 	},
			// 	success: function (retorno) {
			// 		var vetorClientes = [];
			// 		that.vetorClientes = retorno.results;
			// 		var oModelClientes = new JSONModel(that.vetorClientes);
			// 		that.setModel(oModelClientes, "modelClientes");
			// 	},
			// 	error: function (error) {

			// 		that.onMensagemErroODATA(error);
			// 	}
			// });
			

			// open.onsuccess = function () {

			// 	var db = open.result;

			// 	var trans = db.transaction(["TabPrecos"], "readonly");
			// 	var objStore = trans.objectStore("TabPrecos");

			// 	var request = objStore.get(TabPreco);

			// 	request.onsuccess = function (event) {

			// 		var aux = event.target.result;
			// 		aux.Kunnr = that.getModelGlobal("Cliente").getProperty("/Kunnr");

			// 		var vetor = [];

			// 		vetor.push(aux);

			// 		var oModelTabPreco = new JSONModel(vetor);
			// 		that.setModel(oModelTabPreco, "TabPreco");

			// 	};

			// 	var transCentro = db.transaction("Centros", "readwrite");
			// 	var objCentro = transCentro.objectStore("Centros");
			// 	var requestCentro = objCentro.getAll();

			// 	requestCentro.onsuccess = function (event) {

			// 		that.vetorCentros = event.target.result;

			// 		that.vetorItens = event.target.result;

			// 		trans = db.transaction("Contratos", "readwrite");
			// 		var objContrato = trans.objectStore("Contratos");
			// 		var indexContrato = objContrato.index("Kvgr4");

			// 		var requestContrato = indexContrato.getAll(chaveContrato);

			// 		requestContrato.onsuccess = function (event) {

			// 			that.vetorContratos = event.target.result;

			// 			that.vetorContratos.sort(function (a, b) {
			// 				return a.Bukrs < b.Bukrs;
			// 			});

			// 			var vetorResult = [];
			// 			var Contrato = "";
			// 			var aux = "";
			// 			var aux2 = "";
			// 			var vetorTeste = [];

			// 			for (var i = 0; i < that.vetorContratos.length; i++) {

			// 				aux = {
			// 					IndexSum: that.vetorContratos[i].IndexSum,
			// 					Versg: that.vetorContratos[i].Versg,
			// 					DescVersg: that.vetorContratos[i].DescVersg,
			// 					Mvgr1: that.vetorContratos[i].Mvgr1,
			// 					DescMvgr1: that.vetorContratos[i].DescMvgr1,
			// 					Mvgr5: that.vetorContratos[i].Mvgr5,
			// 					DescMvgr5: that.vetorContratos[i].DescMvgr5,
			// 					Kvgr5: that.vetorContratos[i].Kvgr5,
			// 					DescKvgr5: "",
			// 					Kunnr: that.vetorContratos[i].Kunnr,
			// 					Name1: "",
			// 					Bukrs: that.vetorContratos[i].Bukrs,
			// 					NomeEmpresa: "",
			// 					ContratoInterno: that.vetorContratos[i].ContratoInterno,
			// 					IndiceItem: parseFloat(that.vetorContratos[i].IndiceItem)
			// 				};

			// 				for(var o=0; o<that.vetorItens.length; o++){
			// 					if(that.vetorItens[o].Bukrs == that.vetorContratos[i].Bukrs){
   //                                 aux.NomeEmpresa = that.vetorItens[o].NomeCentro;
   //                                 break;
			// 					}
			// 				}
							
			// 				if(aux.Kunnr != ""){
			// 					aux.Name1 = that.getModelGlobal("Cliente").getProperty("/Name1");
			// 				}
							
			// 				if(aux.Kvgr5 != ""){
			// 					aux.DescKvgr5 = that.getModelGlobal("Cliente").getProperty("/DescKvgr5");
			// 				}

			// 				if (Contrato == "") {
								
			// 					Contrato = aux;
			// 				} else {
								
			// 					Contrato.IndiceItem += parseFloat(aux.IndiceItem);
			// 				}

			// 				if (i + 1 == that.vetorContratos.length) {

			// 					if (Contrato != "") {
			// 						vetorResult.push(Contrato);
			// 					}

			// 				} else {

			// 					if (that.vetorContratos[i].IndexSum != that.vetorContratos[i + 1].IndexSum) {

			// 						that.vetorContratos[i].IndiceItem = Contrato.IndiceItem;

			// 						vetorResult.push(Contrato);
			// 						Contrato = "";
			// 					}
			// 				}
			// 			}

			// 			for (var e = 0; e < vetorResult.length; e++) {

			// 				for (var f = 0; f < that.vetorCentros.length; f++) {

			// 					if (that.vetorCentros[f].Bukrs == vetorResult[e].Bukrs) {
			// 						vetorResult[e].NomeEmpresa = that.vetorCentros[f].NomeCentro;
			// 						break;
			// 					}
			// 				}

			// 				for (var g = 0; g < that.vetorItens.length; g++) {

			// 					if (that.vetorItens[g].Mvgr1 == vetorResult[e].Mvgr1) {
			// 						vetorResult[e].DescMvgr1 = that.vetorItens[f].DescMvgr1;
			// 					}
			// 					if (that.vetorItens[g].Mvgr5 == vetorResult[e].Mvgr5) {
			// 						vetorResult[e].DescMvgr5 = that.vetorItens[f].DescMvgr5;
			// 					}
			// 				}
			// 			}

			// 			var oModelTotalContratos = new JSONModel(vetorResult);
			// 			that.setModel(oModelTotalContratos, "modelTotalContratos");

			// 			that.byId("table_ContratosAtivos").setBusy(false);
			// 		};

			// 		trans = db.transaction("TitulosAbertos", "readwrite");
			// 		var obj = trans.objectStore("TitulosAbertos");
			// 		var index = obj.index("Kunnr");

			// 		var requestTitulo = index.getAll(that.getModelGlobal("Cliente").getProperty("/Kunnr"));

			// 		requestTitulo.onsuccess = function (event) {

			// 			that.vetorTitulos = event.target.result;

			// 			var data = new Date();
			// 			var Ano = data.getFullYear();

			// 			var Mes = data.getMonth() + 1;
			// 			Mes = String(Mes).length == 1 ? "0" + String(Mes) : Mes;

			// 			var Dia = data.getDate();
			// 			Dia = String(Dia).length == 1 ? "0" + String(Dia) : Dia;

			// 			data = Ano + Mes + Dia;

			// 			for (var e = 0; e < that.vetorTitulos.length; e++) {

			// 				try {

			// 					var dataAux = that.vetorTitulos[e].Zfbdt.indexOf("T");
			// 					if (dataAux > 0) {

			// 						dataAux = that.vetorTitulos[e].Zfbdt.split("T");
			// 						dataAux = dataAux[0].split("-");

			// 						var dataTitulo = dataAux[0] + dataAux[1] + dataAux[2];
			// 						var dataFormatada = dataAux[2] + "/" + dataAux[1] + "/" + dataAux[0];

			// 					} else {

			// 					}

			// 				} catch (x) {

			// 					var dataAux2 = that.vetorTitulos[e].Zfbdt;
			// 					Ano = String(dataAux2.getFullYear());

			// 					Mes = dataAux2.getMonth() + 1;
			// 					Mes = String(Mes).length == 1 ? "0" + String(Mes) : String(Mes);

			// 					Dia = dataAux2.getDate();
			// 					Dia = String(Dia).length == 1 ? "0" + String(Dia) : String(Dia);

			// 					dataTitulo = Ano + Mes + Dia;
			// 					dataFormatada = Dia + "/" + Mes + "/" + Ano;

			// 				}

			// 				if (dataTitulo < data) {

			// 					that.vetorTitulos[e].Status = "Vencido";
			// 					that.vetorTitulos[e].PathImg = sap.ui.require.toUrl("application/img/R.png");

			// 				} else {

			// 					that.vetorTitulos[e].Status = "Em aberto";
			// 					that.vetorTitulos[e].PathImg = sap.ui.require.toUrl("application/img/S.png");
			// 				}

			// 				that.vetorTitulos[e].Zfbdt = dataFormatada;

			// 				try {

			// 					var dataAux3 = that.vetorTitulos[e].Budat.indexOf("T");

			// 					if (dataAux3 > 0) {

			// 						dataAux3 = that.vetorTitulos[e].Budat.split("T");
			// 						dataAux3 = dataAux3[0].split("-");
			// 						var dataFormatada2 = dataAux3[2] + "/" + dataAux3[1] + "/" + dataAux3[0];

			// 					}

			// 				} catch (x) {

			// 					dataAux3 = that.vetorTitulos[e].Budat;
			// 					Ano = String(dataAux3.getFullYear());

			// 					Mes = dataAux3.getMonth() + 1;
			// 					Mes = String(Mes).length == 1 ? "0" + String(Mes) : String(Mes);

			// 					Dia = dataAux3.getDate();
			// 					Dia = String(Dia).length == 1 ? "0" + String(Dia) : String(Dia);

			// 					dataFormatada2 = Dia + "/" + Mes + "/" + Ano;

			// 				}

			// 				that.vetorTitulos[e].Budat = dataFormatada2;

			// 				if (parseInt(that.vetorTitulos[e].DiasAtraso, 10) > 0) {

			// 					that.vetorTitulos[e].Status = "Vencido";
			// 					that.vetorTitulos[e].PathImg = sap.ui.require.toUrl("application/img/R.png");

			// 				} else {

			// 					that.vetorTitulos[e].Status = "Em aberto";
			// 					that.vetorTitulos[e].PathImg = sap.ui.require.toUrl("application/img/S.png");
			// 				}

			// 				for (var f = 0; f < that.vetorCentros.length; f++) {

			// 					if (that.vetorCentros[f].Bukrs == that.vetorTitulos[e].Bukrs) {
			// 						that.vetorTitulos[e].NomeEmpresa = that.vetorCentros[f].NomeCentro;
			// 					}
			// 				}

			// 			}

			// 			var oModelTabPreco = new JSONModel(that.vetorTitulos);
			// 			that.setModel(oModelTabPreco, "modelTitulos");

			// 			that.byId("table_ContratosAtivos").setBusy(false);
			// 			var vetorTotal = [];

			// 			var existe = false;

			// 			for (var e = 0; e < that.vetorTitulos.length; e++) {

			// 				existe = false;

			// 				for (var f = 0; f < vetorTotal.length; f++) {

			// 					if (that.vetorTitulos[e].Bukrs == vetorTotal[f].Bukrs) {

			// 						vetorTotal[f].ValorTotal += parseFloat(that.vetorTitulos[e].Dmbtr);
			// 						existe = true;
			// 					}
			// 				}

			// 				if (!existe) {

			// 					var aux = {
			// 						Bukrs: that.vetorTitulos[e].Bukrs,
			// 						NomeEmpresa: that.vetorTitulos[e].NomeEmpresa,
			// 						ValorTotal: parseFloat(that.vetorTitulos[e].Dmbtr)
			// 					};

			// 					vetorTotal.push(aux);
			// 				}
			// 			}

			// 			var oModel = new JSONModel(vetorTotal);
			// 			that.setModel(oModel, "modelTitulosTotal");

			// 		};

			// 	};
			// };
		}
	});
});