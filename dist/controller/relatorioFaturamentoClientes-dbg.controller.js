/*eslint-disable no-unused-vars, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"application/model/formatter",
	"sap/ui/core/util/MockServer",
	"sap/ui/export/library",
	"sap/ui/export/Spreadsheet",
	"sap/ui/model/odata/v2/ODataModel"

], function (BaseController, JSONModel, MessageBox, formatter, MockServer, exportLibrary, Spreadsheet, ODataModel) {
	"use strict";

	var oDuplicataRelatorio = [];
	var EdmType = exportLibrary.EdmType;

	return BaseController.extend("application.controller.relatorioFaturamentoClientes", {

		onInit: function () {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("relatorioFaturamentoClientes").attachPatternMatched(this._onLoadFields, this);
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
				VBelnIni: "",
				VBelnFim: "",
				RepreIni: "",
				Periodo: ""
			};

			var omodelParametros = new JSONModel(vAux);
			that.setModel(omodelParametros, "modelParametros");

			that.vetorFatClientes = [];
			var oModelFatClientes = new JSONModel(that.vetorFatClientes);
			that.setModel(oModelFatClientes, "modelFatClientes");

			that.vetorFatClientesExcel = [];
			var oModelFatClientesExcel = new JSONModel(that.vetorFatClientesExcel);
			that.setModel(oModelFatClientesExcel, "modelFatClientesExcel");

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

				// var oModelRede = new JSONModel(vetorRede);
				// that.setModel(oModelRede, "modelRedes");

				// var oModelBandeira = new JSONModel(vetorBandeira);
				// that.setModel(oModelBandeira, "modelBandeiras");

				var oModelRepres = new JSONModel(vetorRepres);
				that.setModel(oModelRepres, "modelRepres");

			}).catch(function (error) {

				that.onMensagemErroODATA(error);
			});

			new Promise(function (res1, rej1) {

				// var parametros = that.getModel("modelParametros").getData();
				// var VkorgIni = "";
				// var VkorgFin = "";

				// var Centros = that.getModel("modelCentros").getData();

				// for(var i=0; i<Centros.length; i++){
				// 	if(Centros[i].Werks == parametros.WerksIni){

				// 		VkorgIni = Centros[i].Bukrs;
				// 	}

				// 	if(Centros[i].Werks == parametros.WerksFim){

				// 		VkorgFin = Centros[i].Bukrs;
				// 	}
				// }
				// parametros.LifnrIni, parametros.LifnrFim, VkorgIni, VkorgFin,

				that.onBuscarRedesClientesRange(res1, rej1, that);

			}).then(function (dados) {

				var vetorRede = [];

				vetorRede = dados;

				var oModelRede = new JSONModel(vetorRede);
				that.setModel(oModelRede, "modelRedes");
				that.setModel(oModelRede, "modelBandeiras");

				setTimeout(function () {

					that.byId("idClienteIni").focus();
				}, 500);

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
				label: "Canal Atuação",
				property: "Kvgr2",
				type: EdmType.String
			});

			aCols.push({
				label: "Descrição Canal Atuação",
				property: "Kvgr2Text",
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
				label: "Qtd Faturada",
				property: "Menge",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "Vlr Faturado",
				property: "Netwrt",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "%Partic.",
				property: "PctPartic",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "Qtde Pedidos",
				property: "QtdPedidos",
				type: EdmType.Number,
				scale: 0,
				delimiter: true
			});

			aCols.push({
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
				this._oTable = this.byId("idtableFatClientes");
			}

			oTable = this._oTable;
			oRowBinding = oTable.getBinding("items");
			aCols = this.createColumnConfig();
			var parametros = this.getModel("modelParametros").getData();

			oSettings = {
				workbook: {
					columns: aCols,
					hierarchyLevel: "Level",
					context: {
						application: 'Portal Predilecta',
						version: '1.00.00',
						title: 'Relatório de Faturamento de Clientes',
						modifiedBy: 'Administrador',
						metaSheetName: 'Parâmetros',
						metainfo: [{
							name: 'Parâmetros de Seleção',
							items: [{
								key: 'Centro',
								value: parametros.Centro
							}, {
								key: 'UF Origem',
								value: parametros.UFOrigem
							}, {
								key: 'Cliente',
								value: parametros.Cliente
							}, {
								key: 'UF Destino',
								value: parametros.UFDestino
							}, {
								key: 'Canal Atuação',
								value: parametros.CanalAtuacao
							}, {
								key: 'Tabela de Preço',
								value: parametros.TabPreco
							}, {
								key: 'Vencimento',
								value: parametros.Vencimento
							}, {
								key: 'Índice',
								value: parametros.Indice
							}, {
								key: 'Tipo Transporte',
								value: parametros.Frete
							}, {
								key: 'Exibição',
								value: parametros.Exibicao
							}]
						}]
					}
				},
				dataSource: oRowBinding,
				fileName: "Rel_Fat_Cliente.xlsx",
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

			that.oModel.read("/P_RelFatClientes", {
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
						"' and RepreIni eq '" + parametros.RepreIni +
						"' and RepreFim eq '" + parametros.RepreFim +
						"' and PerioIni eq '" + PerioIni +
						"' and PerioFim eq '" + PerioFim + "'"
				},
				success: function (retorno) {

					that.vetorTreeRepres = [];
					that.vetorTreeEmpresa = [];
					that.vetorTreeRede = [];
					that.vetorTreeCliente = [];

					that.vetorFatClientes = [];
					that.vetorFatClientes = retorno.results;

					for (var i = 0; i < that.vetorFatClientes.length; i++) {

						if (that.vetorFatClientes[i].HierarchyLevel == 0) {

							var vAuxRepres = {
								Lifnr: that.vetorFatClientes[i].Lifnr,
								Name1Rep: that.vetorFatClientes[i].Name1Rep,
								Menge: parseFloat(that.vetorFatClientes[i].Menge),
								Netwrt: parseFloat(that.vetorFatClientes[i].Netwrt),
								PctPartic: parseFloat(that.vetorFatClientes[i].PctPartic),
								QtdPedidos: parseFloat(that.vetorFatClientes[i].QtdPedidos),
								PctRentab: parseFloat(that.vetorFatClientes[i].PctRentab),
								NodeID: that.vetorFatClientes[i].NodeID,
								HierarchyLevel: [],
								Description: that.vetorFatClientes[i].Description,
								ParentNodeID: that.vetorFatClientes[i].ParentNodeID
							};
							that.vetorTreeRepres.push(vAuxRepres);
						}

						if (that.vetorFatClientes[i].HierarchyLevel == 1) {

							var vAuxEmpresa = {
								Lifnr: that.vetorFatClientes[i].Lifnr,
								Name1Rep: that.vetorFatClientes[i].Name1Rep,
								Bukrs: that.vetorFatClientes[i].Bukrs,
								Butxt: that.vetorFatClientes[i].Butxt,
								Menge: parseFloat(that.vetorFatClientes[i].Menge),
								Netwrt: parseFloat(that.vetorFatClientes[i].Netwrt),
								PctPartic: parseFloat(that.vetorFatClientes[i].PctPartic),
								QtdPedidos: parseFloat(that.vetorFatClientes[i].QtdPedidos),
								PctRentab: parseFloat(that.vetorFatClientes[i].PctRentab),
								NodeID: that.vetorFatClientes[i].NodeID,
								HierarchyLevel: [],
								Description: that.vetorFatClientes[i].Description,
								ParentNodeID: that.vetorFatClientes[i].ParentNodeID
							};
							that.vetorTreeEmpresa.push(vAuxEmpresa);
						}

						if (that.vetorFatClientes[i].HierarchyLevel == 2) {

							var vAuxRede = {
								Lifnr: that.vetorFatClientes[i].Lifnr,
								Name1Rep: that.vetorFatClientes[i].Name1Rep,
								Bukrs: that.vetorFatClientes[i].Bukrs,
								Butxt: that.vetorFatClientes[i].Butxt,
								Kunnr: that.vetorFatClientes[i].Kunnr,
								Kvgr4: that.vetorFatClientes[i].Kvgr4,
								Kvgr4Text: that.vetorFatClientes[i].Kvgr4Text,
								Menge: parseFloat(that.vetorFatClientes[i].Menge),
								Netwrt: parseFloat(that.vetorFatClientes[i].Netwrt),
								PctPartic: parseFloat(that.vetorFatClientes[i].PctPartic),
								QtdPedidos: parseFloat(that.vetorFatClientes[i].QtdPedidos),
								PctRentab: parseFloat(that.vetorFatClientes[i].PctRentab),
								NodeID: that.vetorFatClientes[i].NodeID,
								HierarchyLevel: [],
								Description: that.vetorFatClientes[i].Description,
								ParentNodeID: that.vetorFatClientes[i].ParentNodeID
							};
							that.vetorTreeRede.push(vAuxRede);
						}

						if (that.vetorFatClientes[i].HierarchyLevel == 3) {

							var vAuxCliente = {
								Lifnr: that.vetorFatClientes[i].Lifnr,
								Name1Rep: that.vetorFatClientes[i].Name1Rep,
								Bukrs: that.vetorFatClientes[i].Bukrs,
								Butxt: that.vetorFatClientes[i].Butxt,
								Kunnr: that.vetorFatClientes[i].Kunnr,
								Name1Cli: that.vetorFatClientes[i].Name1Cli,
								Stcd1: that.vetorFatClientes[i].Stcd1,
								Stcd2: that.vetorFatClientes[i].Stcd2,
								Street: that.vetorFatClientes[i].Street,
								HouseNum1: that.vetorFatClientes[i].HouseNum1,
								City1: that.vetorFatClientes[i].City1,
								Region: that.vetorFatClientes[i].Region,
								Kvgr2: that.vetorFatClientes[i].Kvgr2,
								Kvgr2Text: that.vetorFatClientes[i].Kvgr2Text,
								Kvgr4: that.vetorFatClientes[i].Kvgr4,
								Kvgr4Text: that.vetorFatClientes[i].Kvgr4Text,
								Kvgr5: that.vetorFatClientes[i].Kvgr5,
								Kvgr5Text: that.vetorFatClientes[i].Kvgr5Text,
								Menge: parseFloat(that.vetorFatClientes[i].Menge),
								Netwrt: parseFloat(that.vetorFatClientes[i].Netwrt),
								PctPartic: parseFloat(that.vetorFatClientes[i].PctPartic),
								QtdPedidos: parseFloat(that.vetorFatClientes[i].QtdPedidos),
								PctRentab: parseFloat(that.vetorFatClientes[i].PctRentab),
								NodeID: that.vetorFatClientes[i].NodeID,
								HierarchyLevel: [],
								Description: that.vetorFatClientes[i].Description,
								ParentNodeID: that.vetorFatClientes[i].ParentNodeID
							};
							that.vetorTreeCliente.push(vAuxCliente);
							that.vetorFatClientesExcel.push(that.vetorFatClientes[i]);
						}
					}

					that.vetorFatClientes = [];

					for (var k = 0; k < that.vetorTreeRepres.length; k++) {

						that.vetorFatClientes.push(that.vetorTreeRepres[k]);

						for (var l = 0; l < that.vetorTreeEmpresa.length; l++) {
							if (that.vetorTreeEmpresa[l].Lifnr == that.vetorTreeRepres[k].Lifnr) {
								that.vetorFatClientes[k].HierarchyLevel.push(that.vetorTreeEmpresa[l]);
							}
						}
					}

					//

					for (var k = 0; k < that.vetorFatClientes.length; k++) {

						for (var i = 0; i < that.vetorFatClientes[k].HierarchyLevel.length; i++) {

							for (var m = 0; m < that.vetorTreeRede.length; m++) {

								if ((that.vetorTreeRede[m].Lifnr == that.vetorFatClientes[k].HierarchyLevel[i].Lifnr) &&
									(that.vetorTreeRede[m].Bukrs == that.vetorFatClientes[k].HierarchyLevel[i].Bukrs)) {

									that.vetorFatClientes[k].HierarchyLevel[i].HierarchyLevel.push(that.vetorTreeRede[m]);
								}
							}
						}
					}

					for (var k = 0; k < that.vetorFatClientes.length; k++) {

						for (var i = 0; i < that.vetorFatClientes[k].HierarchyLevel.length; i++) {

							for (var m = 0; m < that.vetorFatClientes[k].HierarchyLevel[i].HierarchyLevel.length; m++) {

								if ((that.vetorFatClientes[k].HierarchyLevel[i].HierarchyLevel[m].Lifnr == that.vetorFatClientes[k].HierarchyLevel[i].Lifnr) &&
									(that.vetorFatClientes[k].HierarchyLevel[i].HierarchyLevel[m].Bukrs == that.vetorFatClientes[k].HierarchyLevel[i].Bukrs)) {

									for (var n = 0; n < that.vetorTreeCliente.length; n++) {

										if ((that.vetorTreeCliente[n].Lifnr == that.vetorFatClientes[k].HierarchyLevel[i].HierarchyLevel[m].Lifnr) &&
											(that.vetorTreeCliente[n].Bukrs == that.vetorFatClientes[k].HierarchyLevel[i].HierarchyLevel[m].Bukrs) &&
											(that.vetorTreeCliente[n].Kvgr4 == that.vetorFatClientes[k].HierarchyLevel[i].HierarchyLevel[m].Kvgr4)) {

											that.vetorFatClientes[k].HierarchyLevel[i].HierarchyLevel[m].HierarchyLevel.push(that.vetorTreeCliente[n]);
										}
									}
								}
							}
						}
					}
					that.byId("master").setBusy(false);
					that.getModel("modelFatClientes").setData(that.vetorFatClientes);
					that.getModel("modelFatClientesExcel").setData(that.vetorFatClientesExcel);
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