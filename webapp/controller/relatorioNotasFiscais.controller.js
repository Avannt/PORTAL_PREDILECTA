/*eslint-disable no-unused-vars, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"application/model/formatter",
	"sap/ui/export/library",
	"sap/ui/export/Spreadsheet",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/core/Fragment"

], function (BaseController, JSONModel, MessageBox, formatter, exportLibrary, Spreadsheet, ODataModel, Fragment) {
	"use strict";

	var oDuplicataRelatorio = [];
	var EdmType = exportLibrary.EdmType;

	return BaseController.extend("application.controller.relatorioNotasFiscais", {

		onInit: function () {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("relatorioNotasFiscais").attachPatternMatched(this._onLoadFields, this);
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
				LifnrIni: "",
				LifnrFim: "",
				SeriesIni: "",
				SeriesFim: "",
				NfenumIni: "",
				NfenumFim: "",
				Periodo: ""
			};

			var omodelParametros = new JSONModel(vAux);
			that.setModel(omodelParametros, "modelParametros");

			that.vetorNotasFiscais = [];
			var omodelNotasFiscais = new JSONModel(that.vetorNotasFiscais);
			that.setModel(omodelNotasFiscais, "modelNotasFiscais");

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
				label: "Centro",
				property: "Werks",
				type: EdmType.String
			});

			aCols.push({
				label: "Série",
				property: "Series",
				type: EdmType.String
			});

			aCols.push({
				label: "NFe",
				property: "Nfenum",
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

			aCols.push({
				label: "Data Entrega",
				property: "Datent",
				type: EdmType.DateTime,
				format: 'dd/mm/yyyy'
			});

			return aCols;
		},

		onExport: function () {
			var aCols, oRowBinding, oSettings, oSheet, oTable;

			if (!this._oTable) {
				this._oTable = this.byId("idtableNotasFiscais");
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
				fileName: "Rel_Notas_Fiscais.xlsx",
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
				Docnum: evt.getSource().getBindingContext("modelNotasFiscais").getObject().Docnum,
				Nfenum: evt.getSource().getBindingContext("modelNotasFiscais").getObject().Nfenum,
				Series: evt.getSource().getBindingContext("modelNotasFiscais").getObject().Series,
				Nfe: true,
				Boleto: true
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

		onDialogOpenStatus: function (evt) {

			var that = this;

			var vAux = {
				Nfenum: evt.getSource().getBindingContext("modelNotasFiscais").getObject().Nfenum,
				Werks: evt.getSource().getBindingContext("modelNotasFiscais").getObject().Werks,
				Name1Redesp: evt.getSource().getBindingContext("modelNotasFiscais").getObject().Name1Redesp,
				FoneRedesp: evt.getSource().getBindingContext("modelNotasFiscais").getObject().FoneRedesp,
				EmailRedesp: evt.getSource().getBindingContext("modelNotasFiscais").getObject().EmailRedesp,
			};
			var omodelParamDialog = new JSONModel(vAux);
			that.setModel(omodelParamDialog, "modelParamDialog");

			var oModelDelay = new JSONModel({
				"view": false
			});
			this.getView().setModel(oModelDelay, "modelDelay");

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}

			if (!this._CreateMaterialFragment) {

				this._ItemDialog = sap.ui.xmlfragment(
					"application.view.StatusPedido",
					this
				);
				this.getView().addDependent(this._ItemDialog);
			}

			this._ItemDialog.open();
		},

		onZoomIn: function () {

			this.oProcessFlow.zoomIn();
		},

		onZoomOut: function () {

			this.oProcessFlow.zoomOut();
		},

		onLoadStatus: function () {

			var that = this;

			var NF = that.getModel("modelParamDialog").getProperty("/Nfenum");
			var Werks = that.getModel("modelParamDialog").getProperty("/Werks");
			var Name1Redesp = that.getModel("modelParamDialog").getProperty("/Name1Redesp");
			var FoneRedesp = that.getModel("modelParamDialog").getProperty("/FoneRedesp");
			var EmailRedesp = that.getModel("modelParamDialog").getProperty("/EmailRedesp");

			this.oProcessFlow = this._ItemDialog.getContent("fnClass")[0];

			this.oProcessFlow.setZoomLevel(sap.suite.ui.commons.ProcessFlowZoomLevel.One);
			this._ItemDialog.setBusy(true);

			new Promise(function (res, rej) {

				that.onBuscarStatusPedido(NF, Werks, res, rej, that);

			}).then(function (retorno) {

				console.log(retorno);
				that.onCriarModelStatus();
				var qntOcorrencia = 0;

				var vetorStatus = that.getModel("modelStatusPedido").getData();
				var vetorOcorrencias = that.getModel("modelOcorrencias").getData();


				if (retorno.DataFaturamento != '' || retorno.DataFaturamento != "00/00/0000" && retorno.DataFaturamento != "undefined") {

					vetorStatus.lanes[0].state = "Positive";
					vetorStatus.nodes[0].state = "Positive";
					vetorStatus.nodes[0].stateText = "OK - " + retorno.DataFaturamento;
					vetorStatus.nodes[0].texts = "Nota Fiscal emitida."

					vetorStatus.lanes[1].state = "Positive";
					vetorStatus.nodes[1].state = "Positive";
					vetorStatus.nodes[1].stateText = "OK - " + retorno.DataFaturamento;
					vetorStatus.nodes[1].texts = "Frete contratado.";
				}

				if (retorno.DataLibPortaria != '' && retorno.DataLibPortaria != "00/00/0000" && retorno.DataLibPortaria != "undefined") {

					vetorStatus.lanes[2].state = "Positive";
					vetorStatus.nodes[2].state = "Positive";
					vetorStatus.nodes[2].stateText = "OK - " + retorno.DataLibPortaria;
					vetorStatus.nodes[2].texts = "Mercadoria separada.";

					vetorStatus.lanes[3].state = "Positive";
					vetorStatus.nodes[3].state = "Positive";
					vetorStatus.nodes[3].stateText = "OK - " + retorno.DataLibPortaria;
					vetorStatus.nodes[3].texts = "Mercadoria saiu da fabrica.";


					if (retorno.Inco1 == 'FOB') {

						vetorStatus.nodes.splice(4, 1);
						vetorStatus.lanes.splice(4, 1);

						// o quinto no virou o quarto no
						vetorStatus.lanes[4].state = "Positive";
						vetorStatus.nodes[4].state = "Positive";
						vetorStatus.nodes[4].stateText = "OK - " + retorno.DataLibPortaria;
						vetorStatus.nodes[4].texts = "Mercadoria entregue";

					} else {

						if (that.getModel("modelParamDialog").getProperty("/Name1Redesp") != '' && that.getModel("modelParamDialog").getProperty("/Name1Redesp") != undefined) {

							var possuiRedespacho = true;
							vetorStatus.nodes[3].children = [40, 41];

							//Index 4
							var aux = {
								"id": "41",
								"lane": "4",
								"title": that.getModel("modelParamDialog").getProperty("/Name1Redesp"),
								"titleAbbreviation": "TRANSP REDESP",
								"children": null,
								"state": "Positive",
								"stateText": that.onFormatTelefone(that.getModel("modelParamDialog").getProperty("/FoneRedesp")),
								"focused": false,
								"texts": [that.getModel("modelParamDialog").getProperty("/EmailRedesp")]
							};

							vetorStatus.nodes.splice(4, 0, aux);
						}

						if (retorno.DataRedesp != '' && retorno.DataRedesp != "00/00/0000" && retorno.DataRedesp != "undefined") {
							// var dataReal = retorno.DataEntregaReal.substring(6, 10) + retorno.DataEntregaReal.substring(3, 5) + retorno.DataEntregaReal.substring(0, 2);
							// var dataPortaria = retorno.DataLibPortaria.substring(6, 10) + retorno.DataLibPortaria.substring(3, 5) + retorno.DataLibPortaria.substring(0, 2);

							// var dataResult = dataReal - dataPortaria;

							vetorStatus.lanes[4].state = "Positive";
							vetorStatus.nodes[5].state = "Positive";
							vetorStatus.nodes[5].stateText = "OK - " + retorno.DataRedesp;
							vetorStatus.nodes[5].texts = "Prev Redespacho: " + retorno.DataPrevRedesp;

							if (retorno.DataEntregaReal != '' && retorno.DataEntregaReal != "00/00/0000" && retorno.DataEntregaReal != "undefined") {

								//Index 6 - Entrega Final
								try {

									vetorStatus.lanes[5].state = "Positive";
									vetorStatus.nodes[6].state = "Positive";
									vetorStatus.nodes[5].focused = true;
									vetorStatus.nodes[6].stateText = "OK - " + retorno.DataEntregaReal;

									if (retorno.DataAgendada != "" && retorno.DataAgendada != "00/00/0000" && retorno.DataAgendada != "undefined") {

										vetorStatus.nodes[6].texts = ["Data agendada: " + retorno.DataAgendada];

									} else if (retorno.DataEstimadaEntrega != "" && retorno.DataAgendada != "00/00/0000" && retorno.DataAgendada != "undefined") {

										vetorStatus.nodes[6].texts = ["Prev Entrega: " + retorno.DataEstimadaEntrega];
									}
								} catch (x) {

									vetorStatus.lanes[4].state = "Positive";
									vetorStatus.nodes[5].state = "Positive";
									vetorStatus.nodes[4].focused = true;
									vetorStatus.nodes[5].stateText = "OK - " + retorno.DataEntregaReal;

									if (retorno.DataAgendada != "" && retorno.DataAgendada != "00/00/0000" && retorno.DataAgendada != "undefined") {

										vetorStatus.nodes[5].texts = ["Data agendada: " + retorno.DataAgendada];

									} else if (retorno.DataEstimadaEntrega != "" && retorno.DataAgendada != "00/00/0000" && retorno.DataAgendada != "undefined") {

										vetorStatus.nodes[5].texts = ["Prev Entrega: " + retorno.DataEstimadaEntrega];
									}

								}

							} else {

								try {

									if (retorno.DataAgendada != "" && retorno.DataAgendada != "00/00/0000" && retorno.DataAgendada != "undefined") {

										vetorStatus.nodes[6].texts = ["Data agendada: " + retorno.DataAgendada];

									} else if (retorno.DataEstimadaEntrega != "" && retorno.DataAgendada != "00/00/0000" && retorno.DataAgendada != "undefined") {

										vetorStatus.nodes[6].texts = ["Prev Entrega: " + retorno.DataEstimadaEntrega];
									}
								} catch (x) {


									if (retorno.DataAgendada != "" && retorno.DataAgendada != "00/00/0000" && retorno.DataAgendada != "undefined") {

										vetorStatus.nodes[5].texts = ["Data agendada: " + retorno.DataAgendada];

									} else if (retorno.DataEstimadaEntrega != "" && retorno.DataAgendada != "00/00/0000" && retorno.DataAgendada != "undefined") {

										vetorStatus.nodes[5].texts = ["Prev Entrega: " + retorno.DataEstimadaEntrega];
									}
								}
							}

						} else {

							if (retorno.DataEntregaReal != '' && retorno.DataEntregaReal != "00/00/0000" && retorno.DataEntregaReal != "undefined") {

								if (possuiRedespacho) {

									vetorStatus.lanes[6].state = "Positive";
									vetorStatus.nodes[6].state = "Positive";
									vetorStatus.nodes[6].focused = true;
									vetorStatus.nodes[6].stateText = "OK - " + retorno.DataEntregaReal;
								} else {

									vetorStatus.lanes[5].state = "Positive";
									vetorStatus.nodes[5].state = "Positive";
									vetorStatus.nodes[5].focused = true;
									vetorStatus.nodes[5].stateText = "OK - " + retorno.DataEntregaReal;
								}

							}
						}
					}
				}

				//Texto do ultimo status
				if (retorno.Inco1 == 'FOB') {

					if (retorno.DataAgendada != "" && retorno.DataAgendada != "00/00/0000" && retorno.DataAgendada != "undefined") {

						vetorStatus.nodes[4].texts = ["Data agendada: " + retorno.DataAgendada];

					} else if (retorno.DataEstimadaEntrega != "" && retorno.DataAgendada != "00/00/0000" && retorno.DataAgendada != "undefined") {

						vetorStatus.nodes[4].texts = ["Prev Entrega: " + retorno.DataEstimadaEntrega];
					}

				} else {

					if (retorno.DataAgendada != "" && retorno.DataAgendada != "00/00/0000" && retorno.DataAgendada != "undefined") {

						vetorStatus.nodes[5].texts = ["Data agendada: " + retorno.DataAgendada];

					} else if (retorno.DataEstimadaEntrega != "" && retorno.DataAgendada != "00/00/0000" && retorno.DataAgendada != "undefined") {

						vetorStatus.nodes[5].texts = ["Prev Entrega: " + retorno.DataEstimadaEntrega];
					}
				}




				var ultimono = vetorStatus.nodes.length;
				var ultimoIndex = vetorStatus.lanes.length - 1;

				for (var i = 0; i < vetorOcorrencias.length; i++) {

					var campoNF = vetorOcorrencias[i].NF;



					if (campoNF.includes(NF)) {

						// vetorStatus.nodes[0].children = [10, 11, 12];

						qntOcorrencia += 1;
						var id = parseInt(String(ultimono) + String(qntOcorrencia));
						var id2 = parseInt(String(ultimono) + String(qntOcorrencia) + String(qntOcorrencia));

						if (vetorStatus.nodes[ultimoIndex].children == null) {

							vetorStatus.nodes[ultimoIndex].children = [id];
						} else {

							vetorStatus.nodes[ultimoIndex].children.push(id);
						}

						if (vetorOcorrencias[i].Status == "Resolvido" || vetorOcorrencias[i].Status == "Fechado") {
							var status = "Positive"
						} else {

							var status = "Negative"
						}

						vetorStatus.lanes[String(ultimoIndex)].state = status;
						//Index 4
						var aux = {
							"id": String(id),
							"lane": String(ultimoIndex),
							"title": vetorOcorrencias[i].Servico,
							"titleAbbreviation": "OCORRÊNCIA",
							"children": [id2],
							"state": status,
							"stateText": "Ticket:" + vetorOcorrencias[i].Status,
							"focused": false,
							"texts": ["Atendente: " + vetorOcorrencias[i].Nome_Responsavel, "Protocolo:" + vetorOcorrencias[i].Protocolo],
							"quickView": {
								"pageId": vetorOcorrencias[i].Protocolo,
								"header": "Informações da Ocorrência",
								"icon": "sap-icon://warning",
								"title": vetorOcorrencias[i].Nome_Responsavel,
								"description": "Atendente",
								"groups": [
									{
										"heading": "Detalhes",
										"elements": [
											{
												"label": "Status",
												"value": vetorOcorrencias[i].status,
												"url": null,
												"elementType": "text",
												"emailSubject": null
											},
											{
												"label": "Data Criação",
												"value": vetorOcorrencias[i].Data_Criacao,
												"url": null,
												"elementType": "text",
												"emailSubject": null
											},
											{
												"label": "Data Última Alteração",
												"value": vetorOcorrencias[i].Data_Ultima_Acao,
												"url": null,
												"elementType": "text",
												"emailSubject": null
											},
										]
									}
								]
							}
						};

						vetorStatus.nodes.splice(ultimono, 0, aux);

						var aux = {
							"id": String(id2),
							"lane": String(ultimoIndex),
							"title": vetorOcorrencias[i].Nome_Responsavel,
							"titleAbbreviation": "DETALHES OCORRÊNCIA",
							"children": null,
							"state": status,
							"stateText": "Solic: " + vetorOcorrencias[i].Nome_Solicitante,
							"focused": false,
							"texts": ["Criação: " + vetorOcorrencias[i].Data_Criacao, "Últ. Alter.:" + vetorOcorrencias[i].Data_Ultima_Acao],
							"quickView": {
								"pageId": vetorOcorrencias[i].Protocolo,
								"header": "Informações da Ocorrência",
								"icon": "sap-icon://warning",
								"title": vetorOcorrencias[i].Nome_Responsavel,
								"description": "Atendente",
								"groups": [
									{
										"heading": "Detalhes",
										"elements": [
											{
												"label": "Status",
												"value": vetorOcorrencias[i].status,
												"url": null,
												"elementType": "text",
												"emailSubject": null
											},
											{
												"label": "Data Criação",
												"value": vetorOcorrencias[i].Data_Criacao,
												"url": null,
												"elementType": "text",
												"emailSubject": null
											},
											{
												"label": "Data Última Alteração",
												"value": vetorOcorrencias[i].Data_Ultima_Acao,
												"url": null,
												"elementType": "text",
												"emailSubject": null
											},
										]
									}
								]
							}
						};

						vetorStatus.nodes.splice(ultimono, 0, aux);
					}
				}

				var oModel = new JSONModel(vetorStatus);
				that.setModel(oModel, "StatusPed");

				that.getModel("StatusPed").refresh();

				that._ItemDialog.setBusy(false);

			}).catch(function (error) {

				that.onMensagemErroODATA(error);
				that._ItemDialog.setBusy(false);
			});
		},

		onNodePress: function (oEvent) {

			var oNode = oEvent.getParameters();
			var sPath = oNode.getBindingContext("StatusPed").getPath() + "/quickView";
			var oObject = oNode.getBindingContext("StatusPed").getObject().quickView;

			var oModel = new JSONModel(oObject);
			this.setModel(oModel, "modelMaisInfo");

			if (!this.oQuickView) {

				Fragment.load({

					name: "application.view.MaisInfo",
					type: "XML"

				}).then(function (oFragment) {

					this.oQuickView = oFragment;
					this.getView().addDependent(this.oQuickView);

					// this.oQuickView.bindElement(oObject);
					this.oQuickView.openBy(oNode);

				}.bind(this));

			} else {

				// this.oQuickView.bindElement(oObject);
				this.oQuickView.openBy(oNode);
			}

			// if (this._ItemDialogMaisInfo) {
			// 	this._ItemDialogMaisInfo.destroy(true);
			// }

			// if (!this._CreateMaterialFragment) {

			// 	this._ItemDialogMaisInfo = sap.ui.xmlfragment(
			// 		"application.view.MaisInfo",
			// 		this
			// 	);
			// 	this.getView().addDependent(this._ItemDialogMaisInfo);
			// }

			// this._ItemDialogMaisInfo.openBy(oNode);
		},

		onExit: function () {

			if (this.oQuickView) {
				this.oQuickView.destroy();
			}
		},

		onDialogEnvioDanfe: function () {

			var that = this;

			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			var Name1 = that.getModelGlobal("modelAux").getProperty("/NomeRepres").replaceAll(" ", "_");
			var Docnum = that.getModel("modelParamDialog").getProperty("/Docnum");
			var Nfenum = that.getModel("modelParamDialog").getProperty("/Nfenum");
			var Series = that.getModel("modelParamDialog").getProperty("/Series");
			var Boleto = that.getModel("modelParamDialog").getProperty("/Boleto");
			var Nfe = that.getModel("modelParamDialog").getProperty("/Nfe");
			var Email = that.getModelGlobal("modelAux").getProperty("/Email");

			sap.ui.getCore().byId("idDialogEmail").setBusy(true);

			that.oModel.read("/P_EnviaEmailDanfe(IvUsuario='" + repres +
				"',IvDocnum='" + Docnum +
				"',IvEmail='" + Email +
				"',IvBoleto=" + Boleto +
				",IvNfe=" + Nfe +
				",IvName1='" + Name1 + "')", {
				success: function (data) {

					if (Boleto == true && Nfe == true) {

						var msg = 'NF-e "' + Nfenum + "-" + Series + '" e o(os) boletos foram enviados para o e-mail: ';

					} else if (Boleto == true) {

						msg = 'Os boletos foram enviados para o e-mail: ';

					} else if (Nfe == true) {

						msg = 'NF-e "' + Nfenum + "-" + Series + '" foi enviada para o e-mail: ';
					}

					sap.ui.getCore().byId("idDialogEmail").setBusy(false);
					MessageBox.show(msg + Email, {
						icon: MessageBox.Icon.SUCCESS,
						title: "Envio de emails",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (oAction) {

							that.onDialogClose();
						}
					});
				},
				error: function (error) {

					sap.ui.getCore().byId("idDialogEmail").setBusy(false);
					that.onMensagemErroODATA(error);
				}
			});
		},

		onChangeRepres: function () {

			var that = this;

			new Promise(function (res1, rej1) {

				var parametros = that.getModel("modelParametros").getData();
				var VkorgIni = "";
				var VkorgFin = "";

				var Centros = that.getModel("modelCentros").getData();

				for(var i=0; i<Centros.length; i++){
					if(Centros[i].Werks == parametros.WerksIni){

						VkorgIni = Centros[i].Bukrs;
					}

					if(Centros[i].Werks == parametros.WerksFim){

						VkorgFin = Centros[i].Bukrs;
					}
				}

				that.onBuscarRedesClientesRange(parametros.LifnrIni, parametros.LifnrFim, VkorgIni, VkorgFin, res1, rej1, that);

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

			that.oModel.read("/P_RelNotasFiscais", {
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
						"' and SeriesIni eq '" + parametros.SeriesIni +
						"' and SeriesFim eq '" + parametros.SeriesFim +
						"' and NfenumIni eq '" + parametros.NfenumIni +
						"' and NfenumFim eq '" + parametros.NfenumFim +
						"' and RepreIni eq '" + parametros.LifnrIni +
						"' and RepreFim eq '" + parametros.LifnrFim +
						"' and PerioIni eq '" + PerioIni +
						"' and PerioFim eq '" + PerioFim + "'"
				},
				success: function (retorno) {

					that.vetorNotasFiscais = [];
					that.vetorResumoEmpresa = [];

					that.vetorNotasFiscais = retorno.results;

					that.getModel("modelNotasFiscais").setData(that.vetorNotasFiscais);

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

		onCriarModelStatus: function () {

			var omodelParametros = new JSONModel({
				"nodes": [{
					"id": "1",
					"lane": "0",
					"title": "Emissão da NF",
					"titleAbbreviation": "NF",
					"children": [10],
					"state": "Negative",
					"stateText": "-",
					"focused": true,
					"texts": null
				}, {
					"id": "10",
					"lane": "1",
					"title": "Em contratação de frete",
					"titleAbbreviation": "CONT FRETE",
					"children": [20],
					"state": null,
					"stateText": "-",
					"focused": false,
					"texts": null
				}, {
					"id": "20",
					"lane": "2",
					"title": "Mercadoria em separação",
					"titleAbbreviation": "MERC TRANS",
					"children": [30],
					"state": null,
					"stateText": "-",
					"focused": false,
					"texts": null
				}, {
					"id": "30",
					"lane": "3",
					"title": "Mercadoria saiu da fábrica",
					"titleAbbreviation": "MERC FÁBRIC",
					"children": [40],
					"state": null,
					"stateText": "-",
					"focused": false,
					"texts": null
				}, {
					"id": "40",
					"lane": "4",
					"title": "Transportadora de Redespacho",
					"titleAbbreviation": "MERC REDESP",
					"children": [50],
					"state": null,
					"stateText": "-",
					"focused": false,
					"texts": null
				}, {
					"id": "50",
					"lane": "5",
					"title": "Mercadoria entregue",
					"titleAbbreviation": "MERC ENTRG",
					"children": null,
					"state": null,
					"stateText": "-",
					"focused": false,
					"texts": null
				}],
				"lanes": [{
					"id": "0",
					"icon": "sap-icon://order-status",
					"label": "Emissão da NF",
					"position": 0
				}, {
					"id": "1",
					"icon": "sap-icon://lead",
					"label": "Em contratação de frete",
					"position": 1
				}, {
					"id": "2",
					"icon": "sap-icon://customer-and-supplier",
					"label": "Em separação de mercadoria",
					"position": 2
				}, {
					"id": "3",
					"icon": "sap-icon://offsite-work",
					"label": "Mercadoria saiu da fábrica",
					"position": 3
				}, {
					"id": "4",
					"icon": "sap-icon://shipping-status",
					"label": "Mercadoria em trânsito para entrega",
					"position": 4
				}, {
					"id": "5",
					"icon": "sap-icon://task",
					"label": "Mercadoria entregue",
					"position": 5
				}, {
					"id": "6",
					"icon": "sap-icon://warning",
					"label": "Ocorrência",
					"position": 6
				}]
			});
			this.setModel(omodelParametros, "modelStatusPedido");

		}
	});
});