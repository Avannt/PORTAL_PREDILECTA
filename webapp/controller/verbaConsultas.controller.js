/*eslint-disable no-console, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"application/model/formatter"

], function (BaseController, JSONModel, MessageBox, formatter) {
	"use strict";

	return BaseController.extend("application.controller.verbaConsultas", {

		onInit: function () {
			this.getRouter().getRoute("VerbaConsultas").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {

			var that = this;
			
			that.onInicializaModels();

			var open = indexedDB.open("PRED");

			open.onerror = function () {
				alert(open.error.mensage);
			};

			open.onsuccess = function () {

				var db = open.result;

				new Promise(function (resolve, reject) {

					var transCentro = db.transaction("Centros", "readwrite");
					var objCentro = transCentro.objectStore("Centros");

					var requestCentro = objCentro.getAll();

					requestCentro.onsuccess = function (event) {
						that.vetorCentros = event.target.result;

						var modelCentros = new JSONModel(that.vetorCentros);
						that.setModel(modelCentros, "modelCentros");

						resolve();
					};

				}).then(function (resolve) {

					that.onAbrirCentros();

				}).catch(function (msg) {

					sap.m.MessageBox.show(msg, {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Falha ao carregar os centros!",
						actions: [MessageBox.Action.OK],
						onClose: function () {

						}
					});
				});

			};
		},

		onChangeEmpresa: function () {

			var that = this;
			var Bukrs = this.getModel("modelTela").getProperty("/Bukrs");

			that.onDialogCancelar();

			var open = indexedDB.open("PRED");

			open.onerror = function () {
				alert(open.error.mensage);
			};

			open.onsuccess = function () {

				var db = open.result;

				var str = db.transaction("SaldoVerbas", "readwrite");
				var objVerba = str.objectStore("SaldoVerbas");
				var indexVerba = objVerba.index("Bukrs");

				var request = indexVerba.getAll(Bukrs);

				request.onsuccess = function (e) {
					var aux = e.target.result;
					
					if(aux !== undefined){
						
						var oItemSaldoVerbas = [];
						
						for(var j=0; j<aux.length; j++){
							
							aux[j].NomEmpresa = "";
	
							for (var i = 0; i < that.vetorCentros.length; i++) {
								if (that.vetorCentros[i].Bukrs == Bukrs) {
									aux[j].NomEmpresa = that.vetorCentros[i].NomeCentro;
									break;
								}
							}
							
							oItemSaldoVerbas.push(aux[j]);
						}
					}
					
					var oModel = new JSONModel(oItemSaldoVerbas);
					that.setModel(oModel, "Verbas");

				};

				var store1 = db.transaction("Aux", "readwrite");
				var objUsuarios = store1.objectStore("Aux");

				var request = objUsuarios.getAll();

				request.onsuccess = function (e) {

					var result = e.target.result[0];

					if (result !== undefined) {

						var aux = that.getModel("modelTela").getData();

						aux.Cod = result.CodRepres;
						aux.Nome = result.NomeRepres;
						aux.Email = result.Email;

						var oModel = new JSONModel(aux);
						that.setModel(oModel, "modelTela");

					}
				};
			};
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
				NomEmpresa: "",
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
				new sap.ui.model.Filter("Reprs", sap.ui.model.FilterOperator.Contains, sValue),
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