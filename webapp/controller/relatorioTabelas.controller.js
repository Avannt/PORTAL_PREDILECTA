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
					that.vetorCentros = retorno.results;
					var oModelCentros = new JSONModel(that.vetorCentros);
					that.setModel(oModelCentros, "modelCentros");
				},
				error: function (error) {
					that.onMensagemErroODATA(error);
				}
			});

			that.oModel.read("/Vencimentos", {
				success: function (retorno) {
					that.vetorVencimentos = retorno.results;
					var oModelVencimentos = new JSONModel(that.vetorVencimentos);
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
				Exibicao: "CAIXA", //CAIXA ou UNIDADE
				Pltyp: "",
				Indice: 0,
				Contrato: "",
				Vencimento: "",
				Werks: "",
				Kunnr: "",
				Inco1: "",
				UFOrigem: "",
				UFDestino: "",
				Kvgr2: "",
				DescKvgr2: "",
				DescCentro: "",
				DescTabelaPreco: "",
				DescTipoFrete: "",
				NomeCliente: "",
				DescVencto: ""
			};

			var modelTela = new JSONModel(aux);
			this.setModelGlobal(modelTela, "modelTela");

			this.vetorFretes = [];
			this.vetorCentros = [];

			this.vetorCentro = {};
			this.vetorClientes = [];
			this.vetorTabPrecos = [];
			this.vetorContratos = [];
			this.vetorVencimentos = [];
			this.vetorUnidadeMedida = [];
			this.vetorEstabelecimento = [];

			var ComboExibicao = [];

			var modelCentros = new JSONModel(this.vetorCentros);
			this.setModel(modelCentros, "modelCentros");

			var modelCentro = new JSONModel(this.vetorCentro);
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
				idExibicao: "CAIXA",
				descricao: "Caixa"
			};

			var aux1 = {
				idExibicao: "UNIDADE",
				descricao: "Unidade"
			};

			ComboExibicao.push(aux);
			ComboExibicao.push(aux1);
			var oModel = new sap.ui.model.json.JSONModel(ComboExibicao);
			that.getOwnerComponent().setModel(oModel, "ComboExibicao");

		},

		onCarregarPrecos: function () {

			var that = this;
			
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
			that.getModelGlobal("modelTela").setProperty("/DescCentro", e.getSource().getSelectedItem().getText());
			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			for (var i = 0; i < this.vetorCentros.length; i++) {

				if (centro == this.vetorCentros[i].Werks) {

					this.getModelGlobal("modelCentro").setData(this.vetorCentros[i]);
					that.getModelGlobal("modelTela").setProperty("/UFOrigem", this.vetorCentros[i].Regio);
					break;
				}
			}

			new Promise(function (res, rej) {

				that.onBuscarClientes(repres, res, rej, that);

			}).then(function (retorno) {

				var vetorClientes = retorno;

				var oModelClientes = new JSONModel(vetorClientes);
				that.setModel(oModelClientes, "modelClientes");

				that.getModelGlobal("modelTela").setProperty("/CodRepres", repres);
				that.getModelGlobal("modelTela").setProperty("/Kunnr", "");
				that.getModelGlobal("modelTela").setProperty("/Vencimento", "");
				that.getModelGlobal("modelTela").setProperty("/Indice", 0);
				that.getModelGlobal("modelTela").setProperty("/Contrato", "");
				that.getModelGlobal("modelTela").setProperty("/Pltype", "");
				that.getModelGlobal("modelTela").setProperty("/UFDestino", "");
				that.getModelGlobal("modelTela").setProperty("/Kvgr2", "");
				that.getModelGlobal("modelTela").setProperty("/DescKvgr2", "");

				that.byId("idCliente").focus();

			}).catch(function (error) {

				that.onMensagemErroODATA(error);
			});

		},

		onChangeCliente: function (oEvent) {

			var that = this;
			
			new Promise(function (res, rej) {

				var Repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
				var Cliente = that.getModelGlobal("modelTela").getProperty("/Kunnr");
				
				that.oModel.read("/ClienteR(IvUsuario='" + Repres + "',IvCliente='" + Cliente + "')", {
					success: function (retorno) {

						that.vetorCliente = retorno;
						var oModelCliente = new JSONModel(that.vetorCliente);
						that.setModelGlobal(oModelCliente, "modelCliente");
						
						that.getModelGlobal("modelTela").setProperty("/NomeCliente", that.vetorCliente.Kunnr + " - " + that.vetorCliente.Name1);
						
						var oModelTbPreco = new JSONModel(that.vetorTabPrecos);
						that.setModel(oModelTbPreco, "modelTbPreco");

						var vAux = {
							Kunnr: retorno.Kunnr,
							Name1: retorno.Name1,
							Pltyp: retorno.Pltyp,
							Ptext: retorno.DescPltyp
						};

						that.vetorTabPrecos.push(vAux);

						that.getModel("modelTbPreco").setData(that.vetorTabPrecos);
						that.getModelGlobal("modelTela").setProperty("/Pltyp", that.vetorTabPrecos[0].Pltyp);
						that.getModelGlobal("modelTela").setProperty("/UFDestino", retorno.Regio);
						that.getModelGlobal("modelTela").setProperty("/Kvgr2", retorno.Kvgr2);
						that.getModelGlobal("modelTela").setProperty("/DescKvgr2", retorno.Kvgr2 + " - " + retorno.DescKvgr2);
						
						res();

					},
					error: function (error) {
						that.onMensagemErroODATA(error);
						 rej();
					}
				});

			}).then(function (data) {
				that.getModelGlobal("modelTela").setProperty("/DescTabelaPreco", that.byId("idTabelaPreco").getSelectedItem().getText());
				that.onBuscarContrato();
			}).catch(function (error) {

				that.onMensagemErroODATA(error);
			});
		},

		onBuscarContrato: function () {

			var that = this;

			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			
			that.getModelGlobal("modelTela").setProperty("/Vencto", "");
			that.getModelGlobal("modelTela").setProperty("/Indice", 0);
			
			that.vetorVencimentos = [];
			that.vetorContratos = [];
			
			that.oModel.read("/Vencimentos", {
				success: function (retorno) {
					that.vetorVencimentos = retorno.results;
					var oModelVencimentos = new JSONModel(that.vetorVencimentos);
					that.setModel(oModelVencimentos, "modelVencimentos");
				},
				error: function (error) {
					that.onMensagemErroODATA(error);
				}
			});

			that.oModel.read("/P_ContratoR(IvBukrs='" + that.getModelGlobal("modelCentro").getProperty("/Bukrs") + "',IvKvgr4='" + that.getModelGlobal(
				"modelCliente").getProperty("/Kvgr4") + "')", {

				success: function (result) {

					that.byId("idContrato").setBusy(false);
					that.byId("idVencimento").setBusy(false);

					var vetorVenc = that.getModel("modelVencimentos").getData();
					var vetorVencContrato = [];

					if (result.ContratoInterno != "") {

						var encontrou = "false";
						var indiceVec = 0;

						for (var j = 0; j < vetorVenc.length; j++) {

							if (vetorVenc[j].Zterm == result.Zterm) {
								encontrou = "true";

								if (String(result.AtlOrdem) == "true") {

									that.getModelGlobal("modelTela").setProperty("/Indice", result.IndiceContrato);
								} else {

									that.getModelGlobal("modelTela").setProperty("/Indice", vetorVenc[j].Kbetr);
								}

								break;
							}
						}

						if (encontrou == "false" && result.Zterm != "") {

							var aux = {
								Zterm: result.Zterm,
								IdVencimento: result.Zterm,
								DescCond: result.DescCond
							};

							vetorVencContrato.push(aux);
							that.getModel("modelVencimentos").setData(vetorVencContrato);

							if (String(result.AtlOrdem) == "true") {

								that.getModelGlobal("modelTela").setProperty("/Indice", result.IndiceContrato);
							} else {

								//Não possui vencimento cadastrado e vinculado para o representante.
								that.getModelGlobal("modelTela").setProperty("/Indice", 0);
							}
						}
						
						if (that.getModelGlobal("modelTela").getProperty("/Vencimento") == "") {

							that.byId("idVencimento").setEnabled(true);
							
						} else {

							that.byId("idVencimento").setEnabled(false);
						}

						that.getModelGlobal("modelTela").setProperty("/Vencimento", result.Zterm);
						// that.getModelGlobal("modelTela").setProperty("/Contrato", result.ContratoInterno);
						
						that.getModelGlobal("modelTela").setProperty("/DescVencto", that.byId("idVencimento").getSelectedItem().getText());
						that.byId("idVencimento").setEnabled(false);

					} else {

						// that.getModel("modelTela").setData(that.vetorVencimentos);
						that.byId("idVencimento").setEnabled(true);
					}

				},
				error: function (error) {

					that.onMensagemErroODATA(error);

				}
			});
		},
		
		onChangeTabelaPreco: function (e) {

			var that = this;
			
			that.getModelGlobal("modelTela").setProperty("/DescTabelaPreco", e.getSource().getSelectedItem().getText());
			
		},
		
		onChangeTipoFrete: function (e) {

			var that = this;
			
			that.getModelGlobal("modelTela").setProperty("/DescTipoFrete", e.getSource().getSelectedItem().getText());
			
		},

		onChangeVencimento: function (e) {

			var that = this;

			var selectedValue = e.getSource().getSelectedKey();
			
			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");
			that.getModelGlobal("modelTela").setProperty("/DescVencto", e.getSource().getSelectedItem().getText());

			for (var i = 0; i < this.vetorVencimentos.length; i++) {

				if (this.vetorVencimentos[i].Zterm == selectedValue) {
					that.getModelGlobal("modelTela").setProperty("/Indice", parseFloat(this.vetorVencimentos[i].Kbetr));
				}
			}
		},

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