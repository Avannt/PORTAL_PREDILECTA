/*eslint-disable no-console, no-alert */
/*eslint-disable eqeqeq, no-alert */
/*eslint-disable sap-no-hardcoded-url, no-alert */
/*eslint-disable no-shadow, no-alert */
/*eslint-disable consistent-return, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV",
	"sap/m/MessageBox"

], function (BaseController, JSONModel, MessageBox, Export, ExportTypeCSV) {
	"use strict";

	return BaseController.extend("application.controller.relatorioTabelas", {

		onInit: function () {

			//FORÇA FAZER O INIT DA PÁGINA .. MESMO QUE JÁ FOI INICIADA.
			this.getRouter().getRoute("relatorioTabelas").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {

			var that = this;
			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			this.onInicializarModels();

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
			
			that.oModel.read("/Vencimentos", {
				success: function (retorno) {
					var vetorVencimentos = retorno.results;
					var oModelVencimentos = new JSONModel(vetorVencimentos);
					that.setModel(oModelVencimentos, "modelVencimentos");
				},
				error: function (error) {
					that.onMensagemErroODATA(error);
				}
			});
			
			that.oModel.read("/Fretes", {
				success: function (retorno) {
					var vetorFretes = retorno.results;
					var oModelFretes = new JSONModel(vetorFretes);
					that.setModel(oModelFretes, "modelFretes");
				},
				error: function (error) {
					that.onMensagemErroODATA(error);
				}
			});
		},

		onInicializarModels: function () {

			var that = this;

			var aux = {
				Exibicao: "1", //Caixa = 1 / Unidade  = 2
				Pltyp: "",
				Indice: "",
				Contrato: "",
				Vencimento: "",
				Werks: "",
				Kunnr: "",
				Inco1: ""
			};

			var modelTela = new JSONModel(aux);
			this.setModelGlobal(modelTela, "modelTela");

			this.vetorFretes = [];
			this.vetorCentros = [];
			this.vetorClientes = [];
			this.vetorTabPrecos = [];
			this.vetorContratos = [];
			this.vetorVencimentos = [];
			this.vetorUnidadeMedida = [];
			this.vetorEstabelecimento = [];

			var ComboExibicao = [];

			var modelCentros = new JSONModel(this.vetorVencimentos);
			this.setModel(modelCentros, "modelCentros");

			var modelCentro = new JSONModel(this.vetorVencimentos);
			this.setModelGlobal(modelCentro, "modelCentro");

			var modelVenc = new JSONModel(this.vetorVencimentos);
			this.setModel(modelVenc, "modelVencimentos");

			var modelTabprecos = new JSONModel(that.vetorTabPrecos);
			that.setModel(modelTabprecos, "modelTabPrecos");

			var modelContratos = new JSONModel(that.vetorContratos);
			that.setModelGlobal(modelContratos, "modelContratos");

			var modelFretes = new JSONModel(that.vetorFretes);
			that.setModel(modelFretes, "modelFretes");

			var aux = {
				idExibicao: 1,
				descricao: "Caixa"
			};

			var aux1 = {
				idExibicao: 2,
				descricao: "Unidade"
			};

			ComboExibicao.push(aux);
			ComboExibicao.push(aux1);
			var oModel = new sap.ui.model.json.JSONModel(ComboExibicao);
			that.getOwnerComponent().setModel(oModel, "ComboExibicao");

		},

		onCarregarPrecos: function () {

			var that = this;
			
			sap.ui.core.UIComponent.getRouterFor(that).navTo("detalhesRelatorioTabelas");
			var parametros = this.getModelGlobal("modelTela").getData();

			if (parametros.Werks == "") {

				sap.m.MessageBox.show("Escolha o estabelecimento!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idEstabelecimento").focus();

					}
				});

			} else if (parametros.Kunnr == "") {

				sap.m.MessageBox.show("Preencher o cliente!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idCliente").focus();

					}
				});

			} else if (parametros.Pltyp == "") {

				sap.m.MessageBox.show("Preencher a tabela de preço!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTabelaPreco").focus();

					}
				});

			} else if (parametros.Vencimento == "") {

				sap.m.MessageBox.show("Preencher a data pagamento!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTabelaPreco").focus();

					}
				});

			} else if (parametros.Inco1 == "") {

				sap.m.MessageBox.show("Preencher o Tipo de Transporte!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTipoTransporte").focus();

					}
				});

			} else {

				sap.m.MessageBox.show("O tipo de frete escolhido é " + parametros.Inco1 + ". Deseja continuar?", {
					icon: sap.m.MessageBox.Icon.WARNING,
					title: "Confirmação de campo(s)",
					actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
					onClose: function (Action) {
						if (Action == MessageBox.Action.YES) {
							sap.ui.core.UIComponent.getRouterFor(that).navTo("detalhesRelatorioTabelas");
						}
					}
				});
			}
		},

		myFormatterDataVencimento: function (fValue) {

			if (fValue.length === 1) {
				fValue = "0" + fValue;
			}

		},

		onChangeEstabelecimento: function (e) {

			var that = this;
			var centro = e.getSource().getSelectedKey();
			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			for (var i = 0; i < this.vetorCentros.length; i++) {

				if (centro == this.vetorCentros[i].Werks) {

					this.getModelGlobal("modelCentro").setData(this.vetorCentros[i]);
				}
			}

			new Promise(function (res, rej) {

				that.onBuscarClientes(repres, res, rej, that);

			}).then(function (retorno) {

				var vetorClientes = retorno;

				var oModelClientes = new JSONModel(vetorClientes);
				that.setModel(oModelClientes, "modelClientes");

				that.getModelGlobal("modelTela").setProperty("/Kunnr", "");
				that.getModelGlobal("modelTela").setProperty("/Vencimento", "");
				that.getModelGlobal("modelTela").setProperty("/Indice", "");
				that.getModelGlobal("modelTela").setProperty("/Contrato", "");
				that.getModelGlobal("modelTela").setProperty("/Pltype", "");

				that.byId("idCliente").focus();

			}).catch(function (error) {

				that.onMensagemErroODATA(error);
			});

		},

		onChangeCliente: function (oEvent) {

			var that = this;

			var Cliente = this.getModelGlobal("modelTela").getProperty("/Kunnr");

			that.oModel.read("/TabPrecos", {
				success: function (retorno) {
					var vetorTabPrecos = retorno.results;
					var oModelTabPrecos = new JSONModel(vetorTabPrecos);
					that.setModel(oModelTabPrecos, "modelTabPrecos");
				},
				error: function (error) {
					that.onMensagemErroODATA(error);
				}
			});

			// open.onsuccess = function () {

			// 	var db = open.result;

			// 	var store = db.transaction("Clientes").objectStore("Clientes");

			// 	new Promise(function (resolve, reject) {

			// 		var req = store.get(Cliente);

			// 		req.onsuccess = function (e) {

			// 			var cliente = e.target.result;

			// 			var oModel = new JSONModel(cliente);
			// 			that.setModelGlobal(oModel, "modelCliente");

			// 			var trans = db.transaction("TabPrecos", "readwrite");
			// 			var objTabPreco = trans.objectStore("TabPrecos");
			// 			var request = objTabPreco.getAll();

			// 			request.onsuccess = function (event) {

			// 				that.vetorTabPrecos = [];

			// 				var tabPreco = event.target.result;

			// 				for (var i = 0; i < tabPreco.length; i++) {

			// 					if (tabPreco[i].Pltyp == that.getModelGlobal("modelCliente").getProperty("/Pltyp")) {
			// 						that.vetorTabPrecos.push(tabPreco[i]);
			// 					}
			// 				}

			// 				that.getModel("modelTabPrecos").setData(that.vetorTabPrecos);

			// 				if (that.vetorTabPrecos.length > 0) {
			// 					that.getModelGlobal("modelTela").setProperty("/Pltyp", that.vetorTabPrecos[0].Pltyp);
			// 				}

			// 				resolve();
			// 			};
			// 		};

			// 	}).then(function (resolve) {

			// 		that.onCarregarContrato(db);

			// 	});
			// };
		},

		onCarregarContrato: function (db) {

			var that = this;
			var chaveContrato = that.getModelGlobal("modelCentro").getProperty("/Bukrs") + "." + that.getModelGlobal("modelCliente").getProperty(
				"/Kvgr4");

			that.vetorContratos = [];

			// var trans = db.transaction("Contratos", "readwrite");
			// var objContrato = trans.objectStore("Contratos");
			// var indexContrato = objContrato.index("ChavePesq");

			// var requestContrato = indexContrato.getAll(chaveContrato);

			// requestContrato.onsuccess = function (event) {

			// 	that.vetorContratos = event.target.result;
			// 	that.getModelGlobal("modelContratos").setData(that.vetorContratos);

			// 	var vetorVenc = that.getModel("modelVencimentos").getData();

			// 	//Set default a forma de pagamento do contrato.
			// 	if (that.vetorContratos.length > 0) {

			// 		var encontrou = false;

			// 		for (var i = 0; i < vetorVenc.length; i++) {

			// 			if (that.vetorContratos[0].Zterm == vetorVenc[i].Zterm) {
			// 				encontrou = true;

			// 				if (that.vetorContratos[0].AtlOrdem == "true") {

			// 					that.getModelGlobal("modelTela").setProperty("/Indice", that.vetorContratos[0].IndiceContrato);

			// 				} else {

			// 					that.getModelGlobal("modelTela").setProperty("/Indice", vetorVenc[i].Kbetr);
			// 				}

			// 				break;
			// 			}
			// 		}

			// 		if (!encontrou) {

			// 			var aux = {
			// 				Zterm: that.vetorContratos[0].Zterm,
			// 				IdVencimento: that.vetorContratos[0].Zterm,
			// 				DescCond: that.vetorContratos[0].DescCond,
			// 				Contrato: true
			// 			};

			// 			vetorVenc.push(aux);
			// 			that.getModel("modelVencimentos").setData(vetorVenc);
			// 		}

			// 		var aux = that.vetorContratos.sort(
			// 			function (a, b) {

			// 				if (a.Compo === b.Compo) {

			// 					return a.Kunnr - b.Kunnr ? 1 : -1;
			// 				}
			// 				if (a.Compo === b.Compo && a.Kunnr == b.Kunnr) {

			// 					return a.Versg - b.Versg ? 1 : -1;
			// 				}
			// 				if (a.Compo === b.Compo && a.Kunnr == b.Kunnr && a.Versg == b.Versg) {

			// 					return a.Mvgr1 - b.Mvgr1 ? 1 : -1;
			// 				}
			// 				if (a.Compo === b.Compo && a.Kunnr == b.Kunnr && a.Versg == b.Versg && a.Mvgr1 == b.Mvgr1) {

			// 					return a.Mvgr5 - b.Mvgr5 ? 1 : -1;
			// 				}
			// 				if (a.Compo === b.Compo && a.Kunnr == b.Kunnr && a.Versg == b.Versg && a.Mvgr1 == b.Mvgr1 && a.Mvgr5 == b.Mvgr5) {

			// 					return a.Kvgr5 - b.Kvgr5 ? 1 : -1;
			// 				}

			// 				return a.Compo > b.Compo ? 1 : -1;
			// 			});

			// 		that.byId("idLabelContrato").setVisible(true);
			// 		that.byId("idContrato").setVisible(true);

			// 		that.getModelGlobal("modelTela").setProperty("/Vencimento", that.vetorContratos[0].Zterm);
			// 		that.getModelGlobal("modelTela").setProperty("/Contrato", that.vetorContratos[0].ContratoInterno);

			// 		if (that.getModel("modelTela").getProperty("/Vencimento") == "") {

			// 			that.byId("idVencimento").setEnabled(true);

			// 		} else {

			// 			that.byId("idVencimento").setEnabled(false);
			// 		}

			// 		that.byId("idContrato").setVisible(true);
			// 		that.byId("idLabelContrato").setVisible(true);

			// 	} else {

			// 		that.getModelGlobal("modelTela").setProperty("/Vencimento", "");
			// 		that.getModelGlobal("modelTela").setProperty("/Indice", "");
			// 		that.getModelGlobal("modelTela").setProperty("/Contrato", "");

			// 		that.byId("idContrato").setVisible(false);
			// 		that.byId("idLabelContrato").setVisible(false);
			// 		that.byId("idVencimento").setEnabled(true);

			// 	}
			// };
		},

		onChangeVencimento: function (e) {

			var that = this;

			var selectedValue = e.getSource().getSelectedKey();

			for (var i = 0; i < that.vetorVencimentos.length; i++) {

				if (that.vetorVencimentos[i].Zterm == selectedValue) {
					that.getModelGlobal("modelTela").setProperty("/Indice", parseFloat(that.vetorVencimentos[i].Kbetr));
				}
			}
		},

		// onDataExport: sap.m.Table.prototype.exportData || function (oEvent) {

		// 	this.vetorItensRelatorio = [];
		// 	var oModel = new JSONModel(this.vetorItensRelatorio);
		// 	this.getView().setModel(oModel);

		// 	var oExport = new sap.ui.core.util.Export({

		// 		// Type that will be used to generate the content. Own ExportType's can be created to support other formats
		// 		exportType: new sap.ui.core.util.ExportTypeCSV({
		// 			separatorChar: ";"
		// 		}),

		// 		// Pass in the model created above
		// 		models: oModel,
		// 		// binding information for the rows aggregation
		// 		rows: {
		// 			path: "/"
		// 		},

		// 		// column definitions with column name and binding info for the content

		// 		columns: [{
		// 			name: "Cod Cliente",
		// 			template: {
		// 				content: "{CodCliente}"
		// 			}
		// 		}, {
		// 			name: "Cod Estabel",
		// 			template: {
		// 				content: "{CodEstabel}"
		// 			}
		// 		}, {
		// 			name: "Nome Estabel",
		// 			template: {
		// 				content: "{NomEstabel}"
		// 			}
		// 		}, {
		// 			name: "Nº Tab Preço",
		// 			template: {
		// 				content: "{NrTabPreco}"
		// 			}
		// 		}, {
		// 			name: "Desc. Tabela",
		// 			template: {
		// 				content: "{DescTabela}"
		// 			}
		// 		}, {
		// 			name: "Juros",
		// 			template: {
		// 				content: "{ValSdoTitAcr}"
		// 			}
		// 		}]
		// 	});

		// 	// download exported file
		// 	oExport.saveFile().catch(function (oError) {
		// 		MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
		// 	}).then(function () {
		// 		oExport.destroy();
		// 	});
		// },

		_handleValueHelpSearch: function (oEvent) {

			var sValue = oEvent.getSource().getValue();

			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.StartsWith, sValue),
				new sap.ui.model.Filter("Name1", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);

			if (this.byId("idCliente").getBinding("suggestionItems") != undefined) {

				this.byId("idCliente").getBinding("suggestionItems").filter(aFilters);
				this.byId("idCliente").suggest();
			}
		}
	});
});