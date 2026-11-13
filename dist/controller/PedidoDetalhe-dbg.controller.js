/*eslint-disable no-console, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"application/model/formatter",
	"sap/ui/export/library",
	"sap/ui/export/Spreadsheet",
	"application/model/ItemPedidoSupport",
		"application/model/CampanhaItemSupport",
	"sap/ui/dom/includeStylesheet",
	"application/model/BoletoDescontoSupport",

], function (BaseController, JSONModel, MessageBox, formatter, library, Spreadsheet, ItemPedidoSupport, CampanhaItemSupport, includeStylesheet, BoletoDescontoSupport) {
	"use strict";

	var EdmType = library.EdmType;

	return BaseController.extend("application.controller.PedidoDetalhe", {

		formatter: formatter,

		_validarCampanhasFinalizacao: function () {
			var a = this.getModelGlobal("modelItensPedidoGrid").getData() || [], p = this.getModelGlobal("modelPedido").getData(), c = this.getModel("modelCampanhasUI").getData();
			try {
				a.forEach(function (o) { if (String(o.IdCorGrid) === "0") { CampanhaItemSupport.validarAplicado(o); } });
				if (c.AplicacaoItem && (Number(p.ValDescCampInform || 0) > 0 || Number(p.ValDescInformCe || 0) > 0)) { throw new Error("Revise os descontos de campanha do cabeçalho antes de finalizar com aplicação por item."); }
			} catch (e) { MessageBox.warning(e.message); return false; }
			return true;
		},

        onBuscarItensPedido: function (res, rej, sNrPedido) {
            return CampanhaItemSupport.lerItensPedido(this.oModel, sNrPedido, this._normalizarIdCorGrid.bind(this)).then(res, rej);
        },

		_prepararCampanhasGrid: function (aItens) {
			var c = this._contratoCampanhas;
			try { c = CampanhaItemSupport.contrato(this.oModel.getMetaModel()); this._contratoCampanhas = c; this.getModel("modelCampanhasUI").setData(c); } catch (e) { c = c || {}; }
			return (aItens || []).map(function (o) { return CampanhaItemSupport.normalizar(o, c.ConsultaGrade, c.ConsumoGrade); });
		},

		_atualizarContratoCampanhas: function () {
			var that = this, oMeta = this.oModel && this.oModel.getMetaModel();
			if (!oMeta) { return Promise.resolve(); }
			return oMeta.loaded().then(function () { that._contratoCampanhas = CampanhaItemSupport.contrato(oMeta); that.getModel("modelCampanhasUI").setData(that._contratoCampanhas); }).catch(function () { that.getModel("modelCampanhasUI").setProperty("/Mensagem", "Não foi possível consultar a disponibilidade de campanha."); });
		},

		formatarCampanhaTooltip: function (v, sVenda, sEscal, bPendente, bSimulada, sErro) { return CampanhaItemSupport.tooltip(v, sVenda, sEscal, bPendente, bSimulada, sErro); },

		formatarSaldoCampanha: function (v, a, bPendente) { return CampanhaItemSupport.formatarSaldo(v, a, bPendente); },

		formatarCampanhaAtiva: function (vVenda, vEscal, sVendas, sEscal, bPendente) { return CampanhaItemSupport.campanhaAtiva(vVenda, vEscal, sVendas, sEscal, bPendente); },

		formatarCodigoCampanha: function (v, bPendente, sLista) { return CampanhaItemSupport.formatarCodigo(v, bPendente, sLista); },

		formatarIdentificacaoCampanha: function (vVenda, vEscal, sVendas, sEscal, bPendente) { return CampanhaItemSupport.formatarIdentificacao(vVenda, vEscal, sVendas, sEscal, bPendente); },

		formatarPrecoUnitarioCampanha: function (v, bPendente) { return CampanhaItemSupport.formatarUnitario(v, bPendente); },

		formatarPrecoMinimoPermitido: function (vPolitica, vCampanha, bPendente) { return CampanhaItemSupport.formatarMinimoPermitido(vPolitica, vCampanha, bPendente); },

		formatarCampanhaDisponivel: function (v, bPendente) { return CampanhaItemSupport.formatar(v, bPendente); },

		formatarCampanhaPorCaixa: function (vTotal, vQuantidade, bPendente) { return CampanhaItemSupport.formatarPorCaixa(vTotal, vQuantidade, bPendente); },


        formatarEstadoCampanha: function () { return CampanhaItemSupport.estadoCampanha.apply(null, arguments); },
        formatarIconeCampanha: function () { return CampanhaItemSupport.iconeCampanha.apply(null, arguments); },
        formatarTooltipAplicacaoCampanha: function () { return CampanhaItemSupport.tooltipAplicacao.apply(null, arguments); },
        podeAcionarCampanha: function () { return CampanhaItemSupport.podeAcionarCampanha.apply(null, arguments); },

		onInit: function () {
            this.setModel(new JSONModel({ Processando: false }), "modelItensUI");
            includeStylesheet(sap.ui.require.toUrl("application/css/CampanhaItem.css"), "predilecta-campanha-item-css");
			this.setModel(new JSONModel({ ConsultaItem: false, ConsultaGrade: false, SimulacaoPedido: false, AplicacaoItem: false, Mensagem: "" }), "modelCampanhasUI");

			this.getRouter().getRoute("pedidoDetalhe").attachPatternMatched(this.onLoadFields, this);
		},

		onLoadFields: function () {
            this._navegacaoCampanhaEmAndamento = false;
            this._boletoDigitacaoAtiva = false;
            this._boletoEntradaInvalida = false;
            this._erroDescontoBoleto = "";
            this._boletoLiquidoDigitado = null;
            this.getModel("modelItensUI").setProperty("/Processando", false);

			var that = this;
			var NrPedido = that.getModelGlobal("modelAux").getProperty("/NrPedido");
			var CodRepres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			var Cliente = that.getModelGlobal("modelAux").getProperty("/Kunnr");

			that.byId("idPedidoDetalhe").setBusy(true);

			that.onInicializaCampos();
			that._inicializarModeloCampanha();
			that.getModelGlobal("modelItensCampanha")._consultaCampanha = (that.getModelGlobal("modelItensCampanha")._consultaCampanha || 0) + 1;
			that.getModelGlobal("modelItensCampanha").setData([]);

			new Promise(function (resCli, rejCli) {

				debugger;
				that.onBuscarCliente(resCli, rejCli, Cliente, CodRepres, that);

			}).then(function (cliente) {

				that.getModel("modelCliente").setData(cliente);
				that.getModelGlobal("modelPedido").setProperty("/EmailCliente", cliente.EmailComprador);

				new Promise(function (resolve, reject) {

					that.onInicializaModelsIniciais(resolve, reject);

				}).then(function () {

					if (NrPedido != "") {

						new Promise(function (res, rej) {

							that.onBuscarPedido(NrPedido, res, rej, that);

						}).then(function (dataPed) {

							that.getModelGlobal("modelPedido").setData(dataPed);

							that.onCarregarCombosMsgPedido(dataPed);
							that.byId("idPedidoDetalhe").setBusy(false);

							new Promise(function (res, rej) {

								that.onBuscarItensPedido(res, rej, that.getModelGlobal("modelAux").getProperty("/NrPedido"));

							}).then(function (dataItens) {

								that.vetorItensPedido = dataItens;

								if (that.vetorItensPedido.length > 0) {

									that.byId("idTopLevelIconTabBar").setSelectedKey("tab3");
								}

								if (that.temItensLista(that.getModelGlobal("modelItensCampanha") ? that.getModelGlobal("modelItensCampanha").getData() : [])) {

									that.byId("strip0").setVisible(true);
								} else {

									that.byId("strip0").setVisible(false);
								}

								that.getModelGlobal("modelItensPedidoGrid").setData(that._prepararCampanhasGrid(that.vetorItensPedido));
								that.onAtualizarCampanhasPedido();
								that.getModelGlobal("modelItensPedidoGrid").refresh();

								const qtdCorGridInseridos = that.contarItensPedidoDigitados(that.vetorItensPedido);
								that.getModelGlobal("modelAux").setProperty("/ItensPedidoTab", qtdCorGridInseridos);

								// that.getModelGlobal("modelAux").setProperty("/ItensPedidoTab", that.vetorItensPedido.length);

								var Pedido = that.getModelGlobal("modelPedido").getData();
								var Repres = that.Usuario;

								new Promise(function (resTabPreco, rejTabPreco) {

									that.onBuscarTabelaPreco(Pedido, Repres, resTabPreco, rejTabPreco, that);

								}).then(function (dataItens) {

									new Promise(function (res, rej) {

										that.byId("idTipoPedido").setBusy(true);

										var Kunnr = that.getModelGlobal("modelPedido").getProperty("/Kunnr");
										var Kvgr4 = that.getModelGlobal("modelPedido").getProperty("/Kvgr4");
										var Kvgr5 = that.getModelGlobal("modelPedido").getProperty("/Kvgr5");
										var Centro = that.getModelGlobal("modelPedido").getProperty("/Werks");

										that.onBuscarTipoPedido(that.Usuario, Kunnr, Centro, Kvgr4, Kvgr5, res, rej, that);

									}).then(function (TipoPedido) {

										that.byId("idTipoPedido").setBusy(false);
										that.onCarregarTipoPedido(dataPed, TipoPedido);

										// new Promise(function (res, rej) {

										// 	that.oModel.read("/P_Vencimentos", {
										// 		urlParameters: {
										// 			"$filter": "RegCliente eq '" + that.getModelGlobal("modelPedido").getProperty("/RegCliente") + "' and RegCentro eq '" + that.getModelGlobal("modelPedido").getProperty("/RegCentro") + "'"
										// 		},
										// 		success: function (result) {

										// 			var limiteCred = parseFloat(that.getModel("modelCliente").getProperty("/CreditLimit"));

										// 			if (limiteCred == 1) {

										// 				for (var i = 0; i < result.results.length; i++) {

										// 					if (result.results[i].Zterm == "0000") {

										// 						that.vetorVencimentoTotal.push(result.results[i]);
										// 					}
										// 				}
										// 			} else {

										// 				that.vetorVencimentoTotal = result.results;
										// 			}

										// 			that.getModel("modelVencimentos1").setData(that.vetorVencimentoTotal);
										// 			res();
										// 		},
										// 		error: function (error) {

										// 			that.onMensagemErroODATA(error);
										// 		}
										// 	});

										// }).then(function (data) {

										new Promise(function (res, rej) {

											var oModelPedido = that.getModel("modelPedido");
											var oModelPedidoGlobal = that.getModelGlobal("modelPedido");
											var oModelCliente = that.getModel("modelCliente");
											var oModelVencimentos = that.getModel("modelVencimentos1");
											var oCampoVencimento = that.byId("idVencimento1");

											function normalizarTexto(value) {
												return value === undefined || value === null ? "" : String(value).trim();
											}

											function obterPropriedadePedido(sPath) {
												var value = oModelPedido ? oModelPedido.getProperty(sPath) : undefined;

												if (value !== undefined && value !== null && value !== "") {
													return value;
												}

												return oModelPedidoGlobal ? oModelPedidoGlobal.getProperty(sPath) : undefined;
											}

											function setPedidoProperty(sPath, value) {
												if (oModelPedido) {
													oModelPedido.setProperty(sPath, value);
												}

												if (oModelPedidoGlobal && oModelPedidoGlobal !== oModelPedido) {
													oModelPedidoGlobal.setProperty(sPath, value);
												}
											}

											function localizarVencimento(aVencimentos, sZterm) {
												for (var i = 0; i < aVencimentos.length; i++) {
													if (normalizarTexto(aVencimentos[i].Zterm) === sZterm) {
														return aVencimentos[i];
													}
												}

												return null;
											}

											function adicionarVencimento(aVencimentos, oVencimento) {
												var sZterm = normalizarTexto(oVencimento && oVencimento.Zterm);

												if (sZterm === "" || localizarVencimento(aVencimentos, sZterm)) {
													return;
												}

												aVencimentos.push(oVencimento);
											}

											function escaparFiltroOData(value) {
												return normalizarTexto(value).replace(/'/g, "''");
											}

											var sRegCliente = escaparFiltroOData(obterPropriedadePedido("/RegCliente"));
											var sRegCentro = escaparFiltroOData(obterPropriedadePedido("/RegCentro"));
											var sVencimentoSelecionado = normalizarTexto(obterPropriedadePedido("/Vencimento"));
											var vIndiceFinal = obterPropriedadePedido("/IndiceFinal");
											var sLimiteCredito = normalizarTexto(oModelCliente.getProperty("/CreditLimit")).replace(",", ".");
											var nLimiteCredito = parseFloat(sLimiteCredito);

											that.oModel.read("/P_Vencimentos", {
												urlParameters: {
													"$filter": "RegCliente eq '" + sRegCliente + "' and RegCentro eq '" + sRegCentro + "'"
												},

												success: function (result) {
													try {
														var aResultados = result && Array.isArray(result.results) ? result.results : [];
														var aVencimentosCarregados = [];

														for (var i = 0; i < aResultados.length; i++) {
															if (nLimiteCredito !== 1 || normalizarTexto(aResultados[i].Zterm) === "0000") {
																adicionarVencimento(aVencimentosCarregados, aResultados[i]);
															}
														}

														if (sVencimentoSelecionado !== "" && !localizarVencimento(aVencimentosCarregados, sVencimentoSelecionado)) {
															adicionarVencimento(aVencimentosCarregados, {
																Zterm: sVencimentoSelecionado,
																IdVencimento: sVencimentoSelecionado,
																DescCond: sVencimentoSelecionado + " - Condição sem cadastro",
																Kbetr: vIndiceFinal !== undefined && vIndiceFinal !== null && vIndiceFinal !== "" ? vIndiceFinal : 0,
																AdicionadoAutomaticamente: true
															});
														}

														that.vetorVencimentoTotal = aVencimentosCarregados.slice();
														oModelVencimentos.setData(aVencimentosCarregados);

														if (sVencimentoSelecionado !== "") {
															setPedidoProperty("/Vencimento", sVencimentoSelecionado);

															if (oCampoVencimento) {
																oCampoVencimento.setSelectedKey(sVencimentoSelecionado);
															}
														}

														res();
													} catch (error) {
														rej(error);
													}
												},

												error: function (error) {
													that.onMensagemErroODATA(error);
													rej(error);
												}
											});
										}).then(function (data) {

											that.onCarregarLocalEntrega(that.getModelGlobal("modelPedido").getProperty("/Bukrs"));

											that.getModelGlobal("modelItensPedidoGrid").setData(that._prepararCampanhasGrid(that.vetorItensPedido));
											that.onAtualizarCampanhasPedido();
											that.getModelGlobal("modelItensPedidoGrid").refresh();

											const qtdCorGridInseridos = that.contarItensPedidoDigitados(that.vetorItensPedido);
											that.getModelGlobal("modelAux").setProperty("/ItensPedidoTab", qtdCorGridInseridos);

											// that.getModelGlobal("modelAux").setProperty("/ItensPedidoTab", that.vetorItensPedido.length);

											that.byId("table_pedidos").setBusy(false);
											that.onBloquearPedido(dataPed.IdStatusPedido);

										}).catch(function (error) {

											that.onMensagemErroODATA(error);
										});

									}).catch(function (error) {

										that.onMensagemErroODATA(error);
									});

								}).catch(function (error) {

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

					} else {

						that.onCriarNrPedido();
						that.onSetValuesDefault();
						that.onBloquearPedido(that.getModelGlobal("modelPedido").getProperty("IdStatusPedido"));

						that.byId("idPedidoDetalhe").setBusy(false);
					}
				});
			});
		},

		onInicializaModelsIniciais: function (resolve, reject) {
			var that = this;

			that.CodRepres = this.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.Usuario = this.getModelGlobal("modelAux").getProperty("/Usuario");
			var vetorPromises = [];

			//Vencimentos
			// vetorPromises.push(new Promise(function (res, rej) {

			// 	that.oModel.read("/Vencimentos", {
			// 		success: function (result) {

			// 			var limiteCred = parseFloat(that.getModel("modelCliente").getProperty("/CreditLimit"));

			// 			if (limiteCred == 1) {

			// 				for (var i = 0; i < result.results.length; i++) {

			// 					if (result.results[i].Zterm == "0000") {

			// 						that.vetorVencimentoTotal.push(result.results[i]);
			// 					}
			// 				}
			// 			} else {

			// 				that.vetorVencimentoTotal = result.results;
			// 			}

			// 			that.getModel("modelVencimentos1").setData(that.vetorVencimentoTotal);
			// 			res();
			// 		},
			// 		error: function (error) {

			// 			that.onMensagemErroODATA(error);
			// 		}
			// 	});
			// }));

			// //Tabela de Preço
			// vetorPromises.push(new Promise(function (res, rej) {

			// 	that.oModel.read("/TabPrecos", {
			// 		// urlParameters: {
			// 		// 	"$filter": "IvUsuario eq '" + that.CodRepres + "'"
			// 		// },
			// 		success: function (result) {

			// 			for (var i = 0; i < result.results.length; i++) {

			// 				if (result.results[i].Pltyp == that.getModel("modelCliente").getProperty("/Pltyp")) {

			// 					that.vetorTabPrecos.push(result.results[i]);
			// 				}
			// 			}

			// 			that.getModel("modelTabPrecos").setData(that.vetorTabPrecos);
			// 			res();
			// 		},
			// 		error: function (error) {

			// 			that.onMensagemErroODATA(error);
			// 		}
			// 	});
			// }));

			vetorPromises.push(new Promise(function (res, rej) {

				that.oModel.read("/MsgNF", {
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

				that.oModel.read("/LocaisEntregas", {
					urlParameters: {
						"$filter": "IvUsuario eq '" + that.Usuario + "'"
					},
					success: function (retornoEntregas) {

						var vetorEntregas = retornoEntregas.results;
						for (var i = 0; i < vetorEntregas.length; i++) {

							var auxLocais = vetorEntregas[i];

							if (auxLocais.Kunnr == that.getModel("modelCliente").getProperty("/Kunnr")) {

								that.vetorLocaisEntregas.push(auxLocais);
							}
						}

						// that.getModel("modelLocaisEntregas").setData(that.vetorLocaisEntregas);
						res();

					},
					error: function (error) {
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
						that.onMensagemErroODATA(error);
					}
				});
			}));

			vetorPromises.push(new Promise(function (res, rej) {

				that.oModel.read("/Centros", {
					urlParameters: {
						"$filter": "IvUsuario eq '" + that.Usuario + "'"
					},
					success: function (data) {

						that.vetorCentros = data.results;
						that.setModel(new JSONModel(that.vetorCentros), "modelCentros");

						res();
					},
					error: function (error) {

						rej(error);
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
						"$filter": "IvUsuario eq '" + that.Usuario + "'"
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
						that.onMensagemErroODATA(error);
					}
				});
			}));

			Promise.all(vetorPromises).then(function (values) {

				resolve();
			});

		},

		onInicializaCampos: function () {

			var that = this;

			that.oModel = this.getModelGlobal("modelAux").getProperty("/DBModel");
			this._atualizarContratoCampanhas();

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
			that.vetorLocaisEntregasAux = [];
			that.vetorMotivosCampanha = [];
			that.vetorVencimentoTotal = [];
			that.vetorTipoPedidosTotal = [];

			this.setModel(new sap.ui.model.json.JSONModel({
				totalValor: 0,
				totalSaldo: 0
			}), "modelTotais");

			that.getModelGlobal("modelAux").getProperty("/ObrigaSalvar", false);

			that.getModelGlobal("modelAux").getProperty("/ItensPedidoTab", 0);

			var modelCliente = new JSONModel({});
			that.setModel(modelCliente, "modelCliente");

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
		},

		onValidaDataMenorAtual: function (data) {

			var dataSplit = data.split("/");

			var dataNova = this.onDataHora();

			var novaAtual = dataNova[2].ano + dataNova[2].mes + dataNova[2].dia;

			var dataEscolhida = String(dataSplit[2]) + String(dataSplit[1]) + String(dataSplit[0]);

			// var dataAntiga = new Date(dataSplit[2],dataSplit[1],dataSplit[0]);

			if (dataEscolhida >= novaAtual) {
				return "Data Maior";

			} else {

				return "Data Menor";
			}
		},

		onValidaDataLimiteEntrega: function (DataEntrega, DataLimite) {

			var DataEntrega = DataEntrega.split("/");
			var DataLimite = DataLimite.split("/");

			var dataEscolhida = String(DataEntrega[2]) + String(DataEntrega[1]) + String(DataEntrega[0]);
			var dataLimite = String(DataLimite[2]) + String(DataLimite[1]) + String(DataLimite[0]);

			if (dataEscolhida >= dataLimite) {
				return "Data Maior";

			} else {

				return "Data Menor";
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
			this.getModelGlobal("modelPedido").setProperty("/IdStatusPedido", '1');
			this.getModelGlobal("modelPedido").setProperty("/TipoDispositivo", "PORTALWEB");
			this.getModelGlobal("modelPedido").setProperty("/Lifnr", this.getModel("modelAux").getProperty("/Lifnr"));
			this.getModelGlobal("modelPedido").setProperty("/Usuario", this.getModel("modelAux").getProperty("/Usuario"));
			this.getModelGlobal("modelPedido").setProperty("/DataIni", data[0]);
			this.getModelGlobal("modelPedido").setProperty("/HoraIni", data[1]);
			this.getModelGlobal("modelPedido").setProperty("/DataFim", data[0]);
			this.getModelGlobal("modelPedido").setProperty("/HoraFim", data[1]);

			this.getModelGlobal("modelPedido").setProperty("/Txjcd", this.getModel("modelCliente").getProperty("/Txjcd").replace(" ", "_"));
			this.getModelGlobal("modelPedido").setProperty("/Kunnr", this.getModel("modelCliente").getProperty("/Kunnr"));
			this.getModelGlobal("modelPedido").setProperty("/EmailRepres", this.getModelGlobal("modelAux").getProperty("/Email"));
			this.getModelGlobal("modelPedido").setProperty("/Tdt", this.getModel("modelCliente").getProperty("/Tdt"));
			this.getModelGlobal("modelPedido").setProperty("/EmailCliente", this.getModel("modelCliente").getProperty("/EmailComprador"));

			this.getModelGlobal("modelAux").setProperty("/ItensPedidoTab", 0);

			this.onCarregarTipoPedido(this.getModelGlobal("modelPedido").getData());
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

				//Não deixar trocar o tipo de transporte quando vier do cliente.
				if (that.getModel("modelCliente").getProperty("/Inco1") != "") {

					that.byId("idTipoTransporte").setEnabled(false);
				}

				if (status == '3' || status == '2' || status == '4') {

					that.byId("idDataLimite").setEnabled(false);
					that.byId("idDataEntrega").setEnabled(false);
					that.byId("idMsg1").setEnabled(false);
					that.byId("idMsg2").setEnabled(false);
					that.byId("idMsg3").setEnabled(false);
					that.byId("idPedidoOrigem").setEnabled(false);
					that.byId("idObservacoes").setEnabled(false);
					that.byId("idEmailCliente").setEnabled(false);

				} else {

					that.byId("idDataLimite").setEnabled(false);
					that.byId("idDataEntrega").setEnabled(true);
					that.byId("idMsg1").setEnabled(true);
					that.byId("idMsg2").setEnabled(true);
					that.byId("idMsg3").setEnabled(true);
					that.byId("idPedidoOrigem").setEnabled(true);
					that.byId("idObservacoes").setEnabled(true);
					that.byId("idEmailCliente").setEnabled(true);

				}

				if (status != '1' && status != '4') {

					that.byId("idDescontoPedido").setEnabled(false);
					that.byId("idDescontoAplicar").setEnabled(false);
					that.byId("idDescontoAplicarBoleto").setEnabled(false);
                    that.byId("idDescontoAplicarBoletoReduz").setEnabled(false);
					that.byId("idDescontoPedidoCamp").setEnabled(false);
					that.byId("idDescontoAplicarCamp").setEnabled(false);
					that.byId("idDescontoPedidoBoleto").setEnabled(false);

					that.byId("idDescontoPedidoCampBol").setEnabled(false);
					that.byId("idDescontoAplicarCampBol").setEnabled(false);

					that.byId("idDescontoDisponivelCe").setEnabled(false);
					that.byId("idDescontoPedidoCe").setEnabled(false);
					that.byId("idDescontoAplicarCe").setEnabled(false);

					that.byId("idDescontoDisponivelCampBolEscal").setEnabled(false);
					that.byId("idDescontoPedidoCampBolEscal").setEnabled(false);
					that.byId("idDescontoAplicarCampBolEscal").setEnabled(false);

				} else {

					that.byId("idDescontoPedido").setEnabled(true);
					that.byId("idDescontoAplicar").setEnabled(true);
					that.byId("idDescontoAplicarBoleto").setEnabled(true);
                    that.byId("idDescontoAplicarBoletoReduz").setEnabled(true);
					that.byId("idDescontoPedidoCamp").setEnabled(true);
					that.byId("idDescontoAplicarCamp").setEnabled(true);
					that.byId("idDescontoPedidoBoleto").setEnabled(true);

					that.byId("idDescontoPedidoCampBol").setEnabled(true);
					that.byId("idDescontoAplicarCampBol").setEnabled(true);

					// that.byId("idDescontoDisponivelCe").setEnabled(true);
					that.byId("idDescontoPedidoCe").setEnabled(true);
					that.byId("idDescontoAplicarCe").setEnabled(true);

					// that.byId("idDescontoDisponivelCampBolEscal").setEnabled(true);
					that.byId("idDescontoPedidoCampBolEscal").setEnabled(true);
					that.byId("idDescontoAplicarCampBolEscal").setEnabled(true);
				}
			}

			function abas(bloqueio) {

				that.byId("tabTotalStep").setEnabled(bloqueio);
				that.byId("tabDescontoStep").setEnabled(bloqueio);
				that.byId("tabItensPedidoStep").setEnabled(bloqueio);
			}

			var itens = this.getModelGlobal("modelItensPedidoGrid").getData();

			if (itens.length > 0 && statusPedido == '1') {

				campos(false, statusPedido);
				abas(true);

			} else if (itens.length == 0) {

				campos(true, statusPedido);
				abas(false);

			} else if (statusPedido == '3' || statusPedido == '2' || statusPedido == '4') {

				campos(false, statusPedido);
				abas(true);
			}
		},

		onCriarNrPedido: function () {

			this.byId("idTopLevelIconTabBar").setSelectedKey("tab1");
			this.getModelGlobal("modelPedido").setProperty("/Completo", false);

			var CodRepres = this.getModelGlobal("modelAux").getProperty("/CodRepres");
			var Lifnr = this.getModelGlobal("modelAux").getProperty("/Lifnr");
			var dataAtual = this.onDataHora();

			var data = dataAtual[0].substring(0, 2) + dataAtual[0].substring(3, 5) + dataAtual[0].substring(6, 11);
			var horario = dataAtual[1].substring(0, 2) + dataAtual[1].substring(3, 5) + dataAtual[1].substring(6, 8);

			if (Lifnr == CodRepres) {

				var numeroPed = Lifnr + "." + data + "." + horario;
			} else {

				numeroPed = CodRepres + "." + data + "." + horario;
			}

			this.getModelGlobal("modelAux").setProperty("/NrPedido", numeroPed);
			this.getModelGlobal("modelPedido").setProperty("/NrPedido", numeroPed);

		},

		onLiberarItensPedido: function () {
            if (!this._validarBoletoAntesGravar()) { return; }
			var that = this;

			var Pedido = that.getModelGlobal("modelPedido").getData();
			var limiteCredito = parseFloat(this.getModel("modelCliente").getProperty("/CreditLimit"));

			var validaDataLimite = that.onValidaDataMenorAtual(Pedido.DataLimite);
			var validaDataEntrega = that.onValidaDataMenorAtual(Pedido.DataEntrega);

			// var date = new Date();
			// var dataLimiteEntrega = date.addDays(this.getModelGlobal("modelAux").getProperty("/MaxDiasEntrega"));

			var maxDias = Number(this.getModelGlobal("modelAux").getProperty("/MaxDiasEntrega") || 0);

			var hoje = new Date();
			hoje.setHours(0, 0, 0, 0);

			var dtLimite = this.addDays(hoje, maxDias);// Date
			var dataLimiteEntrega = this.formatDateBR(dtLimite);

			var validaLimiteDataEntrega = that.onValidaDataLimiteEntrega(Pedido.DataEntrega, dataLimiteEntrega);
			var validaMinDataEntrega = that.onValidaDataLimiteEntrega(Pedido.DataEntrega, Pedido.DataEntregaSugerida);

			var dtEntrega = this.parseDateBR(Pedido.DataEntrega);
			var dtEntregaSugerida = this.parseDateBR(Pedido.DataEntregaSugerida);

			that.onBuscarDescTabPreco(Pedido.Pltyp);

			var caracSpecRefPedido = this.containsSpecialChars(Pedido.PedidoOrigem);

			if (Pedido.StatusPedido == 3 || Pedido.StatusPedido == 2 || Pedido.StatusPedido == 4) {

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

			} else if (Pedido.Vencimento == "" && Pedido.Contrato != "" && limiteCredito == 1) {

				sap.m.MessageBox.show("Cliente possui Contrato e Limite de crédito indisponível. Entrar em contato com Depto. Financeiro!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idVencimento1").setValueState("Error");
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

			} else if (!dtEntrega) {

				sap.m.MessageBox.show("Data de Entrega inválida.", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idDataEntrega").focus();
						that.byId("idDataEntrega").setValueState("Error");

						return;
					}
				});

			} else if (!dtEntregaSugerida) {

				sap.m.MessageBox.show("Data de Entrega Sugerida inválida.", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idDataEntregaSugerida").focus();
						that.byId("idDataEntregaSugerida").setValueState("Error");

						return;
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

			} else if (validaDataLimite != "Data Maior") {

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

			} else if (validaDataEntrega != "Data Maior") {

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

			} else if (validaLimiteDataEntrega == "Data Maior") {

				sap.m.MessageBox.show("Data de Entrega máx permitida é de " + this.getModelGlobal("modelAux").getProperty("/MaxDiasEntrega") +
					" dias a partir da data atual! ", {
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

				sap.m.MessageBox.show("Preencher o e-mail do cliente!", {
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

			} else if (validaMinDataEntrega == "Data Menor") {

				sap.m.MessageBox.show("Alinhar data de entrega superior a data sugerida!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Preecher campo(s)",
					actions: [MessageBox.Action.OK],
					onClose: function () {

						that.byId("idTopLevelIconTabBar").setSelectedKey("tab2");
						that.byId("idDataEntrega").focus();
						that.byId("idDataEntrega").setValueState("Error");
					}
				});

			} else if (caracSpecRefPedido == true) {

				sap.m.MessageBox.show("O campo Pedido Origem Cliente possui caracteres especiais. Favor corrigir!", {
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
							Pedido.Usuario = that.getModelGlobal("modelAux").getProperty("/CodRepres");
							that.byId("idPedidoDetalhe").setBusy(true);

							Pedido = that.onFormatNumberPedido(Pedido);
							Pedido = that.onDeleteProperties(Pedido);

							that.oModel.create("/P_PedidoPR", Pedido, {
								method: "POST",
								success: function (data) {
									var sNrPedidoSalvo = data.NrPedido || Pedido.NrPedido;
									that.getModelGlobal("modelPedido").setProperty("/NrPedido", sNrPedidoSalvo);
									that.getModelGlobal("modelAux").setProperty("/NrPedido", sNrPedidoSalvo);


									sap.m.MessageToast.show("Pedido salvo com sucesso!", {
										duration: 5000
									});

									that.byId("idPedidoDetalhe").setBusy(false);
									that.onLiberarAbas();

									that.byId("table_pedidos").setBusy(true);
									new Promise(function (res, rej) { that.onBuscarItensPedido(res, rej, sNrPedidoSalvo); }).then(function (aItens) {
										if (String(that.getModelGlobal("modelPedido").getProperty("/NrPedido")) !== String(sNrPedidoSalvo)) { return; }
										that.vetorItensPedido = aItens;
										that.getModelGlobal("modelItensPedidoGrid").setData(that._prepararCampanhasGrid(aItens));
										that.getModelGlobal("modelAux").setProperty("/ItensPedidoTab", that.contarItensPedidoDigitados(aItens));
										if (aItens.length) { that.byId("idTopLevelIconTabBar").setSelectedKey("tab3"); }
										return that.onAtualizarCampanhasPedido();
									}).catch(function (oErro) {
										if (String(that.getModelGlobal("modelPedido").getProperty("/NrPedido")) === String(sNrPedidoSalvo)) { that.onMensagemErroODATA(oErro); }
									}).then(function () {
										if (String(that.getModelGlobal("modelPedido").getProperty("/NrPedido")) === String(sNrPedidoSalvo)) { that.byId("table_pedidos").setBusy(false); }
									});

								},
								error: function (error) {

									that.byId("table_pedidos").setBusy(false);
									that.byId("idPedidoDetalhe").setBusy(false);
									that.onMensagemErroODATA(error);

									sap.ui.core.UIComponent.getRouterFor(that).navTo("pedido");
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
			this.byId("idDataLimite").setValueState("None");
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
				Usuario: "",
				DataIni: "",
				HoraIni: "",
				DataFim: "",
				HoraFim: "",
				IdStatusPedido: "",
				SituacaoPedido: "",
				Werks: "", //Centro
				WerksDesc: "", //Centro Descrição
				Bukrs: "", //Empresa
				RegCentro: "", //Região Estabelecimento
				Pltyp: "", // Tab Preço
				PltypDesc: "", // Tab Preço
				Inco1: "", //Frete
				TipoPedido: "",
				Completo: false,
				Kunnr: "",
				KunnrDesc: "",
				RegCliente: "",
				DataLimite: dataLimite,
				DataEntregaSugerida: dataLimite,
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
				Bzirk: "",
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
				LeadTime: 0,
				MotivoDescBolCe: "",
				MotivoDescCe: "",
				ValDescDispCe: 0,
				ValDescInformCe: 0,
				ValDescDispBolCe: 0,
				ValDescInformBolCe: 0,
				ValDescInformBoletoReduzid: 0,
				PercFatModeradorVerba: 0,
				IsSupervisor: false,
				IsGerente: false,
				IsDivisor: false,
				UsuarioEnvio: "",
				TextoAprovacao: "",
				PercFlexBoleto: 0
			});

			this.setModelGlobal(modelPedido, "modelPedido");
		},

		onChangeEstabelecimento: function (e) {

			var that = this;
			that.vetorTipoPedidos = [];
			that.vetorVencimentos = [];

			var Centro = that.getModelGlobal("modelPedido").getProperty("/Werks");
			var Kunnr = that.getModelGlobal("modelPedido").getProperty("/Kunnr");
			var Kvgr4 = that.getModelGlobal("modelPedido").getProperty("/Kvgr4");
			var Kvgr5 = that.getModelGlobal("modelPedido").getProperty("/Kvgr5");

			that.getModelGlobal("modelPedido").setProperty("/Vencimento", "");
			that.getModelGlobal("modelPedido").setProperty("/IndiceFinal", 0);
			that.getModelGlobal("modelPedido").setProperty("/Contrato", "");

			// that.byId("idContrato").setVisible(false);
			that.byId("idVencimento1").setEnabled(true);

			that.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", true);

			for (var i = 0; i < that.vetorCentros.length; i++) {

				if (that.vetorCentros[i].Werks == Centro) {

					that.getModelGlobal("modelPedido").setProperty("/Bukrs", that.vetorCentros[i].Bukrs);
					that.getModelGlobal("modelPedido").setProperty("/RegCentro", that.vetorCentros[i].Regio);
					that.getModelGlobal("modelPedido").setProperty("/RegCliente", that.getModel("modelCliente").getProperty("/Regio"));

					// var regCliente = that.getModel("modelCliente").getProperty("/Txjcd").substring(0, 3).trim();
					// that.getModel("modelPedido").setProperty("/RegCliente", regCliente);

					that.getModelGlobal("modelPedido").setProperty("/ValMinPed", that.vetorCentros[i].ValMinPed);
					that.getModelGlobal("modelPedido").setProperty("/PercFlexBoleto", that.vetorCentros[i].PercFlex);
					that.getModelGlobal("modelPedido").setProperty("/PercAcresc", that.vetorCentros[i].PercAcresc);
					// that.getModelGlobal("modelPedido").setProperty("/PercCampFlex", that.vetorCentros[i].PercCampFlex);
					that.getModelGlobal("modelPedido").setProperty("/NrMesina", that.vetorCentros[i].NrMesina);
					that.getModelGlobal("modelPedido").setProperty("/PercIncent", that.vetorCentros[i].PercIncent);
					that.getModelGlobal("modelPedido").setProperty("/PercFator", that.vetorCentros[i].PercFator);
					that.getModelGlobal("modelPedido").setProperty("/PercRentabNeg", that.vetorCentros[i].PercRentabNeg);
					that.getModelGlobal("modelPedido").setProperty("/LogVerbaRentNeg", that.vetorCentros[i].LogVerbaRentNeg);
					that.getModelGlobal("modelPedido").setProperty("/LogProposta", that.vetorCentros[i].LogProposta);
					that.getModelGlobal("modelPedido").setProperty("/Gerencia", that.vetorCentros[i].Gerencia);
					that.getModelGlobal("modelPedido").setProperty("/Bzirk", that.vetorCentros[i].Bzirk);
					that.getModelGlobal("modelPedido").setProperty("/Supervisor", that.vetorCentros[i].Supervisor);
					that.getModelGlobal("modelPedido").setProperty("/PercFatModeradorVerba", that.vetorCentros[i].PercFatModeradorVerba);

					//Locais de entregas
					that.vetorLocaisEntregasAux = [];

					for (var i = 0; i < that.vetorLocaisEntregas.length; i++) {

						if (that.getModelGlobal("modelPedido").getProperty("/Bukrs") == that.vetorLocaisEntregas[i].Bukrs ||
							that.vetorLocaisEntregas[i].Bukrs == "") {

							that.vetorLocaisEntregasAux.push(that.vetorLocaisEntregas[i]);
						}
					}

					that.getModel("modelLocaisEntregas").setData(that.vetorLocaisEntregasAux);
					that.getModel("modelLocaisEntregas").refresh();

					//Setar Local de entrega default
					if (this.getModel("modelLocaisEntregas").getData().length == 1) {
						this.getModel("modelPedido").setProperty("/LocalEntrega", (this.getModel("modelLocaisEntregas").getData()[0].Addrnumber));
					}

					break;
				}

				//Setar Tipo pedido Default
				// if (this.getModel("modelTipoPedidos").getData().length == 1) {

				// 	this.getModel("modelPedido").setProperty("/TipoPedido", (this.getModel("modelTipoPedidos").getData()[0].TipoPedido));
				// }

			}

			new Promise(function (resFrete, rejFrete) {

				var Cliente = that.getModel("modelCliente").getProperty("/Kunnr");
				var Bukrs = that.getModel("modelPedido").getProperty("/Bukrs");

				that.onBuscarClienteEmpresa(Cliente, Bukrs, resFrete, rejFrete, that);

			}).then(function (dataFrete) {

				that.getModel("modelCliente").setProperty("/Kvgr1", dataFrete.Kvgr1);
				that.getModel("modelCliente").setProperty("/Kvgr2", dataFrete.Kvgr2);
				that.getModel("modelCliente").setProperty("/Kvgr3", dataFrete.Kvgr3);
				that.getModel("modelCliente").setProperty("/Kvgr4", dataFrete.Kvgr4);
				that.getModel("modelCliente").setProperty("/Kvgr5", dataFrete.Kvgr5);
				// that.getModel("modelCliente").setProperty("/Bzirk", dataFrete.Bzirk);
				that.getModel("modelCliente").setProperty("/Pltyp", dataFrete.Pltyp);
				that.getModel("modelCliente").setProperty("/Inco1", dataFrete.Inco1);

				that.getModelGlobal("modelPedido").setProperty("/Kvgr1", that.getModel("modelCliente").getProperty("/Kvgr1"));
				that.getModelGlobal("modelPedido").setProperty("/Kvgr2", that.getModel("modelCliente").getProperty("/Kvgr2"));
				that.getModelGlobal("modelPedido").setProperty("/Kvgr3", that.getModel("modelCliente").getProperty("/Kvgr3"));
				that.getModelGlobal("modelPedido").setProperty("/Kvgr4", that.getModel("modelCliente").getProperty("/Kvgr4"));
				that.getModelGlobal("modelPedido").setProperty("/Kvgr5", that.getModel("modelCliente").getProperty("/Kvgr5"));
				// that.getModelGlobal("modelPedido").setProperty("/Bzirk", that.getModel("modelCliente").getProperty("/Bzirk"));
				that.getModelGlobal("modelPedido").setProperty("/Pltyp", that.getModel("modelCliente").getProperty("/Pltyp"));
				that.getModelGlobal("modelPedido").setProperty("/Inco1", that.getModel("modelCliente").getProperty("/Inco1"));


				if (that.getModel("modelCliente").getProperty("/Inco1") != "") {

					that.byId("idTipoTransporte").setEnabled(false);
					that.getModelGlobal("modelPedido").setProperty("/Inco1", that.getModel("modelCliente").getProperty("/Inco1"));
				} else {

					that.byId("idTipoTransporte").setEnabled(true);
				}

				new Promise(function (res, rej) {

					that.byId("idTipoPedido").setBusy(true);

					var Kunnr = that.getModelGlobal("modelPedido").getProperty("/Kunnr");
					var Kvgr4 = that.getModelGlobal("modelPedido").getProperty("/Kvgr4");
					var Kvgr5 = that.getModelGlobal("modelPedido").getProperty("/Kvgr5");
					var Centro = that.getModelGlobal("modelPedido").getProperty("/Werks");

					that.onBuscarTipoPedido(that.Usuario, Kunnr, Centro, Kvgr4, Kvgr5, res, rej, that);

				}).then(function (TipoPedido) {

					// that.vetorTipoPedidos = [];

					// if (TipoPedido.DatFimValid !== null) {

					// 	var aux = {
					// 		TipoPedido: "Proposta"
					// 	};

					// 	that.vetorTipoPedidos.push(aux);

					// 	aux = {
					// 		TipoPedido: "Normal"
					// 	};

					// 	that.vetorTipoPedidos.push(aux);

					// } else {

					// 	that.vetorTipoPedidos = [];
					// 	aux = {
					// 		TipoPedido: "Normal"
					// 	};

					// 	that.vetorTipoPedidos.push(aux);
					// }

					// that.getModel("modelTipoPedidos").setData(that.vetorTipoPedidos);

					that.onCarregarTipoPedido(that.getModelGlobal("modelPedido").getData(), TipoPedido);

					if (that.getModel("modelTipoPedidos").getData().length == 1) {

						that.getModel("modelPedido").setProperty("/TipoPedido", (that.vetorTipoPedidos[0].TipoPedido));
					}

					that.byId("idTipoPedido").setBusy(false);

					new Promise(function (res, rej) {

						that.oModel.read("/P_Vencimentos", {
							urlParameters: {
								"$filter": "RegCliente eq '" + that.getModelGlobal("modelPedido").getProperty("/RegCliente") + "' and RegCentro eq '" + that.getModelGlobal("modelPedido").getProperty("/RegCentro") + "'"
							},
							success: function (result) {

								var limiteCred = parseFloat(that.getModel("modelCliente").getProperty("/CreditLimit"));

								if (limiteCred == 1) {

									for (var i = 0; i < result.results.length; i++) {

										if (result.results[i].Zterm == "0000") {

											that.vetorVencimentoTotal.push(result.results[i]);
										}
									}
								} else {

									that.vetorVencimentoTotal = result.results;
								}

								that.getModel("modelVencimentos1").setData(that.vetorVencimentoTotal);
								res();
							},
							error: function (error) {

								that.onMensagemErroODATA(error);
							}
						});

					}).then(function (data) {


						//Vencimentos
						// new Promise(function (res, rej) {

						// 	that.byId("idVencimento1").setEnabled(true);
						// 	that.byId("idContrato").setBusy(true);
						// 	that.byId("idVencimento1").setBusy(true);

						// 	that.oModel.read("/P_ContratoR(IvBukrs='" + that.getModel("modelPedido").getProperty("/Bukrs") + "',IvKvgr4='" + that.getModel(
						// 		"modelPedido").getProperty("/Kvgr4") + "')", {
						// 		// urlParameters: {
						// 		// 	"$filter": "IvKvgr4 eq '" + that.getModel("modelPedido").getProperty("/Kvgr4") + "' and IvBukrs eq '" + that.getModel("modelPedido").getProperty("/Bukrs") + "'"
						// 		// },
						// 		success: function (result) {

						// 			that.byId("idContrato").setBusy(false);
						// 			that.byId("idVencimento1").setBusy(false);

						// 			var vetorVenc = that.getModel("modelVencimentos1").getData();
						// 			var vetorVencContrato = [];

						// 			if (result.ContratoInterno != "") {

						// 				// that.byId("idLabelContrato").setVisible(true);

						// 				var encontrou = "false";
						// 				var indiceVec = 0;

						// 				for (var j = 0; j < vetorVenc.length; j++) {

						// 					if (vetorVenc[j].Zterm == result.Zterm) {
						// 						encontrou = "true";

						// 						if (String(result.AtlOrdem) == "true") {

						// 							that.getModel("modelPedido").setProperty("/IndiceFinal", result.IndiceContrato);
						// 						} else {

						// 							that.getModel("modelPedido").setProperty("/IndiceFinal", vetorVenc[j].Kbetr);
						// 						}

						// 						break;
						// 					}
						// 				}

						// 				if (encontrou == "false" && result.Zterm != "") {

						// 					var aux = {
						// 						Zterm: result.Zterm,
						// 						IdVencimento: result.Zterm,
						// 						DescCond: result.DescCond
						// 					};

						// 					vetorVencContrato.push(aux);
						// 					that.getModel("modelVencimentos1").setData(vetorVencContrato);

						// 					if (String(result.AtlOrdem) == "true") {

						// 						that.getModel("modelPedido").setProperty("/IndiceFinal", result.IndiceContrato);
						// 					} else {

						// 						//Não possui vencimento cadastrado e vinculado para o representante.
						// 						that.getModel("modelPedido").setProperty("/IndiceFinal", 0);
						// 					}

						// 				}

						// 				if (result.Zterm == "") {
						// 					//Setar pagamento avista. Se tiver contrato mas nao tiver forma de pagamento do contrato definida

						// 					that.getModel("modelPedido").setProperty("/Vencimento", vetorVenc[0].Zterm);
						// 					that.getModel("modelPedido").setProperty("/IndiceFinal", vetorVenc[0].Kbetr);
						// 					that.getModelGlobal("modelPedido").setProperty("/Contrato", result.ContratoInterno);

						// 				} else {

						// 					that.getModelGlobal("modelPedido").setProperty("/Vencimento", result.Zterm); //Forma de pagamento setada no contrato
						// 					that.getModelGlobal("modelPedido").setProperty("/Contrato", result.ContratoInterno);
						// 				}

						// 				if (that.getModel("modelPedido").getProperty("/Vencimento") == "") {

						// 					that.byId("idVencimento1").setEnabled(true);

						// 				} else {

						// 					that.byId("idVencimento1").setEnabled(false);
						// 				}

						// 				var contrato = that.getModelGlobal("modelPedido").getProperty("/Contrato");
						// 				var limiteCred = parseFloat(that.getModel("modelCliente").getProperty("/CreditLimit"));

						// 				//Regra para quando tiver contrato e a rede for OUTROS. limpar tudo e deixar o kra setar a cond de pagto
						// 				// if(contrato != "" && result.Kvgr4 == 1){
						// 				if (contrato != "" && String(result.AtlOrdem) == "false" && result.Zterm == "") {

						// 					that.byId("idVencimento1").setEnabled(true);
						// 					that.getModelGlobal("modelPedido").setProperty("/Vencimento", "");
						// 					that.getModel("modelPedido").setProperty("/IndiceFinal", 0);

						// 				} else if (result.Zterm != "" && contrato != "" && limiteCred == 1) {

						// 					//Regra para limpar forma de pagamento quando o cliente nao
						// 					//possui limite de credito mas existe contrato ativo com Indice e Forma de pagamento setada
						// 					that.getModelGlobal("modelPedido").setProperty("/Vencimento", "");
						// 					that.getModel("modelPedido").setProperty("/IndiceFinal", 0);
						// 				}

						// 				// that.byId("idVencimento1").setEnabled(false);

						// 			} else {

						// 				that.getModel("modelVencimentos1").setData(that.vetorVencimentoTotal);
						// 			}

						// 			res();
						// 		},
						// 		error: function (error) {

						// 			that.onMensagemErroODATA(error);
						// 			rej();
						// 		}
						// 	});

						// }).then(function (data) {

						that._carregarVencimentosContrato().then(function (data) {

							new Promise(function (resLead, rejLead) {

								that.byId("idDataEntregaSugerida").setBusy(true);

								var IvTxjcd = that.getModelGlobal("modelPedido").getProperty("/Txjcd");


								that.oModel.read(
									"/P_LeadTimeR(IvBukrs='" + that.getModel("modelPedido").getProperty("/Bukrs") +
									"',IvRegCliente='" + that.getModelGlobal("modelPedido").getProperty("/RegCliente") +
									"',IvRegCentro='" + that.getModelGlobal("modelPedido").getProperty("/RegCentro") +
									"',IvTxjcd='" + IvTxjcd + "')",
									{
										success: function (result) {
											var leadTime = Number(result.Kbetr || 0);
											that.getModel("modelPedido").setProperty("/LeadTime", leadTime);

											// usa Date "limpa" (sem horário) + soma dias
											var hoje = new Date();
											hoje.setHours(0, 0, 0, 0);

											var dtSug = that.addDays(hoje, leadTime);
											var dataSugerida = that.formatDateBR(dtSug);

											that.getModel("modelPedido").setProperty("/DataEntregaSugerida", dataSugerida);

											that.byId("idDataEntregaSugerida").setBusy(false);
											resLead();
										},
										error: function (error) {
											that.byId("idDataEntregaSugerida").setBusy(false);
											rejLead();
											that.onMensagemErroODATA(error);
										}
									}
								);

							}).then(function (data) {

								new Promise(function (resTab, rejTab) {

									that.oModel.read("/TipoIntegraBol", {
										urlParameters: {
											"$filter": "IvUsuario eq '" + that.Usuario + "'"
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

											resTab();
										},
										error: function (error) {

											that.onMensagemErroODATA(error);
											rejTab();
										}
									});

								}).then(function (data) {

									var Cliente = that.getModel("modelCliente").getProperty("/Kunnr");
									var Bukrs = that.getModel("modelPedido").getProperty("/Bukrs");

									that.oModel.read("/P_TabPrecos(IvKunnr='" + Cliente + "',IvBukrs='" + Bukrs + "',IvRepres='" + that.Repres + "')", {
										success: function (result) {

											that.vetorTabPrecos = [];

											that.vetorTabPrecos.push(result);
											that.getModel("modelTabPrecos").setData(that.vetorTabPrecos);
										},
										error: function (error) {
											that.onMensagemErroODATA(error);
										}
									});

								}).catch(function () {
									that.byId("idDataEntregaSugerida").setBusy(false);
								});

							}).catch(function () {
								that.byId("idDataEntregaSugerida").setBusy(false);
							});

						}).catch(function () {

							that.byId("idContrato").setBusy(false);
							that.byId("idVencimento1").setBusy(false);
						});

					}).catch(function () {

						that.byId("idContrato").setBusy(false);
						that.byId("idVencimento1").setBusy(false);
					});
				}).catch(function (error) {

					that.byId("idTipoPedido").setBusy(false);
					that.onMensagemErroODATA(error);
				});
			}).catch(function (error) {

				that.byId("idTipoTransporte").setBusy(false);
				that.onMensagemErroODATA(error);
			});
		},

		_carregarVencimentosContrato: function () {
			var that = this;

			return new Promise(function (resolve, reject) {
				var oModelPedido = that.getModel("modelPedido");
				var oModelPedidoGlobal = typeof that.getModelGlobal === "function" ? that.getModelGlobal("modelPedido") : null;
				var oModelCliente = that.getModel("modelCliente");
				var oModelVencimentos = that.getModel("modelVencimentos1");
				var oCampoContrato = that.byId("idContrato");
				var oCampoVencimento = that.byId("idVencimento1");

				function normalizarTexto(value) {
					return value === undefined || value === null ? "" : String(value).trim();
				}

				function converterBooleano(value) {
					var sValue = normalizarTexto(value).toUpperCase();
					return value === true || sValue === "TRUE" || sValue === "X" || sValue === "S" || sValue === "SIM" || sValue === "1";
				}

				function converterNumero(value) {
					if (typeof value === "number") {
						return isNaN(value) ? 0 : value;
					}

					var sValue = normalizarTexto(value);

					if (sValue.indexOf(",") >= 0) {
						sValue = sValue.replace(/\./g, "").replace(",", ".");
					}

					var nValue = parseFloat(sValue);
					return isNaN(nValue) ? 0 : nValue;
				}

				function obterVetor(value) {
					if (Array.isArray(value)) {
						return value;
					}

					if (value && Array.isArray(value.results)) {
						return value.results;
					}

					return [];
				}

				function localizarVencimento(aVencimentos, sZterm) {
					for (var i = 0; i < aVencimentos.length; i++) {
						if (normalizarTexto(aVencimentos[i].Zterm) === sZterm) {
							return aVencimentos[i];
						}
					}

					return null;
				}

				function setPedidoProperty(sPath, value) {
					oModelPedido.setProperty(sPath, value);

					if (oModelPedidoGlobal && oModelPedidoGlobal !== oModelPedido) {
						oModelPedidoGlobal.setProperty(sPath, value);
					}
				}

				function finalizarBusy() {
					if (oCampoContrato) {
						oCampoContrato.setBusy(false);
					}

					if (oCampoVencimento) {
						oCampoVencimento.setBusy(false);
					}
				}

				function escaparParametroOData(value) {
					return normalizarTexto(value).replace(/'/g, "''");
				}

				var sBukrs = normalizarTexto(oModelPedido.getProperty("/Bukrs"));
				var sKvgr4 = normalizarTexto(oModelPedido.getProperty("/Kvgr4"));
				var sCaminho = "/P_ContratoR(IvBukrs='" + escaparParametroOData(sBukrs) + "',IvKvgr4='" + escaparParametroOData(sKvgr4) + "')";

				if (oCampoVencimento) {
					oCampoVencimento.setEnabled(true);
					oCampoVencimento.setBusy(true);
				}

				if (oCampoContrato) {
					oCampoContrato.setBusy(true);
				}

				try {
					that.oModel.read(sCaminho, {
						success: function (result) {
							try {
								var oResultado = result || {};
								var sContratoInterno = normalizarTexto(oResultado.ContratoInterno);
								var sZtermContrato = normalizarTexto(oResultado.Zterm);
								var bAtualizaOrdem = converterBooleano(oResultado.AtlOrdem);
								var nLimiteCredito = converterNumero(oModelCliente.getProperty("/CreditLimit"));
								var aVencimentosAtuais = obterVetor(oModelVencimentos.getData());
								var aVencimentosTotais = obterVetor(that.vetorVencimentoTotal);
								var aVencimentosBase = aVencimentosTotais.length > 0 ? aVencimentosTotais.slice() : aVencimentosAtuais.slice();

								if (sContratoInterno !== "") {
									setPedidoProperty("/Contrato", sContratoInterno);

									if (sZtermContrato !== "") {
										var oVencimentoEncontrado = localizarVencimento(aVencimentosBase, sZtermContrato);
										var nIndiceContrato = normalizarTexto(oResultado.IndiceContrato) !== "" ? oResultado.IndiceContrato : 0;

										if (oVencimentoEncontrado) {
											oModelVencimentos.setData(aVencimentosBase);
										} else {
											var aVencimentosComContrato = aVencimentosBase.slice();

											aVencimentosComContrato.push({
												Zterm: sZtermContrato,
												IdVencimento: sZtermContrato,
												DescCond: normalizarTexto(oResultado.DescCond),
												Kbetr: nIndiceContrato
											});

											oModelVencimentos.setData(aVencimentosComContrato);
										}

										setPedidoProperty("/Vencimento", sZtermContrato);
										setPedidoProperty("/IndiceFinal", nIndiceContrato);

										if (oCampoVencimento) {
											oCampoVencimento.setEnabled(false);
										}
									} else {
										oModelVencimentos.setData(aVencimentosBase);
										setPedidoProperty("/Vencimento", "");
										setPedidoProperty("/IndiceFinal", 0);

										if (oCampoVencimento) {
											oCampoVencimento.setEnabled(true);
										}
									}
								} else {
									oModelVencimentos.setData(aVencimentosBase);
									setPedidoProperty("/Contrato", "");
									setPedidoProperty("/Vencimento", "");
									setPedidoProperty("/IndiceFinal", 0);

									if (oCampoVencimento) {
										oCampoVencimento.setEnabled(true);
									}
								}

								resolve();

								if (oCampoVencimento) {
									oCampoVencimento.setEnabled(normalizarTexto(oModelPedido.getProperty("/Vencimento")) === "");
								}

								if (!bAtualizaOrdem && sZtermContrato === "") {
									setPedidoProperty("/Vencimento", "");
									setPedidoProperty("/IndiceFinal", 0);

									if (oCampoVencimento) {
										oCampoVencimento.setEnabled(true);
									}
								} else if (sZtermContrato !== "" && nLimiteCredito === 1) {
									setPedidoProperty("/Vencimento", "");
									setPedidoProperty("/IndiceFinal", 0);

									/*
									 * Mantido o comportamento original:
									 * o campo continua desabilitado quando não existe limite de crédito.
									 */
								}

								resolve();
							} catch (error) {
								reject(error);
							} finally {
								finalizarBusy();
							}
						},

						error: function (error) {
							finalizarBusy();

							try {
								that.onMensagemErroODATA(error);
							} finally {
								reject(error);
							}
						}
					});
				} catch (error) {
					finalizarBusy();
					reject(error);
				}
			});
		},

		Entrega: function (Bukrs) {

			var that = this;

			for (var i = 0; i < that.vetorLocaisEntregas.length; i++) {

				if (Bukrs == that.vetorLocaisEntregas[i].Bukrs || that.vetorLocaisEntregas[i].Bukrs == "") {

					that.vetorLocaisEntregasAux.push(that.vetorLocaisEntregas[i]);
				}
			}

			that.getModel("modelLocaisEntregas").setData(that.vetorLocaisEntregasAux);
			that.getModel("modelLocaisEntregas").refresh();

			// onCarregarLocal
		},

		onCarregarTipoPedido: function (Ped, TipoPedido) {

			var oPedido = Ped || {};
			var oModelCliente = this.getModel("modelCliente");
			var sOpTriangular = oModelCliente ? oModelCliente.getProperty("/OpTriangular") : "";
			var sTipoPedidoAtual = String(oPedido.TipoPedido || "").trim();
			var sOpTriangularNormalizada = String(sOpTriangular || "").trim().toUpperCase();
			var bPermiteProposta = sTipoPedidoAtual === "Proposta" || (TipoPedido && TipoPedido.DatFimValid != null);
			var bPermiteOperacaoTriangular = sOpTriangularNormalizada === "S" || sOpTriangularNormalizada === "SIM";
			var bOperacaoTriangularHistorica = sTipoPedidoAtual === "Operação Triangular" || sTipoPedidoAtual === "Operacao Triangular";

			this.vetorTipoPedidos = [];

			var adicionarTipoPedido = function (sTipoPedido) {
				var bJaAdicionado = this.vetorTipoPedidos.some(function (oItem) {
					return oItem.TipoPedido === sTipoPedido;
				});

				if (!bJaAdicionado) {
					this.vetorTipoPedidos.push({
						TipoPedido: sTipoPedido
					});
				}
			}.bind(this);

			adicionarTipoPedido("Normal");

			if (bPermiteProposta) {
				adicionarTipoPedido("Proposta");
			}

			if (bPermiteOperacaoTriangular || bOperacaoTriangularHistorica) {
				adicionarTipoPedido("Oper Triangular");
			}

			this.getModel("modelTipoPedidos").setData(this.vetorTipoPedidos);
		},

		// onCarregarTipoPedido: function (Ped, TipoPedido) {

		// 	this.vetorTipoPedidos = [];

		// 	if (Ped.TipoPedido == "Proposta") {

		// 		this.vetorTipoPedidos = [];

		// 		var aux = {
		// 			TipoPedido: "Normal"
		// 		};

		// 		this.vetorTipoPedidos.push(aux);

		// 		aux = {
		// 			TipoPedido: "Proposta"
		// 		};

		// 		this.vetorTipoPedidos.push(aux);

		// 	} else if (TipoPedido !== undefined && TipoPedido.DatFimValid !== null) {

		// 		this.vetorTipoPedidos = [];

		// 		var aux = {
		// 			TipoPedido: "Normal"
		// 		};

		// 		this.vetorTipoPedidos.push(aux);

		// 		aux = {
		// 			TipoPedido: "Proposta"
		// 		};

		// 		this.vetorTipoPedidos.push(aux);

		// 	} else {

		// 		var aux = {
		// 			TipoPedido: "Normal"
		// 		};

		// 		this.vetorTipoPedidos.push(aux);

		// 	}

		// 	this.getModel("modelTipoPedidos").setData(this.vetorTipoPedidos);
		// },

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

		// onChangeDataEntrega: function (Event) {

		// 	Date.prototype.addDays = function (days) {
		// 		var dat = new Date(this.valueOf());
		// 		dat.setDate(dat.getDate() + parseInt(days, 10));
		// 		return dat.toLocaleDateString("pt-BR");
		// 	};

		// 	Date.prototype.remDays = function (days) {
		// 		var dat = new Date(this.valueOf());
		// 		dat.setDate(dat.getDate() - parseInt(days - 1, 10));
		// 		return dat.toLocaleDateString("pt-BR");
		// 	};

		// 	this.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", true);

		// 	var Pedido = this.getModelGlobal("modelPedido").getData();

		// 	var DataEntrega = this.myFormatterDataRevert(Pedido.DataEntrega);
		// 	var DataEntregaSugerida = this.myFormatterDataRevert(Pedido.DataEntregaSugerida);

		// 	if (DataEntrega > DataEntregaSugerida) {

		// 		var date = new Date(Date.UTC(DataEntrega[1].ano, DataEntrega[1].mes - 1, DataEntrega[1].dia));
		// 		var dateDataLimite = date.remDays(Pedido.LeadTime);
		// 		this.getModelGlobal("modelPedido").setProperty("/DataLimite", dateDataLimite);

		// 	} else {

		// 		var data = this.onDataHora();
		// 		var dataLimite = data[2].dia + "/" + data[2].mes + "/" + data[2].ano;
		// 		this.getModelGlobal("modelPedido").setProperty("/DataLimite", dataLimite);
		// 	}
		// },

		onChangeDataEntrega: function (Event) {
			this.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", true);

			var Pedido = this.getModelGlobal("modelPedido").getData();

			// Se seu Pedido.DataEntrega já vem em dd/MM/yyyy, use direto
			// Se você realmente precisa do myFormatterDataRevert, me avisa que ajusto.
			var dtEntrega = this.parseDateBR(Pedido.DataEntrega);
			var dtSugerida = this.parseDateBR(Pedido.DataEntregaSugerida);

			// validações básicas
			if (!dtEntrega) {

				sap.m.MessageToast.show("Data de Entrega inválida.");
				return;
			}
			if (!dtSugerida) {

				// se não existir sugerida, cai no padrão "hoje"
				var hoje1 = new Date();
				hoje1.setHours(0, 0, 0, 0);
				this.getModelGlobal("modelPedido").setProperty("/DataLimite", this.formatDateBR(hoje1));
				return;
			}

			// compara por timestamp (seguro)
			if (dtEntrega.getTime() > dtSugerida.getTime()) {

				var lead = Number(Pedido.LeadTime || 0);

				// DataLimite = DataEntrega - LeadTime
				var dtLimite = this.removeDays(dtEntrega, lead);
				this.getModelGlobal("modelPedido").setProperty("/DataLimite", this.formatDateBR(dtLimite));
			} else {

				// senão: DataLimite = hoje
				var hoje = new Date();
				hoje.setHours(0, 0, 0, 0);
				this.getModelGlobal("modelPedido").setProperty("/DataLimite", this.formatDateBR(hoje));
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
			var statusPedido = that.getModelGlobal("modelPedido").getProperty("/IdStatusPedido");

			if (statusPedido == 3 || statusPedido == 4 || statusPedido == 2) {

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
								var oGridCampanhas = that.getModelGlobal("modelItensPedidoGrid"); oGridCampanhas.setData((oGridCampanhas.getData() || []).filter(function (o) { return CampanhaItemSupport.material(o.Matnr) !== CampanhaItemSupport.material(Matnr); }).map(CampanhaItemSupport.pendente));

								new Promise(function (res, rej) {

									that.onBuscarItensPedido(res, rej, NrPedido);

								}).then(function (dataItens) {

									that.vetorItensPedido = dataItens;

									if (that.vetorItensPedido.length == 0) {

										that.onBloquearCabecalho(true);
									}

									if (that.temItensLista(that.getModelGlobal("modelItensCampanha") ? that.getModelGlobal("modelItensCampanha").getData() : [])) {

										that.byId("strip0").setVisible(true);
									} else {

										that.byId("strip0").setVisible(false);
									}

									that.getModelGlobal("modelItensPedidoGrid").setData(that._prepararCampanhasGrid(that.vetorItensPedido));
									that.onAtualizarCampanhasPedido();
									that.getModelGlobal("modelItensPedidoGrid").refresh();

									const qtdCorGridInseridos = that.contarItensPedidoDigitados(that.vetorItensPedido);
									that.getModelGlobal("modelAux").setProperty("/ItensPedidoTab", qtdCorGridInseridos);

									// that.getModelGlobal("modelAux").setProperty("/ItensPedidoTab", that.vetorItensPedido.length);
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

			if (Pedido.IdStatusPedido == '1') {

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

							const qtdCorGridInseridos = that.contarItensPedidoDigitados(that.vetorItensPedido);
							that.getModelGlobal("modelAux").setProperty("/ItensPedidoTab", qtdCorGridInseridos);

							// that.getModelGlobal("modelAux").setProperty("/ItensPedidoTab", that.vetorItensPedido.length);

							if (!that.onCalculaDescBoletoReduzido()) { return; }
                            that.onValidacoesCampanha();
							that.onValidacoesCampanhaEscal();
							that.onCalculaPrecoDebitarVerba();
							that.onCalculaRentabilidade();

							that.getModel("modelPedido").refresh();
						}
					}

				} else {

					//Validações na primeira e segunda aba
				}
			}
		},

		onValidacoesCampanha: function () {

			var pedido = this.getModel("modelPedido").getData();

			if (pedido.ValDescAplicarBol == "" || pedido.ValDescAplicarBol < 0) {
				pedido.ValDescAplicarBol = 0;
			}

			if (pedido.ValDescAplicar == "" || pedido.ValDescAplicar < 0) {
				pedido.ValDescAplicar = 0;
			}

			var ValDescDisp = parseFloat(pedido.ValDescDisp);
			var MotivoDescNota = pedido.MotivoDescNota;
			var ValDescAplicar = parseFloat(pedido.ValDescAplicar);
			var MotivoDescBoleto1 = pedido.MotivoDescBoleto1;
            var valoresBoleto;
            try { valoresBoleto = this._valoresLimiteBoleto(); }
            catch (e) { this._estadoDescontoBoleto(e.message); return; }
            // O limite incide sobre o liquido digitado; o bruto calculado continua no modelo.
            var ValDescAplicarBol = valoresBoleto.digitado;
            var ValDescDispTotal = valoresBoleto.disponivel;

			if (ValDescDisp < 0) {

				pedido.ValDescDisp = 0;
				console.log("Valor Desconto Disp foi zerado por estar negativo.");
			}

            var ValDescBoletoPerm = valoresBoleto.limite;

            if (valoresBoleto.centavosDigitado > valoresBoleto.centavosLimite) {

				this.byId("idTopLevelIconTabBar").setSelectedKey("tab4");
				this.byId("idDescontoAplicarBoletoReduz").focus();

				this.byId("idDescontoAplicarBoletoReduz").setValueState("Error");

				var valor = this.onFormatNumberController(ValDescBoletoPerm);
				this.byId("idDescontoAplicarBoletoReduz").setValueStateText("O valor permitido para desconto Boleto é de R$ " + valor);

			} else if ((valoresBoleto.centavosDigitado + valoresBoleto.centavosNota) > valoresBoleto.centavosDisponivel) {

				this.byId("idTopLevelIconTabBar").setSelectedKey("tab4");
				this.byId("idDescontoAplicar").focus();

				this.byId("idDescontoAplicar").setValueState("Error");
				this.byId("idDescontoAplicarBoletoReduz").setValueState("Error");

				var valor = this.onFormatNumberController(ValDescDispTotal);
				this.byId("idDescontoAplicar").setValueStateText("A soma de NF e boleto digitado excede trade + desconto disponível de R$ " + valor);
				this.byId("idDescontoAplicarBoletoReduz").setValueStateText("A soma de NF e boleto digitado excede trade + desconto disponível de R$ " + valor);

			} else {

				this.byId("idDescontoAplicar").setValueState("None");
				this.byId("idDescontoAplicarBoletoReduz").setValueState("None");

				this.byId("idDescontoAplicar").setValueStateText("");
				this.byId("idDescontoAplicarBoletoReduz").setValueStateText("");

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

			if (pedido.ValDescCampInform == "" || pedido.ValDescCampInform < 0) {
				pedido.ValDescCampInform = 0;
			}

			var ValDescCampDisp = pedido.ValDescCampDisp;
			var ValDescCampInform = pedido.ValDescCampInform;
			var MotivoDescCamp = pedido.MotivoDescCamp;

			if (ValDescCampDisp < 0) {

				pedido.ValDescCampDisp = 0;
				console.log("Valor Camp Disp foi zerado por estar negativo.");
			}

			if (ValDescCampInform > ValDescCampDisp) {

				this.byId("idTopLevelIconTabBar").setSelectedKey("tab4");
				this.byId("idDescontoAplicarCamp").focus();

				this.byId("idDescontoAplicarCamp").setValueState("Error");

				var valor = this.onFormatNumberController(ValDescCampDisp);
				this.byId("idDescontoAplicarCamp").setValueStateText("A soma dos descontos é maior que o permitido de R$ " + valor);
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

			if (pedido.ValDescCampInformBol == "" || pedido.ValDescCampInformBol < 0) {
				pedido.ValDescCampInformBol = 0;
			}

			var ValDescCampDispBol = pedido.ValDescCampDispBol;
			var ValDescCampInformBol = pedido.ValDescCampInformBol;
			var MotivoDescBoleto2 = pedido.MotivoDescBoleto2;

			if (ValDescCampDispBol < 0) {

				pedido.ValDescCampDispBol = 0;
				console.log("Valor Camp Disp Bol foi zerado por estar negativo.");
			}

			if (ValDescCampInformBol > ValDescCampDispBol) {

				this.byId("idTopLevelIconTabBar").setSelectedKey("tab4");
				this.byId("idDescontoAplicarCampBol").focus();

				this.byId("idDescontoAplicarCampBol").setValueState("Error");

				var valor = this.onFormatNumberController(ValDescCampDispBol);
				this.byId("idDescontoAplicarCampBol").setValueStateText("A soma dos descontos é maior que o permitido de R$ " + valor);
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

			if (pedido.TipoPedido == "Proposta") {
				this.byId("idTextCamp").setVisible(false);
				this.byId("idBtnCamp").setVisible(false);
			} else {
				this.byId("idTextCamp").setVisible(true);
				this.byId("idBtnCamp").setVisible(true);
			}
		},

		onValidacoesCampanhaEscal: function () {

			var pedido = this.getModel("modelPedido").getData();

			if (pedido.ValDescInformBolCe == "" || pedido.ValDescInformBolCe < 0) {
				pedido.ValDescInformBolCe = 0;
			}

			if (pedido.ValDescInformCe == "" || pedido.ValDescInformCe < 0) {
				pedido.ValDescInformCe = 0;
			}

			var MotivoDescCe = pedido.MotivoDescCe;
			var ValDescInformCe = pedido.ValDescInformCe;
			var ValDescDispCe = parseFloat(pedido.ValDescDispCe);

			if (ValDescInformCe < 0) {

				pedido.ValDescInformCe = 0;
				console.log("Valor Desc Disp Camp CE foi zerado por estar negativo.");
			}

			if (ValDescInformCe > ValDescDispCe) {

				this.byId("idTopLevelIconTabBar").setSelectedKey("tab4");
				this.byId("idDescontoAplicarCe").focus();

				this.byId("idDescontoAplicarCe").setValueState("Error");

				var valor = this.onFormatNumberController(ValDescDispCe);
				this.byId("idDescontoAplicarCe").setValueStateText("A soma dos descontos é maior que o permitido de R$ " + valor);
				return;

			} else {

				if ((ValDescInformCe > 0) && MotivoDescCe == "") {

					this.byId("idTopLevelIconTabBar").setSelectedKey("tab4");
					this.byId("idDescontoPedidoCe").focus();

					this.byId("idDescontoPedidoCe").setValueState("Error");
					this.byId("idDescontoPedidoCe").setValueStateText("Preencher o motivo de desconto!");
					return;

				} else {

					this.byId("idDescontoPedidoCe").setValueState("None");
					this.byId("idDescontoPedidoCe").setValueStateText("");

					this.byId("idDescontoAplicarCe").setValueState("None");
					this.byId("idDescontoAplicarCe").setValueStateText("");

				}
			}

			var MotivoDescBolCe = pedido.MotivoDescBolCe;
			var ValDescDispBolCe = parseFloat(pedido.ValDescDispBolCe);
			var ValDescInformBolCe = pedido.ValDescInformBolCe;

			if (ValDescDispBolCe < 0) {

				pedido.ValDescDispBolCe = 0;
				console.log("Valor Desc Disp Camp Bol CE foi zerado por estar negativo.");
			}

			if (ValDescInformBolCe > ValDescDispBolCe) {

				this.byId("idTopLevelIconTabBar").setSelectedKey("tab4");
				this.byId("idDescontoAplicarCampBolEscal").focus();

				this.byId("idDescontoAplicarCampBolEscal").setValueState("Error");

				var valor = this.onFormatNumberController(ValDescDispBolCe);
				this.byId("idDescontoAplicarCampBolEscal").setValueStateText("A soma dos descontos é maior que o permitido de R$ " + valor);
				return;

			} else {

				if ((ValDescInformBolCe > 0) && MotivoDescBolCe == "") {

					this.byId("idTopLevelIconTabBar").setSelectedKey("tab4");
					this.byId("idDescontoPedidoCampBolEscal").focus();

					this.byId("idDescontoPedidoCampBolEscal").setValueState("Error");
					this.byId("idDescontoPedidoCampBolEscal").setValueStateText("Preencher o motivo de desconto!");
					return;

				} else {

					this.byId("idDescontoAplicarCampBolEscal").setValueStateText("");
					this.byId("idDescontoAplicarCampBolEscal").setValueState("None");

					this.byId("idDescontoPedidoCampBolEscal").setValueStateText("");
					this.byId("idDescontoPedidoCampBolEscal").setValueState("None");

					console.log("Validações da Campanha estão OK!");
				}
			}

			if (pedido.TipoPedido == "Proposta") {

				this.byId("idTextCE").setVisible(false);
				this.byId("idBtnCE").setVisible(false);
			} else {

				this.byId("idTextCE").setVisible(true);
				this.byId("idBtnCE").setVisible(true);
			}
		},

		onBloquearCabecalho: function (bloqueio) {

			this.byId("idEstabelecimento").setEnabled(bloqueio);
			this.byId("idTabelaPreco").setEnabled(bloqueio);
			this.byId("idVencimento1").setEnabled(bloqueio);
			this.byId("idDataLimite").setEnabled(false);
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

		onAtualizarCampanhasPedido: function () {
			var that = this;
			var NrPedido = this.getModelGlobal("modelPedido").getProperty("/NrPedido");
			return this.onCarregarItensCampanha(NrPedido).then(function () {
				var oAviso = that.byId("strip0");
				if (oAviso) { oAviso.setVisible(that.temItensLista(that.getModelGlobal("modelItensCampanha").getData())); }
			}).catch(function (oErro) {
				// var oAviso = that.byId("strip0");
				// if (oAviso) { oAviso.setVisible(false); }
				// MessageBox.warning("O pedido foi carregado, mas não foi possível consultar as campanhas: " + (oErro.message || "verifique o serviço SAP."));
			});
		},

		formatarDescricaoItem: function (sDescricao) {
			return ItemPedidoSupport.formatarDescricao(sDescricao);
		},

		formatarDescontoItem: function (vValorVenda, vLiquidoTabela) {
			return ItemPedidoSupport.formatarDesconto(vValorVenda, vLiquidoTabela);
		},

		formatarDataItem: function (vData) { return ItemPedidoSupport.formatarData(vData); },

		onDetalhesItemPress: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("modelItensPedidoGrid");
			if (oContext) {
				ItemPedidoSupport.abrirDetalhes(this, oContext.getObject());
			}
		},

        onAplicarCampanhaItemGrid: function (oEvent) {
            if (this._navegacaoCampanhaEmAndamento) { return; }
            var oContexto = oEvent.getSource().getBindingContext("modelItensPedidoGrid");
            var oPedido = this.getModelGlobal("modelPedido").getData();
            if (!oContexto || ["2", "3", "4"].indexOf(String(oPedido.IdStatusPedido)) >= 0) { return; }
            var oItem = oContexto.getObject(), c = CampanhaItemSupport.contrato(this.oModel.getMetaModel());
            if (!c.ConsumoAutomatico || !c.ConsumoGrade || CampanhaItemSupport.precoComSaldoCampanha(oItem, c.EscalaPrecoCampanha) === null) { return; }
            // A tela de itens executa a mesma rotina do botao apos reler o pedido.
            this.setModelGlobal(new JSONModel({ NrPedido: oPedido.NrPedido, Kunnr: oPedido.Kunnr, Werks: oPedido.Werks, Matnr: oItem.Matnr, AplicarCampanha: true }), "modelItemParaEdicao");
            this._navegacaoCampanhaEmAndamento = true;
            this.getModel("modelItensUI").setProperty("/Processando", true);
            this.getRouter().navTo("pedidoDetalheItens");
        },

		onEditarItemGridPress: function (oEvent) {
			var oSource = oEvent.getSource();
			var oContext = oSource.getBindingContext("modelItensPedidoGrid");
			var sStatus = String(this.getModelGlobal("modelPedido").getProperty("/IdStatusPedido"));
			if (!oContext) {
				return;
			}
			if (sStatus === "2" || sStatus === "3" || sStatus === "4") {
				MessageBox.warning("Este pedido não pode mais ser alterado.");
				return;
			}
			var oItem = oContext.getObject();
			var oPedido = this.getModelGlobal("modelPedido").getData();
			// Modelo exclusivo da navegação; não pertence ao payload do pedido.
			this.setModelGlobal(new JSONModel({ NrPedido: oPedido.NrPedido, Kunnr: oPedido.Kunnr, Werks: oPedido.Werks, Matnr: oItem.Matnr }), "modelItemParaEdicao");
			this.getRouter().navTo("pedidoDetalheItens");
		},

		onNovoItem: function () {

			console.log("onitempress standard");
			var that = this;

			var statusPedido = this.getModelGlobal("modelPedido").getProperty("/IdStatusPedido");
			var tipoPedido = this.getModelGlobal("modelPedido").getProperty("/TipoPedido");
			that.oItemPedido = [];

			if (statusPedido == 3 || statusPedido == 4 || statusPedido == 2) {

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

				var oEdicaoPendente = this.getModelGlobal("modelItemParaEdicao");
				if (oEdicaoPendente) { oEdicaoPendente.setData(null); }
				sap.ui.core.UIComponent.getRouterFor(this).navTo("pedidoDetalheItens");
			}
		},

		// onFinalizarPedido: function () {

		// 	var that = this;

		// 	var Pedido = this.getModel("modelPedido").getData();

		// 	var totalItens = that.getModel("modelItensPedidoGrid").getData().length;

		// 	if (totalItens <= 0) {

		// 		sap.m.MessageBox.show("O pedido deve conter no mínimo 1 item.", {
		// 			icon: sap.m.MessageBox.Icon.ERROR,
		// 			title: "Falha ao Completar Pedido",
		// 			actions: [MessageBox.Action.OK]
		// 		});

		// 	} else if (Pedido.TipoPedido !== "Proposta" && parseFloat(Pedido.ValMinPed) > parseFloat(Pedido.ValorTotal)) {

		// 		sap.m.MessageBox.show("Pedido não atingiu o valor mínimo estipulado pela empresa de R$: " + parseFloat(Pedido.ValMinPed), {
		// 			icon: sap.m.MessageBox.Icon.ERROR,
		// 			title: "Falha ao Completar Pedido",
		// 			actions: [MessageBox.Action.OK]
		// 		});

		// 	} else if (Pedido.IdStatusPedido == 3 || Pedido.IdStatusPedido == 4 || Pedido.IdStatusPedido == 2) {

		// 		sap.m.MessageBox.show("Este pedido não pode mais ser alterado", {
		// 			icon: sap.m.MessageBox.Icon.WARNING,
		// 			title: "Não Permitido",
		// 			actions: [MessageBox.Action.OK]
		// 		});

		// 	} else {

		// 		that.byId("idPedidoDetalhe").setBusy(true);

		// 		var data = this.onDataHora();

		// 		Pedido.SituacaoPedido = "PEND";
		// 		Pedido.IdStatusPedido = 2;
		// 		Pedido.DataFim = data[0];
		// 		Pedido.HoraFim = data[1];
		// 		Pedido.Completo = true;
		// 		Pedido.UsuarioEnvio = that.getModelGlobal("modelAux").getProperty("/CodRepres");

		// 		that.onLimparValueState("None");

		// 		Pedido = that.onFormatNumberPedido(Pedido);
		// 		Pedido = that.onDeleteProperties(Pedido);

		// 		that.byId("idPedidoDetalhe").setBusy(true);

		// 		new Promise(function (res, rej) {

		// 			that.onInserirPedido(Pedido, res, rej, that);

		// 		}).then(function (dataPed) {

		// 			if (dataPed.TipoErro == "E") {

		// 				sap.m.MessageBox.show(dataPed.MsgErro, {
		// 					icon: sap.m.MessageBox.Icon.ERROR,
		// 					title: "Não Permitido",
		// 					actions: [MessageBox.Action.OK],
		// 					onClose: function () {

		// 						Pedido.SituacaoPedido = "EM DIGITAÇÃO";
		// 						Pedido.IdStatusPedido = '1';
		// 						Pedido.DataFim = "";
		// 						Pedido.HoraFim = "";
		// 						Pedido.Completo = false;
		// 						that.byId("idPedidoDetalhe").setBusy(false);
		// 					}
		// 				});

		// 			} else {

		// 				sap.m.MessageBox.show("Pedido salvo com sucesso !! \n\n Deseja enviar o pedido agora ?", {
		// 					icon: sap.m.MessageBox.Icon.SUCCESS,
		// 					title: "Sucesso!",
		// 					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO, 'Exporta Excel'],
		// 					emphasizedAction: "Exporta Excel",

		// 					onClose: function (oAction) {

		// 						that.onResetarDadosPedido();

		// 						if (oAction == 'Exporta Excel') {

		// 							that.onExportarPedidoExcel();
		// 							sap.ui.core.UIComponent.getRouterFor(that).navTo("pedido");

		// 						} else if (oAction == sap.m.MessageBox.Action.NO) {

		// 							sap.ui.core.UIComponent.getRouterFor(that).navTo("pedido");
		// 						} else {

		// 							new Promise(function (res, rej) {

		// 								Pedido.SituacaoPedido = "FIN";
		// 								Pedido.IdStatusPedido = 3;
		// 								Pedido.DataFim = data[0];
		// 								Pedido.HoraFim = data[1];
		// 								Pedido.Completo = true;

		// 								that.onLimparValueState("None");

		// 								Pedido = that.onFormatNumberPedido(Pedido);
		// 								Pedido = that.onDeleteProperties(Pedido);

		// 								that.onInserirPedido(Pedido, res, rej, that);

		// 							}).then(function (dataPedSalvo) {

		// 								if (dataPedSalvo.TipoErro == "E") {

		// 									sap.m.MessageBox.show(dataPedSalvo.MsgErro, {
		// 										icon: sap.m.MessageBox.Icon.ERROR,
		// 										title: "Não Permitido",
		// 										actions: [MessageBox.Action.OK],
		// 										onClose: function () {

		// 											that.byId("idPedidoDetalhe").setBusy(false);
		// 										}
		// 									});

		// 								} else {

		// 									sap.m.MessageBox.show("Pedido enviado com sucesso !! \n\n Número Pedido SAP: " + dataPedSalvo.Vbeln, {
		// 										icon: sap.m.MessageBox.Icon.SUCCESS,
		// 										title: "Sucesso!",
		// 										actions: ["OK"],
		// 										onClose: function (oAction) {

		// 											sap.ui.core.UIComponent.getRouterFor(that).navTo("pedido");

		// 											that.byId("idPedidoDetalhe").setBusy(false);
		// 											that.onLiberarAbas();
		// 										},
		// 									});
		// 								}

		// 							}).catch(function (error) {

		// 								that.byId("idPedidoDetalhe").setBusy(false);
		// 								that.onMensagemErroODATA(error);
		// 							});
		// 						}
		// 					}
		// 				});
		// 			}
		// 		}).catch(function (error) {

		// 			Pedido.SituacaoPedido = "EM DIGITAÇÃO";
		// 			Pedido.IdStatusPedido = '1';
		// 			Pedido.DataFim = "";
		// 			Pedido.HoraFim = "";
		// 			Pedido.Completo = false;

		// 			that.byId("idPedidoDetalhe").setBusy(false);
		// 			that.onMensagemErroODATA(error);
		// 		});
		// 	}
		// },

		onFinalizarPedido: function () {
            if (!this._validarBoletoAntesGravar()) { return; }
			if (!this._validarCampanhasFinalizacao()) { return; }

			var that = this;

			var Pedido = this.getModel("modelPedido").getData();

			var totalItens = that.getModel("modelItensPedidoGrid").getData().length;

			if (totalItens <= 0) {

				sap.m.MessageBox.show(
					"O pedido deve conter no mínimo 1 item.",
					{
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Falha ao Completar Pedido",
						actions: [sap.m.MessageBox.Action.OK]
					}
				);

				return;
			}

			if (
				Pedido.TipoPedido !== "Proposta" &&
				parseFloat(Pedido.ValMinPed) > parseFloat(Pedido.ValorTotal)
			) {

				sap.m.MessageBox.show(
					"Pedido não atingiu o valor mínimo estipulado pela empresa de R$: " +
					parseFloat(Pedido.ValMinPed),
					{
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Falha ao Completar Pedido",
						actions: [sap.m.MessageBox.Action.OK]
					}
				);

				return;
			}

			if (
				// String(Pedido.IdStatusPedido) === "2" ||
				String(Pedido.IdStatusPedido) === "3"
				// || String(Pedido.IdStatusPedido) === "4"
			) {

				sap.m.MessageBox.show(
					"Este pedido não pode mais ser alterado.",
					{
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Não Permitido",
						actions: [sap.m.MessageBox.Action.OK]
					}
				);

				return;
			}

			/*
			 * Abre o popup antes de iniciar o salvamento.
			 */
			this._obterTextoAprovacao(Pedido)
				.then(function (sTextoAprovacao) {

					if (String(Pedido.IdStatusPedido) === "2") {

						Pedido.TextoAprovacao = sTextoAprovacao;

						that.getModel("modelPedido").setProperty("/TextoAprovacao", sTextoAprovacao);
					}

					that.byId("idPedidoDetalhe").setBusy(true);

					var data = that.onDataHora();

					Pedido.SituacaoPedido = "PEND";
					Pedido.IdStatusPedido = 2;
					Pedido.DataFim = data[0];
					Pedido.HoraFim = data[1];
					Pedido.Completo = true;
					Pedido.UsuarioEnvio = that
						.getModelGlobal("modelAux")
						.getProperty("/CodRepres");

					that.onLimparValueState("None");

					Pedido = that.onFormatNumberPedido(Pedido);
					Pedido = that.onDeleteProperties(Pedido);

					return new Promise(function (res, rej) {
						that.onInserirPedido(Pedido, res, rej, that);
					}).then(function (dataPed) {

						if (dataPed.TipoErro === "E") {

							sap.m.MessageBox.show(dataPed.MsgErro, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Não Permitido",
								actions: [sap.m.MessageBox.Action.OK],

								onClose: function () {

									Pedido.SituacaoPedido = "EM DIGITAÇÃO";
									Pedido.IdStatusPedido = "1";
									Pedido.DataFim = "";
									Pedido.HoraFim = "";
									Pedido.Completo = false;

									that.getModel("modelPedido").setProperty(
										"/SituacaoPedido",
										"EM DIGITAÇÃO"
									);

									that.getModel("modelPedido").setProperty(
										"/IdStatusPedido",
										"1"
									);

									that.getModel("modelPedido").setProperty(
										"/DataFim",
										""
									);

									that.getModel("modelPedido").setProperty(
										"/HoraFim",
										""
									);

									that.getModel("modelPedido").setProperty(
										"/Completo",
										false
									);

									that.byId("idPedidoDetalhe").setBusy(false);
								}
							});

							return;
						}

						sap.m.MessageBox.show(
							"Pedido salvo com sucesso!\n\nDeseja enviar o pedido agora?",
							{
								icon: sap.m.MessageBox.Icon.SUCCESS,
								title: "Sucesso!",
								actions: [
									sap.m.MessageBox.Action.YES,
									sap.m.MessageBox.Action.NO,
									"Exporta Excel"
								],
								emphasizedAction: "Exporta Excel",

								onClose: function (oAction) {

									that.onResetarDadosPedido();

									if (oAction === "Exporta Excel") {

										that.onExportarPedidoExcel();

										sap.ui.core.UIComponent
											.getRouterFor(that)
											.navTo("pedido");

										that.byId("idPedidoDetalhe").setBusy(false);

										return;
									}

									if (oAction === sap.m.MessageBox.Action.NO) {

										sap.ui.core.UIComponent
											.getRouterFor(that)
											.navTo("pedido");

										that.byId("idPedidoDetalhe").setBusy(false);

										return;
									}

									if (oAction !== sap.m.MessageBox.Action.YES) {
										that.byId("idPedidoDetalhe").setBusy(false);
										return;
									}

									that.byId("idPedidoDetalhe").setBusy(true);

									new Promise(function (res, rej) {

										Pedido.SituacaoPedido = "FIN";
										Pedido.IdStatusPedido = 3;
										Pedido.DataFim = data[0];
										Pedido.HoraFim = data[1];
										Pedido.Completo = true;

										/*
										 * O texto informado continua no objeto
										 * durante o envio definitivo.
										 */
										Pedido.TextoAprovacao = sTextoAprovacao;

										that.onLimparValueState("None");

										Pedido = that.onFormatNumberPedido(Pedido);
										Pedido = that.onDeleteProperties(Pedido);

										that.onInserirPedido(
											Pedido,
											res,
											rej,
											that
										);

									}).then(function (dataPedSalvo) {

										if (dataPedSalvo.TipoErro === "E") {

											sap.m.MessageBox.show(
												dataPedSalvo.MsgErro,
												{
													icon:
														sap.m.MessageBox.Icon.ERROR,
													title: "Não Permitido",
													actions: [
														sap.m.MessageBox.Action.OK
													],
													onClose: function () {
														that
															.byId("idPedidoDetalhe")
															.setBusy(false);
													}
												}
											);

											return;
										}

										sap.m.MessageBox.show(
											"Pedido enviado com sucesso!" +
											"\n\nNúmero Pedido SAP: " +
											dataPedSalvo.Vbeln,
											{
												icon:
													sap.m.MessageBox.Icon.SUCCESS,
												title: "Sucesso!",
												actions: [
													sap.m.MessageBox.Action.OK
												],

												onClose: function () {

													sap.ui.core.UIComponent
														.getRouterFor(that)
														.navTo("pedido");

													that
														.byId("idPedidoDetalhe")
														.setBusy(false);

													that.onLiberarAbas();
												}
											}
										);

									}).catch(function (error) {

										that.byId("idPedidoDetalhe").setBusy(false);
										that.onMensagemErroODATA(error);

										new Promise(function (res, rej) {

											that.onBuscarItensPedido(res, rej, that.getModelGlobal("modelAux").getProperty("/NrPedido"));

										}).then(function (dataItens) {

											that.vetorItensPedido = dataItens;
											that.getModelGlobal("modelItensPedidoGrid").setData(that._prepararCampanhasGrid(that.vetorItensPedido));
											that.onAtualizarCampanhasPedido();
											that.getModelGlobal("modelItensPedidoGrid").refresh();
										}).catch(function (error) {

											that.byId("idPedidoDetalhe").setBusy(false);
											that.onMensagemErroODATA(error);
										});
									});
								}
							}
						);
					});
				})
				.catch(function (oError) {

					/*
					 * Cancelamento do popup não é erro de integração.
					 */
					if (oError && oError.cancelado) {
						return;
					}

					that.byId("idPedidoDetalhe").setBusy(false);
					that.onMensagemErroODATA(oError);
				});
		},
		_abrirPopupTextoAprovacao: function () {

			return new Promise(function (resolve, reject) {

				var oTextArea = new sap.m.TextArea({
					width: "100%",
					rows: 6,
					maxLength: 500,
					growing: true,
					growingMaxLines: 10,
					placeholder: "Informe o motivo ou observação para aprovação...",
					showExceededText: true,
					liveChange: function (oEvent) {

						var sTexto = oEvent.getParameter("value") || "";

						oBtnConfirmar.setEnabled(sTexto.trim().length > 0);

						oTextArea.setValueState(
							sTexto.trim().length > 0 ? "None" : "Error"
						);

						oTextArea.setValueStateText(
							sTexto.trim().length > 0
								? ""
								: "Informe o texto de aprovação."
						);
					}
				});

				var oBtnConfirmar = new sap.m.Button({
					text: "Confirmar",
					type: "Emphasized",
					enabled: false,
					press: function () {

						var sTextoAprovacao = oTextArea.getValue().trim();

						if (!sTextoAprovacao) {
							oTextArea.setValueState("Error");
							oTextArea.setValueStateText(
								"Informe o texto de aprovação."
							);
							oTextArea.focus();
							return;
						}

						oDialog.close();
						resolve(sTextoAprovacao);
					}
				});

				var oBtnCancelar = new sap.m.Button({
					text: "Cancelar",
					press: function () {
						oDialog.close();
						reject({
							cancelado: true
						});
					}
				});

				var oDialog = new sap.m.Dialog({
					title: "Texto para aprovação",
					type: "Message",
					contentWidth: "35rem",
					draggable: true,
					resizable: true,
					content: [
						new sap.m.VBox({
							width: "100%",
							class: "sapUiSmallMargin",
							items: [
								new sap.m.Label({
									text: "Observação para aprovação",
									required: true,
									labelFor: oTextArea
								}),
								oTextArea
							]
						})
					],
					beginButton: oBtnConfirmar,
					endButton: oBtnCancelar,
					afterOpen: function () {
						oTextArea.focus();
					},
					afterClose: function () {
						oDialog.destroy();
					}
				});

				oDialog.open();
			});
		},
		_obterTextoAprovacao: function (oPedido) {

			var sStatus = String(oPedido.IdStatusPedido || "");

			if (sStatus === "2" || sStatus === "1") {
				return this._abrirPopupTextoAprovacao();
			}

			/*
			 * Para os demais status, não abre o popup.
			 * Retorna o texto já existente ou vazio para manter
			 * a sequência de Promises funcionando normalmente.
			 */
			return Promise.resolve(oPedido.TextoAprovacao || "");
		},

		onAbrirTela: function () {

			var oModelDelay = new JSONModel({
				"table": false
			});

			this.getView().setModel(oModelDelay, "modelDelay");

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}

			if (!this._CreateMaterialFragment) {

				this._ItemDialog = sap.ui.xmlfragment(
					"application.view.ItensCampanha",
					this
				);
				this.getView().addDependent(this._ItemDialog);
			}

			this._ItemDialog.open();
		},

		onAbrirTelaEscal: function () {

			var oModelDelay = new JSONModel({
				"table": false
			});

			this.getView().setModel(oModelDelay, "modelDelay");

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}

			if (!this._CreateMaterialFragment) {

				this._ItemDialog = sap.ui.xmlfragment(
					"application.view.ItensCampanhaEscal",
					this
				);
				this.getView().addDependent(this._ItemDialog);
			}

			this._ItemDialog.open();
		},

		onBuscarCampanhaAtiva: function () {

			var that = this;

			var aux = {
				dialog: true
			};

			var modelDialog = new JSONModel(aux);
			that.setModel(modelDialog, "modelDelay");

			that.oModel.read("/P_ItensCampQ", {
				urlParameters: {
					"$filter": "EvNrPedido eq '" + that.getModel("modelPedido").getProperty("/NrPedido") + "'"
				},
				success: function (result) {

					var modelItensCamp = new JSONModel(result.results);
					that.setModel(modelItensCamp, "modelItensCampanha");

					that.getModel("modelDelay").setProperty("/dialog", false);
				},
				error: function (error) {

					that.getModel("modelDelay").setProperty("/dialog", false);
					that.onMensagemErroODATA(error);
				}
			});
		},
		onBuscarCampanhaAtivaEscal: function () {

			var that = this;

			var aux = {
				dialog: true
			};

			var modelDialog = new JSONModel(aux);
			that.setModel(modelDialog, "modelDelay");

			that.oModel.read("/P_itensCampEscalQ", {
				urlParameters: {
					"$filter": "EvNrPedido eq '" + that.getModel("modelPedido").getProperty("/NrPedido") + "'"
				},
				success: function (result) {

					var total = 0;

					var aux = {
						QtdPedida: 0,
						ValorTotal: 0,
						QtdDe: 0,
						QtdAte: 0,
						CodCampanha: "",
						DescCampanha: ""
					};

					var vetorTotais = [];

					for (var i = 0; i < result.results.length; i++) {

						// if (aux.CodCampanha == "") {
						if (i == 0) {

							aux.CodCampanha = result.results[i].CodCampanha;
							aux.DescCampanha = result.results[i].DescCampanha;
							aux.QtdDe = parseFloat(result.results[i].QtdDe);
							aux.QtdAte = parseFloat(result.results[i].QtdAte);
							aux.QtdPedida = parseFloat(result.results[i].QtdPedida);
							aux.ValorTotal = parseFloat(result.results[i].ValorTotal);

						} else {

							//Ultimo registro
							if (result.results.length == i + 1) {

								if (result.results[i].CodCampanha == aux.CodCampanha) {

									aux.QtdPedida += parseFloat(result.results[i].QtdPedida);
									aux.ValorTotal += parseFloat(result.results[i].ValorTotal);

									vetorTotais.push(aux);

								} else {

									vetorTotais.push(aux);

									var aux = {
										QtdPedida: parseFloat(result.results[i].QtdPedida),
										ValorTotal: parseFloat(result.results[i].ValorTotal),
										QtdDe: parseFloat(result.results[i].QtdDe),
										QtdAte: parseFloat(result.results[i].QtdAte),
										CodCampanha: result.results[i].CodCampanha,
										DescCampanha: result.results[i].DescCampanha
									};

									vetorTotais.push(aux);
								}
							} else if (result.results[i].CodCampanha != aux.CodCampanha) {

								vetorTotais.push(aux);

								var aux = {
									QtdPedida: parseFloat(result.results[i].QtdPedida),
									ValorTotal: parseFloat(result.results[i].ValorTotal),
									QtdDe: parseFloat(result.results[i].QtdDe),
									QtdAte: parseFloat(result.results[i].QtdAte),
									CodCampanha: result.results[i].CodCampanha,
									DescCampanha: result.results[i].DescCampanha
								};

							} else {

								aux.QtdPedida += parseFloat(result.results[i].QtdPedida);
								aux.ValorTotal += parseFloat(result.results[i].ValorTotal);
							}
						}
					}

					var modelItensCamp = new JSONModel(result.results);
					that.setModel(modelItensCamp, "modelItensCampanha");

					var modelItensCampCE = new JSONModel(vetorTotais);
					that.setModelGlobal(modelItensCampCE, "modelResumo");

					that.getModel("modelDelay").setProperty("/dialog", false);
				},
				error: function (error) {

					that.getModel("modelDelay").setProperty("/dialog", false);
					that.onMensagemErroODATA(error);
				}
			});
		},

		onExportarPedidoExcel: function () {

			var aCols, oRowBinding, oSettings, oSheet, oTable;

			var itens = this.getModelGlobal("modelItensPedidoGrid");
			var pedido = this.getModel("modelPedido").getData();
			var cliente = this.getModel("modelCliente").getData();
			var vencimentos = this.getModel("modelVencimentos1").getData();
			var frete = this.getModel("modelFretes").getData();
			var endereco = this.getModel("modelLocaisEntregas").getData();
			var centros = this.getModel("modelCentros").getData();

			var ZtermDesc = "";
			var Inco1Desc = "";
			var RuaEntrega = "";
			var CidadeEntrega = "";
			var NomeCentro = "";

			for (var i = 0; i < vencimentos.length; i++) {
				if (vencimentos[i].Zterm == pedido.Vencimento) {

					ZtermDesc = vencimentos[i].DescCond;
					break;
				}
			}

			for (var i = 0; i < frete.length; i++) {
				if (frete[i].Inco1 == pedido.Inco1) {

					Inco1Desc = frete[i].Bezei;
					break;
				}
			}

			for (var i = 0; i < endereco.length; i++) {
				if (endereco[i].Addrnumber == pedido.LocalEntrega) {

					RuaEntrega = endereco[i].Rua;
					CidadeEntrega = endereco[i].Cidade;
					break;
				}
			}

			for (var i = 0; i < centros.length; i++) {
				if (centros[i].Werks == pedido.Werks) {

					NomeCentro = centros[i].NomeCentro;
					break;
				}
			}

			if (!this._oTable) {
				this._oTable = this.byId("table_pedidos");
			}

			oTable = this._oTable;
			oRowBinding = oTable.getBinding("rows") || oTable.getBinding("items");

			aCols = this.createColumnConfig();

			oSettings = {
				workbook: {
					columns: aCols,
					context: {
						application: "Aplicação Força de Vendas",
						// version: "0.0.1",
						title: "Espelho do Pedido",
						modifiedBy: "Repres: " + this.getModelGlobal("modelAux").getProperty("/Usuario"),
						metaSheetName: "Cabeçalho Pedido",
						metainfo: [{
							name: "Resumo do pedido",
							items: [{
								key: "Ordem de venda",
								value: pedido.Vbeln
							}, {
								key: "Data Criação",
								value: pedido.DataFim
							}]
						}, {
							name: "Dados Fornecedor",
							items: [{
								key: "Vendedor",
								value: this.getModelGlobal("modelAux").getProperty("/Usuario")
							}, {
								key: "Centro",
								value: pedido.Werks + "-" + NomeCentro
							}]
						}, {
							name: "Dados Cliente",
							items: [{
								key: "Cliente",
								value: cliente.Kunnr
							}, {
								key: "CNPJ Cliente",
								value: cliente.Stcd1 + cliente.Stcd2
							}, {
								key: "Endereço",
								value: cliente.Stras
							}, {
								key: "Cidade/ UF",
								value: cliente.Ort01
							}, {
								key: "CEP",
								value: cliente.Pstlz
							}, {
								key: "Fone/ Cel",
								value: cliente.Telf1
							}, {
								key: "E-mail envio XML",
								value: cliente.EmailNf
							}]
						}, {
							name: "Dados de Negociação",
							items: [{
								key: "Prazo de pagamento",
								value: pedido.Vencimento + "-" + ZtermDesc
							}, {
								key: "Tipo de Frete",
								value: pedido.Inco1 + "-" + Inco1Desc
							}, {
								key: "Endereço de entrega",
								value: RuaEntrega
							}, {
								key: "Cidade de entrega",
								value: CidadeEntrega
							}]
						}, {
							name: "Investimentos",
							items: [{
								key: "Em Nota Fiscal",
								value: pedido.ValDescAplicar
							}, {
								key: "Em Boleto",
								value: pedido.ValDescAplicarBol
							}]
						}, {
							name: "Composição do pedido",
							items: [{
								key: "QTD",
								value: pedido.TotalItens
							}, {
								key: "Preço Total s/ST",
								value: pedido.ValorTotal
							}, {
								key: "Preço Total c/ST",
								value: pedido.ValTotItemSt
							}, {
								key: "Peso Bruto (KG)",
								value: pedido.PesoBruto
							}]
						}]
					},
					hierarchyLevel: "level",
					sheetName: ""
				},
				dataSource: oRowBinding,
				fileName: "Pedido" + pedido.Vbeln + ".xlsx"
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function () {
				oSheet.destroy();
			});

		},

		onDialogOpen: function (evt) {

			var that = this;

			var pedido = this.getModelGlobal("modelPedido").getData();
			var aux = this.getModelGlobal("modelAux").getData();

			var vAux = {
				CodRepres: this.getModelGlobal("modelAux").getProperty("/CodRepres"),
				NomeRepres: this.getModelGlobal("modelAux").getProperty("/NomeRepres"),
				NrPedido: pedido.NrPedido,
				EmailPedido: pedido.EmailRepres
			};

			var omodelParamDialog = new JSONModel(vAux);
			that.setModel(omodelParamDialog, "modelParamDialog");

			if (that._ItemDialog) {
				that._ItemDialog.destroy(true);
			}

			if (!that._CreateMaterialFragment) {

				that._ItemDialog = sap.ui.xmlfragment(
					"application.view.DialogEmailPedido",
					that
				);
				that.getView().addDependent(that._ItemDialog);
			}

			that._ItemDialog.open();

		},

		onEnviarEmailPedido: function () {

			var that = this;

			var pedido = this.getModelGlobal("modelPedido").getData();
			var modelDialog = this.getModel("modelParamDialog").getData();

			if (modelDialog.EmailPedido.includes("/") || modelDialog.EmailPedido.includes("'")) {

				sap.m.MessageBox.show("O e-mail do pedido contém caracteres não permitidos (/ ou '') ", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Ação não permitida!",
					actions: [MessageBox.Action.OK],
					onClose: function () { }
				});

			} else {

				that.oModel.read("/P_EnviaEmailPedidoR(NrPedido='" + pedido.NrPedido + "',Email='" + modelDialog.EmailPedido + "')", {
					success: function (result) {

						sap.m.MessageBox.show("O e-mail do pedido " + pedido.NrPedido + " foi enviado com sucesso!", {
							icon: sap.m.MessageBox.Icon.SUCCESS,
							title: "Pedido enviado!",
							actions: [MessageBox.Action.OK],
							onClose: function () {

								that.onDialogClose();
							}
						});
					},
					error: function (error) {

						that.onMensagemErroODATA(error);
					}
				});
			}

		},

		onExportarPedido: function () {

			var that = this;
			var pedido = this.getModelGlobal("modelPedido").getData();

			if (pedido.Vbeln == "") {

				sap.m.MessageBox.show("Pedido ainda não foi criado!", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Ação não permitida!",
					actions: [MessageBox.Action.OK]
				});

			} else {

				that.onDialogOpen();

				// sap.m.MessageBox.show("Deseja enviar o espelho do pedido por e-mail?", {
				// 	icon: sap.m.MessageBox.Icon.QUESTION,
				// 	title: "Tomada de Ação!",
				// 	actions: ['Enviar', 'Cancelar'],
				// 	onClose: function (oAction) {

				// 		if (oAction == "Enviar") {

				// 		}
				// 	}
				// });
			}
		},

		createColumnConfig: function () {
			var aCols = [];

			aCols.push({
				label: "Material",
				property: "Matnr",
				type: EdmType.Number
			});

			aCols.push({
				label: "Descrição",
				property: "Maktx",
				type: EdmType.String
			});

			aCols.push({
				label: "U.M.",
				property: "Vrkme",
				type: EdmType.String
			});

			aCols.push({
				label: "QTD",
				property: "QtdPedida",
				type: EdmType.Number
			});

			aCols.push({
				label: "Preço Unit. s/ST",
				property: "ValPrecoUnitFat",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "Preço Total s/ST",
				property: "ValorTotal",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "% ST",
				property: "PerSubTri",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "Preço Unit. c/ST",
				property: "ValPrecoUnitStFat",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "Preço Total c/ST",
				property: "ValTotItemSt",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "Peso Bruto (KG)",
				property: "PesoBruto",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			return aCols;
		},


		onBuscarDescTabPreco: function (TabPreco) {

			if (TabPreco != "" && TabPreco != undefined) {

				var vetorTabPreco = this.getModel("modelTabPrecos").getData();
				for (var i = 0; i < vetorTabPreco.length; i++) {

					if (vetorTabPreco[i].Pltyp == TabPreco) {
						this.getModelGlobal("modelPedido").setProperty("/PltypDesc", vetorTabPreco[i].Ptext);
						break;
					}
				}
			}
		},

		onChangeTabPreco: function (oEvent) {

			this.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", true);
			var TabPreco = this.getModelGlobal("modelPedido").getProperty("/Pltyp");

			if (TabPreco != "" && TabPreco != undefined) {

				var vetorTabPreco = this.getModel("modelTabPrecos").getData();
				for (var i = 0; i < vetorTabPreco.length; i++) {

					if (vetorTabPreco[i].Pltyp == TabPreco) {
						this.getModelGlobal("modelPedido").setProperty("/PltypDesc", vetorTabPreco[i].Ptext);
						break;
					}
				}
			}
		},

        _itensCalculoBoleto: function () {
            var that = this, oModelo = this.getModel("modelItensPedidoGrid"), aItens = oModelo ? oModelo.getData() || [] : [];
            return aItens.filter(function (oItem) { return that.ehItemPedidoDigitado(oItem); });
        },

        _estadoDescontoBoleto: function (sErro) {
            this._erroDescontoBoleto = sErro || "";
            var oCampo = this.byId("idDescontoAplicarBoletoReduz");
            if (oCampo) { oCampo.setValueState(sErro ? "Error" : "None"); oCampo.setValueStateText(sErro || ""); }
        },

        _recalcularBoletoPeloLiquido: function (vEntrada, bAtualizarCampo) {
            try {
                var nLiquido = BoletoDescontoSupport.numeroEntrada(vEntrada);
                this._boletoLiquidoDigitado = nLiquido;
                var r = BoletoDescontoSupport.brutoDoLiquido(nLiquido, this._itensCalculoBoleto());
                this.getModel("modelPedido").setProperty("/ValDescAplicarBol", r.bruto);
                if (bAtualizarCampo) { this.getModel("modelPedido").setProperty("/ValDescInformBoletoReduzid", r.liquido); }
                this._boletoEntradaInvalida = false;
                this._estadoDescontoBoleto("");
                return true;
            } catch (e) { this._boletoEntradaInvalida = true; this._estadoDescontoBoleto(e.message); return false; }
        },

        onLiveChangeDescBoletoLiquido: function (oEvent) {
            this._boletoDigitacaoAtiva = true;
            // Durante a digitacao, atualizar somente o calculado para nao reposicionar o cursor.
            return this._recalcularBoletoPeloLiquido(oEvent.getSource().getValue(), false);
        },

        onChangeDescBoletoLiquido: function (oEvent) {
            this._boletoDigitacaoAtiva = true;
            if (!this._recalcularBoletoPeloLiquido(oEvent.getSource().getValue(), true)) { return false; }
            if (!this._validarLimitesBoleto()) { return false; }
            this.onValidacoesCampanha();
            this.onCalculaPrecoDebitarVerba();
            this.onCalculaRentabilidade();
            return true;
        },

        onCalculaDescBoletoReduzido: function () {
            // Apos o usuario informar a direita, essa entrada continua sendo a referencia.
            if (this._boletoDigitacaoAtiva) {
                if (this._boletoEntradaInvalida) { return false; }
                return this._recalcularBoletoPeloLiquido(this._boletoLiquidoDigitado, true);
            }
            // Ao abrir um pedido existente, apenas apresentar o liquido do valor ja gravado.
            // Nao alterar o valor bruto historico nem aplicar acrescimos sucessivos.
            try {
                var r = BoletoDescontoSupport.liquidoDoBruto(this.getModel("modelPedido").getProperty("/ValDescAplicarBol"), this._itensCalculoBoleto());
                this.getModel("modelPedido").setProperty("/ValDescInformBoletoReduzid", r.liquido);
                this._estadoDescontoBoleto("");
                return true;
            } catch (e) { this._estadoDescontoBoleto(e.message); return false; }
        },

        _valoresLimiteBoleto: function () {
            var p = this.getModel("modelPedido").getData();
            if (this._boletoEntradaInvalida) { throw new Error("Corrija o valor informado no desconto de boleto."); }
            var nDigitado = this._boletoDigitacaoAtiva ? BoletoDescontoSupport.numeroEntrada(this._boletoLiquidoDigitado) : BoletoDescontoSupport.liquidoDoBruto(p.ValDescAplicarBol, this._itensCalculoBoleto()).liquido;
            var nDisponivel = BoletoDescontoSupport.arredondar(Math.max(0, BoletoDescontoSupport.numeroModelo(p.ValDescDisp)) + BoletoDescontoSupport.numeroModelo(p.ValDescTrader));
            var nLimite = BoletoDescontoSupport.arredondar(nDisponivel * BoletoDescontoSupport.numeroModelo(p.PercFlexBoleto) / 100);
            var nNota = BoletoDescontoSupport.numeroModelo(p.ValDescAplicar);
            if (nNota < 0) { throw new Error("Informe um desconto de nota fiscal maior ou igual a zero."); }
            nNota = BoletoDescontoSupport.arredondar(nNota);
            return { digitado: nDigitado, disponivel: nDisponivel, limite: nLimite, nota: nNota, centavosDigitado: Math.round(nDigitado * 100), centavosDisponivel: Math.round(nDisponivel * 100), centavosLimite: Math.round(nLimite * 100), centavosNota: Math.round(nNota * 100) };
        },

        _validarLimitesBoleto: function () {
            try {
                var p = this.getModel("modelPedido").getData();
                var v = this._valoresLimiteBoleto();
                if (v.centavosDigitado > 0 && v.centavosDigitado > v.centavosLimite) { throw new Error("O valor digitado para desconto Boleto excede o permitido de R$ " + this.onFormatNumberController(v.limite) + "."); }
                if (v.centavosDigitado + v.centavosNota > v.centavosDisponivel) { throw new Error("A soma do desconto de nota com o boleto digitado excede o disponível de R$ " + this.onFormatNumberController(v.disponivel) + "."); }
                if (v.centavosDigitado > 0 && !String(p.MotivoDescBoleto1 || "").trim()) { throw new Error("Preencha o motivo do desconto de boleto."); }
                this._estadoDescontoBoleto("");
                return true;
            } catch (e) { this._estadoDescontoBoleto(e.message); return false; }
        },

        _validarBoletoAntesGravar: function () {
            if (!this.onCalculaDescBoletoReduzido() || !this._validarLimitesBoleto()) {
                MessageBox.warning(this._erroDescontoBoleto || "Confira o desconto de boleto antes de salvar.");
                return false;
            }
            return true;
        },

		onCarregarLocalEntrega: function (Bukrs) {

			var that = this;

			for (var i = 0; i < that.vetorLocaisEntregas.length; i++) {

				if (Bukrs == that.vetorLocaisEntregas[i].Bukrs || that.vetorLocaisEntregas[i].Bukrs == "") {

					that.vetorLocaisEntregasAux.push(that.vetorLocaisEntregas[i]);
				}
			}

			that.getModel("modelLocaisEntregas").setData(that.vetorLocaisEntregasAux);
			that.getModel("modelLocaisEntregas").refresh();

		},

		onCalculaPrecoDebitarVerba: function () {

			var pedido = this.getModel("modelPedido").getData();
			var itens = this.getModel("modelItensPedidoGrid").getData();

			var DescAplicado = this.getModel("modelPedido").getProperty("/ValDescAplicar");
			var DescBoletoAplicado = this.getModel("modelPedido").getProperty("/ValDescAplicarBol");
			var DescTrade = parseFloat(this.getModel("modelPedido").getProperty("/ValDescTrader"));
			var ValDescDisp = parseFloat(this.getModel("modelPedido").getProperty("/ValDescDisp"));

			var descTotalRealizado = parseFloat(DescAplicado) + parseFloat(DescBoletoAplicado);

			var DescTrade = this.getModel("modelPedido").getProperty("/ValDescAplicarBol");
			if (descTotalRealizado > ValDescDisp) {

				descTotalRealizado = ValDescDisp;
			}

			var valTotalDispInvestir = 0;
			var valTotUtilizadoPreco = 0;
			var valTotLiqTab = 0;
			var valDebitarVerba = 0;
			var valFatModerador = 0;
			var valFatModeradorTotal = 0;

			for (var i = 0; i < itens.length; i++) {

				//Itens inseridos no grid, exclui os itens de campanha ainda nāo inseridos no pedido.
				if (this.ehItemPedidoDigitado(itens[i])) {

					valTotalDispInvestir += parseFloat((itens[i].ValPrecoTabelaMin - itens[i].ValPrecoMin) * itens[i].QtdPedida);
					valTotalDispInvestir = Math.round(valTotalDispInvestir * 100) / 100;

					// if (parseFloat(itens[i].ValPrecoInform - itens[i].ValPrecoTabelaMin) > 0) {

					// 	valTotUtilizadoPreco = 0;
					// } else {

					// 	valTotUtilizadoPreco += Math.abs(parseFloat((itens[i].ValPrecoInform - itens[i].ValPrecoTabelaMin) * itens[i].QtdPedida));
					// 	valTotUtilizadoPreco = Math.round(valTotUtilizadoPreco * 100) / 100;
					// }

					if (parseFloat(itens[i].ValPrecoInform - itens[i].ValPrecoTabelaMin) > 0) {

						//Se gerar verba, nāo cosiderar no total utilizado em preço.
						if (parseFloat((itens[i].ValPrecoInform - itens[i].ValPrecoTabelaMin) * itens[i].QtdPedida) > 0) {

							valTotUtilizadoPreco += 0;
						} else {

							valTotUtilizadoPreco += parseFloat((itens[i].ValPrecoInform - itens[i].ValPrecoTabelaMin) * itens[i].QtdPedida);
						}

						valTotUtilizadoPreco = Math.round(valTotUtilizadoPreco * 100) / 100;
					} else {

						valTotUtilizadoPreco += parseFloat((itens[i].ValPrecoInform - itens[i].ValPrecoTabelaMin) * itens[i].QtdPedida);
						valTotUtilizadoPreco = Math.round(valTotUtilizadoPreco * 100) / 100;
					}

					valTotLiqTab += parseFloat(itens[i].ValPrecoTabelaMin * itens[i].QtdPedida);
					valTotLiqTab = Math.round(valTotLiqTab * 100) / 100;

					// valFatModerador += parseFloat(itens[i].ValFatModeradorVerba); //Já tem quantidade

					valFatModeradorTotal += (parseFloat(pedido.PercFatModeradorVerba) / 100) * itens[i].ValPrecoTabelaMin * itens[i].QtdPedida;
					valFatModeradorTotal = Math.round(valFatModeradorTotal * 100) / 100;
				}
			}

			if (valTotUtilizadoPreco + descTotalRealizado >= Math.abs(valFatModeradorTotal)) {

				valDebitarVerba = valTotUtilizadoPreco + descTotalRealizado - Math.abs(valFatModeradorTotal);
				valDebitarVerba = Math.round(valDebitarVerba * 100) / 100;

			} else {

				if (valTotUtilizadoPreco + descTotalRealizado < Math.abs(valFatModeradorTotal)) {

					valDebitarVerba = 0;

				} else {
					if (valTotUtilizadoPreco >= descTotalRealizado) {

						valDebitarVerba = descTotalRealizado;

					} else {

						if (valTotUtilizadoPreco + descTotalRealizado >= Math.abs(valFatModerador)) {

							valDebitarVerba = (descTotalRealizado + valTotUtilizadoPreco) - Math.abs(valFatModerador);
							valDebitarVerba = Math.round(valDebitarVerba * 100) / 100;

						} else {

							valDebitarVerba = 0;
						}
					}
				}
			}

			this.getModel("modelPedido").setProperty("/ValFatModeradorVerba", valDebitarVerba);
		},

		_calcularTotaisPedidos: function () {

			var aData = this.getModel("modelPedidos").getData() || [];

			var totalValor = 0;
			var totalSaldo = 0;

			aData.forEach(function (o) {

				totalValor += Number(o.ValSSt) || 0;
				totalSaldo += Number(o.ValSdoSSt) || 0;

			});

			this.getModel("modelTotais").setData({
				totalValor: totalValor,
				totalSaldo: totalSaldo
			});

		},
		onFormatNumeroPedido: function (sNrPedido, sVbeln) {
			var aValores = [];

			if (sNrPedido !== undefined && sNrPedido !== null && String(sNrPedido).trim() !== "") {
				aValores.push(String(sNrPedido).trim());
			}

			if (sVbeln !== undefined && sVbeln !== null && String(sVbeln).trim() !== "") {
				aValores.push(String(sVbeln).trim());
			}

			return aValores.length > 0 ? aValores.join(" - ") : "Não informado";
		}
	});
});
