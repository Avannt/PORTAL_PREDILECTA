/*eslint-disable no-console, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"application/model/formatter",
	"sap/ui/model/odata/v2/ODataModel"

], function (BaseController, JSONModel, MessageBox, formatter, ODataModel) {
	"use strict";

	return BaseController.extend("application.controller.PedidoDetalheItens", {

		formatter: formatter,

		onInit: function () {

			this.getRouter().getRoute("PedidoDetalheItens").attachPatternMatched(this.onLoadFields, this);

		},

		onLoadFields: function () {

			var that = this;
			var CodRepres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			var Bukrs = that.getModelGlobal("modelPedido").getProperty("/Bukrs");

			that.getView().byId("IdItemPedido").setBusy(true);

			that.onInicializaCamposItens();
			
			new Promise(function(res, rej) {
				
				that.onBuscarProdutos(CodRepres, res, rej, that);
				
			}).then(function(data){
				
				var vetorProdutos = [];

				vetorProdutos = data.filter(function (a, b) {
					if (a.Vkorg == Bukrs) {
						delete a.__metadata;
						return a;
					}
				});

				var oModelProdutos = new JSONModel(vetorProdutos);
				that.setModel(oModelProdutos, "modelProdutos");
				that.getView().byId("IdItemPedido").setBusy(false);
				that.getView().byId("IdItemPedido").focus();
				
			}).catch(function(error){
				
				that.getView().byId("IdItemPedido").setBusy(false);
				that.onMensagemErroODATA(error);
			});
		},

		onInicializaCamposItens: function () {

			var that = this;

			that.oModel = this.getModelGlobal("modelAux").getProperty("/DBModel");

			this.ItemPedido = {
				IdItem: "",
				IndexItem: 0,
				NrPedido: "",
				Matnr: "",
				Maktx: "",
				Meins: "",
				ValPrecoInform: 0,
				ValPrecoInformAntigo: 0,
				ValPrecoUnit: 0,
				ValPrecoUnitSt: 0,
				ValPrecoUnitStFat: 0,
				ValorTotal: 0,
				ValPrecoOrig: 0,
				ValTotItemSt: 0,
				ValPrecoMin: 0,
				PrecoMinBase: 0,
				ValPrecoMax: 0,
				QtdPedida: 1,
				TotalDesc: 0,
				PercCanal: 0,
				PercCanalMax: 0,
				CondPercCanal: 0,
				PercCampFlex: 0,
				CondCampFlex: 0,
				PrecoSt: 0,
				CondPrecoSt: 0,
				PercPromo: 0,
				PercPromoMax: 0,
				CondPercPromoMax: 0,
				ValDescDisp: 0,
				ValLiqItem: 0,
				QtdUnFat: 0,
				ValVerbaItem: 0,
				VerbaOrig: 0,
				PathImg: "",
				PerSubTri: 0,
				CodCampanha: "",
				ValPctDescCamp: 0,
				QtdMultiplaCamp: 0,
				ValPctDescontoReduc: 0,
				ExcIncent: false,
				ExcVerba: false,
				PercComissao: 0,
				CondPercComissao: "",
				PercCustoFixo: 0,
				CondPercCustoFixo: "",
				PercCpmf: 0,
				CondPercCpmf: "",
				PercGanho: 0,
				CondPercGanho: "",
				PercIr: 0,
				CondPercIr: "",
				ValPrecoBase: 0,
				CondValPrecoBase: "",
				PercPromoRent: 0,
				CondPercPromoRent: "",
				AliquotaIcm: 0,
				CondAliquotaIcm: "",
				PercLucro: 0,
				ValLucro: 0,
				PercCofins: 0,
				CondPercCofins: "",
				PercPis: 0,
				CondPercPis: "",
				RentImg: "",
				PercRoyalties: 0,
				CondPercRoyalties: "",
				PercFrete: 0,
				CondPercFrete: "",
				Provg: "",
				ValCustoFixo: 0,
				ValFinsocial: 0,
				ValRoyalties: 0,
				ValIcmsIt: 0,
				ValPis: 0,
				ValFinSocial: 0,
				ValPromocao: 0,
				ValGanho: 0,
				ValCpmf: 0,
				ValIr: 0,
				ValComissao: 0,
				ValContrato: 0,
				ValFrete: 0,
				ValVerbaOrig: 0,
				ValPrecoTabela: 0,
				ValPrecoMinBase: 0,
				PctDescContrato: 0,
				Ntgew: 0,
				Mvgr1: 0,
				Mvgr2: 0,
				Mvgr3: 0,
				Mvgr4: 0,
				Mvgr5: 0,
				Mtpos: 0,
				VerbaRepres: 0,
				Draft: false
			};

			var modelItem = new JSONModel(this.ItemPedido);
			this.setModelGlobal(modelItem, "modelItem");

			var vars = {
				Editar: false
			};

			var model = new JSONModel(vars);
			this.setModel(model, "modelVar");

			that.getView().byId("IdItemPedido").setEnabled(true);
			
			setTimeout(function () {
				that.getView().byId("IdItemPedido").focus();	
			}, 500);
		},

		onSuggestProdutos: function (evt) {

			var sValue = evt.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.Contains, sValue), new sap.ui.model.Filter(
				"Maktx", sap.ui.model.FilterOperator.Contains, sValue)];

			var allFilters = new sap.ui.model.Filter(oFilter, false);

			aFilters.push(allFilters);
			this.byId("IdItemPedido").getBinding("suggestionItems").filter(aFilters);
			this.byId("IdItemPedido").suggest();
		},

		onItemChange: function () {

			var that = this;

			// toda vez que seleciona o item, seta 1 na quantidade.
			this.getModelGlobal("modelItem").setProperty("/QtdPedida", 1);

			var oParameters = {
				Matnr: this.getModelGlobal("modelItem").getProperty("/Matnr"),
				QtdPedida: this.getModelGlobal("modelItem").getProperty("/QtdPedida"),
				PercPromo: this.getModelGlobal("modelItem").getProperty("/PercPromo"),
				ValPrecoInform: this.getModelGlobal("modelItem").getProperty("/ValPrecoInform"),
				NrPedido: this.getModelGlobal("modelPedido").getProperty("/NrPedido"),
				Evento: "ChangeItem",
				Editar: String(this.getModel("modelVar").getProperty("/Editar"))
			};

			if (oParameters.Matnr != "") {

				if (oParameters.QtdPedida > 0) {

					that.byId("idItens").setBusy(true);

					that.onCallPrecoItem(oParameters);

					setTimeout(function () {
						that.getView().byId("idQuantidade").focus();
					}, 500);

				} else {

					MessageBox.show("A quantidade de itens deve ser maior que 0", {
						icon: MessageBox.Icon.WARNING,
						title: "Não Permitido",
						actions: [MessageBox.Action.OK],
						onClose: function () {

							that.getView().byId("idQuantidade").focus();
						}
					});
				}
			} else {

				that.onInicializaCamposItens();
				that.byId("IdItemPedido").suggest();
			}
		},

		onQuantidadeChange: function () {

			var that = this;

			var oParameters = {
				Matnr: this.getModelGlobal("modelItem").getProperty("/Matnr"),
				QtdPedida: this.getModelGlobal("modelItem").getProperty("/QtdPedida"),
				PercPromo: this.getModelGlobal("modelItem").getProperty("/PercPromo"),
				ValPrecoInform: this.getModelGlobal("modelItem").getProperty("/ValPrecoInform"),
				NrPedido: this.getModelGlobal("modelPedido").getProperty("/NrPedido"),
				Evento: "ChangeQuantidade",
				Editar: String(this.getModel("modelVar").getProperty("/Editar"))
			};

			if (oParameters.Matnr != "") {

				if (oParameters.QtdPedida > 0) {

					that.byId("idItens").setBusy(true);

					that.onCallPrecoItem(oParameters);

				} else {

					MessageBox.show("A quantidade de itens deve ser maior que 0", {
						icon: MessageBox.Icon.WARNING,
						title: "Não Permitido",
						actions: [MessageBox.Action.OK],
						onClose: function () {
							that.getView().byId("idQuantidade").focus();
							that.getModelGlobal("modelItem").setProperty("/QtdPedida", 1);
						}
					});
				}

			} else {

				this.byId("IdItemPedido").suggest();
			}
		},

		onPrecoVendaChange: function () {

			var that = this;

			var oParameters = {
				Matnr: this.getModelGlobal("modelItem").getProperty("/Matnr"),
				QtdPedida: this.getModelGlobal("modelItem").getProperty("/QtdPedida"),
				PercPromo: this.getModelGlobal("modelItem").getProperty("/PercPromo"),
				ValPrecoInform: this.getModelGlobal("modelItem").getProperty("/ValPrecoInform"),
				NrPedido: this.getModelGlobal("modelPedido").getProperty("/NrPedido"),
				Evento: "ChangePrecoVenda",
				Editar: String(this.getModel("modelVar").getProperty("/Editar"))
			};

			if (oParameters.Matnr != "") {

				if (oParameters.QtdPedida > 0) {

					that.byId("idItens").setBusy(true);

					that.onCallPrecoItem(oParameters);

				} else {

					MessageBox.show("A quantidade de itens deve ser maior que 0", {
						icon: MessageBox.Icon.WARNING,
						title: "Não Permitido",
						actions: [MessageBox.Action.OK],
						onClose: function () {
							that.getView().byId("idQuantidade").focus();
						}
					});
				}

			} else {

				this.byId("IdItemPedido").suggest();
			}
		},

		onPromocaoChange: function () {

			var that = this;

			var oParameters = {
				Matnr: this.getModelGlobal("modelItem").getProperty("/Matnr"),
				QtdPedida: this.getModelGlobal("modelItem").getProperty("/QtdPedida"),
				PercPromo: this.getModelGlobal("modelItem").getProperty("/PercPromo"),
				ValPrecoInform: this.getModelGlobal("modelItem").getProperty("/ValPrecoInform"),
				NrPedido: this.getModelGlobal("modelPedido").getProperty("/NrPedido"),
				Evento: "ChangePrecoVenda",
				Editar: String(this.getModel("modelVar").getProperty("/Editar"))
			};

			var Promocao = that.getModelGlobal("modelItem").getProperty("/PercPromo");
			var MaxPromo = that.getModelGlobal("modelItem").getProperty("/PercPromoMax");

			if (Promocao == "" || Promocao < 0) {

				that.getModelGlobal("modelItem").setProperty("/PercPromo", 0);

			} else {

				if (Promocao > MaxPromo) {
					that.getModelGlobal("modelItem").setProperty("/PercPromo", MaxPromo);
				}

				that.onCallPrecoItem(oParameters);
			}
		},

		onCallPrecoItem: function (parameters) {

			var that = this;
			that.byId("idItens").setBusy(true);

			this.onFormatNumberItem(parameters);

			that.oModel.callFunction("/P_Get_PrecoItem", {
				method: "POST",
				urlParameters: parameters,
				success: function (oData, oResponse) {

					var Item = oData;

					if (Item.TipoErro == "E") {

						MessageBox.show(Item.MsgErro, {
							icon: MessageBox.Icon.WARNING,
							title: "Não Permitido",
							actions: [MessageBox.Action.OK],
							onClose: function () {
								that.byId("idItens").setBusy(false);
							}
						});

					} else {

						that.getModelGlobal("modelItem").setData(Item);
						that.byId("idItens").setBusy(false);
					}
				},
				error: function (oError) {

					that.byId("idItens").setBusy(false);
					that.onMensagemErroODATA(oError);
				}
			});
		},

		onInserirItem: function () {

			var that = this;

			var oButtonSalvar = this.byId("idBtnAdd");

			that.byId("idItens").setBusy(true);
			var objItem = this.getModel("modelItem").getData();

			that.oModel.setUseBatch(false);
			that.oModel.refreshSecurityToken();

			delete objItem.__metadata;

			if (objItem.Matnr === "") {

				MessageBox.show("Selecione um produto.", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Falha ao inserir",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idItens").setBusy(false);
					}
				});

			} else if (objItem.QtdPedida === "" || objItem.QtdPedida <= 0) {

				sap.m.MessageBox.show("Digite uma quantidade acima de 0.", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Campo Inválido!",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idItens").setBusy(false);
						objItem.QtdPedida = 1;
					}
				});

			} else {

				oButtonSalvar.setEnabled(false);

				if (that.getModel("modelVar").getProperty("/Editar")) {
					objItem.Draft = true;
				}

				that.onFormatNumberItem(objItem);

				that.oModel.create("/P_ItensPedidoPR", objItem, {
					method: "POST",
					success: function (data) {

						var itensPed = that.getModelGlobal("modelItensPedidoGrid").getData();
						delete data.__metadata;

						if (that.getModel("modelVar").getProperty("/Editar")) {

							oButtonSalvar.setText("Inserir");
							that.getModel("modelVar").setProperty("/Editar", false);
							that.getView().byId("IdItemPedido").setEnabled(true);

							for (var i = 0; i < itensPed.length; i++) {
								if (itensPed[i].Matnr == data.Matnr) {

									itensPed[i] = data;
								}
							}

						} else {

							itensPed.push(data);
						}

						oButtonSalvar.setEnabled(true);
						that.byId("idItens").setBusy(false);
						that.onInicializaCamposItens();
						that.getModelGlobal("modelItensPedidoGrid").refresh();

					},
					error: function (error) {

						that.byId("idItens").setBusy(false);
						oButtonSalvar.setEnabled(true);
						that.onMensagemErroODATA(error);
					}
				});
			}
		},

		onEditarItemPress: function (oEvent) {

			var that = this;

			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var itemPedido = oItem.getBindingContext("modelItensPedidoGrid").getObject();

			this.getModelGlobal("modelItem").setData(itemPedido);
			this.getModel("modelVar").setProperty("/Editar", true);
			this.getView().byId("idBtnAdd").setText("Salvar");
			this.getView().byId("IdItemPedido").setEnabled(false);

			setTimeout(function () {
				that.getView().byId("idQuantidade").focus();
			}, 500);

		},
		
		onDeletarItem: function (oEvent) {

			var that = this;

			var list = oEvent.getParameter("listItem") || oEvent.getSource();
			var NrPedido = list.getBindingContext("modelItensPedidoGrid").getProperty("NrPedido");
			var Matnr = list.getBindingContext("modelItensPedidoGrid").getProperty("Matnr");
			var statusPedido = list.getBindingContext("modelItensPedidoGrid").getProperty("IdStatusPedido");

			if (statusPedido == 3) {

				var msg = "Não é possível deletar pedidos que já foram integrados!";

				MessageBox.error(msg, {
					icon: MessageBox.Icon.ERROR,
					title: "Deleção de pedido.",
					actions: [sap.m.MessageBox.Action.OK]
				});

			} else {

				MessageBox.show("Deseja mesmo excluir o Item " + Matnr + " ?", {
					icon: MessageBox.Icon.WARNING,
					title: "Exclusão de Pedidos",
					actions: [MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
					onClose: function (oAction) {

						if (oAction == sap.m.MessageBox.Action.YES) {
							
							
							that.byId("idItens").setBusy(true);

							new Promise(function (res, rej) {

								that.onDeletarItemPedido(res, rej, NrPedido, Matnr);

							}).then(function (data) {

								new Promise(function (res, rej) {
									
									that.onBuscarItensPedido(res,rej,NrPedido);

								}).then(function (dataItens) {
									
									that.vetorItensPedido = dataItens;
									that.getModelGlobal("modelItensPedidoGrid").setData(that.vetorItensPedido);

									that.byId("idItens").setBusy(false);
									that.onInicializaCamposItens();

								}).catch(function (error) {
									
									that.byId("idItens").setBusy(false);
									that.onMensagemErroODATA(error);
									
								});
							}).catch(function (error) {
									
								that.byId("idItens").setBusy(false);
								that.onMensagemErroODATA(error);
							});

							that.oModel.remove("/P_ItensPedidoD(IvNrPedido='" + NrPedido + "',IvMatnr='" + Matnr + "')", {
								success: function (result) {

									that.oModel.read("/P_ItensPedidoQ", {
										urlParameters: {
											"$filter": "IvNrPedido eq '" + NrPedido + "'"
										},
										success: function (dataItens) {

											

										},
										error: function (error) {
											that.byId("table_pedidos").setBusy(false);
											that.onMensagemErroODATA(error);
										}
									});
								},
								error: function (error) {
									console.log(error);
									that.onMensagemErroODATA(error);
								}
							});
						}
					}
				});
			}
		},

		onResetaTela: function () {

			var that = this;

			if (this.getModel("modelVar").getProperty("/Editar") == "true") {

				MessageBox.show("Deseja cancelar a Edição?", {
					icon: MessageBox.Icon.WARNING,
					title: "Edição de itens",
					actions: ["Confirmar", "Cancelar"],
					onClose: function () {

						that.getModel("modelVar").setProperty("/Editar", false);

						that.getView().byId("idBtnAdd").setText("Salvar");
						that.getView().byId("IdItemPedido").setEnabled(true);

						that.onInicializaCamposItens();
					}
				});

			} else {
				
				that.onInicializaCamposItens();
			}
		},

		onFocusQnt: function () {
			this.getView().byId("idPromocao").focus();
		},

		onFocusPromo: function () {
			this.getView().byId("idPrecoVenda").focus();
		}
	});
});