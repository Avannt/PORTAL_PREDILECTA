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

	return BaseController.extend("application.controller.cadastroRebaixa", {

		onInit: function () {
			this.getRouter().getRoute("cadastroRebaixa").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {

			var that = this;

			that.onInicializaModels();

			that.byId("idEmpresa").setBusy(true);

			new Promise(function (res, rej) {

				that.onBuscarCentros(that.CodRepres, res, rej, that);

			}).then(function (data) {

				that.byId("idEmpresa").setBusy(false);

				var oModelEmpresas = new JSONModel(data);
				that.setModel(oModelEmpresas, "modelEmpresas");

				setTimeout(function () {

					that.byId("idEmpresa").focus();
				}, 500);

			}).catch(function (error) {

				that.byId("idEmpresa").setBusy(false);
				that.onMensagemErroODATA(error);
			});
		},

		onInicializaModels: function () {

			var that = this;

			that.CodRepres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			var parametros = {
				Vkorg: "",
				Lifnr: "",
				Kunnr: "",
				Kvgr4: "",
				Mvgr1: "",
				Mvgr2: "",
				Mvgr3: "",
				Mvgr4: "",
				Mvgr5: "",
				Matnr: "",
				Usuario: "",
				PercCadastrar: "",
				PercCadastrado: ""
			};

			var omodelParametros = new JSONModel(parametros);
			that.setModel(omodelParametros, "modelParametros");

			var oModel = new JSONModel(that.vetorEmpresas);
			that.setModel(oModel, "modelEmpresas");
		},

		onChangeEmpresa: function () {

			var that = this;

			that.byId("idRepres").setBusy(true);
			var Bukrs = this.getModel("modelParametros").getProperty("/Bukrs");

			that.oModel.read("/P_BuscarRepresQ", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + that.CodRepres + "' and IvBukrs eq '" + Bukrs + "'"
				},
				success: function (result) {

					that.byId("idRepres").setBusy(false);

					var vetorRepres = result.results;
					if (vetorRepres.length == 0) {
						vetorRepres.push({
							Lifnr: "800001",
							Name1: "Ricardo Junior"
						});
					}

					var oModelRepres = new JSONModel(vetorRepres);
					that.setModel(oModelRepres, "modelRepres");

					setTimeout(function () {
						that.byId("idRepres").focus();
					}, 500);
				},
				error: function (error) {

					that.byId("idRepres").setBusy(false);
					that.onMensagemErroODATA(error);
				}
			});
		},

		onChangeRepres: function () {

			var that = this;
			var CodRepres = this.getModel("modelParametros").getProperty("/Lifnr");

			that.byId("idCliente").setBusy(true);

			new Promise(function (res, rej) {

				that.onBuscarClientes(CodRepres, res, rej, that);

			}).then(function (dado) {

				that.byId("idCliente").setBusy(false);

				var oModelClientes = new JSONModel(dado);
				that.setModel(oModelClientes, "modelClientes");

				var vetorRede = [];

				for (var i = 0; i < dado.length; i++) {

					var vAchouRede = false;

					for (var j = 0; j < vetorRede.length; j++) {

						if ((dado[i].Kvgr4 == vetorRede[j].Kvgr4) || dado[i].Kvgr4 == "") {
							vAchouRede = true;

							break;
						}
					}

					if (vAchouRede == false) {
						vetorRede.push(dado[i]);
					}
				}

				var oModelRede = new JSONModel(vetorRede);
				that.setModel(oModelRede, "modelRedes");

				setTimeout(function () {

					that.byId("idCliente").focus(false);
				}, 500);

				that.byId("idCategoria").setBusy(true);
				that.byId("idSubCategoria").setBusy(true);
				that.byId("idProdutos").setBusy(true);
				that.byId("idMarca").setBusy(true);
				that.byId("idGramatura").setBusy(true);
				that.byId("idFamilia").setBusy(true);
				that.byId("idProdutos").setBusy(true);

				new Promise(function (res, rej) {

					that.onBuscarProdutos(that.CodRepres, res, rej, that);

				}).then(function (data) {

					var vetorProdutos = [];

					var Bukrs = that.getModel("modelParametros").getProperty("/Bukrs");

					that.byId("idCategoria").setBusy(false);
					that.byId("idSubCategoria").setBusy(false);
					that.byId("idProdutos").setBusy(false);
					that.byId("idMarca").setBusy(false);
					that.byId("idGramatura").setBusy(false);
					that.byId("idFamilia").setBusy(false);
					that.byId("idProdutos").setBusy(false);

					vetorProdutos = data.filter(function (a, b) {
						if (a.Vkorg == Bukrs) {
							delete a.__metadata;
							return a;
						}
					});

					var vetorCategoria = [];
					var vetorSubCategoria = [];
					var vetorFamilia = [];
					var vetorGramatura = [];
					var vetorMarca = [];

					for (var i = 0; i < vetorProdutos.length; i++) {

						var vAchouCateg = false;
						var vAchouSubCateg = false;
						var vAchouFamilia = false;
						var vAchouGramatura = false;
						var vAchouMarca = false;

						for (var j = 0; j < vetorCategoria.length; j++) {

							if ((vetorProdutos[i].Mvgr1 == vetorCategoria[j].Mvgr1) || vetorProdutos[i].Mvgr1 == "") {
								vAchouCateg = true;

								break;
							}
						}

						for (var j = 0; j < vetorSubCategoria.length; j++) {

							if ((vetorProdutos[i].Mvgr2 == vetorSubCategoria[j].Mvgr2) || vetorProdutos[i].Mvgr2 == "") {
								vAchouSubCateg = true;

								break;
							}
						}

						for (var j = 0; j < vetorFamilia.length; j++) {

							if ((vetorProdutos[i].Mvgr3 == vetorFamilia[j].Mvgr3) || vetorProdutos[i].Mvgr3 == "") {
								vAchouFamilia = true;

								break;
							}
						}
						for (var j = 0; j < vetorGramatura.length; j++) {

							if ((vetorProdutos[i].Mvgr4 == vetorGramatura[j].Mvgr4) || vetorProdutos[i].Mvgr4 == "") {
								vAchouGramatura = true;

								break;
							}
						}
						for (var j = 0; j < vetorMarca.length; j++) {

							if ((vetorProdutos[i].Mvgr5 == vetorMarca[j].Mvgr5) || vetorProdutos[i].Mvgr5 == "") {
								vAchouMarca = true;

								break;
							}
						}

						if (vAchouCateg == false) {
							vetorCategoria.push(vetorProdutos[i]);
						}
						if (vAchouSubCateg == false) {
							vetorSubCategoria.push(vetorProdutos[i]);
						}
						if (vAchouFamilia == false) {
							vetorFamilia.push(vetorProdutos[i]);
						}
						if (vAchouGramatura == false) {
							vetorGramatura.push(vetorProdutos[i]);
						}
						if (vAchouMarca == false) {
							vetorMarca.push(vetorProdutos[i]);
						}
					}

					var oModel = new JSONModel(vetorProdutos);
					that.setModel(oModel, "modelProdutos");

					oModel = new JSONModel(vetorCategoria);
					that.setModel(oModel, "modelCategoria");

					oModel = new JSONModel(vetorSubCategoria);
					that.setModel(oModel, "modelSubCategoria");

					oModel = new JSONModel(vetorFamilia);
					that.setModel(oModel, "modelFamilia");

					oModel = new JSONModel(vetorGramatura);
					that.setModel(oModel, "modelGramatura");

					oModel = new JSONModel(vetorMarca);
					that.setModel(oModel, "modelMarca");

					that.getView().byId("idCategoria").focus();

				}).catch(function (error) {

					that.byId("idCategoria").setBusy(false);
					that.byId("idSubCategoria").setBusy(false);
					that.byId("idProdutos").setBusy(false);
					that.byId("idMarca").setBusy(false);
					that.byId("idGramatura").setBusy(false);
					that.byId("idFamilia").setBusy(false);
					that.byId("idProdutos").setBusy(false);

					that.onMensagemErroODATA(error);
				});

			}).catch(function (error) {

				that.byId("idCliente").setBusy(false);
				that.onMensagemErroODATA(error);
			});
		},

		onChangeRede: function () {

			this.byId("idCategoria").focus();
		},

		onChangeCategoria: function () {

			this.byId("idSubCategoria").focus();
		},

		onChangeSubCategoria: function () {

			this.byId("idFamilia").focus();
		},

		onChangeFamilia: function () {

			this.byId("idGramatura").focus();
		},

		onChangeGramatura: function () {

			this.byId("idMarca").focus();
		},

		onChangeMarca: function () {

			this.byId("idProdutos").focus();
		},

		onChangeCliente: function () {

			this.byId("idRede").focus();
		},

		onSuggestEmpresa: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("NomeEmpresa", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idEmpresa").getBinding("suggestionItems").filter(aFilters);
			this.byId("idEmpresa").suggest();
		},

		onSuggestMarca: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr5", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr5", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idMarca").getBinding("suggestionItems").filter(aFilters);
			this.byId("idMarca").suggest();
		},

		onSuggestGramatura: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr4", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr4", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idGramatura").getBinding("suggestionItems").filter(aFilters);
			this.byId("idGramatura").suggest();
		},

		onSuggestFamilia: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr3", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr3", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idFamilia").getBinding("suggestionItems").filter(aFilters);
			this.byId("idFamilia").suggest();
		},

		onSuggestCliente: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Name1", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idCliente").getBinding("suggestionItems").filter(aFilters);
			this.byId("idCliente").suggest();
		},

		onSuggestRede: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Kvgr4", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescKvgr4", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("idRede").getBinding("suggestionItems").filter(aFilters);

			this.byId("idRede").suggest();
		},

		onSuggestRepres: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Lifnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Name1", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);

			this.byId("idRepres").getBinding("suggestionItems").filter(aFilters);
			this.byId("idRepres").suggest();
		},

		onSuggestCategoria: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr1", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr1", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);

			this.byId("idCategoria").getBinding("suggestionItems").filter(aFilters);
			this.byId("idCategoria").suggest();
		},

		onSuggestSubCategoria: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Mvgr2", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("DescMvgr2", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);

			this.byId("idSubCategoria").getBinding("suggestionItems").filter(aFilters);
			this.byId("idSubCategoria").suggest();
		},

		onSuggestProdutos: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);

			this.byId("idProdutos").getBinding("suggestionItems").filter(aFilters);
			this.byId("idProdutos").suggest();
		},

		onBuscarDesconto: function () {

			var that = this;

			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			var aux = that.getModel("modelParametros").getData();

			var parametros = {
				Vkorg: aux.Bukrs,
				Lifnr: aux.Lifnr,
				Kunnr: aux.Kunnr,
				Kvgr4: aux.Kvgr4,
				Mvgr1: aux.Mvgr1,
				Mvgr2: aux.Mvgr2,
				Mvgr3: aux.Mvgr3,
				Mvgr4: aux.Mvgr4,
				Mvgr5: aux.Mvgr5,
				Matnr: aux.Matnr,
				Usuario: this.getModelGlobal("modelAux").getProperty("/CodRepres")
			};

			that.byId("master").setBusy(true);

			that.oModel.callFunction("/P_Get_PercRebaixa", {
				method: "POST",
				urlParameters: parametros,
				success: function (oData, oResponse) {

					var Item = oData;
					that.byId("master").setBusy(false);

					if (Item.TipoErro == "E") {

						MessageBox.show(Item.MsgErro, {
							icon: MessageBox.Icon.WARNING,
							title: "Não Permitido",
							actions: [MessageBox.Action.OK],
							onClose: function () {}
						});

					} else {

						that.getModel("modelParametros").setProperty("/PercCadastrado", oData.PercCadastrado);
					}
				},
				error: function (oError) {

					that.byId("master").setBusy(false);
					that.onMensagemErroODATA(oError);
				}
			});
		},

		onCadastrarDesconto: function () {

			var that = this;

			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");

			var aux = that.getModel("modelParametros").getData();

			if (aux.Bukrs == "" || aux.Bukrs == undefined) {

				MessageBox.show("Preencher a Empresa!", {
					icon: MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK],
					onClose: function () {
						that.byId("idEmpresa").focus();
					}
				});

			} else if (aux.Lifnr == "" || aux.Lifnr == undefined) {

				MessageBox.show("Preencher o Representante!", {
					icon: MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK],
					onClose: function () {
						that.byId("idRepres").focus();
					}
				});

			} else if ((aux.Kunnr != "" && aux.Kunnr != undefined) && (aux.Kvgr4 != "" && aux.Kvgr4 != undefined)) {

				MessageBox.show("Preencher apenas o Cliente ou a Rede, para realização do cadastro da condição!", {
					icon: MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.getModel("modelParametros").setProperty("/Kunnr", "");
						that.getModel("modelParametros").setProperty("/Kvgr4", "");
					}
				});

			} else if (aux.PercCadastrado < aux.PercCadastrar) {

				MessageBox.show("Valor máx permitido é de: " + aux.PercCadastrado + "%", {
					icon: MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK],
					onClose: function () {
						that.byId("idCliente").focus();
					}
				});

			} else if (aux.PercCadastrado == "" || aux.PercCadastrado == undefined) {

				MessageBox.show("Pesquise o valor já cadastrado antes de iniciar um novo cadastro!", {
					icon: MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK],
					onClose: function () {
						that.byId("idCliente").focus();
					}
				});

			} else {

				var parametros = {
					Vkorg: aux.Bukrs,
					Lifnr: aux.Lifnr,
					Kunnr: aux.Kunnr,
					Kvgr4: aux.Kvgr4,
					Mvgr1: aux.Mvgr1,
					Mvgr2: aux.Mvgr2,
					Mvgr3: aux.Mvgr3,
					Mvgr4: aux.Mvgr4,
					Mvgr5: aux.Mvgr5,
					Matnr: aux.Matnr,
					Usuario: this.getModelGlobal("modelAux").getProperty("/CodRepres"),
					PercCadastrado: aux.PercCadastrado,
					PercCadastrar: aux.PercCadastrar
				};

				that.byId("master").setBusy(true);

				that.oModel.callFunction("/P_Set_PercRebaixa", {
					method: "POST",
					urlParameters: parametros,
					success: function (oData, oResponse) {

						var Item = oData;
						that.byId("master").setBusy(false);

						if (Item.TipoErro == "E") {

							MessageBox.show(Item.MsgErro, {
								icon: MessageBox.Icon.WARNING,
								title: "Não Permitido",
								actions: [MessageBox.Action.OK],
								onClose: function () {}
							});
						} else {

							that.getModel("modelParametros").setProperty("/PercCadastrado", oData.Kbetr);
						}
					},
					error: function (oError) {

						that.byId("master").setBusy(false);
						that.onMensagemErroODATA(oError);
					}
				});
			}

		}
	});
});