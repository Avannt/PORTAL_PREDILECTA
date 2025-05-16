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

			that.vetorCliente = [];
			that.vetorTbPreco = [];

			new Promise(function (resFrete, rejFrete) {

				that.oModel.read("/ClienteR(IvUsuario='" + repres + "',IvCliente='" + codigoCliente + "')", {
					success: function (retorno) {

						resFrete(retorno)

					},
					error: function (error) {
						rejFrete(error);
					}
				});

			}).then(function (retorno) {

				that.vetorCliente = retorno;
				var oModelCliente = new JSONModel(that.vetorCliente);
				that.setModel(oModelCliente, "modelCliente");

				var oModelTbPreco = new JSONModel(that.vetorTbPreco);
				that.setModel(oModelTbPreco, "modelTbPreco");

				new Promise(function (resFrete, rejFrete) {

					var Bukrs = '1';
					var Cliente = that.getModel("modelCliente").getProperty("/Kunnr");

					that.onBuscarClienteEmpresa(Cliente, Bukrs, resFrete, rejFrete, that);

				}).then(function (retorno) {

					that.getModel("modelCliente").setProperty("/Kvgr1", retorno.Kvgr1);
					that.getModel("modelCliente").setProperty("/DescKvgr1", retorno.DescKvgr1);
					that.getModel("modelCliente").setProperty("/Kvgr2", retorno.Kvgr2);
					that.getModel("modelCliente").setProperty("/DescKvgr2", retorno.DescKvgr2);
					that.getModel("modelCliente").setProperty("/Kvgr3", retorno.Kvgr3);
					that.getModel("modelCliente").setProperty("/DescKvgr3", retorno.DescKvgr3);
					that.getModel("modelCliente").setProperty("/Kvgr4", retorno.Kvgr4);
					that.getModel("modelCliente").setProperty("/DescKvgr4", retorno.DescKvgr4);
					that.getModel("modelCliente").setProperty("/Kvgr5", retorno.Kvgr5);
					that.getModel("modelCliente").setProperty("/DescKvgr5", retorno.DescKvgr5);
					that.getModel("modelCliente").setProperty("/Bzirk", retorno.Bzirk);
					that.getModel("modelCliente").setProperty("/Pltyp", retorno.Pltyp);
					that.getModel("modelCliente").setProperty("/Inco1", retorno.Inco1);

					var vAux = {
						Kunnr: retorno.Kunnr,
						Name1: retorno.Name1,
						Pltyp: retorno.Pltyp,
						Ptext: retorno.DescPltyp
					};

					that.vetorTbPreco.push(vAux);
					that.getModel("modelTbPreco").setData(that.vetorTbPreco);

					that.byId("table_ContratosAtivos").setBusy(true);
					that.oModel.read("/Contratos", {
						urlParameters: {
							"$filter": "IvUsuario eq '" + repres + "' and IvCliente eq '" + codigoCliente + "'"
						},
						success: function (retorno) {

							that.vetorContratosTotal = retorno.results;

							var sKvgr4 = that.getModel("modelCliente").getProperty("/Kvgr4");

							that.vetorContratos = that.vetorContratosTotal.filter(function (a) {
								if (a.Kvgr4 == sKvgr4) {

									return a;
								}
							});

							var oModelContratos = new JSONModel(that.vetorContratos);
							that.setModel(oModelContratos, "modelContratos");

							that.byId("table_ContratosAtivos").setBusy(false);
						},
						error: function (error) {

							that.onMensagemErroODATA(error);
							that.byId("table_ContratosAtivos").setBusy(false);
						}
					});

					that.oModel.read("/TitulosAbertos", {
						urlParameters: {
							"$filter": "IvUsuario eq '" + repres + "'"
						},
						success: function (retorno) {
							that.vetorTitulosTotal = retorno.results;

							var sKunnr = that.getModel("modelCliente").getProperty("/Kunnr");

							that.vetorTitulos = that.vetorTitulosTotal.filter(function (a) {
								if (a.Kunnr == sKunnr) {
									return a;
								}
							});

							var oModelTitulos = new JSONModel(that.vetorTitulos);
							that.setModel(oModelTitulos, "modelTitulos");

							// var sValue = that.getModel("modelCliente").getProperty("/Kunnr");
							// var aFilters = [];
							// var oFilter = [new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.Contains, sValue)];

							// var allFilters = new sap.ui.model.Filter(oFilter, false);
							// aFilters.push(allFilters);
							// this.byId("tabDuplicatas").getBinding("items").filter(aFilters, "Application");

							that.vetorTitulosTotal = [];
							var oModelTitulosTotal = new JSONModel(that.vetorTitulosTotal);
							that.setModel(oModelTitulosTotal, "modelTitulosTotal");

							var vTotalEmp = 0;
							for (var i = 0; i < that.vetorTitulos.length; i++) {
								var vAchouEmpresa = false;
								for (var j = 0; j < that.vetorTitulosTotal.length; j++) {

									if (that.vetorTitulos[i].Bukrs == that.vetorTitulosTotal[j].Bukrs) {

										vAchouEmpresa = true;

										that.vetorTitulosTotal[j].ValTotal = parseFloat(that.vetorTitulosTotal[j].ValTotal) + Math.round(parseFloat(that.vetorTitulos[
											i].Dmbtr) * 100) / 100;
										that.vetorTitulosTotal[j].ValTotal = parseFloat(that.vetorTitulosTotal[j].ValTotal).toFixed(2);

									}
								}
								if (vAchouEmpresa == false) {
									var vAux = {
										Bukrs: that.vetorTitulos[i].Bukrs,
										Butxt: that.vetorTitulos[i].Butxt,
										ValTotal: parseFloat(that.vetorTitulos[i].Dmbtr)
									};

									that.vetorTitulosTotal.push(vAux);

								}
								vTotalEmp += parseFloat(that.vetorTitulos[i].ValTotal);
							}

							// that.byId("master").setBusy(false);
							that.getModel("modelTitulosTotal").setData(that.vetorTitulosTotal);

						},
						error: function (error) {
							that.onMensagemErroODATA(error);
						}
					});

				}).catch(function (error) {

					that.onMensagemErroODATA(error);
				});
			}).catch(function (error) {

				that.onMensagemErroODATA(error);
			});
		}
	});
});