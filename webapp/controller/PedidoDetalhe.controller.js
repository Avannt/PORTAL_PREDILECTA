/*eslint-disable no-console, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"application/model/formatter"

], function (BaseController, JSONModel, MessageBox, formatter) {
	"use strict";

	return BaseController.extend("application.controller.PedidoDetalhe", {

		formatter: formatter,

		onInit: function () {

			this.getRouter().getRoute("pedidoDetalhe").attachPatternMatched(this.onLoadFields, this);

		},

		onLoadFields: function () {

			var that = this;
			var NrPedido = that.getModelGlobal("modelAux").getProperty("/NrPedido");

			new Promise(function (resolve, reject) {

				that.onInicializaCampos(resolve, reject);

			}).then(function () {

				if (NrPedido != "") {

					new Promise(function (res, rej) {

						that.byId("idPedidoDetalhe").setBusy(true);
						that.onBuscarPedido(NrPedido, res, rej, that);

					}).then(function (dataPed) {

						that.getModelGlobal("modelPedido").setData(dataPed);

						that.onCarregarTipoPedido(dataPed.Werks);
						that.onCarregarCombosMsgPedido(dataPed);

						that.byId("idPedidoDetalhe").setBusy(false);

						new Promise(function (res, rej) {

							that.byId("table_pedidos").setBusy(true);

							that.onBuscarItensPedido(res, rej, that.getModelGlobal("modelAux").getProperty("/NrPedido"));

						}).then(function (dataItens) {

							that.vetorItensPedido = dataItens;
							that.getModelGlobal("modelItensPedidoGrid").setData(that.vetorItensPedido);
							that.getModelGlobal("modelItensPedidoGrid").refresh();
							that.getModelGlobal("modelAux").setProperty("/ItensPedidoTab", that.vetorItensPedido.length);

							that.byId("table_pedidos").setBusy(false);
							that.onBloquearPedido(dataPed.IdStatusPedido);

						}).catch(function (error) {

							that.byId("table_pedidos").setBusy(false);
							that.onMensagemErroODATA(error);
						});

					}).catch(function (error) {

						that.byId("table_pedidos").setBusy(false);
						that.onMensagemErroODATA(error);
					});

				} else {

					that.onCriarNrPedido();
					that.onSetValuesDefault();
					that.onBloquearPedido(that.getModelGlobal("modelPedido").getProperty("IdStatusPedido"));

					that.byId("idPedidoDetalhe").setBusy(false);
				}
			});
		},

		onInicializaCampos: function (resolve, reject) {

			var that = this;

			that.oModel = this.getModelGlobal("modelAux").getProperty("/DBModel");
			that.CodRepres = this.getModelGlobal("modelAux").getProperty("/CodRepres");

			//remover o Bloqueio dos campos
			this.byId("idVencimento1").setEnabled(true);

			//Ocultar os campos iniciais
			// that.onOcultarCampos(false);

			that.vetorFretes = [];
			that.vetorCentros = [];
			that.vetorCampanha = [];
			that.vetorProdutos = [];
			that.vetorTabPrecos = [];
			that.vetorMsgPedido = [];
			that.vetorContratos = [];
			that.vetorMsgPedido2 = [];
			that.vetorMsgPedido3 = [];
			that.vetorTipoPedidos = [];
			that.vetorItensPedido = [];
			that.vetorMotivosNota = [];
			that.vetorVencimentos1 = [];
			that.vetorMotivosBoleto = [];
			that.vetorLocaisEntregas = [];
			that.vetorMotivosCampanha = [];
			that.vetorVencimentoTotal = [];
			that.vetorTipoPedidosTotal = [];

			that.getModelGlobal("modelAux").getProperty("/ObrigaSalvar", false);

			that.getModelGlobal("modelAux").getProperty("/ItensPedidoTab", 0);

			var modelCliente = that.getModelGlobal("Cliente_G");
			that.setModel(modelCliente, "modelCliente");

			console.log(modelCliente.getData());

			var modelContratos = new JSONModel(that.vetorContratos);
			that.setModel(modelContratos, "modelContratos");

			var modelVenc1 = new JSONModel(that.vetorVencimentos1);
			that.setModel(modelVenc1, "modelVencimentos1");

			var oModelCamp = new JSONModel(that.vetorCampanha);
			that.setModel(oModelCamp, "modelCampanha");

			// var modelVenc2 = new JSONModel(that.vetorVencimentos2);
			// that.setModel(modelVenc2, "modelVencimentos2");

			// var modelVenc3 = new JSONModel(that.vetorVencimentos3);
			// that.setModel(modelVenc3, "modelVencimentos3");

			var modelTabprecos = new JSONModel(that.vetorTabPrecos);
			that.setModel(modelTabprecos, "modelTabPrecos");

			var modelFretes = new JSONModel(that.vetorFretes);
			that.setModel(modelFretes, "modelFretes");

			var modelCentros = new JSONModel(that.vetorCentros);
			that.setModel(modelCentros, "modelCentros");

			var modelTipoPedidos = new JSONModel(that.vetorTipoPedidos);
			that.setModel(modelTipoPedidos, "modelTipoPedidos");

			var modelMsgPedido = new JSONModel(that.vetorMsgPedido);
			that.setModel(modelMsgPedido, "modelMsgPedido");

			var modelMsgPedido2 = new JSONModel(that.vetorMsgPedido2);
			that.setModel(modelMsgPedido2, "modelMsgPedido2");

			var modelMsgPedido3 = new JSONModel(that.vetorMsgPedido3);
			that.setModel(modelMsgPedido3, "modelMsgPedido3");

			var modelLocaisEntregas = new JSONModel(that.vetorLocaisEntregas);
			that.setModel(modelLocaisEntregas, "modelLocaisEntregas");

			var modelProdutos = new JSONModel(that.vetorProdutos);
			that.setModelGlobal(modelProdutos, "modelProdutos");

			var modelMotivosCamp = new JSONModel(that.vetorMotivosCampanha);
			that.setModelGlobal(modelMotivosCamp, "modelMotivosCamp");

			var modelMotivosNota = new JSONModel(that.vetorMotivosNota);
			that.setModelGlobal(modelMotivosNota, "modelMotivosNota");

			var modelMotivosBoleto = new JSONModel(that.vetorMotivosBoleto);
			that.setModelGlobal(modelMotivosBoleto, "modelMotivosBoleto");

			var modelItensPedidos = new JSONModel(that.vetorItensPedido);
			that.setModelGlobal(modelItensPedidos, "modelItensPedidoGrid");

			that.byId("idTopLevelIconTabBar").setSelectedKey("tab1");

			that.onCriarModelPedido();

			var vetorPromises = [];

			//Vencimentos
			vetorPromises.push(new Promise(function (res, rej) {

				that.oModel.read("/Vencimentos", {
					// urlParameters: {
					// 	"$filter": "IvUsuario eq '" + that.CodRepres + "'"
					// },
					success: function (result) {

						that.vetorVencimentoTotal = result.results;
						that.getModel("modelVencimentos1").setData(that.vetorVencimentoTotal);
						res();

					},
					error: function (error) {
						that.onMensagemErroODATA(error);
					}
				});

			}));

			//Tabela de Preço
			vetorPromises.push(new Promise(function (res, rej) {
				that.oModel.read("/TabPrecos", {
					// urlParameters: {
					// 	"$filter": "IvUsuario eq '" + that.CodRepres + "'"
					// },
					success: function (result) {

						for (var i = 0; i < result.results.length; i++) {

							if (result.results[i].Pltyp == that.getModel("modelCliente").getProperty("/Pltyp")) {

								that.vetorTabPrecos.push(result.results[i]);
							}
						}

						that.getModel("modelTabPrecos").setData(that.vetorTabPrecos);
						res();

					},
					error: function (error) {
						that.onMensagemErroODATA(error);
					}
				});
			}));
			vetorPromises.push(new Promise(function (res, rej) {
				//MsgPedido
				that.oModel.read("/MsgNF", {
					// urlParameters: {
					// 	"$filter": "IvUsuario eq '" + that.CodRepres + "'"
					// },
					success: function (result) {

						that.vetorMsgPedido = result.results;
						that.getModel("modelMsgPedido").setData(that.vetorMsgPedido);
						res();
					},
					error: function (error) {
						that.onMensagemErroODATA(error);
					}
				});
			}));

			vetorPromises.push(new Promise(function (res, rej) {
				//Locais Entregas
				that.oModel.read("/LocaisEntregas", {
					urlParameters: {
						"$filter": "IvUsuario eq '" + that.CodRepres + "'"
					},
					success: function (retornoEntregas) {

						var vetorEntregas = retornoEntregas.results;
						for (var i = 0; i < vetorEntregas.length; i++) {

							var auxLocais = vetorEntregas[i];

							if (auxLocais.Kunnr == that.getModel("modelCliente").getProperty("/Kunnr")) {

								that.vetorLocaisEntregas.push(auxLocais);
							}
						}

						that.getModel("modelLocaisEntregas").setData(that.vetorLocaisEntregas);
						res();

					},
					error: function (error) {
						that.onBusyDialogClosed();
						that.onMensagemErroODATA(error);
					}
				});
			}));

			vetorPromises.push(new Promise(function (res, rej) {
				//Tipo Frete
				that.oModel.read("/Fretes", {
					success: function (retorno) {

						that.vetorFretes = retorno.results;
						that.getModel("modelFretes").setData(that.vetorFretes);

						res();

					},
					error: function (error) {
						that.onBusyDialogClosed();
						that.onMensagemErroODATA(error);
					}
				});
			}));

			vetorPromises.push(new Promise(function (res, rej) {
				//Tipos Pedidos
				that.oModel.read("/TipoPedidos", {
					urlParameters: {
						"$filter": "IvUsuario eq '" + that.CodRepres + "'"
					},
					success: function (retorno) {

						var vetorTipoPedidos = retorno.results;

						for (var i = 0; i < vetorTipoPedidos.length; i++) {

							if (vetorTipoPedidos[i].Kunnr == that.getModel("modelCliente").getProperty("/Kunnr")) {
								that.vetorTipoPedidosTotal.push(vetorTipoPedidos[i]);
							}
						}

						res();
					},
					error: function (error) {
						that.onMensagemErroODATA(error);
					}
				});
			}));

			vetorPromises.push(new Promise(function (res, rej) {

				that.oModel.read("/Centros", {
					urlParameters: {
						"$filter": "IvUsuario eq '" + that.CodRepres + "'"
					},
					success: function (result) {

						that.vetorCentros = result.results;
						var oModelCentro = new JSONModel(that.vetorCentros);
						that.getView().setModel(oModelCentro, "modelCentros");

						res();
					},
					error: function (error) {

						rej();
						that.onMensagemErroODATA(error);
					}
				});
			}));

			vetorPromises.push(new Promise(function (resMotv, rejMotv) {

				that.vetorMotivosCampanha = [];
				that.vetorMotivosBoleto = [];
				that.vetorMotivosNota = [];

				that.oModel.read("/MotvCamp", {
					success: function (retornoMotvCamp) {

						var vetorMotvCamp = retornoMotvCamp.results;

						for (var i = 0; i < vetorMotvCamp.length; i++) {

							var aux = vetorMotvCamp[i];

							if (aux.TipoDesconto == "CAMP") {

								that.vetorMotivosCampanha.push(aux);

							} else if (aux.TipoDesconto == "BOL") {

								that.vetorMotivosBoleto.push(aux);

							} else if (aux.TipoDesconto == "NF") {

								that.vetorMotivosNota.push(aux);
							}
						}

						that.getModelGlobal("modelMotivosCamp").setData(that.vetorMotivosCampanha);
						that.getModelGlobal("modelMotivosBoleto").setData(that.vetorMotivosBoleto);
						that.getModelGlobal("modelMotivosNota").setData(that.vetorMotivosNota);

						resMotv();
					},
					error: function (error) {

						rejMotv();
						that.onMensagemErroODATA(error);
					}
				});

			}));

			vetorPromises.push(new Promise(function (restTipo, rejTipo) {

				var CodRepres = that.getModelGlobal("modelAux").getProperty("/CodRepres");

				that.oModel.read("/TipoIntegraBol", {
					urlParameters: {
						"$filter": "IvUsuario eq '" + CodRepres + "'"
					},
					success: function (retoroTipIntegraBol) {

						var vetorTipoIntegraBol = retoroTipIntegraBol.results;

						var Cliente = that.getModel("modelCliente").getProperty("/Kunnr");
						var Bukrs = that.getModel("modelPedido").getProperty("/Bukrs");
						var encontrou = "false";

						for (var j = 0; j < vetorTipoIntegraBol.length; j++) {

							if (Cliente == vetorTipoIntegraBol[j].Kunnr && Bukrs == vetorTipoIntegraBol[j].Bukrs) {
								encontrou = "true";
								break;
							}
						}

						if (encontrou == "true") {

							that.getModelGlobal("modelPedido").setProperty("/TipoIntegrBol", "CONTAS A RECEBER");

						} else {

							that.getModelGlobal("modelPedido").setProperty("/TipoIntegrBol", "CONTAS A PAGAR");
						}

						restTipo();

					},
					error: function (error) {

						rejTipo();
						that.onBusyDialogClosed();
						that.onMensagemErroODATA(error);
					}
				});
			}));

			Promise.all(vetorPromises).then(function (values) {

				that.getModelGlobal("modelPedido").setProperty("/EmailCliente", that.getModel("modelCliente").getProperty("/EmailComprador"));

				resolve();

			});
		},

		onValidaDataMenorAtual: function (data) {

			var dataSplit = data.split("/");

			var dataNova = this.onDataHora();

			var novaAtual = dataNova[2].ano + dataNova[2].mes + dataNova[2].dia;

			var dataEscolhida = String(dataSplit[2]) + String(dataSplit[1]) + String(dataSplit[0]);

			// var dataAntiga = new Date(dataSplit[2],dataSplit[1],dataSplit[0]);

			if (dataEscolhida >= novaAtual) {
				return "Data OK";

			} else {

				return "Data menor que data atual!";
			}
		},

		onCarregarCombosMsgPedido: function (Pedido) {

			var vetorMsgs = this.getModel("modelMsgPedido").getData();

			if (Pedido.MsgPedido1 != "" && Pedido.MsgPedido1 != "00000") {

				for (var i = 0; i < vetorMsgs.length; i++) {
					if (vetorMsgs[i].CodMensagem != Pedido.MsgPedido1) {
						this.vetorMsgPedido2.push(vetorMsgs[i]);
					}
				}

				this.getModel("modelMsgPedido2").setData(this.vetorMsgPedido2);
			}

			if (Pedido.MsgPedido2 != "00000" && Pedido.MsgPedido2 != "") {

				for (var i = 0; i < this.vetorMsgPedido2.length; i++) {
					if (this.vetorMsgPedido2[i].CodMensagem != Pedido.MsgPedido2) {
						this.vetorMsgPedido3.push(this.vetorMsgPedido2[i]);
					}
				}

				this.getModel("modelMsgPedido3").setData(this.vetorMsgPedido3);

			}

		},

		onSetValuesDefault: function () {

			var data = this.onDataHora();

			//Campos padrões do pedido
			this.getModelGlobal("modelPedido").setProperty("/SituacaoPedido", "EM DIGITAÇÃO");
			this.getModelGlobal("modelPedido").setProperty("/IdStatusPedido", 1);
			this.getModelGlobal("modelPedido").setProperty("/TipoDispositivo", "PORTALWEB");
			this.getModelGlobal("modelPedido").setProperty("/Lifnr", this.getModel("modelAux").getProperty("/Lifnr"));
			this.getModelGlobal("modelPedido").setProperty("/DataIni", data[0]);
			this.getModelGlobal("modelPedido").setProperty("/HoraIni", data[1]);
			this.getModelGlobal("modelPedido").setProperty("/DataFim", data[0]);
			this.getModelGlobal("modelPedido").setProperty("/HoraFim", data[1]);
			this.getModelGlobal("modelPedido").setProperty("/Kunnr", this.getModel("modelCliente").getProperty("/Kunnr"));
			this.getModelGlobal("modelPedido").setProperty("/Kvgr1", this.getModel("modelCliente").getProperty("/Kvgr1"));
			this.getModelGlobal("modelPedido").setProperty("/Kvgr2", this.getModel("modelCliente").getProperty("/Kvgr2"));
			this.getModelGlobal("modelPedido").setProperty("/Kvgr3", this.getModel("modelCliente").getProperty("/Kvgr3"));
			this.getModelGlobal("modelPedido").setProperty("/Kvgr4", this.getModel("modelCliente").getProperty("/Kvgr4"));
			this.getModelGlobal("modelPedido").setProperty("/Kvgr5", this.getModel("modelCliente").getProperty("/Kvgr5"));
			this.getModelGlobal("modelPedido").setProperty("/Bzirk", this.getModel("modelCliente").getProperty("/Bzirk"));
			this.getModelGlobal("modelPedido").setProperty("/Txjcd", this.getModel("modelCliente").getProperty("/Txjcd"));
			this.getModelGlobal("modelPedido").setProperty("/Pltyp", this.getModel("modelCliente").getProperty("/Pltyp"));
			this.getModelGlobal("modelPedido").setProperty("/EmailRepres", this.getModelGlobal("modelAux").getProperty("/Email"));
			this.getModel("modelPedido").setProperty("/Tdt", this.getModel("modelCliente").getProperty("/Tdt"));
			this.getModel("modelPedido").setProperty("/EmailCliente", this.getModel("modelCliente").getProperty("/EmailComprador"));

			if (this.getModel("modelCliente").getProperty("/Inco1") != "") {
				this.getModel("modelPedido").setProperty("/Inco1", this.getModel("modelCliente").getProperty("/Inco1"));
			}
		},

		onBloquearPedido: function (statusPedido) {

			var that = this;

			function campos(bloqueio, status, Itens) {

				that.byId("idEstabelecimento").setEnabled(bloqueio);
				that.byId("idTabelaPreco").setEnabled(bloqueio);

				if (that.getModelGlobal("modelPedido").getProperty("/Contrato") != "") {

					that.byId("idVencimento1").setEnabled(false);

				} else {

					that.byId("idVencimento1").setEnabled(bloqueio);
				}

				that.byId("idTipoPedido").setEnabled(bloqueio);
				that.byId("idLocalEntrega").setEnabled(bloqueio);
				that.byId("idTipoTransporte").setEnabled(bloqueio);
				that.byId("idEmailCliente").setEnabled(bloqueio);

				if (status == 3 || status == 2) {

					that.byId("idDataLimite").setEnabled(false);
					that.byId("idDataEntrega").setEnabled(false);
					that.byId("idMsg1").setEnabled(false);
					that.byId("idMsg2").setEnabled(false);
					that.byId("idMsg3").setEnabled(false);
					that.byId("idPedidoOrigem").setEnabled(false);
					that.byId("idObservacoes").setEnabled(false);

				} else {

					that.byId("idDataLimite").setEnabled(true);
					that.byId("idDataEntrega").setEnabled(true);
					that.byId("idMsg1").setEnabled(true);
					that.byId("idMsg2").setEnabled(true);
					that.byId("idMsg3").setEnabled(true);
					that.byId("idPedidoOrigem").setEnabled(true);
					that.byId("idObservacoes").setEnabled(true);

				}

				if (status != 1) {

					that.byId("idDescontoPedido").setEnabled(false);
					that.byId("idDescontoAplicar").setEnabled(false);
					that.byId("idDescontoAplicarBoleto").setEnabled(false);
					that.byId("idDescontoPedidoCamp").setEnabled(false);
					that.byId("idDescontoAplicarCamp").setEnabled(false);
					that.byId("idDescontoPedidoBoleto").setEnabled(false);

					that.byId("idDescontoPedidoCampBol").setEnabled(false);
					that.byId("idDescontoAplicarCampBol").setEnabled(false);

				} else {

					that.byId("idDescontoPedido").setEnabled(true);
					that.byId("idDescontoAplicar").setEnabled(true);
					that.byId("idDescontoAplicarBoleto").setEnabled(true);
					that.byId("idDescontoPedidoCamp").setEnabled(true);
					that.byId("idDescontoAplicarCamp").setEnabled(true);
					that.byId("idDescontoPedidoBoleto").setEnabled(true);

					that.byId("idDescontoPedidoCampBol").setEnabled(true);
					that.byId("idDescontoAplicarCampBol").setEnabled(true);
				}
			}

			function abas(bloqueio) {

				that.byId("tabTotalStep").setEnabled(bloqueio);
				that.byId("tabDescontoStep").setEnabled(bloqueio);
				that.byId("tabItensPedidoStep").setEnabled(bloqueio);
			}

			var itens = this.getModelGlobal("modelItensPedidoGrid").getData();

			if (itens.length > 0 && statusPedido == 1) {

				campos(false, statusPedido);
				abas(true);

			} else if (itens.length == 0) {

				campos(true, statusPedido);
				abas(false);

			} else if (statusPedido == 3 || statusPedido == 2) {

				campos(false, statusPedido);
				abas(true);
			}

		},

		onCriarNrPedido: function () {

			this.byId("idTopLevelIconTabBar").setSelectedKey("tab1");
			this.getModelGlobal("modelPedido").setProperty("/Completo", false);

			var CodRepres = this.getModelGlobal("modelAux").getProperty("/CodRepres");
			var dataAtual = this.onDataHora();

			var data = dataAtual[0].substring(0, 2) + dataAtual[0].substring(3, 5) + dataAtual[0].substring(6, 11);
			var horario = dataAtual[1].substring(0, 2) + dataAtual[1].substring(3, 5) + dataAtual[1].substring(6, 8);

			var numeroPed = CodRepres + "." + data + "." + horario;
			this.getModelGlobal("modelAux").setProperty("/NrPedido", numeroPed);
			this.getModelGlobal("modelPedido").setProperty("/NrPedido", numeroPed);

		},

		onLiberarItensPedido: function () {

			var that = this;

			var Pedido = that.getModelGlobal("modelPedido").getData();

			var validaDataLimite = that.onValidaDataMenorAtual(Pedido.DataLimite);
			var validaDataEntrega = that.onValidaDataMenorAtual(Pedido.DataEntrega);

			if (Pedido.StatusPedido == 3) {

				sap.m.MessageBox.show("O pedido " + Pedido.NrPedido + " não pode mais ser alterado", {
					icon: sap.m.MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK]
				});

			} else if (Pedido.Pltyp == "") {

				sap.m.MessageBox.show("Preencher a tabela de preço!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {
						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idTabelaPreco").focus();
						that.byId("idTabelaPreco").setValueState("Error");
					}
				});

			} else if (Pedido.Werks == "") {

				sap.m.MessageBox.show("Escolha o estabelecimento!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idEstabelecimento").focus();
						that.byId("idEstabelecimento").setValueState("Error");
					}
				});

			} else if (Pedido.Vencimento == "") {

				sap.m.MessageBox.show("Preencher a data pagamento!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idTabelaPreco").focus();
						that.byId("idVencimento1").setValueState("Error");

					}
				});

			} else if (Pedido.DataLimite == "") {

				sap.m.MessageBox.show("Preencher a data limite!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idDataLimite").focus();
						that.byId("idDataLimite").setValueState("Error");

					}
				});

			} else if (Pedido.TipoPedido == "") {

				sap.m.MessageBox.show("Preencher o tipo de pedido!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idTipoPedido").focus();
						that.byId("idTipoPedido").setValueState("Error");

					}
				});

			} else if (Pedido.DataEntrega == "") {

				sap.m.MessageBox.show("Preencher a Data de Entrega!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idDataEntrega").focus();
						that.byId("idDataEntrega").setValueState("Error");

					}
				});

			} else if (Pedido.LocalEntrega == "") {

				sap.m.MessageBox.show("Preencher a Local de Entrega!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idLocalEntrega").focus();
						that.byId("idLocalEntrega").setValueState("Error");
					}
				});

			} else if (Pedido.Inco1 == "") {

				sap.m.MessageBox.show("Preencher o Tipo de Transporte!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idTipoTransporte").focus();
						that.byId("idTipoTransporte").setValueState("Error");

					}
				});

			} else if (validaDataLimite != "Data OK") {

				sap.m.MessageBox.show("Data Limite é menor que data Atual!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Error campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idDataLimite").focus();
						that.byId("idDataLimite").setValueState("Error");

					}
				});

			} else if (validaDataEntrega != "Data OK") {

				sap.m.MessageBox.show("Data de Entrega é menor que data Atual!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idDataEntrega").focus();
						that.byId("idDataEntrega").setValueState("Error");

					}
				});

			} else if (Pedido.EmailCliente == "") {

				sap.m.MessageBox.show("Preencher o email do cliente!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idEmailCliente").focus();
						that.byId("idEmailCliente").setValueState("Error");

					}
				});

			} else if (Pedido.PedidoOrigem == "") {

				sap.m.MessageBox.show("Preencher o pedido origem cliente!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idPedidoOrigem").focus();
						that.byId("idPedidoOrigem").setValueState("Error");

					}
				});

			} else {

				sap.m.MessageBox.show("O tipo de frete escolhido é " + Pedido.Inco1 + ". Deseja continuar?", {
					icon: sap.m.MessageBox.Icon.WARNING,
					title: "Confirmação de campo(s)",
					actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
					onClose: function (Action) {

						if (Action == MessageBox.Action.YES) {

							that.onLimparValueState("None");

							Pedido.Completo = false;
							that.byId("idPedidoDetalhe").setBusy(true);

							Pedido = that.onFormatNumberPedido(Pedido);

							delete Pedido.__metadata;

							that.oModel.create("/P_PedidoPR", Pedido, {
								method: "POST",
								success: function (data) {

									MessageBox.show("Pedido: " + data.NrPedido + " Salvo!", {
										icon: MessageBox.Icon.SUCCESS,
										title: "Inclusão do Pedido!",
										actions: [MessageBox.Action.OK],
										onClose: function () {

											that.byId("idPedidoDetalhe").setBusy(false);
											that.onLiberarAbas();
										}
									});

								},
								error: function (error) {
									that.byId("table_pedidos").setBusy(false);
									that.onMensagemErroODATA(error);
								}
							});
						}
					}
				});
			}
		},

		onLimparValueState: function (value) {

			this.byId("idVencimento1").setValueState(value);
			this.byId("idEstabelecimento").setValueState(value);
			this.byId("idTabelaPreco").setValueState(value);
			this.byId("idDataLimite").setValueState(value);
			this.byId("idDataEntrega").setValueState(value);
			this.byId("idTipoPedido").setValueState(value);
			this.byId("idLocalEntrega").setValueState(value);
			this.byId("idTipoTransporte").setValueState(value);
			this.byId("idEmailCliente").setValueState(value);
			this.byId("idPedidoOrigem").setValueState(value);

		},

		onLiberarAbas: function (bloqueio) {

			this.byId("tabTotalStep").setEnabled(true);
			this.byId("tabDescontoStep").setEnabled(true);
			this.byId("tabItensPedidoStep").setEnabled(true);

			this.byId("idTopLevelIconTabBar").setSelectedKey("tab3");
			this.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", false);
		},

		onOcultarCampos: function (ocultar) {
			this.byId("idContrato").setVisible(ocultar);
		},

		onChangeMsg1: function (event) {

			this.vetorMsgPedido2 = [];

			var msg = event.getSource().getSelectedKey();

			var vetorMsgs = this.getModel("modelMsgPedido").getData();

			for (var i = 0; i < vetorMsgs.length; i++) {
				if (vetorMsgs[i].CodMensagem != msg) {
					this.vetorMsgPedido2.push(vetorMsgs[i]);
				}
			}

			this.getModel("modelMsgPedido2").setData(this.vetorMsgPedido2);
			this.getModelGlobal("modelPedido").setProperty("/MsgPedido2", "");
			this.getModelGlobal("modelPedido").setProperty("/MsgPedido3", "");

			this.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", true);
		},

		onChangeMsg2: function (event) {

			this.vetorMsgPedido3 = [];

			var msg = event.getSource().getSelectedKey();
			var vetorMsgs = this.getModel("modelMsgPedido2").getData();

			for (var i = 0; i < vetorMsgs.length; i++) {
				if (vetorMsgs[i].CodMensagem != msg) {
					this.vetorMsgPedido3.push(vetorMsgs[i]);
				}
			}

			this.getModel("modelMsgPedido3").setData(this.vetorMsgPedido3);
			this.getModelGlobal("modelPedido").setProperty("/MsgPedido3", "");

			this.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", true);
		},

		onChangeMsg3: function (event) {
			this.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", true);
		},

		onCriarModelPedido: function () {

			var data = this.onDataHora();
			var dataLimite = data[2].dia + "/" + data[2].mes + "/" + data[2].ano;

			var modelPedido = new JSONModel({
				NrPedido: "",
				Vencimento: "",
				IndiceFinal: "",
				Lifnr: "",
				DataIni: "",
				HoraIni: "",
				DataFim: "",
				HoraFim: "",
				IdStatusPedido: "",
				SituacaoPedido: "",
				Werks: "", //Centro
				Bukrs: "", //Empresa
				RegCentro: "", //Região Estabelecimento
				Pltyp: "", // Tab Preço
				Inco1: "", //Frete
				TipoPedido: "",
				Completo: false,
				Kunnr: "",
				RegCliente: "",
				DataLimite: dataLimite,
				DataEntregaSujerida: dataLimite,
				DataEntrega: "",
				LocalEntrega: "",
				MsgPedido1: "",
				MsgPedido2: "",
				MsgPedido3: "",
				EmailRepres: "",
				EmailCliente: "",
				EnviarEmailCliente: true,
				EnviarEmailRepres: true,
				ValorTotal: 0,
				TotalItens: 0,
				ValTotItemSt: 0,
				PesoBruto: 0,
				PesoLiq: 0,
				RentTotal: 0,
				RentTotalImg: "./img/N.png",
				ValMinPed: 0, //Dados do centro para os itens.
				PercAcresc: 0,
				PercCampFlex: 0,
				PercFator: 0,
				PercRentabNeg: 0,
				NrMesina: 0,
				PercIncent: 0,
				LogVerbaRentNeg: false,
				LogProposta: false,
				TotalVerba: 0,
				ObsPedido: "",
				PedidoOrigem: "",
				Contrato: "",
				TipoIntegrBol: "",
				MotivoDescNota: "",
				MotivoDescCamp: "",
				MotivoDescBoleto1: "",
				MotivoDescBoleto2: "",
				Gerencia: "",
				Supervisor: "",
				ValDescDisp: 0,
				ValDescAplicar: 0,
				ValDescAplicarBol: 0,
				ValDescCampInform: 0,
				ValDescCampInformBol: 0,
				ValDescCampDispBol: 0,
				ValDescCampDisp: 0,
				Vbeln: "",
				Email: "",
				// CheckIncentivo: "",
				Tdt: "",
				DataEnvio: "",
				HoraEnvio: "",
				LeadTime: 0
			});

			this.setModelGlobal(modelPedido, "modelPedido");

		},

		onChangeEstabelecimento: function (e) {

			var that = this;
			that.vetorTipoPedidos = [];
			that.vetorVencimentos = [];

			var centro = that.getModelGlobal("modelPedido").getProperty("/Werks");

			that.getModelGlobal("modelPedido").setProperty("/Vencimento", "");
			that.getModelGlobal("modelPedido").setProperty("/IndiceFinal", 0);
			that.getModelGlobal("modelPedido").setProperty("/Contrato", "");

			// that.byId("idContrato").setVisible(false);
			that.byId("idVencimento1").setEnabled(true);

			that.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", true);

			that.onCarregarTipoPedido(centro);

			for (var i = 0; i < that.vetorCentros.length; i++) {

				if (that.vetorCentros[i].Werks == centro) {

					that.getModelGlobal("modelPedido").setProperty("/Bukrs", that.vetorCentros[i].Bukrs);
					that.getModelGlobal("modelPedido").setProperty("/RegCentro", that.vetorCentros[i].Regio);

					// that.getModelGlobal("modelPedido").setProperty("/RegCliente", that.getModel("modelCliente").getProperty("/Regio"));
					var regCliente = that.getModel("modelCliente").getProperty("/Txjcd").substring(0, 3).trim();
					that.getModel("modelPedido").setProperty("/RegCliente", regCliente);

					that.getModelGlobal("modelPedido").setProperty("/ValMinPed", that.vetorCentros[i].ValMinPed);
					that.getModelGlobal("modelPedido").setProperty("/PercAcresc", that.vetorCentros[i].PercAcresc);
					// that.getModelGlobal("modelPedido").setProperty("/PercCampFlex", that.vetorCentros[i].PercCampFlex);
					that.getModelGlobal("modelPedido").setProperty("/NrMesina", that.vetorCentros[i].NrMesina);
					that.getModelGlobal("modelPedido").setProperty("/PercIncent", that.vetorCentros[i].PercIncent);
					that.getModelGlobal("modelPedido").setProperty("/PercFator", that.vetorCentros[i].PercFator);
					that.getModelGlobal("modelPedido").setProperty("/PercRentabNeg", that.vetorCentros[i].PercRentabNeg);
					that.getModelGlobal("modelPedido").setProperty("/LogVerbaRentNeg", that.vetorCentros[i].LogVerbaRentNeg);
					that.getModelGlobal("modelPedido").setProperty("/LogProposta", that.vetorCentros[i].LogProposta);
					that.getModelGlobal("modelPedido").setProperty("/Gerencia", that.vetorCentros[i].Gerencia);
					that.getModelGlobal("modelPedido").setProperty("/Supervisor", that.vetorCentros[i].Supervisor);
					break;

				}

				//Setar Local de entrega default
				if (this.getModel("modelLocaisEntregas").getData().length == 1) {
					this.getModel("modelPedido").setProperty("/LocalEntrega", (this.getModel("modelLocaisEntregas").getData()[0].Addrnumber));
				}

				//Setar Tipo pedido Default
				if (this.getModel("modelTipoPedidos").getData().length == 1) {
					this.getModel("modelPedido").setProperty("/TipoPedido", (this.getModel("modelTipoPedidos").getData()[0].TipoPedido));
				}

			}

			//Vencimentos
			new Promise(function (res, rej) {

				that.byId("idContrato").setBusy(true);
				that.byId("idVencimento1").setBusy(true);

				that.oModel.read("/P_ContratoR(IvBukrs='" + that.getModel("modelPedido").getProperty("/Bukrs") + "',IvKvgr4='" + that.getModel(
					"modelPedido").getProperty("/Kvgr4") + "')", {
					// urlParameters: {
					// 	"$filter": "IvKvgr4 eq '" + that.getModel("modelPedido").getProperty("/Kvgr4") + "' and IvBukrs eq '" + that.getModel("modelPedido").getProperty("/Bukrs") + "'"
					// },
					success: function (result) {

						// that.byId("idContrato").setVisible(false);
						// that.byId("idLabelContrato").setVisible(true);

						that.byId("idContrato").setBusy(false);
						that.byId("idVencimento1").setBusy(false);

						if (result.ContratoInterno != "") {

							// that.byId("idContrato").setVisible(true);
							// that.byId("idLabelContrato").setVisible(true);

							var vetorVenc = that.getModel("modelVencimentos1").getData();
							var encontrou = "false";

							for (var j = 0; j < vetorVenc.length; j++) {

								if (vetorVenc[j].Zterm == result.Zterm) {
									encontrou = true;

									if (result.AtlOrdem == true) {
										that.getModel("modelPedido").setProperty("/IndiceFinal", result.IndiceContrato);
									} else {
										that.getModel("modelPedido").setProperty("/IndiceFinal", vetorVenc[i].Kbetr);
									}

									break;
								}
							}

							if (encontrou == false) {

								var aux = {
									Zterm: result.Zterm,
									IdVencimento: result.Zterm,
									DescCond: result.DescCond
								};

								vetorVenc.push(aux);
								that.getModel("modelVencimentos1").setData(vetorVenc);
							}

							if (that.getModel("modelPedido").getProperty("/Vencimento") == "") {
								that.byId("idVencimento1").setEnabled(true);
							} else {
								that.byId("idVencimento1").setEnabled(false);
							}

							that.getModelGlobal("modelPedido").setProperty("/Vencimento", result.Zterm);
							that.getModelGlobal("modelPedido").setProperty("/Contrato", result.ContratoInterno);
						}

						res();

					},
					error: function (error) {

						that.onMensagemErroODATA(error);
						rej();

					}
				});

			}).then(function (data) {

				new Promise(function (resLead, rejLead) {

					that.byId("idDataEntregaSujerida").setBusy(true);

					var dataSujerida = "";
					var date = new Date();

					Date.prototype.addDays = function (days) {
						var dat = new Date(this.valueOf());
						dat.setDate(dat.getDate() + parseInt(days, 10));
						return dat.toLocaleDateString("pt-BR");
					};

					var IvTxjcd = that.getModelGlobal("modelPedido").getProperty("/Txjcd").replace(" ", "_");

					that.oModel.read("/P_LeadTimeR(IvBukrs='" + that.getModel("modelPedido").getProperty("/Bukrs") +
						"',IvRegCliente='" + that.getModelGlobal("modelPedido").getProperty("/RegCliente") +
						"',IvRegCentro='" + that.getModelGlobal("modelPedido").getProperty("/RegCentro") +
						"',IvTxjcd='" + IvTxjcd + "')", {
							// urlParameters: {
							// 	"$filter": "IvKvgr4 eq '" + that.getModel("modelPedido").getProperty("/Kvgr4") + "' and IvBukrs eq '" + that.getModel("modelPedido").getProperty("/Bukrs") + "'"
							// },
							success: function (result) {

								var LeadTime = result.Kbetr;

								that.getModel("modelPedido").setProperty("/LeadTime", LeadTime);

								dataSujerida = date.addDays(LeadTime);
								that.getModel("modelPedido").setProperty("/DataEntregaSujerida", dataSujerida);

								that.byId("idDataEntregaSujerida").setBusy(false);

								resLead();
							},
							error: function (error) {

								rejLead();
								that.onMensagemErroODATA(error);
							}
						});

				}).then(function (data) {

					var CodRepres = that.getModelGlobal("modelAux").getProperty("/CodRepres");

					that.oModel.read("/TipoIntegraBol", {
						urlParameters: {
							"$filter": "IvUsuario eq '" + CodRepres + "'"
						},
						success: function (retoroTipIntegraBol) {

							var vetorTipoIntegraBol = retoroTipIntegraBol.results;

							var Cliente = that.getModel("modelCliente").getProperty("/Kunnr");
							var Bukrs = that.getModel("modelPedido").getProperty("/Bukrs");
							var encontrou = "false";

							for (var j = 0; j < vetorTipoIntegraBol.length; j++) {

								if (Cliente == vetorTipoIntegraBol[j].Kunnr && Bukrs == vetorTipoIntegraBol[j].Bukrs) {
									encontrou = "true";
									break;
								}
							}

							if (encontrou == "true") {

								that.getModelGlobal("modelPedido").setProperty("/TipoIntegrBol", "CONTAS A RECEBER");

							} else {

								that.getModelGlobal("modelPedido").setProperty("/TipoIntegrBol", "CONTAS A PAGAR");
							}
						},
						error: function (error) {

							that.onBusyDialogClosed();
							that.onMensagemErroODATA(error);
						}
					});

				}).catch(function () {
					that.byId("idDataEntregaSujerida").setBusy(false);
				});

			}).catch(function () {

				that.byId("idContrato").setBusy(false);
				that.byId("idVencimento1").setBusy(false);

			});
		},

		onCarregarTipoPedido: function (centro) {

			this.vetorTipoPedidos = [];

			var aux = {
				TipoPedido: "Normal"
			};

			this.vetorTipoPedidos.push(aux);

			for (var i = 0; i < this.vetorTipoPedidosTotal.length; i++) {

				if (this.vetorTipoPedidosTotal[i].Werks == centro) {

					aux = {
						TipoPedido: "Proposta"
					};

					this.vetorTipoPedidos.push(aux);
				}
			}

			this.getModel("modelTipoPedidos").setData(this.vetorTipoPedidos);

		},

		onChangeVencimento1: function (oEvent) {

			var that = this;
			var selectedValue = oEvent.getSource().getSelectedKey();

			that.getModelGlobal("modelPedido").setProperty("/IndiceFinal", "");

			for (var i = 0; i < that.vetorVencimentoTotal.length; i++) {

				if (that.vetorVencimentoTotal[i].Zterm == selectedValue) {

					that.getModelGlobal("modelPedido").setProperty("/IndiceFinal", parseFloat(that.vetorVencimentoTotal[i].Kbetr));

				}
			}

			that.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", true);
		},

		onChangeDataEntrega: function (Event) {

			Date.prototype.addDays = function (days) {
				var dat = new Date(this.valueOf());
				dat.setDate(dat.getDate() + parseInt(days, 10));
				return dat.toLocaleDateString('pt-BR');
			};

			Date.prototype.remDays = function (days) {
				var dat = new Date(this.valueOf());
				dat.setDate(dat.getDate() - parseInt(days - 1, 10));
				return dat.toLocaleDateString('pt-BR');
			};

			this.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", true);

			var Pedido = this.getModelGlobal("modelPedido").getData();

			var DataEntrega = this.myFormatterDataRevert(Pedido.DataEntrega);
			var DataEntregaSujerida = this.myFormatterDataRevert(Pedido.DataEntregaSujerida);

			if (DataEntrega > DataEntregaSujerida) {

				var date = new Date(Date.UTC(DataEntrega[1].ano, DataEntrega[1].mes - 1, DataEntrega[1].dia));
				var dateDataLimite = date.remDays(Pedido.LeadTime);
				this.getModelGlobal("modelPedido").setProperty("/DataLimite", dateDataLimite);

			} else {

				var data = this.onDataHora();
				var dataLimite = data[2].dia + "/" + data[2].mes + "/" + data[2].ano;
				this.getModelGlobal("modelPedido").setProperty("/DataLimite", dataLimite);
			}
		},

		onBloqueiaPercEntrada: function (evt) {

			var percEntrada = evt.getSource();
			this.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", false);

			if (percEntrada.getValue() > 0) {
				this.byId("idPercEntrada").setEnabled(false);
				this.getModelGlobal("modelPedido").setProperty("/ValorEntradaPedido", parseFloat(percEntrada.getValue()));
			} else {
				this.byId("idPercEntrada").setEnabled(true);
			}
		},

		onChangeTipoNegociacao: function (evt) {

			var oSource = evt.getSource();
			this.getModelGlobal("modelPedido").setProperty("/TipoNegociacao", oSource.getSelectedKey());

			this.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", false);
		},

		onChangeTipoTransporte: function (evt) {

			this.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", false);
		},

		onChangeDataPedido: function () {

			this.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", false);
		},

		onResetarDadosPedido: function () {

			this.getModelGlobal("modelAux").setProperty("/NrPedido", "");
			this.getModelGlobal("modelAux").setProperty("/ItensPedidoTab", 0);
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
					title: "Deleção de itens do pedido.",
					actions: [sap.m.MessageBox.Action.OK]
				});

			} else if (statusPedido == 2) {

				msg = "Reabra o pedido para realizar alterações";

				MessageBox.error(msg, {
					icon: MessageBox.Icon.ERROR,
					title: "Deleção de itens do pedido.",
					actions: [sap.m.MessageBox.Action.OK]
				});

			} else {

				MessageBox.show("Deseja mesmo excluir o Item " + Matnr + " ?", {
					icon: MessageBox.Icon.WARNING,
					title: "Exclusão de Pedidos",
					actions: [MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
					onClose: function (oAction) {

						if (oAction == sap.m.MessageBox.Action.YES) {

							that.byId("table_pedidos").setBusy(true);

							new Promise(function (res, rej) {

								that.onDeletarItemPedido(res, rej, NrPedido, Matnr);

							}).then(function (data) {

								new Promise(function (res, rej) {

									that.onBuscarItensPedido(res, rej, NrPedido);

								}).then(function (dataItens) {

									that.vetorItensPedido = dataItens;
									that.getModelGlobal("modelItensPedidoGrid").setData(that.vetorItensPedido);
									that.getModelGlobal("modelItensPedidoGrid").refresh();

									if (that.vetorItensPedido.length == 0) {
										that.onBloquearCabecalho(true);
									}

									that.getModelGlobal("modelAux").setProperty("/ItensPedidoTab", that.vetorItensPedido.length);
									that.byId("table_pedidos").setBusy(false);

									new Promise(function (res, rej) {

										that.onBuscarPedido(NrPedido, res, rej, that);

									}).then(function (dataPed) {

										that.getModelGlobal("modelPedido").setData(dataPed);
										that.getModelGlobal("modelPedido").refresh();

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
						}
					}
				});
			}
		},

		onTablFilterEvent: function (evt) {
			var that = this;
			var item = evt.getParameters();
			var open = indexedDB.open("VB_DataBase");

			open.onerror = function () {
				MessageBox.show(open.error.mensage, {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});
			};

			open.onsuccess = function () {
				var db = open.result;
				var obrigadoSalvar = that.getModelGlobal("modelAux").getProperty("/ObrigaSalvar");

				if (obrigadoSalvar == false) {

					MessageBox.show("Salve o pedido !", {
						icon: MessageBox.Icon.ERROR,
						title: "Atenção!",
						actions: [MessageBox.Action.OK],
						onClose: function () {
							that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
							that.byId("idLiberarItens").focus();
						}
					});

				}
			};
		},

		onChangeAuditoriaObservacoes: function (evt) {
			this.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", false);
		},

		onChangeInfo: function (evt) {
			this.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", true);
		},

		onTabEvent: function (evt) {

			var that = this;
			var item = evt.getParameters();

			var obrigadoSalvar = that.getModelGlobal("modelAux").getProperty("/ObrigaSalvar");
			var Pedido = that.getModel("modelPedido").getData();

			if (Pedido.IdStatusPedido == 1) {

				if (item.selectedKey == "tab3" || item.selectedKey == "tab4" || item.selectedKey == "tab5") {

					if (Pedido.Pltyp == "") {

						sap.m.MessageBox.show("Preencher a tabela de preço!", {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: "Preecher campo(s)",
							actions: [MessageBox.Action.OK],
							onClose: function () {
								that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
								that.byId("idTabelaPreco").focus();
							}
						});

					} else if (Pedido.Werks == "") {

						sap.m.MessageBox.show("Escolha o estabelecimento!", {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: "Preecher campo(s)",
							actions: [MessageBox.Action.OK],
							onClose: function () {

								that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
								that.byId("idTabelaPreco").focus();
							}
						});

					} else if (Pedido.Vencimento == "") {

						sap.m.MessageBox.show("Preencher a data pagamento!", {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: "Preecher campo(s)",
							actions: [MessageBox.Action.OK],
							onClose: function () {

								that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
								that.byId("idTabelaPreco").focus();

							}
						});

					} else if (Pedido.DataLimite == "") {

						sap.m.MessageBox.show("Preencher a data limite!", {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: "Preecher campo(s)",
							actions: [MessageBox.Action.OK],
							onClose: function () {

								that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
								that.byId("idTabelaPreco").focus();

							}
						});

					} else if (Pedido.TipoPedido == "") {

						sap.m.MessageBox.show("Preencher o tipo de pedido!", {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: "Preecher campo(s)",
							actions: [MessageBox.Action.OK],
							onClose: function () {

								that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
								that.byId("idTabelaPreco").focus();

							}
						});

					} else if (Pedido.DataEntrega == "") {

						sap.m.MessageBox.show("Preencher a Data de Entrega!", {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: "Preecher campo(s)",
							actions: [MessageBox.Action.OK],
							onClose: function () {

								that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
								that.byId("idTabelaPreco").focus();

							}
						});

					} else if (Pedido.LocalEntrega == "") {

						sap.m.MessageBox.show("Preencher a Local de Entrega!", {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: "Preecher campo(s)",
							actions: [MessageBox.Action.OK],
							onClose: function () {

								that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
								that.byId("idTabelaPreco").focus();

							}
						});

					} else if (item.selectedKey == "tab3" || item.selectedKey == "tab4" || item.selectedKey == "tab5") {

						if (obrigadoSalvar == true) {

							sap.m.MessageBox.show("Salve o pedido !", {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Atenção!",
								actions: [MessageBox.Action.OK],
								onClose: function () {
									that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
								}
							});

						} else {

							that.getModelGlobal("modelAux").setProperty("/ItensPedidoTab", that.vetorItensPedido.length);
							that.onValidacoesCampanha();

						}
					}

				} else {

					//Validações na primeira e segunda aba

				}

			}
		},

		onValidacoesCampanha: function () {

			var pedido = this.getModel("modelPedido").getData();

			if (pedido.ValDescAplicarBol == "") {
				pedido.ValDescAplicarBol = 0;
			}

			if (pedido.ValDescAplicar == "") {
				pedido.ValDescAplicar = 0;
			}

			var ValDescDisp = pedido.ValDescDisp;
			var MotivoDescNota = pedido.MotivoDescNota;
			var ValDescAplicar = parseFloat(pedido.ValDescAplicar);
			var MotivoDescBoleto1 = pedido.MotivoDescBoleto1;
			var ValDescAplicarBol = parseFloat(pedido.ValDescAplicarBol);

			if ((ValDescAplicarBol + ValDescAplicar) > ValDescDisp) {

				this.byId("idTopLevelIconTabBar").setSelectedKey("tab4");
				this.byId("idDescontoAplicar").focus();

				this.byId("idDescontoAplicar").setValueState("Error");
				this.byId("idDescontoAplicarBoleto").setValueState("Error");

				this.byId("idDescontoAplicar").setValueStateText("A soma dos descontos é maior que o permitido de R$ " + ValDescDisp);
				this.byId("idDescontoAplicarBoleto").setValueStateText("A soma dos descontos é maior que o permitido de R$ " + ValDescDisp);

			} else {

				this.byId("idDescontoAplicar").setValueState("None");
				this.byId("idDescontoAplicarBoleto").setValueState("None");

				this.byId("idDescontoAplicar").setValueStateText("");
				this.byId("idDescontoAplicarBoleto").setValueStateText("");

				if ((ValDescAplicarBol > 0) && MotivoDescBoleto1 == "") {

					this.byId("idTopLevelIconTabBar").setSelectedKey("tab4");
					this.byId("idDescontoPedidoBoleto").focus();

					this.byId("idDescontoPedidoBoleto").setValueState("Error");
					this.byId("idDescontoPedidoBoleto").setValueStateText("Preencher o motivo de desconto!");
					return;

				} else {

					this.byId("idDescontoPedidoBoleto").setValueStateText("");
					this.byId("idDescontoPedidoBoleto").setValueState("None");

				}

				if ((ValDescAplicar > 0) && MotivoDescNota == "") {

					this.byId("idTopLevelIconTabBar").setSelectedKey("tab4");
					this.byId("idDescontoPedido").focus();

					this.byId("idDescontoPedido").setValueState("Error");
					this.byId("idDescontoPedido").setValueStateText("Preencher o motivo de desconto!");
					return;

				} else {

					this.byId("idDescontoPedido").setValueState("None");
					this.byId("idDescontoPedido").setValueStateText("");

					this.byId("idDescontoPedidoBoleto").setValueState("None");
					this.byId("idDescontoPedidoBoleto").setValueStateText("");
				}
			}

			if (pedido.ValDescCampInform == "") {
				pedido.ValDescCampInform = 0;
			}

			var ValDescCampDisp = pedido.ValDescCampDisp;
			var ValDescCampInform = pedido.ValDescCampInform;
			var MotivoDescCamp = pedido.MotivoDescCamp;

			if (ValDescCampInform > ValDescCampDisp) {

				this.byId("idTopLevelIconTabBar").setSelectedKey("tab4");
				this.byId("idDescontoAplicarCamp").focus();

				this.byId("idDescontoAplicarCamp").setValueState("Error");
				this.byId("idDescontoAplicarCamp").setValueStateText("A soma dos descontos é maior que o permitido de R$ " + ValDescCampDisp);
				return;

			} else {

				if ((ValDescCampInform > 0) && MotivoDescCamp == "") {

					this.byId("idTopLevelIconTabBar").setSelectedKey("tab4");
					this.byId("idDescontoPedidoCamp").focus();

					this.byId("idDescontoPedidoCamp").setValueState("Error");
					this.byId("idDescontoPedidoCamp").setValueStateText("Preencher o motivo de desconto!");
					return;

				} else {

					this.byId("idDescontoAplicarCamp").setValueState("None");
					this.byId("idDescontoAplicarCamp").setValueStateText("");

					this.byId("idDescontoPedidoCamp").setValueState("None");
					this.byId("idDescontoPedidoCamp").setValueStateText("");

				}
			}

			if (pedido.ValDescCampInformBol == "") {
				pedido.ValDescCampInformBol = 0;
			}
			var ValDescCampDispBol = pedido.ValDescCampDispBol;
			var ValDescCampInformBol = pedido.ValDescCampInformBol;
			var MotivoDescBoleto2 = pedido.MotivoDescBoleto2;

			if (ValDescCampInformBol > ValDescCampDispBol) {

				this.byId("idTopLevelIconTabBar").setSelectedKey("tab4");
				this.byId("idDescontoAplicarCampBol").focus();

				this.byId("idDescontoAplicarCampBol").setValueState("Error");
				this.byId("idDescontoAplicarCampBol").setValueStateText("A soma dos descontos é maior que o permitido de R$ " + ValDescCampDispBol);
				return;

			} else {

				if ((ValDescCampInformBol > 0) && MotivoDescBoleto2 == "") {

					this.byId("idTopLevelIconTabBar").setSelectedKey("tab4");
					this.byId("idDescontoPedidoCampBol").focus();

					this.byId("idDescontoPedidoCampBol").setValueState("Error");
					this.byId("idDescontoPedidoCampBol").setValueStateText("Preencher o motivo de desconto!");
					return;

				} else {

					this.byId("idDescontoPedidoCampBol").setValueStateText("");
					this.byId("idDescontoPedidoCampBol").setValueState("None");

					this.byId("idDescontoAplicarCampBol").setValueStateText("");
					this.byId("idDescontoAplicarCampBol").setValueState("None");

					console.log("Validações da Campanha estão OK!");
				}
			}
		},

		onBloquearCabecalho: function (bloqueio) {

			this.byId("idEstabelecimento").setEnabled(bloqueio);
			this.byId("idTabelaPreco").setEnabled(bloqueio);
			this.byId("idVencimento1").setEnabled(bloqueio);
			this.byId("idDataLimite").setEnabled(true);
			this.byId("idDataEntrega").setEnabled(bloqueio);
			this.byId("idTipoPedido").setEnabled(bloqueio);
			this.byId("idLocalEntrega").setEnabled(bloqueio);
			this.byId("idTipoTransporte").setEnabled(bloqueio);

			if (status == 2) {

				this.byId("idMsg1").setEnabled(bloqueio);
				this.byId("idMsg2").setEnabled(bloqueio);
				this.byId("idMsg3").setEnabled(bloqueio);
				this.byId("idPedidoOrigem").setEnabled(bloqueio);
				this.byId("idEmailCliente").setEnabled(bloqueio);
				this.byId("idObservacoes").setEnabled(bloqueio);

			} else {

				this.byId("idMsg1").setEnabled(true);
				this.byId("idMsg2").setEnabled(true);
				this.byId("idMsg3").setEnabled(true);
				this.byId("idPedidoOrigem").setEnabled(true);
				this.byId("idEmailCliente").setEnabled(true);
				this.byId("idObservacoes").setEnabled(true);
			}

		},

		bloquearCampos: function () {

			this.byId("idEstabelecimento").setProperty("enabled", false);
			this.byId("idTipoPedido").setProperty("enabled", false);
			this.byId("idVencimento1").setProperty("enabled", false);
			this.byId("idVencimento2").setProperty("enabled", false);
			this.byId("idVencimento3").setProperty("enabled", false);
			this.byId("idTabelaPreco").setProperty("enabled", false);
			this.byId("idFormaPagamento").setProperty("enabled", false);
			this.byId("idTipoTransporte").setProperty("enabled", false);

		},

		desbloquearCampos: function () {

			this.byId("idEstabelecimento").setProperty("enabled", true);
			this.byId("idTipoPedido").setProperty("enabled", true);
			this.byId("idVencimento1").setProperty("enabled", true);
			this.byId("idVencimento2").setProperty("enabled", true);
			this.byId("idVencimento3").setProperty("enabled", true);
			this.byId("idTabelaPreco").setProperty("enabled", true);
			this.byId("idFormaPagamento").setProperty("enabled", true);
			this.byId("idTipoTransporte").setProperty("enabled", true);

		},

		resetarCamposTela: function () {

			this.byId("idNumeroPedido").setValue("");
			this.byId("idSituacao").setValue("");
			this.byId("idDataPedido").setValue("");
			this.byId("idTipoPedido").setSelectedKey("");
			this.byId("idTipoNegociacao").setSelectedKey("");
			this.byId("idTabelaPreco").setSelectedKey("");
			this.byId("idFormaPagamento").setSelectedKey("");
			this.byId("idTipoTransporte").setSelectedKey("");
			// this.byId("idDataEntrega").setSelectedKey("");
			// this.byId("idLocalEntrega").setSelectedKey("");
			this.byId("idPrimeiraParcela").setValue("");
			this.byId("idQuantParcelas").setValue("");
			this.byId("idIntervaloParcelas").setValue("");
			this.byId("idValorMinimoPedido").setValue("");
			this.byId("idObservacoes").setText("");

		},

		onNovoItem: function () {
			console.log("onitempress standard");
			var that = this;

			var statusPedido = this.getModelGlobal("modelPedido").getProperty("/IdStatusPedido");
			var tipoPedido = this.getModelGlobal("modelPedido").getProperty("/TipoPedido");
			that.oItemPedido = [];

			if (statusPedido == 3) {
				MessageBox.show("Este pedido não pode mais ser alterado", {
					icon: MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK]
				});

			} else if (statusPedido == 2) {

				MessageBox.show("Reabra o pedido para realizar alterações!", {
					icon: MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK]
				});

			} else {

				sap.ui.core.UIComponent.getRouterFor(this).navTo("PedidoDetalheItens");

			}
		},

		onFinalizarPedido: function () {

			var that = this;

			var Pedido = this.getModel("modelPedido").getData();

			var totalItens = that.getModel("modelItensPedidoGrid").getData().length;

			if (totalItens <= 0) {

				sap.m.MessageBox.show("O pedido deve conter no mínimo 1 item.", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Falha ao Completar Pedido",
					actions: [MessageBox.Action.OK]
				});

			} else if (Pedido.TipoPedido !== "Proposta" && Pedido.ValMinPed > Pedido.ValorTotal) {

				sap.m.MessageBox.show("Pedido não atingiu o valor mínimo estipulado pela empresa de R$: " + parseFloat(Pedido.ValMinPed), {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Falha ao Completar Pedido",
					actions: [MessageBox.Action.OK]
				});

			} else if (Pedido.IdStatusPedido == 3) {

				sap.m.MessageBox.show("Este pedido não pode mais ser alterado", {
					icon: sap.m.MessageBox.Icon.WARNING,
					title: "Não Permitido",
					actions: [MessageBox.Action.OK]
				});

			} else {

				that.byId("idPedidoDetalhe").setBusy(true);

				var data = this.onDataHora();

				Pedido.SituacaoPedido = "PEND";
				Pedido.IdStatusPedido = 2;
				Pedido.DataFim = data[0];
				Pedido.HoraFim = data[1];
				Pedido.Completo = true;

				that.onLimparValueState("None");

				Pedido = that.onFormatNumberPedido(Pedido);

				delete Pedido.__metadata;

				that.byId("idPedidoDetalhe").setBusy(true);

				new Promise(function (res, rej) {

					that.onInserirPedido(Pedido, res, rej, that);

				}).then(function (dataPed) {

					if (dataPed.TipoErro == "E") {

						sap.m.MessageBox.show(dataPed.MsgErro, {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: "Não Permitido",
							actions: [MessageBox.Action.OK]
						});

					} else {

						sap.m.MessageBox.show("Pedido salvo com sucesso !! \n\n Deseja enviar o pedido agora ?", {
							icon: sap.m.MessageBox.Icon.SUCCESS,
							title: "Sucesso!",
							actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
							onClose: function (oAction) {

								that.onResetarDadosPedido();

								if (oAction == sap.m.MessageBox.Action.NO) {

									sap.ui.core.UIComponent.getRouterFor(that).navTo("pedido");

								} else {

									new Promise(function (res, rej) {

										Pedido.SituacaoPedido = "FIN";
										Pedido.IdStatusPedido = 3;
										Pedido.DataFim = data[0];
										Pedido.HoraFim = data[1];
										Pedido.Completo = true;

										that.onLimparValueState("None");

										Pedido = that.onFormatNumberPedido(Pedido);

										delete Pedido.__metadata;

										that.onInserirPedido(Pedido, res, rej, that);

									}).then(function (dataPedSalvo) {

										if (dataPedSalvo.TipoErro == "E") {

											sap.m.MessageBox.show(dataPedSalvo.MsgErro, {
												icon: sap.m.MessageBox.Icon.ERROR,
												title: "Não Permitido",
												actions: [MessageBox.Action.OK]
											});

										} else {

											sap.m.MessageBox.show("Pedido enviado com sucesso !!", {
												icon: sap.m.MessageBox.Icon.SUCCESS,
												title: "Sucesso!",
												actions: ["OK"],
												onClose: function (oAction) {

													sap.ui.core.UIComponent.getRouterFor(that).navTo("pedido");

													that.byId("idPedidoDetalhe").setBusy(false);
													that.onLiberarAbas();
												},
											});
										}

									}).catch(function (error) {

										that.byId("idPedidoDetalhe").setBusy(false);
										that.onMensagemErroODATA(error);
									});
								}
							}
						});
					}
				}).catch(function (error) {

					that.byId("idPedidoDetalhe").setBusy(false);
					that.onMensagemErroODATA(error);
				});
			}
		}
	});
});