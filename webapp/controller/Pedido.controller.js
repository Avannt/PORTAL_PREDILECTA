/*eslint-disable no-console, no-alert */
sap.ui.define([
	"jquery.sap.global",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"application/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel"
], function (jQuery, MessageToast, Fragment, BaseController, Filter, FilterOperator, MessageBox, JSONModel) {
	"use strict";

	return BaseController.extend("application.controller.Pedido", {

		onInit: function () {
			this.getRouter().getRoute("pedido").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {

			var that = this;

			this.vetorClientes = [];
			this.oPrePedidos = [];
			this.oVetorTitulos = [];
			var CodRepres = this.getModelGlobal("modelAux").getProperty("/CodRepres");

			this.onInicializaModels();

			new Promise(function (res, rej) {

				that.onBuscarClientes(CodRepres, res, rej, that);

			}).then(function (dado) {

				var oModelClientes = new JSONModel(dado);
				that.setModel(oModelClientes, "Clientes");

				that.byId("master").setBusy(false);

			}).catch(function (error) {

				sap.m.MessageBox.show(
					"Falha ao carregar os clientes! (" + error.statusCode + ")", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Erro no carregamento!",
						details: error,
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (oAction) {

							that.byId("master").setBusy(false);
						}
					}
				);
			});
		},

		onEditarPress: function (oEvent) {

			var that = this;
			var oList = oEvent.getParameter("listItem") || oEvent.getSource();

			var Ped = oList.getBindingContext("Pedidos").getObject();

			if (Ped.IdStatusPedido == 3) {

				MessageBox.show("Não é possível realizar a edição de pedidos já integrados! ", {
					icon: MessageBox.Icon.ERROR,
					title: "Ação não permitida!",
					actions: [MessageBox.Action.OK]
				});

			} else if (Ped.IdStatusPedido == 2) {

				MessageBox.show("Deseja reabrir o pedido?", {
					icon: MessageBox.Icon.WARNING,
					title: "Detalhamento do pedido!",
					actions: ["Reabrir", "Visualizar", sap.m.MessageBox.Action.CANCEL],
					onClose: function (oAction) {

						/* Caso afirmativo, altero o status do pedido para 1 (Em digitação) (IdStatusPedido = 2)*/
						if (oAction == "Reabrir") {
							new Promise(function (res, rej) {

								that.byId("table_pedidos").setBusy(true);
								that.onBuscarPedido(Ped.NrPedido, res, rej, that);
								
							}).then(function (Pedido) {

								var data = that.onDataHora();

								Pedido.SituacaoPedido = "EM DIGITAÇÃO";
								Pedido.IdStatusPedido = 1;
								Pedido.DataFim = data[0];
								Pedido.HoraFim = data[1];
								Pedido.Completo = false;

								Pedido = that.onFormatNumberPedido(Pedido);

								delete Pedido.__metadata;

								new Promise(function (res, rej) {

									that.onInserirPedido(Pedido, res, rej, that);

								}).then(function (dataPed) {

									that.byId("table_pedidos").setBusy(false);
									that.getModelGlobal("modelAux").setProperty("/NrPedido", Pedido.NrPedido);

								}).catch(function (error) {

									that.byId("table_pedidos").setBusy(false);
									that.onMensagemErroODATA(error);
								});

							}).catch(function (error) {

								that.byId("table_pedidos").setBusy(false);
								that.onMensagemErroODATA(error);
							});

						} else if (oAction == "Visualizar") {

							/* Se o usuário escolher Vizualizar, levo o usuário direto para o pedido sem alterar o status */
							that.getModelGlobal("modelAux").setProperty("/NrPedido", Ped.NrPedido);
							sap.ui.core.UIComponent.getRouterFor(that).navTo("pedidoDetalhe");

						} else {

							that.getModelGlobal("modelAux").setProperty("/NrPedido", "");
						}
					}
				});
			} else {

				/* Se o usuário escolher Vizualizar, levo o usuário direto para o pedido sem alterar o status */
				that.getModelGlobal("modelAux").setProperty("/NrPedido", Ped.NrPedido);
				sap.ui.core.UIComponent.getRouterFor(that).navTo("pedidoDetalhe");
			}
		},

		onInicializaModels: function () {

			this.byId("master").setBusy(true);

			this.getModelGlobal("modelAux").setProperty("/NrPedCli", "");
			this.getModelGlobal("modelAux").setProperty("/Kunnr", "");

			this.oModel = this.getView().getModel();

			var dadoCliente = {
				Kunnr: "",
				Name1: "Nenhum cliente selecionado",
				Stcd1: "",
				Stcd2: ""
			};

			var oModelDadoCliente = new sap.ui.model.json.JSONModel(dadoCliente);
			this.setModel(oModelDadoCliente, "Cliente");
			this.setModelGlobal(oModelDadoCliente, "Cliente_G");

			var modelPedido = new JSONModel();
			this.setModel(modelPedido, "Pedidos");

			this.getModelGlobal("modelAux").setProperty("/NrPedido", "");
		},

		onNavBack: function () {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");
		},

		formatRentabilidade: function (Value) {
			if (Value == 0) {

				this.byId("table_pedidos").getColumns()[5].setVisible(false);
				return Value;
			} else if (Value > -3) {
				
				this.byId("table_pedidos").getColumns()[5].setVisible(false);
				return "";
			} else {
				
				this.byId("table_pedidos").getColumns()[5].setVisible(true);
				return Value;
			}
		},

		onAfterRendering: function () {
			
			var oSplitCont = this.getSplitContObj(),
				ref = oSplitCont.getDomRef() && oSplitCont.getDomRef().parentNode;
			// set all parent elements to 100% height, this should be done by app developer, but just in case
			if (ref && !ref._sapui5_heightFixed) {
				ref._sapui5_heightFixed = true;
				while (ref && ref !== document.documentElement) {
					var $ref = jQuery(ref);
					if ($ref.attr("data-sap-ui-root-content")) { // Shell as parent does this already
						break;
					}
					if (!ref.style.height) {
						ref.style.height = "100%";
					}
					ref = ref.parentNode;
				}
			}
		},

		getSplitContObj: function () {
			
			var result = this.byId("SplitCont");
			if (!result) {
				jQuery.sap.log.error("SplitApp object can't be found");
			}
			return result;
		},

		onPressNavToDetail: function () {
			this.getSplitContObj().to(this.createId("detailDetail"));
		},

		navBack2: function () {
			
			var isTablet = this.getOwnerComponent().getModel("modelAux").getProperty("/isTablet");

			if (isTablet == true) {

				sap.ui.core.UIComponent.getRouterFor(this).navTo("menu");

			} else {

				this.byId("listClientes").removeSelections(true);
				this.onPressDetailBack();
			}
		},

		onPressDetailBack: function () {
			this.getSplitContObj().backDetail();
		},

		onSelectionChange: function (oEvent) {

			var that = this;
			that.vetorPedidos = [];
			this.byId("table_pedidos").setBusy(true);

			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var Cliente = oItem.getBindingContext("Clientes").getObject();

			that.getModelGlobal("Cliente_G").setData(Cliente);
			this.getSplitContObj().toDetail(this.createId("detail"));

			this.oModel.read("/P_PedidoQ", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + this.getModelGlobal("modelAux").getProperty("/CodRepres") + "' and IvKunnr eq '" + Cliente.Kunnr +
						"'"
				},
				success: function (result) {

					that.vetorPedidos = result.results;

					var oModel = new JSONModel(that.vetorPedidos);
					that.getView().setModel(oModel, "Pedidos");

					that.byId("table_pedidos").setBusy(false);
				},
				error: function (error) {

					that.byId("table_pedidos").setBusy(false);
					that.onMensagemErroODATA(error);
				}
			});

			this.getSplitContObj().toDetail(this.createId("detail"));
		},

		onSearch: function (oEvent) {

			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [new sap.ui.model.Filter("kunnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("name1", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			//oEvent.getSource().getBinding("items").filter(aFilters, "Application");
			this.byId("listClientes").getBinding("items").filter(aFilters, "Application");
		},

		onAddPedido: function () {

			var Pedido = "";
			var that = this;

			var cliente = this.getModel("Cliente").getData();

			if (cliente.Kunnr == "") {

				MessageBox.show("Nenhum cliente selecionado! Selecione um cliente!", {
					icon: sap.m.MessageBox.Icon.WARNING,
					title: "Nenhum cliente selecionado",
					actions: [MessageBox.Action.OK]
				});

			} else {

				this.oModel.read("/P_CheckPedidoR(IvUsuario='" + this.getModelGlobal("modelAux").getProperty("/CodRepres") + "',IvKunnr='" +
					cliente.Kunnr + "')", {
						// urlParameters: {
						// 	"$filter": "IvUsuario eq '" + this.getModelGlobal("modelAux").getProperty("/CodRepres") + "'"
						// },
						success: function (result) {

							Pedido = result;

							if (Pedido.TipoErro == "E") {

								MessageBox.show("O Pedido: " + Pedido.NrPedido + ", Cliente: " + Pedido.Kunnr + " está em aberto.", {
									icon: MessageBox.Icon.ERROR,
									details: "<li> Curioso! </li>",
									title: "Pedido em aberto",
									actions: [MessageBox.Action.OK]
								});

							} else {

								if (Pedido.TipoErro == "S" && Pedido.MsgErro == "") {

									sap.ui.core.UIComponent.getRouterFor(that).navTo("pedidoDetalhe");
								} else {

									MessageBox.show(Pedido.MsgErro, {
										icon: sap.m.MessageBox.Icon.WARNING,
										title: "Títulos em Aberto!",
										actions: ["Ver Titulo", "Continuar", "Cancelar"],
										onClose: function (oAction) {
											
											if (oAction == "Ver Titulo") {

												that.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr");
												sap.ui.core.UIComponent.getRouterFor(that).navTo("relatorioTitulos");
											} else if (oAction == "Continuar") {

												sap.ui.core.UIComponent.getRouterFor(that).navTo("pedidoDetalhe");
											}
											// else {
											// 	that.getOwnerComponent().getModel("modelAux").setProperty("/telaPedido", true);
											// 	sap.ui.core.UIComponent.getRouterFor(that).navTo("relatorioTitulos");
											// }
										}
									});
								}
							}
						},
						error: function (error) {

							that.byId("table_pedidos").setBusy(false);
							that.onMensagemErroODATA(error);
						}
					});
			}
		},

		onItemPress: function (oEvent) {

			var that = this;
			var oNumeroPedido = oEvent.getParameter("listItem") || oEvent.getSource();
			var NrPedido = oNumeroPedido.getBindingContext("Pedidos").getProperty("NrPedido");

			that.getModelGlobal("modelAux").setProperty("/NrPedido", NrPedido);
			sap.ui.core.UIComponent.getRouterFor(that).navTo("pedidoDetalhe");
		},

		onExcluirPedido: function (oEvent) {

			var that = this;
			var naoDeletar = false;
			var oNumeroPedido = oEvent.getParameter("listItem") || oEvent.getSource();
			var NrPedido = oNumeroPedido.getBindingContext("Pedidos").getProperty("NrPedido");
			var Bukrs = oNumeroPedido.getBindingContext("Pedidos").getProperty("Bukrs");
			var statusPedido = oNumeroPedido.getBindingContext("Pedidos").getProperty("IdStatusPedido");

			if (statusPedido == 3) {

				var msg = "Não é possível deletar pedidos que já foram integrados!";

				MessageBox.error(msg, {
					icon: MessageBox.Icon.ERROR,
					title: "Deleção de pedido.",
					actions: [sap.m.MessageBox.Action.OK]
				});

			} else {

				MessageBox.show("Deseja mesmo excluir o pedido?", {
					icon: MessageBox.Icon.WARNING,
					title: "Exclusão de Pedidos",
					actions: [MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
					onClose: function (oAction) {

						if (oAction == sap.m.MessageBox.Action.YES) {

							that.byId("table_pedidos").setBusy(true);

							new Promise(function (res, rej) {

								that.onExcluirPed(NrPedido, res, rej);

							}).then(function () {

								var Cliente = that.getModelGlobal("Cliente_G").getData();
								var CodRepres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
								var Envio = false;

								new Promise(function (res, rej) {

									that.onBuscarPedidos(Cliente.Kunnr, CodRepres, Envio, res, rej, that);

								}).then(function (result) {

									that.vetorPedidos = result;

									var oModel = new JSONModel(that.vetorPedidos);
									that.getView().setModel(oModel, "Pedidos");

									that.byId("table_pedidos").setBusy(false);

								}).catch(function (error) {

									that.byId("table_pedidos").setBusy(false);
									that.onMensagemErroODATA(error);
								});
							}).catch(function (error) {

								that.byId("table_pedidos").setBusy(false);
								that.onMensagemErroODATA(error);
							});
						}
					}
				});
			}
		},

		handleLinkPress: function () {

			var cliente = this.getOwnerComponent().getModel("modelAux").getProperty("/CodCliente");
			this.getOwnerComponent().getModel("modelAux").setProperty("/telaPedido", true);
			sap.ui.core.UIComponent.getRouterFor(this).navTo("relatorioTitulos");
		}
	});
});