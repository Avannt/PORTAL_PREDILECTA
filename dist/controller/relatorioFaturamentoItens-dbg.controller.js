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

	return BaseController.extend("application.controller.relatorioFaturamentoItens", {

		onInit: function () {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("relatorioFaturamentoItens").attachPatternMatched(this._onLoadFields, this);
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
				RepreFim: "",
				MatnrIni: "",
				MatnrFim: "",
				Mvgr1Ini: "",
				Mvgr1Fim: "",
				Mvgr2Ini: "",
				Mvgr2Fim: "",
				Mvgr3Ini: "",
				Mvgr3Fim: "",
				Mvgr5Ini: "",
				Mvgr5Fim: "",
				Periodo: ""
			};

			var omodelParametros = new JSONModel(vAux);
			that.setModel(omodelParametros, "modelParametros");

			that.vetorFatItens = [];
			var omodelFatItens = new JSONModel(that.vetorFatItens);
			that.setModel(omodelFatItens, "modelFatItens");

			that.vetorFatItensExcel = [];
			var oModelFatItensExcel = new JSONModel(that.vetorFatItensExcel);
			that.setModel(oModelFatItensExcel, "modelFatItensExcel");

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

			new Promise(function (res, rej) {

				that.onBuscarProdutos(repres, '', res, rej, that);

			}).then(function (retorno) {

				var vetorMaterial = retorno;
				var vetorMaterialAux = [];
				var vetorCategoria = [];
				var vetorSubCategoria = [];
				var vetorFamilia = [];
				var vetorMarca = [];

				for (var i = 0; i < vetorMaterial.length; i++) {

					var vAchouMaterial = false;
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

					for (var x = 0; x < vetorMaterialAux.length; x++) {

						if ((vetorMaterial[i].Matnr == vetorMaterialAux[x].Matnr) || vetorMaterial[i].Matnr == "") {
							vAchouMaterial = true;

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

					if (vAchouMaterial == false) {
						vetorMaterialAux.push(vetorMaterial[i]);
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
				var oModelMaterial = new JSONModel(vetorMaterialAux);
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
				label: "Material",
				property: "Matnr",
				type: EdmType.String
			});

			aCols.push({
				label: "Descrição Material",
				property: "Maktx",
				type: EdmType.String
			});

			aCols.push({
				label: "UM",
				property: "Meins",
				type: EdmType.String
			});

			aCols.push({
				label: "Categoria",
				property: "Mvgr1",
				type: EdmType.String
			});

			aCols.push({
				label: "Descrição Categoria",
				property: "Mvgr1Text",
				type: EdmType.String
			});

			aCols.push({
				label: "SubCategoria",
				property: "Mvgr2",
				type: EdmType.String
			});

			aCols.push({
				label: "Descrição SubCategoria",
				property: "Mvgr2Text",
				type: EdmType.String
			});

			aCols.push({
				label: "Família",
				property: "Mvgr3",
				type: EdmType.String
			});

			aCols.push({
				label: "Descrição Família",
				property: "Mvgr3Text",
				type: EdmType.String
			});

			aCols.push({
				label: "Marca",
				property: "Mvgr5",
				type: EdmType.String
			});

			aCols.push({
				label: "Descrição Marca",
				property: "Mvgr5Text",
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

			aCols.push({
				property: "UltPreco",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				property: "MedPreco",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			return aCols;
		},

		onExport: function () {
			var aCols, oRowBinding, oSettings, oSheet, oTable;

			if (!this._oTable) {
				this._oTable = this.byId("idtableFatItens");
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
				fileName: "Rel_Fat_Item.xlsx",
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

			that.oModel.read("/P_RelFatItens", {
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
						"' and MatnrIni eq '" + parametros.MatnrIni +
						"' and MatnrFim eq '" + parametros.MatnrFim +
						"' and Mvgr1Ini eq '" + parametros.Mvgr1Ini +
						"' and Mvgr1Fim eq '" + parametros.Mvgr1Fim +
						"' and Mvgr2Ini eq '" + parametros.Mvgr2Ini +
						"' and Mvgr2Fim eq '" + parametros.Mvgr2Fim +
						"' and Mvgr3Ini eq '" + parametros.Mvgr3Ini +
						"' and Mvgr3Fim eq '" + parametros.Mvgr3Fim +
						"' and Mvgr5Ini eq '" + parametros.Mvgr5Ini +
						"' and Mvgr5Fim eq '" + parametros.Mvgr5Fim +
						"' and PerioIni eq '" + PerioIni +
						"' and PerioFim eq '" + PerioFim + "'"
				},
				success: function (retorno) {

					that.vetorTreeRepres = [];
					that.vetorTreeEmpresa = [];
					that.vetorTreeCategoria = [];
					that.vetorTreeItem = [];

					that.vetorFatItens = [];
					that.vetorFatItens = retorno.results;

					for (var i = 0; i < that.vetorFatItens.length; i++) {

						if (that.vetorFatItens[i].HierarchyLevel == 0) {

							var vAuxRepres = {
								Lifnr: that.vetorFatItens[i].Lifnr,
								Name1Rep: that.vetorFatItens[i].Name1Rep,
								Menge: parseFloat(that.vetorFatItens[i].Menge),
								Netwrt: parseFloat(that.vetorFatItens[i].Netwrt),
								PctPartic: parseFloat(that.vetorFatItens[i].PctPartic),
								QtdPedidos: parseFloat(that.vetorFatItens[i].QtdPedidos),
								PctRentab: parseFloat(that.vetorFatItens[i].PctRentab),
								NodeID: that.vetorFatItens[i].NodeID,
								HierarchyLevel: [],
								Description: that.vetorFatItens[i].Description,
								ParentNodeID: that.vetorFatItens[i].ParentNodeID
							};
							that.vetorTreeRepres.push(vAuxRepres);
						}

						if (that.vetorFatItens[i].HierarchyLevel == 1) {

							var vAuxEmpresa = {
								Lifnr: that.vetorFatItens[i].Lifnr,
								Name1Rep: that.vetorFatItens[i].Name1Rep,
								Bukrs: that.vetorFatItens[i].Bukrs,
								Butxt: that.vetorFatItens[i].Butxt,
								Menge: parseFloat(that.vetorFatItens[i].Menge),
								Netwrt: parseFloat(that.vetorFatItens[i].Netwrt),
								PctPartic: parseFloat(that.vetorFatItens[i].PctPartic),
								QtdPedidos: parseFloat(that.vetorFatItens[i].QtdPedidos),
								PctRentab: parseFloat(that.vetorFatItens[i].PctRentab),
								NodeID: that.vetorFatItens[i].NodeID,
								HierarchyLevel: [],
								Description: that.vetorFatItens[i].Description,
								ParentNodeID: that.vetorFatItens[i].ParentNodeID
							};
							that.vetorTreeEmpresa.push(vAuxEmpresa);
						}

						if (that.vetorFatItens[i].HierarchyLevel == 2) {

							var vAuxCategoria = {
								Lifnr: that.vetorFatItens[i].Lifnr,
								Name1Rep: that.vetorFatItens[i].Name1Rep,
								Bukrs: that.vetorFatItens[i].Bukrs,
								Butxt: that.vetorFatItens[i].Butxt,
								Matnr: that.vetorFatItens[i].Matnr,
								Maktx: that.vetorFatItens[i].Maktx,
								Mvgr1: that.vetorFatItens[i].Mvgr1,
								Mvgr1Text: that.vetorFatItens[i].Mvgr1Text,
								Menge: parseFloat(that.vetorFatItens[i].Menge),
								Netwrt: parseFloat(that.vetorFatItens[i].Netwrt),
								PctPartic: parseFloat(that.vetorFatItens[i].PctPartic),
								QtdPedidos: parseFloat(that.vetorFatItens[i].QtdPedidos),
								PctRentab: parseFloat(that.vetorFatItens[i].PctRentab),
								NodeID: that.vetorFatItens[i].NodeID,
								HierarchyLevel: [],
								Description: that.vetorFatItens[i].Description,
								ParentNodeID: that.vetorFatItens[i].ParentNodeID
							};
							that.vetorTreeCategoria.push(vAuxCategoria);
						}

						if (that.vetorFatItens[i].HierarchyLevel == 3) {

							var vAuxItem = {
								Lifnr: that.vetorFatItens[i].Lifnr,
								Name1Rep: that.vetorFatItens[i].Name1Rep,
								Bukrs: that.vetorFatItens[i].Bukrs,
								Butxt: that.vetorFatItens[i].Butxt,
								Matnr: that.vetorFatItens[i].Matnr,
								Maktx: that.vetorFatItens[i].Maktx,
								Meins: that.vetorFatItens[i].Meins,
								Mvgr1: that.vetorFatItens[i].Mvgr1,
								Mvgr1Text: that.vetorFatItens[i].Mvgr1Text,
								Mvgr2: that.vetorFatItens[i].Mvgr2,
								Mvgr2Text: that.vetorFatItens[i].Mvgr2Text,
								Mvgr3: that.vetorFatItens[i].Mvgr3,
								Mvgr3Text: that.vetorFatItens[i].Mvgr3Text,
								Mvgr5: that.vetorFatItens[i].Mvgr5,
								Mvgr5Text: that.vetorFatItens[i].Mvgr5Text,
								Menge: parseFloat(that.vetorFatItens[i].Menge),
								Netwrt: parseFloat(that.vetorFatItens[i].Netwrt),
								PctPartic: parseFloat(that.vetorFatItens[i].PctPartic),
								QtdPedidos: parseFloat(that.vetorFatItens[i].QtdPedidos),
								PctRentab: parseFloat(that.vetorFatItens[i].PctRentab),
								UltPreco: parseFloat(that.vetorFatItens[i].UltPreco),
								MedPreco: parseFloat(that.vetorFatItens[i].MedPreco),
								NodeID: that.vetorFatItens[i].NodeID,
								HierarchyLevel: [],
								Description: that.vetorFatItens[i].Description,
								ParentNodeID: that.vetorFatItens[i].ParentNodeID
							};
							that.vetorTreeItem.push(vAuxItem);
							that.vetorFatItensExcel.push(that.vetorFatItens[i]);
						}
					}

					that.vetorFatItens = [];

					for (var k = 0; k < that.vetorTreeRepres.length; k++) {

						that.vetorFatItens.push(that.vetorTreeRepres[k]);

						for (var l = 0; l < that.vetorTreeEmpresa.length; l++) {
							if (that.vetorTreeEmpresa[l].Lifnr == that.vetorTreeRepres[k].Lifnr) {
								that.vetorFatItens[k].HierarchyLevel.push(that.vetorTreeEmpresa[l]);
							}
						}
					}

					//

					for (var k = 0; k < that.vetorFatItens.length; k++) {

						for (var i = 0; i < that.vetorFatItens[k].HierarchyLevel.length; i++) {

							for (var m = 0; m < that.vetorTreeCategoria.length; m++) {

								if ((that.vetorTreeCategoria[m].Lifnr == that.vetorFatItens[k].HierarchyLevel[i].Lifnr) &&
									(that.vetorTreeCategoria[m].Bukrs == that.vetorFatItens[k].HierarchyLevel[i].Bukrs)) {

									that.vetorFatItens[k].HierarchyLevel[i].HierarchyLevel.push(that.vetorTreeCategoria[m]);
								}
							}
						}
					}

					for (var k = 0; k < that.vetorFatItens.length; k++) {

						for (var i = 0; i < that.vetorFatItens[k].HierarchyLevel.length; i++) {

							for (var m = 0; m < that.vetorFatItens[k].HierarchyLevel[i].HierarchyLevel.length; m++) {

								if ((that.vetorFatItens[k].HierarchyLevel[i].HierarchyLevel[m].Lifnr == that.vetorFatItens[k].HierarchyLevel[i].Lifnr) &&
									(that.vetorFatItens[k].HierarchyLevel[i].HierarchyLevel[m].Bukrs == that.vetorFatItens[k].HierarchyLevel[i].Bukrs)) {

									for (var n = 0; n < that.vetorTreeItem.length; n++) {

										if ((that.vetorTreeItem[n].Lifnr == that.vetorFatItens[k].HierarchyLevel[i].HierarchyLevel[m].Lifnr) &&
											(that.vetorTreeItem[n].Bukrs == that.vetorFatItens[k].HierarchyLevel[i].HierarchyLevel[m].Bukrs) &&
											(that.vetorTreeItem[n].Mvgr1 == that.vetorFatItens[k].HierarchyLevel[i].HierarchyLevel[m].Mvgr1)) {

											that.vetorFatItens[k].HierarchyLevel[i].HierarchyLevel[m].HierarchyLevel.push(that.vetorTreeItem[n]);
										}
									}
								}
							}
						}
					}
					that.byId("master").setBusy(false);
					that.getModel("modelFatItens").setData(that.vetorFatItens);
					that.getModel("modelFatItensExcel").setData(that.vetorFatItensExcel);
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

		onSuggestCategoriaIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr1", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr1", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idCategoriaIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idCategoriaIni").suggest();
		},

		onSuggestCategoriaFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr1", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr1", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idCategoriaFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idCategoriaFim").suggest();
		},

		onSuggestSubCategoriaIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr2", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr2", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idSubCategoriaIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idSubCategoriaIni").suggest();
		},

		onSuggestSubCategoriaFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr2", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr2", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idSubCategoriaFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idSubCategoriaFim").suggest();
		},

		onSuggestFamiliaIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr3", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr3", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idFamiliaIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idFamiliaIni").suggest();
		},

		onSuggestFamiliaFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr3", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr3", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idFamiliaFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idFamiliaFim").suggest();
		},

		onSuggestMarcaIni: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr5", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr5", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idMarcaIni").getBinding("suggestionItems").filter(aFilters);

			this.byId("idMarcaIni").suggest();
		},

		onSuggestMarcaFim: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr5", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr5", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idMarcaFim").getBinding("suggestionItems").filter(aFilters);

			this.byId("idMarcaFim").suggest();
		},

	});
});