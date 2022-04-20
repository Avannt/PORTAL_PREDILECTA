/*eslint-disable no-console, no-alert */
/*eslint-disable no-console, sap-no-localstorage */

sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel"
], function (BaseController, Filter, FilterOperator, MessageBox, JSONModel, ODataModel) {
	"use strict";

	return BaseController.extend("application.controller.enviarPedidos", {

		onInit: function () {
			this.getRouter().getRoute("enviarPedidos").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {

			var that = this;

			that.oModel = that.getModel();
			var CodRepres = that.getModelGlobal("modelAux").getProperty("/CodRepres");

			that.byId("table_pedidos").setBusy(true);

			new Promise(function (resCentro, rejCentro) {

				that.onBuscarCentros(CodRepres, resCentro, rejCentro, that);

			}).then(function (DataCentro) {

				var oModelCentro = new JSONModel(DataCentro);
				that.setModel(oModelCentro, "Centros");

				new Promise(function (resC, rejC) {

					that.onBuscarClientes(CodRepres, resC, rejC, that);

				}).then(function (DataCliente) {

					var oModelClientes = new JSONModel(DataCliente);
					that.setModel(oModelClientes, "Clientes");

					that.byId("table_pedidos").setBusy(false);

					new Promise(function (res, rej) {

						var Cliente = "";
						var Envio = true;
						that.onBuscarPedidos(Cliente, CodRepres, Envio, res, rej, that);

					}).then(function (dataPedidos) {

						that.vetorPedidos = dataPedidos;
						var oModel = new JSONModel(that.vetorPedidos);
						
						var valorTotal = 0;
						for(var i=0; i<that.vetorPedidos.length; i++){
							valorTotal += parseFloat(that.vetorPedidos[i].ValorTotal);
						}
						
						that.getModelGlobal("modelAux").setProperty("/ValTotPedPend", valorTotal);
						that.setModel(oModel, "Pedidos");

						that.byId("table_pedidos").setBusy(false);

					}).catch(function (error) {

						that.byId("table_pedidos").setBusy(false);
						that.onMensagemErroODATA(error);
					});
				}).catch(function (error) {

					that.byId("table_pedidos").setBusy(false);
					that.onMensagemErroODATA(error);
				});
			}).catch(function (error) {

				that.byId("table_pedidos").setBusy(false);
				that.onMensagemErroODATA(error);
			});
		},

		myFormatterCodEmpresa: function (Value) {

			var vetorCentros = this.getModel("Centros").getData();

			for (var j = 0; j < vetorCentros.length; j++) {
				if (Value == vetorCentros[j].Bukrs) {
					return Value + "-" + vetorCentros[j].NomeCentro;
				}
			}
		},

		myFormatterCliente: function (Value) {

			var vetorClientes = this.getModel("Clientes").getData();

			for (var j = 0; j < vetorClientes.length; j++) {
				if (Value == vetorClientes[j].Kunnr) {
					return Value + "-" + vetorClientes[j].Name1;
				}
			}
		},

		onItemPressEF: function (oEvent) {

			var that = this;
			var oEvItemPressed = oEvent;
			var oBd = oEvItemPressed.getParameter("listItem") || oEvent.getSource();
			var sKunrg = oBd.getBindingContext("EntregasEnviar").getProperty("Kunrg");

			MessageBox.show("Deseja abrir o item selecionado?", {
				icon: MessageBox.Icon.WARNING,
				title: "Editar",
				actions: ["Sim", "Cancelar"],
				onClose: function (oAction) {

					if (oAction == "Sim") {

						/* Gravo no ModelAux a propriedade Kunrg (Cod cliente) para receber lá na tela de entrega futura e 
						selecionar o cliente automaticamente. */
						that.getOwnerComponent().getModel("modelAux").setProperty("/KunrgEntrega", sKunrg);
						sap.ui.core.UIComponent.getRouterFor(that).navTo("entregaFutura");
					}
				}
			});
		},

		onItemChange: function (oEvent) {

			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [
				new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Lifnr", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("NameOrg1", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("Nrpedcli", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("AprovadoDesc", sap.ui.model.FilterOperator.Contains, sValue)
			];

			var allFilters = new sap.ui.model.Filter(oFilter, false);
			aFilters.push(allFilters);
			this.byId("table_relatorio_pedidos").getBinding("items").filter(aFilters, sap.ui.model.FilterType.Application);

		},

		myFormatterDataImp: function (value) {

			if (value !== undefined && value !== null && value !== "" && value !== 0) {
				var data = value.split("-");

				var aux = data[0].split("/");
				var hora = data[1].split(":");
				// var aux2 = aux[2].substring(2, aux[2].length);
				// value = aux[0] + "/" + aux[1] + "/" + aux2;
				value = aux[0] + "/" + aux[1] + "-" + hora[0] + ":" + hora[1];
				return value;
			}
		},

		onItemPress: function (oEvent) {

			var that = this;
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var nrPedCli = oItem.getBindingContext("PedidosEnviar").getProperty("nrPedCli");
			var variavelCodigoCliente = oItem.getBindingContext("PedidosEnviar").getProperty("kunnr");
			that.getOwnerComponent().getModel("modelAux").setProperty("/Kunnr", variavelCodigoCliente);
			that.getOwnerComponent().getModel("modelAux").setProperty("/NrPedCli", nrPedCli);

			MessageBox.show("Deseja mesmo detalhar o Pedido? O pedido será reaberto.", {
				icon: MessageBox.Icon.WARNING,
				title: "Detalhamento Solicitado",
				actions: [MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
				onClose: function (oAction) {
					if (oAction == sap.m.MessageBox.Action.YES) {
						var open = indexedDB.open("VB_DataBase");

						open.onerror = function () {
							console.log("não foi possivel encontrar e/ou carregar a base de clientes");
						};

						open.onsuccess = function (e) {
							var db = e.target.result;

							var promise = new Promise(function (resolve, reject) {
								that.carregaModelCliente(db, resolve, reject);
							});

							promise.then(function () {
								/* Reabro o pedido */
								new Promise(function (resAP, rejAP) {
									var store1 = db.transaction("PrePedidos", "readwrite");
									var objPedido = store1.objectStore("PrePedidos");
									var req = objPedido.get(nrPedCli);

									req.onsuccess = function (ret) {
										var result = ret.target.result;
										var oPed = result;
										oPed.idStatusPedido = 1; // Em digitação
										oPed.situacaoPedido = "EM DIGITAÇÃO";

										store1 = db.transaction("PrePedidos", "readwrite");
										objPedido = store1.objectStore("PrePedidos");
										req = objPedido.put(oPed);

										req.onsuccess = function () {
											/* Pedido reaberto */
											resAP();
											console.log("O pedido foi reaberto.");
										};

										req.onerror = function () {
											/* Erro ao reabir pedido */
											rejAP("Erro ao reabrir pedido!");
											console.log("Erro ao abrir o Pedido > " + nrPedCli);
										};
									};
								}).then(function () {
									sap.ui.core.UIComponent.getRouterFor(that).navTo("pedidoDetalhe");
								});
							});
						};
					}
				}
			});
		},

		carregaModelCliente: function (db, resolve, reject) {
			var that = this;

			var codCliente = that.getOwnerComponent().getModel("modelAux").getProperty("/Kunnr");

			var tx = db.transaction("Clientes", "readwrite");
			var objUsuarios = tx.objectStore("Clientes");

			var request = objUsuarios.get(codCliente);

			request.onsuccess = function (e1) {

				var result = e1.target.result;

				if (result !== null && result !== undefined) {

					that.getOwnerComponent().getModel("modelCliente").setProperty("/Kunnr", result.kunnr);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Land1", result.land1);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Name1", result.name1);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Name2", result.name2);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Ort01", result.ort01);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Ort02", result.ort02);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Regio", result.regio);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Stras", result.stras);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Pstlz", result.pstlz);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Stcd1", result.stcd1);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Stcd2", result.stcd2);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Inco1", result.inco1);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Parvw", result.parvw);
					that.getOwnerComponent().getModel("modelCliente").setProperty("/Lifnr", result.lifnr);
					resolve();

				} else {

					console.log("ERRO!! Falha ao ler Clientes.");
					reject();
				}
			};
		},

		onSelectionChange: function (oEvent) {

			var that = this;
			var vetorPedEnviar = [];
			var oSelectedItems = this.byId("table_pedidos").getSelectedItems();

			for (var i = 0; i < oSelectedItems.length; i++) {

				var Pedido = oSelectedItems[i].getBindingContext("Pedidos").getObject();

				delete Pedido.__metadata;
				delete Pedido.IvEnvio;
				delete Pedido.IvUsuario;
				delete Pedido.IvKunnr;

				vetorPedEnviar.push(Pedido);
			}

			var oModel = new JSONModel(vetorPedEnviar);
			that.setModel(oModel, "PedidosEnviar");
		},

		onEnviarPedido: function (oEvent) {

			var that = this;
			var PedidosEnviar = that.getModel("PedidosEnviar").getData();
			var pedidosError = [];

			for (var i = 0; i < PedidosEnviar.length; i++) {
				if (PedidosEnviar[i].Usuario != that.getModelGlobal("modelAux").getProperty("/CodRepres")) {

					pedidosError.push({
						NrPedido: PedidosEnviar[i].NrPedido,
						Usuario: PedidosEnviar[i].Usuario
					});
				}
			}

			if (pedidosError.length > 0) {

				for (var i = 0; i < pedidosError.length; i++) {

					MessageBox.show("Não é possível realizar o envio do Pedido: " + pedidosError[i].NrPedido +
						".\n Usuario criação: " + pedidosError[i].Usuario + ". Usuário de Envio: " + that.getModelGlobal("modelAux").getProperty(
							"/CodRepres") + ".", {
							icon: MessageBox.Icon.ERROR,
							title: "Ação não permitida!",
							actions: [MessageBox.Action.OK],
							onClose: function (Action) {
								return;
							}
						});
				}

			} else if (PedidosEnviar.length == 0) {

				MessageBox.show("Selecione pelo menos um pedido para enviar!", {
					icon: MessageBox.Icon.ERROR,
					title: "Pedido não encontrado!!",
					actions: [MessageBox.Action.OK]
				});

			} else {

				MessageBox.show("Deseja enviar os itens selecionados?", {
					icon: MessageBox.Icon.WARNING,
					title: "Envio de itens",
					actions: ["Enviar", "Cancelar"],
					onClose: function (oAction) {

						if (oAction == "Enviar") {

							// var oModelPed = that.getModelGlobal("modelAux").getProperty("/DBModel");
							var Url = that.getModelGlobal("modelAux").getProperty("/Url");

							var oModelPed = new ODataModel({
								serviceUrl: Url,
								// userName: "t_rcardilo",
								// password: "sap123"
							});

							oModelPed.setUseBatch(true);
							oModelPed.refreshSecurityToken();

							that.byId("table_pedidos").setBusy(true);

							for (var j = 0; j < PedidosEnviar.length; j++) {

								var Pedido = PedidosEnviar[j];

								Pedido.IdStatusPedido = 3;
								Pedido.SituacaoPedido = "FIN";

								that.onFormatNumberPedido(Pedido);

								oModelPed.create("/P_PedidoPR", Pedido, {
									method: "POST",
									success: function (data) {

										console.info("Pedido " + data.NrPedido + " Inserido.");
									},
									error: function (error) {

										that.onMensagemErroODATA(error);
									}
								});
							}

							oModelPed.submitChanges();

							oModelPed.attachBatchRequestCompleted(function (oEvent) {

								that._onLoadFields();
							});
						}
					}
				});
			}
		},

		onDataAtualizacao: function () {
			var date = new Date();
			var dia = String(date.getDate());
			var mes = String(date.getMonth() + 1);
			var ano = String(date.getFullYear());
			var minuto = String(date.getMinutes());
			var hora = String(date.getHours());
			var seg = String(date.getSeconds());

			if (dia.length == 1) {
				dia = String("0" + dia);
			}
			if (mes.length == 1) {
				mes = String("0" + mes);
			}
			if (minuto.length == 1) {
				minuto = String("0" + minuto);
			}
			if (hora.length == 1) {
				hora = String("0" + hora);
			}
			if (seg.length == 1) {
				seg = String("0" + seg);
			}
			//HRIMP E DATIMP
			var data = String(dia + "/" + mes);
			var horario = String(hora) + ":" + String(minuto);

			return [data, horario];
		},

		onDeletarPedido: function (oEvent) {

			var that = this;
			
			var PedidosEnviar = that.getModel("PedidosEnviar").getData();
			var pedidosError = [];

			for (var i = 0; i < PedidosEnviar.length; i++) {
				if (PedidosEnviar[i].Usuario != that.getModelGlobal("modelAux").getProperty("/CodRepres")) {

					pedidosError.push({
						NrPedido: PedidosEnviar[i].NrPedido,
						Usuario: PedidosEnviar[i].Usuario
					});
				}
			}

			if (pedidosError.length > 0) {

				for (var i = 0; i < pedidosError.length; i++) {

					MessageBox.show("Não é possível realizar a exclusão do Pedido: " + pedidosError[i].NrPedido +
						".\n Usuario criação: " + pedidosError[i].Usuario + ". Usuário de Exclusão: " + that.getModelGlobal("modelAux").getProperty(
							"/CodRepres") + ".", {
							icon: MessageBox.Icon.ERROR,
							title: "Ação não permitida!",
							actions: [MessageBox.Action.OK],
							onClose: function (Action) {
								return;
							}
						});
				}

			} else if (PedidosEnviar.length == 0) {

				MessageBox.show("Selecione pelo menos um pedido para deletar!", {
					icon: MessageBox.Icon.ERROR,
					title: "Pedido não encontrado!!",
					actions: [MessageBox.Action.OK]
				});

			} else {

				MessageBox.show("Deseja deletar os itens selecionados?", {
					icon: MessageBox.Icon.WARNING,
					title: "Deleção de itens",
					actions: ["Deletar", "Cancelar"],
					onClose: function (oAction) {

						if (oAction == "Deletar") {

							var Url = that.getModelGlobal("modelAux").getProperty("/Url");

							var oModelPed = new ODataModel({
								serviceUrl: Url,
								// userName: "t_rcardilo",
								// password: "sap123"
							});

							oModelPed.setUseBatch(true);
							oModelPed.refreshSecurityToken();

							that.byId("table_pedidos").setBusy(true);

							for (var j = 0; j < PedidosEnviar.length; j++) {

								var Pedido = PedidosEnviar[j];
								
								oModelPed.remove("/P_PedidoD(IvNrPedido='" + Pedido.NrPedido + "')", {
									success: function (result) {
										
									},
									error: function (error) {
										that.onMensagemErroODATA(error);
									}
								});
							}

							oModelPed.submitChanges();

							oModelPed.attachBatchRequestCompleted(function (oEvent) {

								that._onLoadFields();
							});
						}

					}
				});
			}
		},

		onExcluirPedido: function (oEvent) {

			var that = this;
			var naoDeletar = false;

			var oList = oEvent.getParameter("listItem") || oEvent.getSource();
			var Ped = oList.getBindingContext("Pedidos").getObject();

			if (Ped.IdStatusPedido == 3) {

				var msg = "Não é possível deletar pedidos que já foram integrados!";

				MessageBox.error(msg, {
					icon: MessageBox.Icon.ERROR,
					title: "Deleção de pedido.",
					actions: [sap.m.MessageBox.Action.OK]
				});

			} else if (Ped.Usuario != that.getModelGlobal("modelAux").getProperty("/CodRepres")) {

				MessageBox.show("Não é possível realizar a edição. Usuario criação: " + Ped.Usuario + ", Usuario edição: " + that.getModelGlobal(
					"modelAux").getProperty("/CodRepres") + ".", {
					icon: MessageBox.Icon.ERROR,
					title: "Ação não permitida!",
					actions: [MessageBox.Action.OK]
				});

			} else {

				MessageBox.show("Deseja mesmo excluir os pedidos selecionados?", {
					icon: MessageBox.Icon.WARNING,
					title: "Exclusão de Pedidos",
					actions: [MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
					onClose: function (oAction) {

						if (oAction == sap.m.MessageBox.Action.YES) {

							that.byId("table_pedidos").setBusy(true);

							new Promise(function (res, rej) {

								that.onExcluirPed(Ped.NrPedido, res, rej);

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

		onMensagemErroODATA: function (codigoErro) {

			if (codigoErro == 0) {
				sap.m.MessageBox.show(
					"Verifique a conexão com a internet!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Falha na Conexão!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (oAction) {

						}
					}
				);
			} else if (codigoErro == 400) {
				sap.m.MessageBox.show(
					"Url mal formada! Contate a consultoria!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Erro no programa Fiori!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (oAction) {

						}
					}
				);
			} else if (codigoErro == 403) {
				sap.m.MessageBox.show(
					"Usuário sem autorização para executar a função (403)! Contate a consultoria!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Erro no programa Abap!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (oAction) {

						}
					}
				);
			} else if (codigoErro == 404) {
				sap.m.MessageBox.show(
					"Função não encontrada e/ou Parâmentros inválidos  (404)! Contate a consultoria!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Erro no programa Abap!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (oAction) {

						}
					}
				);
			} else if (codigoErro == 500) {
				sap.m.MessageBox.show(
					"Ocorreu um Erro (500)! Contate a consultoria!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Erro no programa Abap!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (oAction) {

						}
					}
				);
			} else if (codigoErro == 501) {
				sap.m.MessageBox.show(
					"Função não implementada (501)! Contate a consultoria!", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Erro no programa Abap!",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (oAction) {

						}
					}
				);
			}
		},
		/*FIM onMensagemErroODATA*/

		onVerificarAprovadorUsuario: function (p1res, p1rej) {
				var oModel = this.getOwnerComponent().getModel("modelAux").getProperty("/DBModel");
				var CodRepres = this.getOwnerComponent().getModel("modelAux").getProperty("/CodRepres");

				oModel.read("/FluxoAprovacao('" + CodRepres + "')", {
					success: function (retorno) {
						var bExisteAprovadores = retorno.ERetorno == "S";

						if (bExisteAprovadores) {
							p1res();
						} else {
							p1rej("Usuário atual não possui aprovadores cadastrados, favor entrar em contato com a administração do sistema.");
						}
					},
					error: function (error) {
						console.log(error);
						p1rej("Erro ao verificar aprovadores.");
					}
				});
			}
			/*FIM onVerificarAprovadorUsuario*/
	});
});