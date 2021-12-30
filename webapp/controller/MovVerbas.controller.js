/*eslint-disable no-unused-vars, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"application/model/formatter",
	"sap/ui/core/util/MockServer",
	"sap/ui/export/library",
	"sap/ui/export/Spreadsheet",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/m/MessageBox"

], function (BaseController, JSONModel, MessageBox, formatter, MockServer, exportLibrary, Spreadsheet, ODataModel) {
	"use strict";

	var oDuplicataRelatorio = [];
	var EdmType = exportLibrary.EdmType;

	return BaseController.extend("application.controller.MovVerbas", {

		onInit: function () {
			this.getRouter().getRoute("MovVerbas").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {

			var that = this;
			var Repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			var NomeRepres = that.getModelGlobal("modelAux").getProperty("/NomeRepres");

			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			this.onCriarModelTela(Repres, NomeRepres);

			that.vetorCentrosOrig = [];
			var oModelCentroOrig = new JSONModel(that.vetorCentrosOrig);
			that.setModel(oModelCentroOrig, "modelCentrosOrig");

			that.vetorCentrosDest = [];
			var oModelCentroDest = new JSONModel(that.vetorCentrosDest);
			that.setModel(oModelCentroDest, "modelCentrosDest");

			that.vetorRepresDest = [];
			var oModelRepresDest = new JSONModel(that.vetorRepresDest);
			that.setModel(oModelRepresDest, "modelRepresDest");

			new Promise(function (res, rej) {

				that.onBuscarCentros(Repres, res, rej, that);

			}).then(function (retorno) {

				that.vetorCentrosOrig = retorno;
				that.getModel("modelCentrosOrig").setData(that.vetorCentrosOrig);

			}).catch(function (error) {

				that.onMensagemErroODATA(error);
			});
		},

		onCriarModelTela: function (Repres, NomeRepres) {

			var vAux = {
				RepresOrig: Repres,
				DescRepres: NomeRepres,
				BukrsOrig: "",
				RepresDest: "",
				BukrsDest: "",
				Valor: "",
				SaldoOrig: 0,
				SaldoDest: 0
			};

			var omodelParametros = new JSONModel(vAux);
			this.setModel(omodelParametros, "modelTela");
		},

		onChangeCentroOrig: function () {

			var that = this;

			that.byId("idRepresDest").setBusy(true);
			var data = that.getModel("modelTela").getData();

			that.oModel.read("/P_TransfRepresQ", {
				urlParameters: {
					"$filter": "IvBukrsOrig eq '" + data.BukrsOrig +
						"' and IvRepresOrig eq '" + data.RepresOrig + "'"
				},
				success: function (retorno) {

					that.vetorRepresDest = retorno.results;
					that.getModel("modelRepresDest").setData(that.vetorRepresDest);
					that.byId("idRepresDest").setBusy(false);

					that.oModel.read("/P_TransfSaldoR(IvBukrs='" + data.BukrsOrig + "',IvRepres='" + data.RepresOrig + "')", {
						success: function (retornoSaldo) {

							that.getModel("modelTela").setProperty("/SaldoOrig", retornoSaldo.EvSaldo);
							that.byId("idRepresDest").setBusy(false);
						},
						error: function (error) {

							that.byId("idRepresDest").setBusy(false);
							that.onMensagemErroODATA(error);
						}
					});
				},
				error: function (error) {

					that.byId("idRepresDest").setBusy(false);
					that.onMensagemErroODATA(error);
				}
			});
		},

		onChangeCentroDest: function () {

			var that = this;

			that.byId("idSaldoDestino").setBusy(true);

			var data = this.getModel("modelTela").getData();

			that.oModel.read("/P_TransfSaldoR(IvBukrs='" + data.BukrsDest + "',IvRepres='" + data.RepresDest + "')", {

				success: function (retorno) {

					that.getModel("modelTela").setProperty("/SaldoDest", retorno.EvSaldo);
					that.byId("idSaldoDestino").setBusy(false);
				},
				error: function (error) {

					that.byId("idSaldoDestino").setBusy(false);
					that.onMensagemErroODATA(error);
				}
			});

		},

		onChangeRepresDest: function () {

			var that = this;

			var RepresDest = that.getModel("modelTela").getProperty("/RepresDest");

			new Promise(function (res, rej) {

				that.onBuscarCentros(RepresDest, res, rej, that);

			}).then(function (retorno) {

				that.vetorCentrosDest = retorno;
				that.getModel("modelCentrosDest").setData(that.vetorCentrosDest);

			}).catch(function (error) {

				that.onMensagemErroODATA(error);
			});

		},

		onSuggestRepresIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Lifnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Name1Rep", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idRepreIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idRepreIni").suggest();
		},

		onSuggestCentroIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("NomeCentro", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idCentroIni").getBinding("suggestionItems").filter(aFilters);
			this.byId("idCentroIni").suggest();
		},

		onDialogOpen: function (evt) {

			var that = this;

			var vAux = {
				Docnum: evt.getSource().getBindingContext("modelNotasFiscais").getObject().Docnum,
				Nfenum: evt.getSource().getBindingContext("modelNotasFiscais").getObject().Nfenum,
				Series: evt.getSource().getBindingContext("modelNotasFiscais").getObject().Series
			};

			var omodelParamDialog = new JSONModel(vAux);
			that.setModel(omodelParamDialog, "modelParamDialog");

			if (that._ItemDialog) {
				that._ItemDialog.destroy(true);
			}

			if (!that._CreateMaterialFragment) {

				that._ItemDialog = sap.ui.xmlfragment(
					"application.view.DialogEmail",
					that
				);
				that.getView().addDependent(that._ItemDialog);
			}

			that._ItemDialog.open();

		},

		onDialogClose: function () {

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}
		},

		onPressMovVerba: function () {

			var that = this;
			that.byId("idPage").setBusy(true);

			var vAux = {
				RepresOrig: this.getModel("modelTela").getProperty("/RepresOrig"),
				BukrsOrig: this.getModel("modelTela").getProperty("/BukrsOrig"),
				RepresDest: this.getModel("modelTela").getProperty("/RepresDest"),
				BukrsDest: this.getModel("modelTela").getProperty("/BukrsDest"),
				Valor: this.getModel("modelTela").getProperty("/Valor")
			};

			that.oModel.callFunction("/P_Set_Transf_Verba", {
				method: "POST",
				urlParameters: vAux,
				success: function (oData, oResponse) {

					var Item = oData;

					if (Item.Type == "E") {

						MessageBox.show(Item.Message, {
							icon: MessageBox.Icon.WARNING,
							title: "Não Permitido",
							actions: [MessageBox.Action.OK],
							onClose: function () {

								that.byId("idPage").setBusy(false);
							}
						});

					} else {

						MessageBox.show(Item.Message, {
							icon: MessageBox.Icon.SUCCESS,
							title: "Transferido",
							actions: [MessageBox.Action.OK],
							onClose: function () {

								// var Repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
								// var NomeRepres = that.getModelGlobal("modelAux").getProperty("/NomeRepres");

								// that.onCriarModelTela(Repres, NomeRepres);
								
								that._onLoadFields();
								that.byId("idPage").setBusy(false);
							}
						});
					}
				},
				error: function (oError) {

					that.byId("idPage").setBusy(false);
					that.onMensagemErroODATA(oError);
				}
			});

		}
	});
});