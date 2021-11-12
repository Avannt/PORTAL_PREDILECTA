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

	return BaseController.extend("application.controller.relatorioPedidos", {

		onInit: function () {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("relatorioPedidos").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {

			var that = this;
			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			var vAux = {
				WerksIni: "",
				WerksFim: "",
				KunnrIni: "",
				KunnrFim: "",
				VbelnIni: "",
				VbelnFim: "",
				LifnrIni: "",
				LifnrFim: "",
				MatnrIni: "",
				MatnrFim: "",
				Periodo: ""
			};

			var omodelParametros = new JSONModel(vAux);
			that.setModel(omodelParametros, "modelParametros");

			that.vetorNotasFiscais = [];
			var omodelPedidos = new JSONModel(that.vetorNotasFiscais);
			that.setModel(omodelPedidos, "modelPedidos");

			that.vetorResumoEmpresa = [];
			var oModelResumoEmpresa = new JSONModel(that.vetorResumoEmpresa);
			that.setModel(oModelResumoEmpresa, "modelResumoEmpresa");

			new Promise(function (res, rej) {

				that.onBuscarClientes(repres, res, rej, that);

			}).then(function (retorno) {

				var vetorClientes = retorno;
				var vetorRede = [];
				var vetorBandeira = [];
				var vetorRepres = [];

				for (var i = 0; i < vetorClientes.length; i++) {
					var vAchouRede = false;
					var vAchouBandeira = false;
					var vAchouRepres = false;

					for (var j = 0; j < vetorRede.length; j++) {

						if ((vetorClientes[i].Kvgr4 == vetorRede[j].Kvgr4) || vetorClientes[i].Kvgr4 == "") {
							vAchouRede = true;

							break;
						}
					}

					for (var k = 0; k < vetorBandeira.length; k++) {

						if ((vetorClientes[i].Kvgr5 == vetorBandeira[k].Kvgr5) || vetorClientes[i].Kvgr5 == "") {
							vAchouBandeira = true;

							break;
						}
					}

					for (var m = 0; m < vetorRepres.length; m++) {

						if ((vetorClientes[i].Lifnr == vetorRepres[m].Lifnr) || vetorClientes[i].Lifnr == "") {
							vAchouRepres = true;

							break;
						}
					}
					if (vAchouRede == false) {
						vetorRede.push(vetorClientes[i]);
					}
					if (vAchouBandeira == false) {
						vetorBandeira.push(vetorClientes[i]);
					}
					if (vAchouRepres == false) {
						vetorRepres.push(vetorClientes[i]);
					}
				}

				var oModelClientes = new JSONModel(vetorClientes);
				that.setModel(oModelClientes, "modelClientes");

				var oModelRede = new JSONModel(vetorRede);
				that.setModel(oModelRede, "modelRedes");

				var oModelBandeira = new JSONModel(vetorBandeira);
				that.setModel(oModelBandeira, "modelBandeiras");

				var oModelRepres = new JSONModel(vetorRepres);
				that.setModel(oModelRepres, "modelRepres");

			}).catch(function (error) {

				that.onMensagemErroODATA(error);
			});

			that.oModel.read("/Centros", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + repres + "'"
				},
				success: function (retorno) {
					var vetorCentros = retorno.results;
					var oModelCentros = new JSONModel(vetorCentros);
					that.setModel(oModelCentros, "modelCentros");
				},
				error: function (error) {
					that.onMensagemErroODATA(error);
				}
			});
		},

		ongetHeaderGroupLifnr: function (oContext) {
			return oContext.getProperty("Lifnr");
		},

		ongetHeaderGroupBukrs: function (oContext) {
			return oContext.getProperty("Bukrs") + ' - ' + oContext.getProperty("Butxt");
		},

		createColumnConfig: function () {
			var aCols = [];

			aCols.push({
				label: "Repres",
				property: "Lifnr",
				type: EdmType.Number
			});

			aCols.push({
				label: "Nome Repres",
				property: "Name1Rep",
				type: EdmType.String
			});

			aCols.push({
				label: "Empresa",
				property: "Bukrs",
				type: EdmType.String
			});

			aCols.push({
				label: "Nome Empresa",
				property: "Butxt",
				type: EdmType.String
			});

			aCols.push({
				label: "Centro",
				property: "Werks",
				type: EdmType.String
			});
			
			aCols.push({
				label: "Doc.Vendas",
				property: "Vbeln",
				type: EdmType.String
			});

			aCols.push({
				label: "Referência Cliente",
				property: "Bstkd",
				type: EdmType.String
			});

			aCols.push({
				label: "Dt Docto",
				property: "Docdat",
				type: EdmType.DateTime,
				format: 'dd/mm/yyyy'
			});

			aCols.push({
				label: "Cliente",
				property: "Kunnr",
				type: EdmType.String
			});

			aCols.push({
				label: "Razão Social",
				property: "Name1Cli",
				type: EdmType.String
			});

			aCols.push({
				label: "CNPJ",
				property: "Stcd1",
				type: EdmType.String
			});

			aCols.push({
				label: "CPF",
				property: "Stcd2",
				type: EdmType.String
			});

			aCols.push({
				label: "UF",
				property: "Region",
				type: EdmType.String
			});

			aCols.push({
				label: "Cidade",
				property: "City1",
				type: EdmType.String
			});

			aCols.push({
				label: "Cód.Transp",
				property: "ParidTransp",
				type: EdmType.String
			});

			aCols.push({
				label: "Nom.Transp",
				property: "Name1Transp",
				type: EdmType.String
			});

			aCols.push({
				label: "Cód.Redesp",
				property: "ParidRedesp",
				type: EdmType.String
			});

			aCols.push({
				label: "Nom.Redesp",
				property: "Name1Redesp",
				type: EdmType.String
			});

			aCols.push({
				label: "Vl.Tot.NF",
				property: "Netwrt",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "%Rentab",
				property: "PctRentab",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			return aCols;
		},

		onExport: function () {
			var aCols, oRowBinding, oSettings, oSheet, oTable;

			if (!this._oTable) {
				this._oTable = this.byId("idtablePedidos");
			}

			oTable = this._oTable;
			oRowBinding = oTable.getBinding("items");
			aCols = this.createColumnConfig();

			oSettings = {
				workbook: {
					columns: aCols,
					hierarchyLevel: "Level"
				},
				dataSource: oRowBinding,
				fileName: "Rel_Posicao_Pedidos.xlsx",
				worker: false // We need to disable worker because we are using a MockServer as OData Service
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function () {
				oSheet.destroy();
			});
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
				Docnum: evt.getSource().getBindingContext("modelPedidos").getObject().Docnum,
				Nfenum: evt.getSource().getBindingContext("modelPedidos").getObject().Nfenum,
				Series: evt.getSource().getBindingContext("modelPedidos").getObject().Series
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

		onDialogEnvioDanfe: function () {

			var that = this;

			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			var Name1 = that.getModelGlobal("modelAux").getProperty("/NomeRepres").replaceAll(" ", "_");
			var Docnum = that.getModel("modelParamDialog").getProperty("/Docnum");
			var Nfenum = that.getModel("modelParamDialog").getProperty("/Nfenum");
			var Series = that.getModel("modelParamDialog").getProperty("/Series");
			var Email = that.getModelGlobal("modelAux").getProperty("/Email");

			sap.ui.getCore().byId("idDialogEmail").setBusy(true);

			that.oModel.read("/EnviaEmailDanfe(IvUsuario='" + repres +
				"',IvDocnum='" + Docnum +
				"',IvEmail='" + Email +
				"',IvName1='" + Name1 + "')", {
					success: function (data) {

						sap.ui.getCore().byId("idDialogEmail").setBusy(false);
						MessageBox.show("NF-e " + Nfenum + " -" + Series + " enviada para o e-mail " + Email, {
							icon: MessageBox.Icon.SUCCESS,
							title: "Envio de Notas Fiscais",
							actions: [sap.m.MessageBox.Action.OK]
						});
						that.onDialogClose();
					},
					error: function (error) {

						sap.ui.getCore().byId("idDialogEmail").setBusy(false);
						that.onMensagemErroODATA(error);
					}
				});
		},

		onPressBtnFiltrar: function () {

			var that = this;

			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			var parametros = that.getModel("modelParametros").getData();
			var PerioAux = that.getModel("modelParametros").getProperty("/Periodo");
			var PerioSplit = PerioAux.split(" - ");
			var PerioIni = PerioSplit[0];
			var PerioFim = PerioSplit[1];

			that.byId("master").setBusy(true);

			that.oModel.read("/RelPedidos", {
				urlParameters: {

					"$filter": "Usuario eq '" + repres +
						"' and WerksIni eq '" + parametros.WerksIni +
						"' and WerksFim eq '" + parametros.WerksFim +
						"' and KunnrIni eq '" + parametros.KunnrIni +
						"' and KunnrFim eq '" + parametros.KunnrFim +
						"' and VbelnIni eq '" + parametros.VbelnIni +
						"' and VbelnFim eq '" + parametros.VbelnFim +
						"' and RepreIni eq '" + parametros.LifnrIni +
						"' and RepreFim eq '" + parametros.LifnrFim +
						"' and MatnrIni eq '" + parametros.MatnrIni +
						"' and MatnrFim eq '" + parametros.MatnrFim +
						"' and PerioIni eq '" + PerioIni +
						"' and PerioFim eq '" + PerioFim + "'"
				},
				success: function (retorno) {

					that.vetorNotasFiscais = [];
					that.vetorResumoEmpresa = [];

					that.vetorNotasFiscais = retorno.results;

					that.getModel("modelPedidos").setData(that.vetorNotasFiscais);

					var vTotalEmp = 0;
					for (var i = 0; i < that.vetorNotasFiscais.length; i++) {
						var vAchouEmpresa = false;
						for (var j = 0; j < that.vetorResumoEmpresa.length; j++) {

							if (that.vetorNotasFiscais[i].Bukrs == that.vetorResumoEmpresa[j].Bukrs) {

								vAchouEmpresa = true;

								that.vetorResumoEmpresa[j].Netwrt = parseFloat(that.vetorResumoEmpresa[j].Netwrt) + Math.round(parseFloat(that.vetorNotasFiscais[
									i].Netwrt) * 100) / 100;
								that.vetorResumoEmpresa[j].Netwrt = parseFloat(that.vetorResumoEmpresa[j].Netwrt).toFixed(2);

							}
						}
						if (vAchouEmpresa == false) {
							var vAux = {
								Bukrs: that.vetorNotasFiscais[i].Bukrs,
								Butxt: that.vetorNotasFiscais[i].Butxt,
								Netwrt: parseFloat(that.vetorNotasFiscais[i].Netwrt)
							};

							that.vetorResumoEmpresa.push(vAux);

						}
						vTotalEmp += parseFloat(that.vetorNotasFiscais[i].Netwrt);
					}

					if (vTotalEmp > 0) {
						var vAuxTot = {
							Bukrs: "",
							Butxt: "TOTAL",
							Netwrt: parseFloat(vTotalEmp).toFixed(2)
						};

						that.vetorResumoEmpresa.push(vAuxTot);
					}

					that.byId("master").setBusy(false);
					that.getModel("modelResumoEmpresa").setData(that.vetorResumoEmpresa);
				},
				error: function (error) {
					that.byId("master").setBusy(false);
					that.onMensagemErroODATA(error);
				}
			});

		},

		onExpandFiltro: function () {

			if (this.byId("idPanelFiltro").getExpanded()) {
				this.byId("idPanelFiltro").setHeaderText("Ocultar Filtros");
			} else {
				this.byId("idPanelFiltro").setHeaderText("Exibir Filtros");
			}
		},

		onSuggestCentroFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("NomeCentro", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idCentroFim").getBinding("suggestionItems").filter(aFilters);
			this.byId("idCentroFim").suggest();
		},

		onSuggestClienteIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Name1", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idClienteIni").getBinding("suggestionItems").filter(aFilters);
			this.byId("idClienteIni").suggest();
		},

		onSuggestClienteFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Name1", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idClienteFim").getBinding("suggestionItems").filter(aFilters);
			this.byId("idClienteFim").suggest();
		},

		onSuggestRedeIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kvgr4", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescKvgr4", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idRedeIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idRedeIni").suggest();
		},

		onSuggestRedeFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kvgr4", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescKvgr4", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idRedeFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idRedeFim").suggest();
		},

		onSuggestBandeiraIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kvgr5", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescKvgr5", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idBandeiraIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idBandeiraIni").suggest();
		},

		onSuggestBandeiraFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kvgr5", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescKvgr5", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idBandeiraFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idBandeiraFim").suggest();
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

		onSuggestRepresFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Lifnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Name1Rep", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idRepreFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idRepreFim").suggest();
		},
	});
});