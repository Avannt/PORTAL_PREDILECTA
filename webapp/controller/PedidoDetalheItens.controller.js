/*eslint-disable no-console, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"application/model/formatter",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/core/format/NumberFormat",
	"application/model/ItemPedidoSupport",
	"application/model/CampanhaItemSupport",
	"sap/m/MessageToast"
], function (BaseController, JSONModel, MessageBox, formatter, ODataModel, NumberFormat, ItemPedidoSupport, CampanhaItemSupport, MessageToast) {
	"use strict";

	return BaseController.extend("application.controller.PedidoDetalheItens", {
		formatter: formatter,

		_aplicarCampanhasSimuladas: function (oItem) {
			var oGrid = this.getModelGlobal("modelItensPedidoGrid"), a = oItem.__CampItensSimulados;
			if (oGrid && Array.isArray(a)) { if (!this._campanhasPersistidas) { this._campanhasPersistidas = this._copiarItem(oGrid.getData() || []); } oGrid.setData(CampanhaItemSupport.atualizarGrade(oGrid.getData() || [], a)); }
			else { this._marcarGradeCampanhasPendente(); }
			delete oItem.__CampItensSimulados;
		},

		_restaurarCampanhasPersistidas: function () {
			if (!this._campanhasPersistidas) { return; }
			var that = this, oGrid = this.getModelGlobal("modelItensPedidoGrid"), a = this._campanhasPersistidas, m = {};
			a.forEach(function (o) { m[CampanhaItemSupport.chave(o)] = o; });
			if (oGrid) { oGrid.setData((oGrid.getData() || []).map(function (o) { var n = that._copiarItem(o), p = m[CampanhaItemSupport.chave(o)]; if (p) { CampanhaItemSupport.CAMPOS_RETORNO.concat(["_CampanhaConsultaPendente", "_CampanhaConfirmada", "_CampanhaSimulada", "_CampanhaErroRetorno"]).forEach(function (k) { n[k] = p[k]; }); } return n; })); }
			this._campanhasPersistidas = null;
		},

		_marcarGradeCampanhasPendente: function () {
			var oGrid = this.getModelGlobal("modelItensPedidoGrid"); if (!oGrid) { return; }
			if (!this._campanhasPersistidas) { this._campanhasPersistidas = this._copiarItem(oGrid.getData() || []); }
			oGrid.setData((oGrid.getData() || []).map(CampanhaItemSupport.pendente));
		},

		_invalidarCampanhasDigitacao: function () {
			var o = this.getModelGlobal("modelItem"); if (o) { o.setProperty("/_CampanhaConsultaPendente", true); o.setProperty("/_CampanhaConfirmada", false); }
			this._marcarGradeCampanhasPendente();
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

		formatarPrecoUnitarioCampanha: function (v, bPendente) { return CampanhaItemSupport.formatarUnitario(v, bPendente); },

		formatarCampanhaDisponivel: function (v, bPendente) { return CampanhaItemSupport.formatar(v, bPendente); },

		onInit: function () {
			this.setModel(new JSONModel({ ConsultaItem: false, ConsultaGrade: false, SimulacaoPedido: false, AplicacaoItem: false, Mensagem: "" }), "modelCampanhasUI");

			this.setModel(new JSONModel({ Processando: false, HistoricoCarregado: false, HistoricoCarregando: false, HistoricoErro: "", HistoricoInserindo: false, HistoricoProgresso: "", HistoricoResultado: "", HistoricoMensagem: "Atualize o histórico para consultar as compras anteriores." }), "modelItensUI");

			this.setModel(new JSONModel([]), "modelItensJaComprados");

			this._historicoCompras = [];

			this._contextoHistorico = "";

			this._operacaoItens = 0;

			this._consultaHistorico = 0;

			this.getRouter().getRoute("pedidoDetalheItens").attachPatternMatched(this.onLoadFields, this);

		},

		onLoadFields: function () {
			this.getModel("modelItensUI").setProperty("/HistoricoInserindo", false);
			this.getModel("modelItensUI").setProperty("/HistoricoProgresso", "");
			this.getModel("modelItensUI").setProperty("/HistoricoResultado", "");
			var that = this;
			var CodRepres = this.getModelGlobal("modelAux").getProperty("/CodRepres");
			var Werks = this.getModelGlobal("modelPedido").getProperty("/Werks");
			var sContexto = this._obterContextoPedido();
			var iOperacao = ++this._operacaoItens;
			var oNavegacao = this.getModelGlobal("modelItemParaEdicao");
			var oEdicaoSolicitada = oNavegacao ? oNavegacao.getData() : null;
			if (oNavegacao) { oNavegacao.setData(null); }
			this._atualizarItensJaComprados();
			this.setModel(new JSONModel({ changeQnt: false, changePreco: false, changePromo: false }), "modelAtualizarItem");
			this.vetorProdutos = [];
			this.setModel(new JSONModel([]), "modelProdutos");
			this.onInicializaCamposItens();
			this._definirProcessando(true);
			return new Promise(function (res, rej) {
				that.onBuscarProdutos(CodRepres, Werks, res, rej, that);
			}).then(function (data) {
				if (!that._contextoAtual(sContexto, iOperacao)) { return; }
				that.vetorProdutos = data;
				that.getModel("modelProdutos").setData(data);
				return that._carregarItensComCampanha(sContexto, iOperacao).then(function () { if (that._contextoAtual(sContexto, iOperacao)) { return that._atualizarTotaisPedido(sContexto, iOperacao); } });
			}).catch(function (error) {
				if (that._contextoAtual(sContexto, iOperacao)) { that.onMensagemErroODATA(error); }
			}).then(function () {
				if (that._contextoAtual(sContexto, iOperacao)) {
					that._definirProcessando(false);
					that._atualizarItensJaComprados();
					if (!that._abrirEdicaoSolicitada(oEdicaoSolicitada)) { that.byId("IdItemPedido").focus(); }
					that.onCarregarHistoricoCompras();
				}
			});
		},

		_carregarItensComCampanha: function (sContexto, iOperacao) {

			var that = this, sEscopo = this._obterContextoHistorico();

			var NrPedido = this.getModelGlobal("modelPedido").getProperty("/NrPedido");

			this._inicializarModeloCampanha();

			this.getModelGlobal("modelItensCampanha").setData([]);

			return new Promise(function (res, rej) { that.onBuscarItensPedido(res, rej, NrPedido); }).then(function (aItens) {

				if (!that._contextoAtual(sContexto, iOperacao) || sEscopo !== that._obterContextoHistorico()) { return; }

				that.getModelGlobal("modelItensPedidoGrid").setData(that._prepararCampanhasGrid(aItens));

				that._atualizarItensJaComprados();

				return that.onCarregarItensCampanha(NrPedido).catch(function (oErro) { MessageBox.warning("Os itens do pedido foram carregados, mas a consulta de campanhas falhou: " + (oErro.message || "verifique o serviço SAP.")); });

			});

		},

		_abrirEdicaoSolicitada: function (oSelecao) {
			if (!oSelecao || this._chaveContexto(oSelecao) !== this._obterContextoPedido() || !this._validarPedidoEditavel()) { return false; }
			var that = this;
			var aItens = this.getModelGlobal("modelItensPedidoGrid").getData() || [];
			var oItem = aItens.filter(function (oAtual) { return that._normalizarMaterial(oAtual.Matnr) === that._normalizarMaterial(oSelecao.Matnr); })[0];
			if (!oItem) { MessageBox.information("O item selecionado não está mais no pedido. Atualize o pedido para conferir os itens."); return false; }
			this._carregarItemParaEdicao(oItem);
			return true;
		},

		onLiveChangeQuantidade: function () { this._invalidarCampanhasDigitacao(); this.getModel("modelAtualizarItem").setProperty("/changeQnt", true); },
		onLiveChangePromocao: function () { this._invalidarCampanhasDigitacao(); this.getModel("modelAtualizarItem").setProperty("/changePromo", true); },
		onLiveChangePreco: function () { this._invalidarCampanhasDigitacao(); this.getModel("modelAtualizarItem").setProperty("/changePreco", true); },
		onLiveChangePrecoVenda: function () { this.onLiveChangePreco(); },

		onInicializaCamposItens: function () {
			this._restaurarCampanhasPersistidas();

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

				ValPrecoUnitSt: 0,

				ValPrecoUnit: 0,

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

				ValPrecoTabelaMin: 0,

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

				Draft: false,

				DataUltCompraUltMes: null,

				QtdUltCompraUltMes: 0,

				ValorUltCompraUltMes: 0,

				ValFatModeradorVerba: 0,

				ForaPolitica: false,

				ValPrecoUnitFat: 0

			};

			this.ItemPedido.DescCampAdicional = null;
			this.ItemPedido.IdCamp = ""; this.ItemPedido.IdCampEscal = ""; this.ItemPedido.DescCampAplicado = null;
			this.ItemPedido._CampanhaConsultaPendente = true; this.ItemPedido._CampanhaConfirmada = false;
			this._atualizarContratoCampanhas();
			var modelItem = new JSONModel(this.ItemPedido);

			this.setModelGlobal(modelItem, "modelItem");

			var vars = {

				Editar: false

			};

			var model = new JSONModel(vars);

			this.setModel(model, "modelVar");

			this._limparAlteracoesDigitacao();

			this._eventoPrecoPendente = "ChangeItem";

			this.byId("idBtnAdd").setText("Inserir");

			that.getView().byId("IdItemPedido").setEnabled(true);

			that.getView().byId("idPrecoVenda").setEnabled(true);


			that.getView().byId("idPromocao").setEnabled(true);
			that.byId("idPromocaoDigitacao").setEnabled(true);

			that.getView().byId("idQuantidade").setEnabled(true);

			setTimeout(function () {

				that.getView().byId("IdItemPedido").focus();

			}, 1000);

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
			if (this.getModel("modelItensUI").getProperty("/Processando")) { return; }
			var that = this;
			var oItem = this.getModelGlobal("modelItem").getData();
			this._eventoPrecoPendente = "ChangeItem";
			oItem.QtdPedida = 1;
			this.getModelGlobal("modelItem").refresh(true);
			if (!oItem.Matnr) { this.onInicializaCamposItens(); this.byId("IdItemPedido").suggest(); return; }
			var sMaterial = this._normalizarMaterial(oItem.Matnr);
			var oProduto = (this.vetorProdutos || []).filter(function (o) { return that._normalizarMaterial(o.Matnr) === sMaterial; })[0];
			if (!oProduto) {
				MessageBox.warning("Item não permitido para digitação!", { title: "Não Permitido", onClose: function () { that.getModelGlobal("modelItem").setProperty("/Matnr", ""); that.byId("IdItemPedido").focus(); } });
				return;
			}
			this.getModelGlobal("modelItem").setProperty("/Matnr", oProduto.Matnr);
			return this.onCallPrecoItem(this._parametrosPreco(this.getModelGlobal("modelItem").getData(), "ChangeItem", this.getModel("modelVar").getProperty("/Editar")));
		},

		onQuantidadeChange: function (res, rej) { return this._recalcularDigitacao("ChangeQuantidade", res, rej); },
		onPrecoVendaChange: function (res, rej) { return this._recalcularDigitacao("ChangePrecoVenda", res, rej); },
		onPromocaoChange: function (res, rej) { return this._recalcularDigitacao("ChangePromocao", res, rej); },

		_recalcularDigitacao: function (sEvento, res, rej) {
			this._eventoPrecoPendente = sEvento;
			var oItem = this.getModelGlobal("modelItem").getData();
			if (!oItem.Matnr || !isFinite(Number(oItem.QtdPedida)) || Number(oItem.QtdPedida) <= 0) {
				var oErro = this._erroNegocio(!oItem.Matnr ? "Selecione um produto." : "Digite uma quantidade acima de 0.");
				if (typeof rej === "function") { rej(oErro); } else { MessageBox.warning(oErro.message); }
				return Promise.resolve();
			}
			if (!this._precoVendaValido(oItem.ValPrecoInform)) {
				var oErroPreco = this._erroNegocio("Digite um preço de venda válido, maior ou igual a 0.");
				if (typeof rej === "function") { rej(oErroPreco); } else { MessageBox.warning(oErroPreco.message); }
				return Promise.resolve();
			}
			if (sEvento === "ChangePromocao") {
				var nPromocao = Number(oItem.PercPromo) || 0;
				var nMaximo = Number(oItem.PercPromoMax) || 0;
				this.getModelGlobal("modelItem").setProperty("/PercPromo", Math.max(0, Math.min(nPromocao, nMaximo)));
			}
			return this.onCallPrecoItem(this._parametrosPreco(oItem, sEvento, this.getModel("modelVar").getProperty("/Editar")), res, rej);
		},

		onCallPrecoItem: function (parameters, res, rej) {

			this._eventoPrecoPendente = parameters.Evento;

			var that = this;

			var sContexto = this._obterContextoPedido();

			var iOperacao = ++this._operacaoItens;

			this._definirProcessando(true);

			var oBasePreco = parameters.Evento === "ChangeItem" && parameters.Editar !== "true" ? null : this._copiarItem(this.getModelGlobal("modelItem").getData());

			return this._calcularPrecoItem(parameters, oBasePreco).then(function (oItem) {

				if (!that._contextoAtual(sContexto, iOperacao)) { return; }

				that._aplicarCampanhasSimuladas(oItem);
				that.getModelGlobal("modelItem").setData(that._copiarItem(oItem));

				that._limparAlteracoesDigitacao();

				if (typeof res === "function") { res(oItem); }

			}).catch(function (error) {

				if (!that._contextoAtual(sContexto, iOperacao)) { return; }

				if (typeof rej === "function") { rej(error); } else { that._mostrarErroItem(error); }

			}).then(function () {

				if (that._contextoAtual(sContexto, iOperacao)) { that._definirProcessando(false); }

			});

		},

		_parametrosPreco: function (oItem, sEvento, bEditar) {
			var o = { Matnr: oItem.Matnr, QtdPedida: oItem.QtdPedida, PercPromo: oItem.PercPromo, ValPrecoInform: oItem.ValPrecoInform, NrPedido: this.getModelGlobal("modelPedido").getProperty("/NrPedido"), Evento: sEvento, Editar: String(!!bEditar) };
			if (oItem.DescCampAplicado !== null && oItem.DescCampAplicado !== undefined) { o.DescCampAplicado = oItem.DescCampAplicado; }
			return o;
		},

		_mesclarDadosItem: function (oAnterior, oRetorno, bPreservarHistorico) {
			oAnterior = oAnterior || {};
			oRetorno = oRetorno || {};
			var bOutroMaterial = oAnterior.Matnr && oRetorno.Matnr && this._normalizarMaterial(oAnterior.Matnr) !== this._normalizarMaterial(oRetorno.Matnr);
			var bOutroPedido = oAnterior.NrPedido && oRetorno.NrPedido && String(oAnterior.NrPedido) !== String(oRetorno.NrPedido);
			var oBase = bOutroMaterial || bOutroPedido ? {} : this._copiarItem(oAnterior);
			var oNovo = this._copiarItem(oBase);
			var that = this;
			Object.keys(oRetorno).forEach(function (sCampo) {
				if (sCampo !== "__metadata" && oRetorno[sCampo] !== undefined) { oNovo[sCampo] = that._copiarItem(oRetorno[sCampo]); }
			});
			// Histórico não é recalculado por quantidade, promoção ou preço de venda.
			// Preserva o conjunto quando já há uma data de compra válida carregada.
			var vData = oBase.DataUltCompraUltMes;
			var bTemHistorico = vData && String(vData) !== "00000000" && String(vData) !== "0000-00-00";
			if (bPreservarHistorico && bTemHistorico) {
				["ValorUltCompraUltMes", "QtdUltCompraUltMes", "DataUltCompraUltMes"].forEach(function (sCampo) {
					if (Object.prototype.hasOwnProperty.call(oBase, sCampo)) { oNovo[sCampo] = that._copiarItem(oBase[sCampo]); }
				});
			}
			delete oNovo.__metadata;
			return oNovo;
		},

		_calcularPrecoItem: function (oParameters, oAnterior) {
			var that = this, oMeta = this.oModel.getMetaModel();
			var oBase = this._copiarItem(oAnterior || { Matnr: oParameters.Matnr, NrPedido: oParameters.NrPedido, QtdPedida: oParameters.QtdPedida, PercPromo: oParameters.PercPromo, ValPrecoInform: oParameters.ValPrecoInform });
			return oMeta.loaded().then(function () {
				var c = CampanhaItemSupport.contrato(oMeta); that._contratoCampanhas = c; that.getModel("modelCampanhasUI").setData(c);
				var oEntradaCalculo = that._copiarItem(oParameters);

				var oDados;
				try { oDados = CampanhaItemSupport.filtrarParametros(oMeta, c.Funcao, oEntradaCalculo, oBase); } catch (e) { throw that._erroNegocio(e.message); }
				that.onFormatNumberItem(oDados);
				return new Promise(function (res, rej) {
					that.oModel.callFunction("/" + c.Funcao, {
						method: "POST", urlParameters: oDados, success: function (oData) {
							try {
								if (oData && (oData.TipoErro === "E" || oData.TipoErro === "A")) { throw that._erroNegocio(oData.MsgErro || "Não foi possível calcular o preço deste item."); }
								var oRetorno = CampanhaItemSupport.selecionar(oData, oParameters, c);
								if (!c.ConsumoAutomatico && !Object.prototype.hasOwnProperty.call(oDados, "DescCampAplicado") && !CampanhaItemSupport.aplicadoNuloOuZero(oRetorno.DescCampAplicado)) { throw that._erroNegocio("O cálculo retornou um desconto de campanha aplicado que esta consulta não permite validar. Conclua a integração antes de salvar."); }

								res(that._mesclarDadosItem(oBase, oRetorno, true));
							} catch (e) { rej(that._erroNegocio(e.message)); }
						}, error: rej
					});
				});
			});
		},

		_criarPayloadItem: function (oItem, bEditar, oMetaModel) {

			var oSet = oMetaModel.getODataEntitySet("P_ItensPedidoPR");

			var oTipo = oSet && oMetaModel.getODataEntityType(oSet.entityType);

			if (!oTipo) { throw this._erroNegocio("Não foi possível identificar a estrutura de gravação P_ItensPedidoPR no metadata do serviço."); }

			var oOrigem = this._copiarItem(oItem), oDados = {}, that = this;
			try { CampanhaItemSupport.validarAplicado(oOrigem); } catch (e) { throw this._erroNegocio(e.message); }
			if (!CampanhaItemSupport.aplicadoNuloOuZero(oOrigem.DescCampAplicado) && !oMetaModel.getODataProperty(oTipo, "DescCampAplicado")) { throw this._erroNegocio("O desconto aplicado não pode ser gravado neste serviço. Atualize o pedido antes de salvar."); }

			if (bEditar) { oOrigem.Draft = true; }

			Object.keys(oOrigem).forEach(function (sCampo) {

				if (sCampo.indexOf("__") === 0 || CampanhaItemSupport.CAMPOS_RETORNO.indexOf(sCampo) >= 0 || oOrigem[sCampo] === undefined) { return; }

				if (oMetaModel.getODataProperty(oTipo, sCampo)) { oDados[sCampo] = that._copiarItem(oOrigem[sCampo]); }

			});

			this.onFormatNumberItem(oDados);

			return oDados;

		},

		_salvarItemNoBackend: function (oItem, bEditar) {

			var that = this, oCompleto = this._copiarItem(oItem);
			delete oCompleto.__CampItensSimulados;

			var oMetaModel = this.oModel.getMetaModel && this.oModel.getMetaModel();

			if (!oMetaModel || typeof oMetaModel.loaded !== "function") { return Promise.reject(this._erroNegocio("Metadata do serviço indisponível. Reabra o pedido antes de gravar o item.")); }

			return oMetaModel.loaded().then(function () {

				var oDados = that._criarPayloadItem(oCompleto, bEditar, oMetaModel);

				that.oModel.setUseBatch(false);

				return new Promise(function (res, rej) {

					that.oModel.create("/P_ItensPedidoPR", oDados, {

						success: function (oData) {

							if (oData && (oData.TipoErro === "E" || oData.TipoErro === "A")) { rej(that._erroNegocio(oData.MsgErro || "Não foi possível salvar este item.")); return; }

							var oGravado = that._mesclarDadosItem(oCompleto, oData, true);
							var c = CampanhaItemSupport.contrato(oMetaModel);
							oGravado = CampanhaItemSupport.mesclarRetornoGravacao(oGravado, oData, c.ConsumoAutomatico);
							res(oGravado);

						}, error: rej

					});

				});

			});

		},

		onInserirItem: function () {

			if (this.getModel("modelItensUI").getProperty("/Processando")) { return; }

			if (!this._validarPedidoEditavel()) { return; }

			var that = this;

			var oItem = this._copiarItem(this.getModelGlobal("modelItem").getData());

			var bEditar = !!this.getModel("modelVar").getProperty("/Editar");

			var sContexto = this._obterContextoPedido();

			var iOperacao = ++this._operacaoItens;

			if (!oItem.Matnr) { MessageBox.warning("Selecione um produto."); return; }

			if (!isFinite(Number(oItem.QtdPedida)) || Number(oItem.QtdPedida) <= 0) { MessageBox.warning("Digite uma quantidade acima de 0."); return; }

			if (!this._precoVendaValido(oItem.ValPrecoInform)) { MessageBox.warning("Digite um preço de venda válido, maior ou igual a 0."); return; }

			var oAlteracoes = this.getModel("modelAtualizarItem");

			var sEvento = oAlteracoes.getProperty("/changePromo") ? "ChangePromocao" : oAlteracoes.getProperty("/changeQnt") ? "ChangeQuantidade" : oAlteracoes.getProperty("/changePreco") ? "ChangePrecoVenda" : this._eventoPrecoPendente || "";

			if (sEvento === "ChangePromocao") { oItem.PercPromo = Math.max(0, Math.min(Number(oItem.PercPromo) || 0, Number(oItem.PercPromoMax) || 0)); }

			this._definirProcessando(true);

			var pPreco = sEvento ? this._calcularPrecoItem(this._parametrosPreco(oItem, sEvento, bEditar), oItem) : Promise.resolve(oItem);

			return pPreco.then(function (oCalculado) {

				if (!that._contextoAtual(sContexto, iOperacao)) { return; }

				that.getModelGlobal("modelItem").setData(that._copiarItem(oCalculado));

				return that._salvarItemNoBackend(oCalculado, bEditar);

			}).then(function (oSalvo) {

				if (!oSalvo || !that._contextoAtual(sContexto, iOperacao)) { return; }

				that._campanhasPersistidas = null;
				that._atualizarItemSalvo(oSalvo, oItem, bEditar);

				that.onInicializaCamposItens();

				return that._atualizarTotaisAposSalvar(sContexto, iOperacao);

			}).catch(function (error) {

				if (that._contextoAtual(sContexto, iOperacao)) { that._mostrarErroItem(error); }

			}).then(function () {

				if (that._contextoAtual(sContexto, iOperacao)) { that._definirProcessando(false); }

			});

		},

		onQuantidadeItemGridChange: function (oEvent) { return this._alterarItemGrid(oEvent, "QtdPedida", "ChangeQuantidade"); },
		onPrecoVendaItemGridChange: function (oEvent) { return this._alterarItemGrid(oEvent, "ValPrecoInform", "ChangePrecoVenda"); },

		onPromocaoItemGridChange: function (oEvent) { return this._alterarItemGrid(oEvent, "PercPromo", "ChangePromocao"); },

		_alterarItemGrid: function (oEvent, sCampo, sEvento) {


			var oInput = oEvent.getSource();

			var oContexto = oInput.getBindingContext("modelItensPedidoGrid");

			if (!oContexto) { return; }

			var oOriginal = this._copiarItem(oContexto.getObject());

			var nValor = NumberFormat.getFloatInstance().parse(String(oEvent.getParameter("value") || "").trim());

			var fnRestaurar = function () { var oBinding = oInput.getBinding("value"); if (oBinding) { oBinding.checkUpdate(true); } };

			return this._gravarAlteracaoGrid(oOriginal, sCampo, sEvento, nValor, fnRestaurar);
		},

		podeExibirAplicarCampanha: function () { return CampanhaItemSupport.podeAplicarSaldo.apply(null, arguments); },

		onAplicarCampanhaItemGrid: function (oEvent) {
			if (this.getModel("modelItensUI").getProperty("/Processando") || !this._validarPedidoEditavel()) { return; }
			var oContexto = oEvent.getSource().getBindingContext("modelItensPedidoGrid");
			if (!oContexto) { return; }
			var oItem = this._copiarItem(oContexto.getObject()), oMeta = this.oModel.getMetaModel(), c = CampanhaItemSupport.contrato(oMeta);
			if (!c.ConsumoAutomatico || !c.ConsumoGrade) { MessageBox.warning("Atualize o pedido para confirmar a disponibilidade da campanha."); return; }
			var iCasas = c.EscalaPrecoCampanha;
			var nPreco = CampanhaItemSupport.precoComSaldoCampanha(oItem, iCasas);
			if (nPreco === null) { MessageBox.warning("O item não tem saldo de campanha disponível para reduzir o preço na precisão permitida."); return; }
			return this._gravarAlteracaoGrid(oItem, "ValPrecoInform", "ChangePrecoVenda", nPreco, function () { }, function (oCalculado) {
				// A consulta pode devolver outro saldo ou piso se o pedido/campanha mudou.
				var oAtual = Object.assign({}, oCalculado, {
					ValPrecoInform: oItem.ValPrecoInform,
					DescCampAplicado: Math.ceil(Math.max(0, (Number(oCalculado.ValPrecoMinSemCamp) - Number(oItem.ValPrecoInform)) * Number(oCalculado.QtdPedida)) * 100 - 0.00000001) / 100
				});
				var nPermitido = CampanhaItemSupport.precoComSaldoCampanha(oAtual, iCasas);
				if (Number(oCalculado.ValPrecoInform) !== nPreco || nPermitido !== nPreco ||
					Number(oCalculado.QtdPedida) !== Number(oItem.QtdPedida)) {
					throw this._erroNegocio("O preço ou a disponibilidade de campanha mudou. Atualize o pedido antes de aplicar o desconto.");
				}
			}.bind(this), function (oSalvo) {
				MessageToast.show("Preço do item " + oItem.Matnr + " atualizado para " + CampanhaItemSupport.formatarUnitario(oSalvo.ValPrecoInform, false) + " por caixa.");
			});
		},

		_gravarAlteracaoGrid: function (oOriginal, sCampo, sEvento, nValor, fnRestaurar, fnValidarCalculado, fnConfirmarGravacao) {
			var that = this;

			if (this.getModel("modelItensUI").getProperty("/Processando")) { fnRestaurar(); return; }

			if (!this._validarPedidoEditavel()) { fnRestaurar(); return; }

			if (!isFinite(nValor) || typeof nValor !== "number" || (sCampo === "QtdPedida" ? nValor <= 0 : nValor < 0)) {

				fnRestaurar();

				MessageBox.warning(sCampo === "QtdPedida" ? "Digite uma quantidade acima de 0." : sCampo === "PercPromo" ? "Digite uma promoção válida, maior ou igual a 0." : sCampo === "DescCampAplicado" ? "Digite um desconto válido, maior ou igual a 0." : "Digite um preço de venda válido, maior ou igual a 0.");

				return;

			}

			if (sCampo === "PercPromo") { nValor = Math.max(0, Math.min(nValor, Number(oOriginal.PercPromoMax) || 0)); }

			if (nValor === Number(oOriginal[sCampo])) { fnRestaurar(); return; }

			if (this.getModel("modelVar").getProperty("/Editar")) {

				fnRestaurar();

				MessageBox.information("Conclua ou cancele a edição do item no cabeçalho antes de alterar os valores na grade.");

				return;

			}

			var oAlterado = this._copiarItem(oOriginal);

			oAlterado[sCampo] = nValor;

			var sContexto = this._obterContextoPedido();

			var iOperacao = ++this._operacaoItens;

			this._definirProcessando(true);

			return this._calcularPrecoItem(this._parametrosPreco(oAlterado, sEvento, true), oAlterado).then(function (oCalculado) {

				if (!that._contextoAtual(sContexto, iOperacao)) { return; }

				if (fnValidarCalculado) { fnValidarCalculado(oCalculado); }
				return that._salvarItemNoBackend(oCalculado, true);

			}).then(function (oSalvo) {

				if (!oSalvo || !that._contextoAtual(sContexto, iOperacao)) { return; }

				that._campanhasPersistidas = null;
				that._atualizarItemSalvo(oSalvo, oOriginal, true);

				if (fnConfirmarGravacao) { fnConfirmarGravacao(oSalvo); }
				return that._atualizarTotaisAposSalvar(sContexto, iOperacao);

			}).catch(function (error) {

				if (that._contextoAtual(sContexto, iOperacao)) { fnRestaurar(); that._mostrarErroItem(error); }

			}).then(function () {

				if (that._contextoAtual(sContexto, iOperacao)) { that._definirProcessando(false); }

			});

		},

		_atualizarItemSalvo: function (oSalvo, oOriginal, bEditar) {
			var that = this;
			var oModel = this.getModelGlobal("modelItensPedidoGrid");
			var aItens = (oModel.getData() || []).slice();
			var iEncontrado = -1;
			aItens.some(function (oItem, iIndice) {
				var bMesmoItem = oOriginal.IdItem && oItem.IdItem ? String(oOriginal.IdItem) === String(oItem.IdItem) : that._normalizarMaterial(oOriginal.Matnr) === that._normalizarMaterial(oItem.Matnr);
				if (bMesmoItem) { iEncontrado = iIndice; return true; }
				return false;
			});
			if (iEncontrado >= 0) { aItens[iEncontrado] = this._mesclarDadosItem(aItens[iEncontrado], oSalvo, true); } else { aItens.push(this._mesclarDadosItem(oOriginal, oSalvo, true)); }
			oModel.setData(aItens);
			this._retirarCampanhasJaDigitadas();
			this._atualizarItensJaComprados();
		},

		_atualizarTotaisPedido: function (sContexto, iOperacao) {
			var that = this;
			var NrPedido = this.getModelGlobal("modelPedido").getProperty("/NrPedido");
			return new Promise(function (res, rej) { that.onBuscarPedido(NrPedido, res, rej, that); }).then(function (oPedido) {
				if (!that._contextoAtual(sContexto, iOperacao)) { return; }
				that.getModelGlobal("modelPedido").setData(oPedido);
				that.onCalculaRentabilidade();
			});
		},

		_recarregarPedidoAposMudanca: function (fnAtual, sOperacao, fnTotais) {
			var that = this, oGrid = this.getModelGlobal("modelItensPedidoGrid"), sNrPedido = this.getModelGlobal("modelPedido").getProperty("/NrPedido");
			if (!fnAtual()) { return Promise.resolve(); }
			this._campanhasPersistidas = null;
			oGrid.setData((oGrid.getData() || []).map(CampanhaItemSupport.pendente));
			var pTotais = fnTotais ? fnTotais() : new Promise(function (res, rej) {
				that.onBuscarPedido(sNrPedido, res, rej, that);
			}).then(function (oPedido) {
				if (fnAtual()) { that.getModelGlobal("modelPedido").setData(oPedido); that.onCalculaRentabilidade(); }
			});
			// Tenta a leitura integral mesmo quando apenas os totais falham.
			var bFalhaTotais = false;
			return pTotais.catch(function () { bFalhaTotais = true; }).then(function () {
				if (!fnAtual()) { return; }
				return new Promise(function (res, rej) { that.onBuscarItensPedido(res, rej, sNrPedido); });
			}).then(function (aItens) {
				if (!fnAtual() || !aItens) { return; }
				that.vetorItensPedido = aItens;
				oGrid.setData(that._prepararCampanhasGrid(aItens));
				that._atualizarItensJaComprados();
			}).catch(function () {
				if (fnAtual()) { throw new Error(sOperacao + ", mas não foi possível atualizar todos os itens do pedido. Reabra o pedido para atualizar os valores."); }
			}).then(function () {
				if (fnAtual() && bFalhaTotais) { throw new Error(sOperacao + ", mas não foi possível atualizar os totais do pedido. Reabra o pedido para atualizar os valores."); }
			});
		},

		_atualizarTotaisAposSalvar: function (sContexto, iOperacao) {
			var that = this, fnAtual = function () { return that._contextoAtual(sContexto, iOperacao); };
			return this._recarregarPedidoAposMudanca(fnAtual, "O item foi salvo", function () {
				return that._atualizarTotaisPedido(sContexto, iOperacao);
			}).catch(function (oErro) {
				if (fnAtual()) { MessageBox.warning(oErro.message + " Não é necessário salvar o item novamente."); }
			});
		},

		_carregarItemJaInserido: function (msg) {
			var that = this;
			var aMatch = msg.match(/Item:\s*([\w-]+)/i);
			if (!aMatch) { return false; }
			var aItens = this.getModelGlobal("modelItensPedidoGrid").getData() || [];
			var oEncontrado = aItens.filter(function (oItem) { return that._normalizarMaterial(oItem.Matnr) === that._normalizarMaterial(aMatch[1]); })[0];
			if (!oEncontrado) { return false; }
			this._carregarItemParaEdicao(oEncontrado);
			sap.m.MessageToast.show("Item já existente. Entrando em modo edição.");
			return true;
		},

		_carregarItemParaEdicao: function (oItem) {

			this._restaurarCampanhasPersistidas();
			var sChave = CampanhaItemSupport.chave(oItem), aPersistidos = this.getModelGlobal("modelItensPedidoGrid").getData() || [];
			var oPersistido = aPersistidos.filter(function (o) { return CampanhaItemSupport.chave(o) === sChave && String(o.IdCorGrid) === String(oItem.IdCorGrid); })[0];
			oItem = oPersistido || oItem;
			this.getModelGlobal("modelItem").setData(this._copiarItem(oItem));

			this.getModel("modelVar").setProperty("/Editar", true);

			this._limparAlteracoesDigitacao();

			this.byId("idBtnAdd").setText("Salvar");

			this.byId("IdItemPedido").setEnabled(false);

			this.byId("idBtnAdd").setVisible(true);

			this.byId("idQuantidade").focus();

		},

		onEditarItemPress: function (oEvent) {
			if (this.getModel("modelItensUI").getProperty("/Processando") || !this._validarPedidoEditavel()) { return; }
			var oSource = oEvent.getParameter("listItem") || oEvent.getSource();
			var oContexto = oSource.getBindingContext("modelItensPedidoGrid");
			if (oContexto) { this._carregarItemParaEdicao(oContexto.getObject()); }
		},

		onAtualizarItemPress: function () {
			var oBotao = this.byId("idBtnEditar");
			if (oBotao) { oBotao.setVisible(false); }
			this.byId("idBtnAdd").setVisible(true);
			this.byId("IdItemPedido").setEnabled(false);
			this.byId("idPrecoVenda").setEnabled(false);
			this.byId("idPromocao").setEnabled(false);
			this.byId("idPromocaoDigitacao").setEnabled(false);
			this.byId("idQuantidade").setEnabled(false);
		},

		onDeletarItem: function (oEvent) {

			if (this.getModel("modelItensUI").getProperty("/Processando") || !this._validarPedidoEditavel()) { return; }

			var that = this;

			var oSource = oEvent.getParameter("listItem") || oEvent.getSource();

			var oContexto = oSource.getBindingContext("modelItensPedidoGrid");

			if (!oContexto) { return; }

			var NrPedido = oContexto.getProperty("NrPedido");

			var Matnr = oContexto.getProperty("Matnr");

			var sContexto = this._obterContextoPedido();

			MessageBox.show("Deseja mesmo excluir o Item " + Matnr + "?", {

				icon: MessageBox.Icon.WARNING, title: "Exclusão de itens", actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL], onClose: function (oAction) {

					if (oAction !== MessageBox.Action.YES || sContexto !== that._obterContextoPedido() || that.getModel("modelItensUI").getProperty("/Processando")) { return; }

					var iOperacao = ++that._operacaoItens;

					var bExcluido = false;

					that._definirProcessando(true);

					new Promise(function (res, rej) { that.onDeletarItemPedido(res, rej, NrPedido, Matnr); }).then(function () {

						bExcluido = true;

						if (!that._contextoAtual(sContexto, iOperacao)) { return; }

						var oGrid = that.getModelGlobal("modelItensPedidoGrid");

						that._campanhasPersistidas = null;
						oGrid.setData((oGrid.getData() || []).filter(function (oItem) { return that._normalizarMaterial(oItem.Matnr) !== that._normalizarMaterial(Matnr); }).map(CampanhaItemSupport.pendente));

						that._atualizarItensJaComprados();

						that.onInicializaCamposItens();

						return that._recarregarPedidoAposMudanca(function () { return that._contextoAtual(sContexto, iOperacao); }, "O item foi excluído").then(function () {
							if (that._contextoAtual(sContexto, iOperacao)) { return that.onCarregarItensCampanha(NrPedido).catch(function (oErro) { that.onMensagemErroODATA(oErro); }); }
						});
					}).catch(function (error) {

						if (!that._contextoAtual(sContexto, iOperacao)) { return; }

						if (bExcluido) { MessageBox.warning(error.message || "O item foi excluído, mas não foi possível atualizar todos os dados do pedido. Reabra o pedido para atualizar os valores."); } else { that.onMensagemErroODATA(error); }

					}).then(function () { if (that._contextoAtual(sContexto, iOperacao)) { that._definirProcessando(false); } });

				}

			});

		},

		onResetaTela: function () {
			if (this.getModel("modelItensUI").getProperty("/Processando")) { return; }
			var that = this;
			if (this.getModel("modelVar").getProperty("/Editar") === true) {
				MessageBox.show("Deseja cancelar a edição?", {
					icon: MessageBox.Icon.WARNING, title: "Edição de itens", actions: ["Confirmar", "Cancelar"], onClose: function (sAcao) {
						if (sAcao === "Confirmar") { that.onInicializaCamposItens(); }
					}
				});
			} else { this.onInicializaCamposItens(); }
		},

		formatarDescricaoItem: function (sDescricao) { return ItemPedidoSupport.formatarDescricao(sDescricao); },
		formatarDataItem: function (vData) { return ItemPedidoSupport.formatarData(vData); },
		formatarDescontoItem: function (vPreco, vLiquidoTabela) { return ItemPedidoSupport.formatarDesconto(vPreco, vLiquidoTabela); },
		onDetalhesItemPress: function (oEvent) {
			var oSource = oEvent.getSource();
			var oContexto = oSource.getBindingContext("modelItensPedidoGrid") || oSource.getBindingContext("modelItensJaComprados");
			if (oContexto) { ItemPedidoSupport.abrirDetalhes(this, oContexto.getObject()); }
		},
		onTodasPropriedadesDigitacaoPress: function () { ItemPedidoSupport.abrirDetalhes(this, this.getModelGlobal("modelItem").getData()); },
		onAbrirDetalhesDigitacao: function () { this.byId("idDialogDetalhesDigitacao").open(); },
		onFecharDetalhesDigitacao: function () { this.byId("idDialogDetalhesDigitacao").close(); },

		onCarregarHistoricoCompras: function () {
			this._garantirContextoHistorico();
			var that = this;
			var oPedido = this._copiarItem(this.getModelGlobal("modelPedido").getData());
			var sContexto = this._chaveContextoHistorico(oPedido);
			var iConsulta = ++this._consultaHistorico;
			var oUI = this.getModel("modelItensUI");
			this._historicoCompras = [];
			this.getModel("modelItensJaComprados").setData([]);
			oUI.setProperty("/HistoricoCarregado", false);
			oUI.setProperty("/HistoricoCarregando", true);
			oUI.setProperty("/HistoricoErro", "");
			oUI.setProperty("/HistoricoMensagem", "Consultando compras anteriores...");
			var fnAtual = function () { return iConsulta === that._consultaHistorico && sContexto === that._obterContextoHistorico(); };
			return new Promise(function (res, rej) {
				that.onBuscarItensJaComprados(oPedido, that.getModelGlobal("modelAux").getProperty("/CodRepres"), res, rej);
			}).then(function (aItens) {
				if (!fnAtual()) { return; }
				if (aItens === null) { oUI.setProperty("/HistoricoMensagem", "Consulta de histórico ainda não configurada."); return; }
				that.onDefinirHistoricoCompras(aItens, oPedido);
				oUI.setProperty("/HistoricoMensagem", "Nenhum item já comprado está pendente de inclusão.");
			}).catch(function (oErro) {
				if (!fnAtual()) { return; }
				oUI.setProperty("/HistoricoMensagem", "Não foi possível carregar o histórico de compras.");
				oUI.setProperty("/HistoricoErro", oErro instanceof Error ? oErro.message : "Falha ao consultar o histórico de compras. Tente atualizar o histórico novamente.");
			}).then(function () { if (fnAtual()) { oUI.setProperty("/HistoricoCarregando", false); } });
		},

		// Integrar com o retorno real do histórico de compras do cliente. Não é uma lista de produtos disponíveis.
		// Para consultas assíncronas, passar também { NrPedido, Kunnr, Bukrs, Werks } capturados antes da consulta.
		onDefinirHistoricoCompras: function (aItens, oEscopo) {
			if (!Array.isArray(aItens)) { throw new TypeError("O histórico deve ser informado como uma lista de itens realmente comprados pelo cliente."); }
			this._garantirContextoHistorico();
			if (oEscopo && this._chaveContextoHistorico(oEscopo) !== this._obterContextoHistorico()) { return false; }
			var that = this;
			var oPedido = this.getModelGlobal("modelPedido").getData();
			var bOutroCliente = aItens.some(function (oItem) { return oItem && oItem.Kunnr && that._normalizarMaterial(oItem.Kunnr) !== that._normalizarMaterial(oPedido.Kunnr); });
			if (bOutroCliente) { throw new Error("O histórico recebido contém dados de outro cliente."); }
			var bOutraEmpresa = aItens.some(function (oItem) { return oItem && oItem.Bukrs !== undefined && String(oItem.Bukrs) !== String(oPedido.Bukrs); });
			if (bOutraEmpresa) { throw new Error("O histórico recebido contém dados de outra empresa."); }
			this._historicoCompras = aItens.filter(function (oItem) { return oItem && oItem.Matnr !== undefined && String(oItem.Matnr).trim() !== ""; }).map(function (oItem) { return that._copiarItem(oItem); });
			this.getModel("modelItensUI").setProperty("/HistoricoCarregado", true);
			this.getModel("modelItensUI").setProperty("/HistoricoMensagem", "Nenhum item já comprado está pendente de inclusão.");
			this.getModel("modelItensUI").setProperty("/HistoricoErro", "");
			this._atualizarItensJaComprados();
			return true;
		},

		onInserirItensHistoricoPress: function () {
			var oUI = this.getModel("modelItensUI");
			if (oUI.getProperty("/Processando") || !this._validarPedidoEditavel()) { return; }
			this._garantirContextoHistorico();
			if (!oUI.getProperty("/HistoricoCarregado") || oUI.getProperty("/HistoricoCarregando")) { MessageBox.information("Aguarde o carregamento do histórico antes de inserir os itens."); return; }
			if (this._temDigitacaoPendente()) { MessageBox.information("Conclua a inclusão ou edição do item no cabeçalho, ou use Limpar, antes de inserir os itens selecionados."); return; }
			var that = this;
			var oTabela = this.byId("idTableItensJaComprados");
			var mSelecionados = Object.create(null);
			var aSelecionados = oTabela.getSelectedIndices().map(function (iIndice) { var oContexto = oTabela.getContextByIndex(iIndice); return oContexto ? that._copiarItem(oContexto.getObject()) : null; }).filter(function (oItem) {
				var sMaterial = oItem ? that._normalizarMaterial(oItem.Matnr) : "";
				if (!sMaterial || mSelecionados[sMaterial]) { return false; }
				mSelecionados[sMaterial] = true;
				return true;
			});
			if (!aSelecionados.length) { MessageBox.information("Selecione os itens já comprados que deseja inserir no pedido."); return; }
			var oPedido = this._copiarItem(this.getModelGlobal("modelPedido").getData());
			var sContexto = this._obterContextoHistorico();
			var sRepresentante = String(this.getModelGlobal("modelAux").getProperty("/CodRepres") || "");
			var iOperacao = ++this._operacaoItens;
			var oResultado = { inseridos: [], ignorados: [], falhas: [], interrompido: false };
			var fnAtual = function () { return iOperacao === that._operacaoItens && sContexto === that._obterContextoHistorico() && sRepresentante === String(that.getModelGlobal("modelAux").getProperty("/CodRepres") || "") && String(oPedido.IdStatusPedido) === String(that.getModelGlobal("modelPedido").getProperty("/IdStatusPedido")); };
			this._definirProcessando(true);
			oUI.setProperty("/HistoricoInserindo", true);
			oUI.setProperty("/HistoricoResultado", "");
			oTabela.clearSelection();
			// Captura as linhas antes de alterar a grade: índices visuais mudam após cada inclusão.
			var pInsercao = aSelecionados.reduce(function (pAnterior, oHistorico, iIndice) {
				return pAnterior.then(function () {
					if (!fnAtual()) { oResultado.interrompido = true; return; }
					oUI.setProperty("/HistoricoProgresso", "Inserindo " + (iIndice + 1) + " de " + aSelecionados.length + ": " + oHistorico.Matnr);
					var sMaterial = that._normalizarMaterial(oHistorico.Matnr);
					var aPedido = that.getModelGlobal("modelItensPedidoGrid").getData() || [];
					var aExistentes = aPedido.filter(function (oItem) { return that._normalizarMaterial(oItem.Matnr) === sMaterial; });
					if (aExistentes.some(function (oItem) { return String(oItem.IdCorGrid) !== "1"; })) { oResultado.ignorados.push(oHistorico.Matnr); that._atualizarItensJaComprados(); return; }
					var oProduto = (that.vetorProdutos || []).filter(function (oItem) { return that._normalizarMaterial(oItem.Matnr) === sMaterial; })[0];
					if (!oProduto) { oResultado.falhas.push({ Matnr: oHistorico.Matnr, mensagem: "Item não permitido para digitação no catálogo atual." }); return; }
					var bEditar = aExistentes.length > 0;
					var oOriginal = bEditar ? that._copiarItem(aExistentes[0]) : { Matnr: oProduto.Matnr, PercPromo: 0, ValPrecoInform: 0 };
					oOriginal.QtdPedida = 1;
					var oParametros = that._parametrosPreco(oOriginal, bEditar ? "ChangeQuantidade" : "ChangeItem", bEditar);
					oParametros.NrPedido = oPedido.NrPedido;
					// O valor histórico nunca é usado como preço atual; todas as linhas passam pela precificação.
					return that._calcularPrecoItem(oParametros, oOriginal).then(function (oCalculado) {
						if (!fnAtual()) { oResultado.interrompido = true; return; }
						return that._salvarItemNoBackend(oCalculado, bEditar);
					}).then(function (oSalvo) {
						if (!oSalvo) { return; }
						oResultado.inseridos.push(oHistorico.Matnr);
						if (!fnAtual()) { oResultado.interrompido = true; return; }
						that._atualizarItemSalvo(oSalvo, oOriginal, bEditar);
					}).catch(function (oErro) {
						oResultado.falhas.push({ Matnr: oHistorico.Matnr, mensagem: that._mensagemErroHistorico(oErro) });
						if (!fnAtual()) { oResultado.interrompido = true; }
					});
				});
			}, Promise.resolve());
			return pInsercao.then(function () {
				if (!fnAtual() || !oResultado.inseridos.length) { return; }
				return that._recarregarPedidoAposMudanca(fnAtual, "Os itens foram salvos").catch(function (oErro) {
					if (fnAtual()) { oResultado.avisoTotais = oErro.message; }
				});
			}).then(function () {
				if (fnAtual()) {
					var sResumo = oResultado.inseridos.length + " item(ns) inserido(s), " + oResultado.ignorados.length + " já presente(s) e " + oResultado.falhas.length + " com falha.";
					oUI.setProperty("/HistoricoResultado", sResumo);
					var aDetalhes = oResultado.falhas.map(function (oFalha) { return oFalha.Matnr + ": " + oFalha.mensagem; });
					if (oResultado.avisoTotais) { aDetalhes.push(oResultado.avisoTotais); }
					if (aDetalhes.length) { MessageBox.warning(sResumo + "\n\n" + aDetalhes.join("\n"), { title: "Inclusão de itens já comprados" }); }
					else { MessageBox.information(sResumo, { title: "Inclusão de itens já comprados" }); }
				}
				return oResultado;
			}).then(function (oRetorno) {
				if (iOperacao === that._operacaoItens) { oUI.setProperty("/HistoricoInserindo", false); oUI.setProperty("/HistoricoProgresso", ""); that._definirProcessando(false); }
				return oRetorno;
			}, function (oErro) {
				if (iOperacao === that._operacaoItens) { oUI.setProperty("/HistoricoInserindo", false); oUI.setProperty("/HistoricoProgresso", ""); that._definirProcessando(false); }
				if (fnAtual()) { MessageBox.warning("Não foi possível concluir a inclusão dos itens: " + that._mensagemErroHistorico(oErro)); }
				return oResultado;
			});
		},

		_temDigitacaoPendente: function () { return !!this.getModel("modelVar").getProperty("/Editar") || !!this.getModelGlobal("modelItem").getProperty("/Matnr"); },
		_mensagemErroHistorico: function (oErro) {
			if (oErro && oErro.message) { return String(oErro.message); }
			if (oErro && oErro.responseText) { try { var oResposta = JSON.parse(oErro.responseText); if (oResposta.error && oResposta.error.message) { return String(oResposta.error.message.value || oResposta.error.message); } } catch (oIgnorado) { /* Resposta sem mensagem JSON legível. */ } }
			return "Falha ao consultar o preço ou salvar o item. Atualize o pedido antes de tentar novamente para confirmar se a gravação foi concluída.";
		},

		onAdicionarItemHistoricoPress: function (oEvent) {
			if (this.getModel("modelItensUI").getProperty("/Processando") || !this._validarPedidoEditavel()) { return; }
			this._garantirContextoHistorico();
			if (!this.getModel("modelItensUI").getProperty("/HistoricoCarregado")) { return; }
			var oContexto = oEvent.getSource().getBindingContext("modelItensJaComprados");
			if (!oContexto) { return; }
			var oItem = oContexto.getObject();
			if (this._temDigitacaoPendente()) { MessageBox.information("Conclua a inclusão ou edição do item no cabeçalho, ou use Limpar, antes de selecionar outro produto."); return; }
			var that = this;
			var aPedido = this.getModelGlobal("modelItensPedidoGrid").getData() || [];
			var oCampanha = aPedido.filter(function (oExistente) { return String(oExistente.IdCorGrid) === "1" && that._normalizarMaterial(oExistente.Matnr) === that._normalizarMaterial(oItem.Matnr); })[0];
			if (oCampanha) {
				this._carregarItemParaEdicao(oCampanha);
				if (!(Number(oCampanha.QtdPedida) > 0)) { this.getModelGlobal("modelItem").setProperty("/QtdPedida", 1); }
				return this._recalcularDigitacao("ChangeQuantidade");
			}
			this.onInicializaCamposItens();
			this.getModelGlobal("modelItem").setProperty("/Matnr", oItem.Matnr);
			this.byId("idBtnAdd").setText("Inserir");
			return this.onItemChange();
		},

		_atualizarItensJaComprados: function () {
			this._garantirContextoHistorico();
			var that = this;
			var oGrid = this.getModelGlobal("modelItensPedidoGrid");
			var aPedido = oGrid ? oGrid.getData() || [] : [];
			var mPresentes = Object.create(null);
			// IdCorGrid 1 representa sugestão de campanha ainda não digitada, conforme os totais do pedido.
			aPedido.forEach(function (oItem) { if (String(oItem.IdCorGrid) !== "1") { mPresentes[that._normalizarMaterial(oItem.Matnr)] = true; } });
			var aDisponiveis = (this._historicoCompras || []).filter(function (oItem) {
				var sMaterial = that._normalizarMaterial(oItem.Matnr);
				if (!sMaterial || mPresentes[sMaterial]) { return false; }
				mPresentes[sMaterial] = true;
				return true;
			});
			this.getModel("modelItensJaComprados").setData(aDisponiveis);
		},

		_garantirContextoHistorico: function () {
			var sContexto = this._obterContextoHistorico();
			if (sContexto !== this._contextoHistorico) {
				this._contextoHistorico = sContexto;
				this.getModel("modelItensUI").setProperty("/HistoricoResultado", "");
				this._historicoCompras = [];
				this.getModel("modelItensJaComprados").setData([]);
				this.getModel("modelItensUI").setProperty("/HistoricoCarregado", false);
				this.getModel("modelItensUI").setProperty("/HistoricoCarregando", false);
				this.getModel("modelItensUI").setProperty("/HistoricoErro", "");
				this.getModel("modelItensUI").setProperty("/HistoricoMensagem", "Atualize o histórico para consultar as compras anteriores.");
			}
		},

		_normalizarMaterial: function (vMaterial) { var sMaterial = String(vMaterial === undefined || vMaterial === null ? "" : vMaterial).trim(); return /^\d+$/.test(sMaterial) ? sMaterial.replace(/^0+(?=\d)/, "") : sMaterial; },
		_chaveContextoHistorico: function (oPedido) { return JSON.stringify([this._chaveContexto(oPedido), String(oPedido.Bukrs || "")]); },
		_obterContextoHistorico: function () { return this._chaveContextoHistorico(this.getModelGlobal("modelPedido").getData()); },
		_chaveContexto: function (oPedido) { return JSON.stringify([String(oPedido.NrPedido || ""), this._normalizarMaterial(oPedido.Kunnr), String(oPedido.Werks || "")]); },
		_obterContextoPedido: function () { return this._chaveContexto(this.getModelGlobal("modelPedido").getData()); },
		_contextoAtual: function (sContexto, iOperacao) { return sContexto === this._obterContextoPedido() && iOperacao === this._operacaoItens; },
		_definirProcessando: function (bProcessando) { this.getModel("modelItensUI").setProperty("/Processando", bProcessando); this.byId("idItens").setBusy(bProcessando); var oDialog = this.byId("idDialogDetalhesDigitacao"); if (oDialog) { oDialog.setBusy(bProcessando); } },
		_limparAlteracoesDigitacao: function () { this._eventoPrecoPendente = ""; var oModel = this.getModel("modelAtualizarItem"); if (oModel) { oModel.setData({ changeQnt: false, changePreco: false, changePromo: false }); } },
		_validarPedidoEditavel: function () {
			var sStatus = String(this.getModelGlobal("modelPedido").getProperty("/IdStatusPedido"));
			if (sStatus === "4") { MessageBox.warning("O status atual do pedido não permite alterar os itens."); return false; }
			if (sStatus === "3") { MessageBox.warning("Não é possível alterar itens de pedidos que já foram integrados!"); return false; }
			if (sStatus === "2") { MessageBox.warning("Reabra o pedido antes de editar!"); return false; }
			return true;
		},
		_precoVendaValido: function (vPreco) { return vPreco !== null && vPreco !== undefined && String(vPreco).trim() !== "" && isFinite(Number(vPreco)) && Number(vPreco) >= 0; },
		_erroNegocio: function (sMensagem) { var oErro = new Error(sMensagem); oErro.negocioItem = true; return oErro; },
		_mostrarErroItem: function (oErro) {
			if (oErro && oErro.negocioItem) {
				if (oErro.message.indexOf("já foi inserido") !== -1 && this._carregarItemJaInserido(oErro.message)) { return; }
				MessageBox.warning(oErro.message, { title: "Não Permitido" });
			} else { this.onMensagemErroODATA(oErro); }
		},
		_copiarItem: function (vValor) {
			var that = this;
			if (vValor instanceof Date) { return new Date(vValor.getTime()); }
			if (Array.isArray(vValor)) { return vValor.map(function (vItem) { return that._copiarItem(vItem); }); }
			if (vValor && typeof vValor === "object") { var oCopia = {}; Object.keys(vValor).forEach(function (sChave) { oCopia[sChave] = that._copiarItem(vValor[sChave]); }); return oCopia; }
			return vValor;
		},
		onFocusQnt: function () { this.byId("idPromocaoDigitacao").focus(); },
		onFocusPromocaoDigitacao: function () { this.byId("idPrecoVenda").focus(); },
		onFocusPromo: function () { this.byId("idPromocao").focus(); },
		onFocusVenda: function () { this.byId("idBtnAdd").focus(); }
	});
});
