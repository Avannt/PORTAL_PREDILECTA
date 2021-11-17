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
				Kvgr4Ini: "",
				Kvgr4Fim: "",
				Kvgr5Ini: "",
				Kvgr5Fim: "",
				VbelnIni: "",
				VbelnFim: "",
				LifnrIni: "",
				LifnrFim: "",
				MatnrIni: "",
				MatnrFim: "",
				Periodo: "",
				StatusNaoFornecido: true,
				StatusParcialmConcluido: true,
				StatusConcluido: true
			};

			var omodelParametros = new JSONModel(vAux);
			that.setModel(omodelParametros, "modelParametros");

			that.vetorPedidos = [];
			var omodelPedidos = new JSONModel(that.vetorPedidos);
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
			
			new Promise(function (res, rej) {

				that.onBuscarProdutos(repres, res, rej, that);

			}).then(function (retorno) {

				var vetorMaterial = retorno;
				var vetorCategoria = [];
				var vetorSubCategoria = [];
				var vetorFamilia = [];
				var vetorMarca = [];

				for (var i = 0; i < vetorMaterial.length; i++) {
					var vAchouCategoria = false;
					var vAchouSubCategoria = false;
					var vAchouFamilia = false;
					var vAchouMarca = false;

					for (var j = 0; j < vetorCategoria.length; j++) {

						if ((vetorMaterial[i].Mvgr1 == vetorCategoria[j].Mvgr1) || vetorMaterial[i].Mvgr1 == "") {
							vAchouCategoria = true;

							break;
						}
					}

					for (var k = 0; k < vetorSubCategoria.length; k++) {

						if ((vetorMaterial[i].Mvgr2 == vetorSubCategoria[k].Mvgr2) || vetorMaterial[i].Mvgr2 == "") {
							vAchouSubCategoria = true;

							break;
						}
					}

					for (var l = 0; l < vetorFamilia.length; l++) {

						if ((vetorMaterial[i].Mvgr3 == vetorFamilia[l].Mvgr3) || vetorMaterial[i].Mvgr3 == "") {
							vAchouFamilia = true;

							break;
						}
					}

					for (var m = 0; m < vetorMarca.length; m++) {

						if ((vetorMaterial[i].Mvgr5 == vetorMarca[m].Mvgr5) || vetorMaterial[i].Mvgr5 == "") {
							vAchouMarca = true;

							break;
						}
					}

					if (vAchouCategoria == false) {
						vetorCategoria.push(vetorMaterial[i]);
					}

					if (vAchouSubCategoria == false) {
						vetorSubCategoria.push(vetorMaterial[i]);
					}

					if (vAchouFamilia == false) {
						vetorFamilia.push(vetorMaterial[i]);
					}

					if (vAchouMarca == false) {
						vetorMarca.push(vetorMaterial[i]);
					}
				}
				var oModelMaterial = new JSONModel(vetorMaterial);
				that.setModel(oModelMaterial, "modelMaterial");

				var oModelCategoria = new JSONModel(vetorCategoria);
				that.setModel(oModelCategoria, "modelCategoria");

				var oModelSubCategoria = new JSONModel(vetorSubCategoria);
				that.setModel(oModelSubCategoria, "modelSubCategoria");

				var oModelFamilia = new JSONModel(vetorFamilia);
				that.setModel(oModelFamilia, "modelFamilia");

				var oModelMarca = new JSONModel(vetorMarca);
				that.setModel(oModelMarca, "modelMarca");

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
				label: "Vocativo",
				property: "TitleLet",
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
				label: "Força Vendas",
				property: "Bname",
				type: EdmType.String
			});

			aCols.push({
				label: "Dt Docto",
				property: "Audat",
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
				label: "Rede",
				property: "Kvgr4",
				type: EdmType.String
			});

			aCols.push({
				label: "Descrição Rede",
				property: "Kvgr4Text",
				type: EdmType.String
			});

			aCols.push({
				label: "Bandeira",
				property: "Kvgr5",
				type: EdmType.String
			});

			aCols.push({
				label: "Descrição Bandeira",
				property: "Kvgr5Text",
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
				label: "Volume(CX)",
				property: "Kwmeng",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "Saldo Volume(CX)",
				property: "QtdSdoPed",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "Valor S/ST",
				property: "ValSSt",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "Vl Saldo S/ST",
				property: "ValSSt",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "Status Remessa",
				property: "StatusRemessa",
				type: EdmType.String
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

		onDialogClose: function () {

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}

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

			that.oModel.read("/P_RelPedidos", {
				urlParameters: {

					"$filter": "Usuario eq '" + repres +
						"' and WerksIni eq '" + parametros.WerksIni +
						"' and WerksFim eq '" + parametros.WerksFim +
						"' and KunnrIni eq '" + parametros.KunnrIni +
						"' and KunnrFim eq '" + parametros.KunnrFim +
						"' and Kvgr4Ini eq '" + parametros.Kvgr4Ini +
						"' and Kvgr4Fim eq '" + parametros.Kvgr4Fim +
						"' and Kvgr5Ini eq '" + parametros.Kvgr5Ini +
						"' and Kvgr5Fim eq '" + parametros.Kvgr5Fim +
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

					that.vetorPedidos = [];

					that.vetorPedidosAux = retorno.results;

					for (var i = 0; i < that.vetorPedidosAux.length; i++) {

						if ((that.vetorPedidosAux[i].Lfgsk == "A" && parametros.StatusNaoFornecido == true) ||
						    (that.vetorPedidosAux[i].Lfgsk == "B" && parametros.StatusParcialmConcluido == true) ||
						    (that.vetorPedidosAux[i].Lfgsk == "C" && parametros.StatusConcluido == true)){

							that.vetorPedidos.push(that.vetorPedidosAux[i]);

						}
					}

					that.getModel("modelPedidos").setData(that.vetorPedidos);
					that.byId("master").setBusy(false);
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
		
		onSuggestMaterialIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idMaterialIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idMaterialIni").suggest();
		},

		onSuggestMaterialFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idMaterialFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idMaterialFim").suggest();
		},
	});
});