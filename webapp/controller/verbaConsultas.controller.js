/*eslint-disable no-console, no-alert */

sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"application/model/formatter"

], function (BaseController, JSONModel, MessageBox, formatter) {
	"use strict";

	return BaseController.extend("application.controller.verbaConsultas", {

		formatter: formatter,

		onInit: function () {
			this.getRouter().getRoute("VerbaConsultas").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {

			var that = this;

			that.onInicializaModels();

			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			that.oModel.read("/Centros", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + repres + "'"
				},
				success: function (retorno) {
					var vetorCentros = [];
					that.vetorCentros = retorno.results;
					var oModelCentros = new JSONModel(that.vetorCentros);
					that.setModel(oModelCentros, "modelCentros");
					that.onBuscarDados();
					// that.onAbrirCentros();
				},
				error: function (error) {

					that.onMensagemErroODATA(error);
				}
			});
		},

		onBuscarDados: function () {

			var that = this;
			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			var Bukrs = this.getModel("modelTela").getProperty("/Bukrs");
			var Periodo = "0122021";

			that.byId("detail").setBusy(true);

			that.oModel.read("/SaldoVerbas", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + repres + "'"
				},
				success: function (retorno) {

					var result = retorno.results[0];
					var aux = that.getModel("modelTela").getData();

					aux.Cod = result.Lifnr;
					aux.Nome = result.Name1Rep;
					
					var oModel = new JSONModel(aux);
					that.setModel(oModel, "modelTela");

					that.vetorVerbasAux = retorno.results;
					that.vetorVerbas = [];
					
					for (var j = 0; j < that.vetorVerbasAux.length; j++) {
						
						Periodo = that.vetorVerbasAux[j].Periodo;
						break;
					}

					for (var i = 0; i < that.vetorVerbasAux.length; i++) {

						if (that.vetorVerbasAux[i].Periodo == Periodo) {

							that.vetorVerbas.push(that.vetorVerbasAux[i]);

						}
					}
					
					that.byId("detail").setBusy(false);
					that.getModel("Verbas").setData(that.vetorVerbas);

				},
				error: function (error) {
					that.byId("detail").setBusy(false);
					that.onMensagemErroODATA(error);
				}
			});
		},
		
		onChangeEmpresa: function () {

			var that = this;
			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			var Bukrs = this.getModel("modelTela").getProperty("/Bukrs");

			that.onDialogCancelar();

			that.byId("detail").setBusy(true);

			that.oModel.read("/SaldoVerbas", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + repres + "'"
				},
				success: function (retorno) {

					var result = retorno.results[0];
					var aux = that.getModel("modelTela").getData();

					aux.Cod = result.Lifnr;
					aux.Nome = result.Name1Rep;
					// aux.Email = result.Email;

					var oModel = new JSONModel(aux);
					that.setModel(oModel, "modelTela");

					that.vetorVerbasAux = retorno.results;
					that.vetorVerbas = [];

					for (var i = 0; i < that.vetorVerbasAux.length; i++) {

						if (that.vetorVerbasAux[i].Bukrs == Bukrs) {

							that.vetorVerbas.push(that.vetorVerbasAux[i]);

						}
					}

					that.byId("detail").setBusy(false);
					that.getModel("Verbas").setData(that.vetorVerbas);

				},
				error: function (error) {
					that.byId("detail").setBusy(false);
					that.onMensagemErroODATA(error);
				}
			});
		},

		onInicializaModels: function () {

			var aux = {
				Bukrs: "",
				Cod: "",
				Nome: "Nenhum Usuário selecionado",
				Email: ""
			};

			var oModel = new JSONModel(aux);
			this.setModel(oModel, "modelTela");

			var oModelVerbas = new JSONModel();
			this.setModel(oModelVerbas, "Verbas");

			var aux2 = {
				Bukrs: "",
				DatUltMovto: "",
				IdSaldo: "",
				IvUsuario: "",
				Lifnr: "",
				Name1Rep: "",
				Butxt: "",
				Periodo: "",
				Usuario: "",
				ValSdoCr: "",
				ValSdoDb: "",
				ValSdoFim: "",
				ValSdoIni: ""
			};

			var oModelVerba = new JSONModel(aux2);
			this.setModelGlobal(oModelVerba, "modelVerba");

		},

		onAbrirCentros: function () {

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}

			if (!this._CreateMaterialFragment) {

				this._ItemDialog = sap.ui.xmlfragment(
					"application.view.centros",
					this
				);
				this.getView().addDependent(this._ItemDialog);
			}

			this._ItemDialog.open();

		},

		onDialogCancelar: function () {

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}
		},

		onSearch: function (oEvent) {

			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [
				new sap.ui.model.Filter("Repres", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("table_Verbas").getBinding("items").filter(aFilters, sap.ui.model.FilterType.Application);

		},

		onItemPress: function (oEvent) {
			// 	//popula modelVerba

			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var itemVerba = oItem.getBindingContext("Verbas").getObject();
			delete itemVerba.__metadata;

			this.getModelGlobal("modelVerba").setData(itemVerba);

			// this.getOwnerComponent().getModel("modelVerba").setProperty("/idEmpresaVerba", oItem.getBindingContext().getProperty("CodEmpresa"));
			// this.getOwnerComponent().getModel("modelVerba").setProperty("/nomeEmpresaVerba", oItem.getBindingContext().getProperty("NomEmpresa"));
			// this.getOwnerComponent().getModel("modelVerba").setProperty("/idUsuarioVerba", oItem.getBindingContext().getProperty("CodRepres"));
			// this.getOwnerComponent().getModel("modelVerba").setProperty("/dataLancamentoVerba", oItem.getBindingContext().getProperty("Periodo"));
			// this.getOwnerComponent().getModel("modelVerba").setProperty("/verbaInicialVerba", oItem.getBindingContext().getProperty("SaldoInicial"));
			// this.getOwnerComponent().getModel("modelVerba").setProperty("/valorDebitoVerba", oItem.getBindingContext().getProperty("Debito"));
			// this.getOwnerComponent().getModel("modelVerba").setProperty("/valorCreditoVerba", oItem.getBindingContext().getProperty("Credito"));
			// this.getOwnerComponent().getModel("modelVerba").setProperty("/VerbaFinalVerba", oItem.getBindingContext().getProperty("SaldoFinal"));

			sap.ui.core.UIComponent.getRouterFor(this).navTo("verbaConsultasDetalhe");
		}
	});
});