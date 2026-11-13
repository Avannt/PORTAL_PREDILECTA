/*global history */
/*eslint-disable no-console, no-alert */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/format/FileSizeFormat",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	"sap/ui/core/format/NumberFormat",
	"sap/ui/core/format/DateFormat"
], function (Controller, History, UIComponent, MessageBox, JSONModel, FileSizeFormat, Filter, FilterOperator, NumberFormat, DateFormat) {
	"use strict";

	var oFormatoData = DateFormat.getDateInstance({
		pattern: "dd/MM/yyyy"
	});

	return Controller.extend("application.controller.BaseController", {

		init: function () {
			// call the init function of the parent
			UIComponent.prototype.init.apply(this, arguments);

			this.getRouter().initialize();
		},

		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		getModelGlobal: function (sName) {
			return this.getOwnerComponent().getModel(sName);
		},

		setModelGlobal: function (oModel, sName) {
			return this.getOwnerComponent().setModel(oModel, sName);
		},

		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		onFormatHora: function (duration) {

			var milliseconds = Math.floor((duration % 1000) / 100),
				seconds = Math.floor((duration / 1000) % 60),
				minutes = Math.floor((duration / (1000 * 60)) % 60),
				hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

			hours = (hours < 10) ? "0" + hours : hours;
			minutes = (minutes < 10) ? "0" + minutes : minutes;
			seconds = (seconds < 10) ? "0" + seconds : seconds;

			return hours + ":" + minutes + ":" + seconds;
		},

		// IdCorGrid descontinuado: mantidos os métodos existentes para compatibilidade.
		_normalizarIdCorGrid: function (vIdCorGrid) { return vIdCorGrid; },

		ehItemPedidoDigitado: function (oItem) {
			// Regra anterior comentada: return !!oItem && this._normalizarIdCorGrid(oItem.IdCorGrid) === "0";
			return !!oItem;
		},

		contarItensPedidoDigitados: function (aItens) {
			return (aItens || []).filter(this.ehItemPedidoDigitado, this).length;
		},

		temCorGridUm: function () {
			// Classificação antiga desativada. As sugestões já usam modelItensCampanha.
			return false;
		},

		onNavBack: function (oEvent) {

			var oHistory, sPreviousHash;
			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("NotFound", {}, true);
			}
		},

		containsSpecialChars: function (str) {

			// const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
			const specialChars = /[`!@#$%^&*()_+\=\[\]{};':"\\|,<>\?~]/;

			return specialChars.test(str);
		},

		formatAttribute: function (sValue) {

			if (jQuery.isNumeric(sValue.ms)) {

				return this.onFormatHora(sValue.ms);

				// 	return FileSizeFormat.getInstance({
				// 		binaryFilesize: false,
				// 		maxFractionDigits: 1,
				// 		maxIntegerDigits: 3
				// 	}).format(sValue);

			}
			if (jQuery.isNumeric(sValue)) {

				return sValue;

				// 	return FileSizeFormat.getInstance({
				// 		binaryFilesize: false,
				// 		maxFractionDigits: 1,
				// 		maxIntegerDigits: 3
				// 	}).format(sValue);

			} else {

				try {

					var dia = sValue.getUTCDate();
					dia = String(dia).length == 1 ? "0" + String(dia) : String(dia);

					var mes = sValue.getUTCMonth() + 1;
					mes = String(mes).length == 1 ? "0" + String(mes) : String(mes);

					var ano = sValue.getUTCFullYear();

					return dia + "/" + mes + "/" + ano;

				} catch (y) {

					return sValue;
				}
			}
		},

		formatPeriodo: function (value) {

			if (value !== null && value !== undefined) {

				return value.substring(0, 3) + "/" + value.substring(3, value.length);
			}
		},

		onFormatCnpj: function (value) {

			if (value != "" && value !== null && value != undefined) {

				value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, "\$1.\$2.\$3\/\$4\-\$5");

				return value;
			}
		},

		// onFormatCancelaSaldo: function (value) {

		// 	if (value != undefined) {

		// 		if (value == "S" || value == "SIM") {

		// 			return "Não";

		// 		} else if (value == "N") {

		// 			return "Sim";
		// 		}
		// 	}
		// },

		_normalizarIndicador: function (value) {
			return value == null ? "" : String(value).trim().toUpperCase();
		},

		onFormatCancelaSaldo: function (value) {
			var sValue = this._normalizarIndicador(value);
			return sValue === "S" || sValue === "SIM" ? "Não" : "Sim";
		},

		onFormatOpTriangular: function (value) {
			var sValue = this._normalizarIndicador(value);
			return sValue === "S" || sValue === "SIM" ? "Sim" : "Não";
		},

		onFormatRegimeEspecial: function (value) {
			if (value === undefined || value === null || value === "") {
				return "Não";
			}

			var oData = null;
			var sValue = String(value).trim();

			if (value instanceof Date) {
				oData = value;
			} else {
				var aDataOData = /^\/Date\((-?\d+)(?:[+-]\d+)?\)\/$/.exec(sValue);
				var aDataISO = /^(\d{4})-(\d{2})-(\d{2})/.exec(sValue);
				var aDataBrasileira = /^(\d{2})[./-](\d{2})[./-](\d{4})$/.exec(sValue);

				if (aDataOData) {
					oData = new Date(Number(aDataOData[1]));
				} else if (aDataISO) {
					oData = new Date(Date.UTC(Number(aDataISO[1]), Number(aDataISO[2]) - 1, Number(aDataISO[3])));
				} else if (aDataBrasileira) {
					oData = new Date(Date.UTC(Number(aDataBrasileira[3]), Number(aDataBrasileira[2]) - 1, Number(aDataBrasileira[1])));
				}
			}

			if (!(oData instanceof Date) || isNaN(oData.getTime())) {
				return "Não";
			}

			return "Sim - válido até " + oFormatoData.format(oData, true);
		},

		onFormatTelefone: function (value) {

			var cleaned = ('' + value).replace(/\D/g, '');
			var match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);

			if (match) {
				return '(' + match[1] + ') ' + match[2] + '-' + match[3];
			}

			return null;
		},

		myFormatterHora: function (value) {

			if (value !== undefined && value !== null && value !== "" && value !== 0) {

				var hora = value.split(":");
				return hora[0] + ":" + hora[1];
			}

		},

		myFormatterData: function (value) {

			if (value !== undefined && value !== null && value !== "" && value !== 0) {
				var data = value.split("/");
				value = data[0] + "/" + data[1];

				return value;
			}
		},

		onDeleteProperties: function (Obj) {

			delete Obj.__metadata;
			delete Obj.WerksDesc;
			delete Obj.KunnrDesc;

			return Obj;
		},
		onFormatNumberPedido: function (Obj) {

			for (var property in Obj) {

				if (property != "Completo" && property != "CheckIncentivo" && property != "EnviarEmailCliente" && property != "DataIniConv" &&
					property != "EnviarEmailRepres" && property != "LogVerbaRentNeg" && property != "TotalItens" && property != "LogProposta"
					&& property != "IsGerente" && property != "IsDivisor" && property != "IsSupervisor") {

					Obj[property] = String(Obj[property]);
				}

				if (property == "PedidoOrigem") {
					Obj[property] = Obj[property].replace(/\s/g, '');;
				}

				if (property == "LogVerbaRentNeg" || property == "LogProposta") {
					Obj[property] = String(Obj[property]) == "true" ? true : false;
				}

				if (Obj[property] == 'isNaN') {
					Obj[property] = "0.00";
				}
			}

			return Obj;
		},

		onBuscarPedidosCount: function (Cliente, CodRepres, Envio, res, rej, that) {

			that.oModel.read("/P_PedidoQ/$count", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + CodRepres + "' and IvKunnr eq '" + Cliente + "' and IvEnvio eq " + Envio
				},
				success: function (data) {

					res(data);
				},
				error: function (error) {

					rej(error);
				}
			});
		},

		onBuscarPedidos: function (Cliente, CodRepres, Envio, res, rej, that) {

			that.oModel.read("/P_PedidoQ", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + CodRepres + "' and IvKunnr eq '" + Cliente + "' and IvEnvio eq " + Envio
				},
				success: function (data) {

					res(data.results);
				},
				error: function (error) {

					rej(error);
				}
			});
		},

		onBuscarCliente: function (res, rej, Cliente, Usuario, that) {

			that.oModel.read("/ClienteR(IvUsuario='" + Usuario + "',IvCliente='" + Cliente + "')", {
				success: function (data) {

					res(data);
				},
				error: function (error) {

					rej(error);
				}
			});
		},

		// Histórico de compras: entidade e filtros de entrada confirmados no serviço SEGW.
		onBuscarItensJaComprados: function (Pedido, CodRepres, res, rej) {
			var sEntitySet = "/P_HistoricoCompras";
			if (!sEntitySet) { res(null); return; }
			if (!Pedido || !Pedido.Kunnr || !Pedido.Bukrs || !Pedido.Werks || !CodRepres) { rej(new Error("Cliente, empresa, centro e representante são necessários para consultar o histórico.")); return; }

			// Parâmetros de entrada publicados pela entidade; os campos de retorno não têm o prefixo Iv.
			var aFiltros = [new Filter("IvKunnr", FilterOperator.EQ, Pedido.Kunnr), new Filter("IvBukrs", FilterOperator.EQ, Pedido.Bukrs), new Filter("IvWerks", FilterOperator.EQ, Pedido.Werks), new Filter("IvUsuario", FilterOperator.EQ, CodRepres)];
			var oModel = this.getModelGlobal("modelAux").getProperty("/DBModel");
			oModel.read(sEntitySet, {
				filters: aFiltros,
				success: function (oData) {
					if (!oData || !Array.isArray(oData.results)) { rej(new Error("O histórico deve retornar uma coleção OData em results.")); return; }
					if (oData.__next) { rej(new Error("A entidade de histórico retornou uma página parcial. Ajuste esta integração para buscar as páginas seguintes antes de preencher a grade.")); return; }
					// Retornar uma linha por material, com os campos da compra mais recente. Não chamar onFormatNumberItem aqui.
					res(oData.results);
				},
				error: rej
			});
		},

		onBuscarProdutos: function (CodRepres, Werks, res, rej, that) {

			that.oModel.read("/Produtos", {
				urlParameters: {
					"$filter": "Usuario eq '" + CodRepres + "' and Werks eq '" + Werks + "'"
				},
				success: function (retorno) {

					res(retorno.results);
				},
				error: function (error) {

					rej(error);
				}
			});
		},

		onBuscarTipoPedido: function (Usuario, Kunnr, Centro, Kvgr4, Kvgr5, res, rej, that) {

			that.oModel.read("/P_TipoPedidosR(IvRepres='" + Usuario + "',IvCliente='" + Kunnr + "',IvCentro='" + Centro + "',IvKvgr4='" +
				Kvgr4 + "',IvKvgr5='" + Kvgr5 + "')", {
				success: function (retorno) {

					res(retorno);
				},
				error: function (error) {

					rej(error);
				}
			});
		},

		onBuscarClienteEmpresa: function (Kunnr, Bukrs, res, rej, that) {

			that.oModel.read("/P_Cliente_Empresa(Kunnr='" + Kunnr + "',Vkorg='" + Bukrs + "')", {
				success: function (result) {

					res(result);
				},
				error: function (error) {

					rej(error);
				}
			});
		},

		onBuscarTabelaPreco: function (Pedido, Repres, res, rej, that) {

			that.oModel.read("/P_TabPrecos(IvKunnr='" + Pedido.Kunnr + "',IvBukrs='" + Pedido.Bukrs + "',IvRepres='" + Repres + "')", {
				success: function (result) {

					that.vetorTabPrecos = [];

					that.vetorTabPrecos.push(result);

					if (result.Pltyp != Pedido.Pltyp && Pedido.Pltyp != "") {

						var aux = {
							Pltyp: Pedido.Pltyp,
							Ptext: Pedido.PltypDesc
						};

						that.vetorTabPrecos.push(aux);
					}

					that.getModel("modelTabPrecos").setData(that.vetorTabPrecos);
					res();
				},
				error: function (error) {

					that.onMensagemErroODATA(error);
				}
			});
		},

		onBuscarPedido: function (NrPedido, res, rej, that) {

			that.oModel.read("/P_PedidoPR(NrPedido='" + NrPedido + "')", {
				success: function (data) {

					res(data);
				},
				error: function (error) {

					rej(error);
				}
			});
		},

		onInserirPedido: function (Pedido, res, rej, that) {

			that.oModel.create("/P_PedidoPR", Pedido, {
				method: "POST",
				success: function (data) {

					res(data);
				},
				error: function (error) {

					rej(error);
				}
			});
		},

		onInserirBP: function (Input, res, rej, that) {

			that.oModel.create("/P_CriarBP", IDBOpenDBRequest, {
				method: "POST",
				success: function (data) {

					res(data);
				},
				error: function (error) {

					rej(error);
				}
			});
		},

		onBuscarVencimentos: function (res, rej, that) {

			that.oModel.read("/Vencimentos", {
				success: function (result) {

					res(result.results);
				},
				error: function (error) {

					rej(error);
				}
			});
		},

		onBuscarCentros: function (CodRepres, res, rej, that) {

			that.oModel.read("/Centros", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + CodRepres + "'"
				},
				success: function (data) {

					res(data.results);
				},
				error: function (error) {

					rej(error);
				}
			});
		},

		temItensLista: function (aItens) { return Array.isArray(aItens) && aItens.length > 0; },

		onBuscarItensPedido: function (res, rej, NrPedido) {

			var that = this;

			that.oModel.read("/P_ItensPedidoQ", {
				urlParameters: {
					"$filter": "IvNrPedido eq '" + NrPedido + "'"
				},
				success: function (dataItens) {

					res(dataItens.results.map(function (oItem) {

						var oCopia = Object.assign({}, oItem);

						// IdCorGrid é preservado como recebido; não participa da classificação dos itens.

						return oCopia;
					}));
				},
				error: function (error) {

					rej(error);
				}
			});
		},

		// Consulta coleção de campanhas; não insere itens no pedido.
		onInserirItensPedidoCampanha: function (res, rej, NrPedido) {

			if (!NrPedido) { rej(new Error("Informe o número do pedido para consultar as campanhas.")); return; }

			this.oModel.read("/P_ItensCampPedidoQ", {
				filters: [new Filter("NrPedido", FilterOperator.EQ, String(NrPedido))],
				success: function (dataItens) {
					if (!dataItens || !Array.isArray(dataItens.results)) { rej(new Error("A consulta /P_ItensCampPedidoQ deve retornar uma coleção OData em results. Confira o GET_ENTITYSET da SEGW.")); return; }
					if (dataItens.__next) { rej(new Error("A consulta de campanhas retornou uma página parcial. Configure o retorno completo antes de exibir as sugestões.")); return; }
					res(dataItens.results);
				}, error: rej
			});
		},

		_contextoCampanhaPedido: function () {

			var oPedido = this.getModelGlobal("modelPedido").getData() || {};
			return JSON.stringify([oPedido.NrPedido, oPedido.Kunnr, oPedido.Bukrs, oPedido.Werks, oPedido.Usuario]);
		},

		_inicializarModeloCampanha: function () {
			if (!this.getModelGlobal("modelItensCampanha")) { this.setModelGlobal(new JSONModel([]), "modelItensCampanha"); }
		},

		onCarregarItensCampanha: function (NrPedido) {

			this._inicializarModeloCampanha();

			var that = this, oModelo = this.getModelGlobal("modelItensCampanha"), sContexto = this._contextoCampanhaPedido();
			var iConsulta = (oModelo._consultaCampanha || 0) + 1;
			oModelo._consultaCampanha = iConsulta;
			oModelo.setData([]);

			if (!NrPedido || String(this.getModelGlobal("modelPedido").getProperty("/NrPedido")) !== String(NrPedido)) {

				return Promise.resolve([]);
			}

			return new Promise(function (res, rej) { that.onInserirItensPedidoCampanha(res, rej, NrPedido); }).then(function (aCampanhas) {

				if (iConsulta !== oModelo._consultaCampanha || sContexto !== that._contextoCampanhaPedido()) { return []; }
				var mMateriais = Object.create(null);

				var aUnicos = aCampanhas.filter(function (oItem) {
					if (!oItem || !oItem.Matnr) { return false; }
					var sMaterial = String(oItem.Matnr).replace(/^0+/, "");
					if (mMateriais[sMaterial]) { return false; }
					mMateriais[sMaterial] = true;
					return true;
				}).map(function (oItem) { return Object.assign({}, oItem); });

				oModelo.setData(aUnicos);
				that._retirarCampanhasJaDigitadas();
				return oModelo.getData();

			}).catch(function (oErro) {

				if (iConsulta !== oModelo._consultaCampanha || sContexto !== that._contextoCampanhaPedido()) { return []; }
				throw oErro;
			});
		},

		_retirarCampanhasJaDigitadas: function () {
			var oCampanhas = this.getModelGlobal("modelItensCampanha");
			if (!oCampanhas) { return; }
			var oItens = this.getModelGlobal("modelItensPedidoGrid");
			var aDigitados = oItens ? oItens.getData() || [] : [];
			var mDigitados = Object.create(null);
			aDigitados.forEach(function (oItem) { if (oItem) { mDigitados[String(oItem.Matnr).replace(/^0+/, "")] = true; } });
			oCampanhas.setData((oCampanhas.getData() || []).filter(function (oItem) { return !mDigitados[String(oItem.Matnr).replace(/^0+/, "")]; }));
		},

		onDeletarItemPedido: function (res, rej, NrPedido, Matnr) {

			var that = this;

			that.oModel.remove("/P_ItensPedidoD(IvNrPedido='" + NrPedido + "',IvMatnr='" + Matnr + "')", {
				success: function (result) {

					res("OK");
				},
				error: function (error) {

					rej(error);
				}
			});
		},

		onBuscarClientes: function (CodRepres, res, rej, that) {

			that.oModel.read("/ClienteQ", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + CodRepres + "'"
				},
				success: function (retorno) {

					res(retorno.results);
				},
				error: function (error) {
					rej(error);
				}
			});
		},

		onBuscarRedesClientes: function (CodRepres, Empresa, res, rej, that) {

			that.oModel.read("/P_ClientesRedes", {
				urlParameters: {
					"$filter": "Usuario eq '" + CodRepres + "' and Vkorg eq '" + Empresa + "'"
				},
				success: function (retorno) {

					res(retorno.results);
				},
				error: function (error) {
					rej(error);
				}
			});
		},

		onBuscarRedesClientesRange: function (res, rej, that) {

			// RepresIni, RepresFin, EmpresaIni, EmpresaFin, 

			// var filters = [];

			// var oFilterRepres = new Filter({
			// 	path: "Repres",
			// 	operator: FilterOperator.EQ,
			// 	value1: RepresIni,
			// 	value2: RepresFin
			// });

			// filters.push(oFilterRepres);

			// var oFilterEmpresa = new Filter({
			// 	path: "Vkorg",
			// 	operator: FilterOperator.EQ,
			// 	value1: EmpresaIni,
			// 	value2: EmpresaFin
			// });

			// filters.push(oFilterEmpresa);

			that.oModel.read("/P_ClientesRedesRangeSet", {
				// Filter: [ oFilterRepres, oFilterEmpresa ],
				// urlParameters: {
				// 	"$filter": "Repres eq '" + RepresIni + "' and Vkorg eq '" + EmpresaIni + "'"
				// },
				success: function (retorno) {

					res(retorno.results);
				},
				error: function (error) {
					rej(error);
				}
			});
		},

		onBuscarStatusPedido: function (NF, Werks, res, rej, that) {

			that.oModel.read("/P_StatusPedido(IvNf='" + NF + "',IvWerks='" + Werks + "')", {
				success: function (retorno) {

					res(retorno);
				},
				error: function (error) {
					rej(error);
				}
			});
		},

		onFormatNumberItem: function (Obj) {

			for (var property in Obj) {

				if (property != "QtdPedida" && property != "IndexItem" && property != "ExcIncent" && property != "ExcVerba" && property !=
					"DataUltCompraUltMes") {

					Obj[property] = String(Obj[property]);
				}

				if (property == "ExcIncent" || property == "ExcVerba" || property == "Draft" || property == "ForaPolitica") {
					Obj[property] = String(Obj[property]) == "true" ? true : false;
				}
			}

			return Obj;
		},


		onCalculaRentabilidade: function () {

			var pedido = this.getModel("modelPedido").getData();
			var itens = this.getModel("modelItensPedidoGrid").getData();

			var ValTotalItens = this.getModel("modelPedido").getProperty("/ValorTotal");
			var ValDescAplicar = this.getModel("modelPedido").getProperty("/ValDescAplicar");
			var ValDescInformBoletoReduzid = this.getModel("modelPedido").getProperty("/ValDescInformBoletoReduzid");
			var ValLucro = this.getModel("modelPedido").getProperty("/ValLucro");

			var descTotalRealizado = parseFloat(ValLucro) - (parseFloat(ValDescAplicar) + parseFloat(ValDescInformBoletoReduzid));
			// this.getModel("modelPedido").setProperty("/ValLucro", descTotalRealizado);

			var ValResultante = descTotalRealizado / ValTotalItens;
			ValResultante = Math.round(ValResultante * 10000) / 10000;

			var PercLucroTotal = parseFloat(ValResultante * 100).toFixed(2);
			this.getModel("modelPedido").setProperty("/RentTotal", PercLucroTotal);

			if (PercLucroTotal >= 3) {

				this.getModel("modelPedido").setProperty("/RentTotalImg", './img/S.png');
			} else if (PercLucroTotal < 0) {

				this.getModel("modelPedido").setProperty("/RentTotalImg", './img/R.png');
			} else {

				this.getModel("modelPedido").setProperty("/RentTotalImg", './img/N.png');
			}
		},

		myFormatterDataMobile: function (value) {

			if (value != undefined) {

				try {

					var dataAux = value.indexOf("T");
					if (dataAux > 0) {

						dataAux = value.split("T");
						dataAux = dataAux[0].split("-");

						return dataAux[2] + "/" + dataAux[1] + "/" + dataAux[0];

					}

				} catch (x) {

					var dataAux2 = value;
					var Ano = String(dataAux2.getFullYear());

					var Mes = dataAux2.getMonth() + 1;
					var Mes = String(Mes).length == 1 ? "0" + String(Mes) : String(Mes);

					var Dia = dataAux2.getDate();
					var Dia = String(Dia).length == 1 ? "0" + String(Dia + 1) : String(Dia + 1);

					return Dia + "/" + Mes + "/" + Ano;

				}
			}
		},

		myFormatterData2: function (value) {

			if (value !== undefined && value !== null && value !== "" && value !== 0) {

				var data = value.split("/");
				value = data[0] + "/" + data[1];

				var data = new Date(Date.UTC(data[2], data[1], data[0]));

				return data;
			}
		},

		onFormatCpf: function (value) {

			if (value != "" && value !== null && value != undefined) {

				value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "\$1.\$2.\$3\-\$4");

				return value;
			}
		},

		onFormatSimplesNacional: function (value) {

			if (value != undefined) {

				if (value == "SN") {

					return "Sim";

				} else {

					return "Não";
				}
			}
		},

		myFormatterDataInvert: function (value) {
			if (value != undefined) {
				return value.substring(6, 8) + "/" + value.substring(4, 6) + "/" + value.substring(0, 4);
			}
		},

		myFormatterDataRevert: function (value) {

			if (value != undefined) {

				var data = value.split("/");
				return [String(data[2]) + String(data[1]) + String(data[0]), {
					dia: String(data[0]),
					mes: String(data[1]),
					ano: String(data[2])
				}];

			}
		},

		onExcluirPed: function (NrPedido, res, rej) {

			var that = this;

			that.oModel.remove("/P_PedidoD(IvNrPedido='" + NrPedido + "')", {
				success: function (result) {
					res();
				},
				error: function (error) {
					rej(error);
				}
			});
		},

		onCheckOnline: function (res, rej, RetiraAtual) {
			//Parâmentros de retirar atualização serve para tirar o flag de atualização obrigatória do SAP.

			var that = this;

			var modelAux = that.getModelGlobal("modelAux").getData();

			modelAux.DBModel.read("/CheckOnline(IvUsuario='" + modelAux.CodRepres + "',IvSenha='" + modelAux.Senha + "',IvSistOper='" +
				modelAux.SistemaOper +
				"',IvImei='" + modelAux.Imei + "',IvRetirarCheck=" + RetiraAtual + ",IvVersaoApp='" + modelAux.VersaoApp + "')", {
				success: function (retorno) {

					res();

				},
				error: function (error) {

					console.log(error);
					rej(error);
				}
			});
		},

		onDataHora: function () {

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

			var valores = {
				dia: dia,
				mes: mes,
				ano: ano,
				hora: hora,
				min: minuto,
				seg: seg
			};

			//HRIMP E DATIMP
			var data = String(dia + "/" + mes + "/" + ano);
			var horario = String(hora) + ":" + String(minuto) + ":" + String(seg);

			return [data, horario, valores];
		},

		onFormatterText: function (value) {

			if (value != undefined) {

				if (value.length > 20) {
					return value.substring(0, 20);
				} else {
					return value;
				}
			}
		},

		onMensagemErroODATA: function (error) {

			if (error.responseText == undefined) {

				if (error.response == undefined) {

					errorLog = String(error);

				} else {

					var error2 = error.response.body;

					if (error2 == undefined) {

						var errorLog = error.message;

					} else {

						var parser = new DOMParser();
						var xmlDoc = parser.parseFromString(error2, "text/xml");

						try {
							var msg = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;

						} catch (y) {
							var msg = xmlDoc.getElementsByTagName("body")[0].childNodes[0].textContent;
						}

						errorLog = msg;
					}
				}

			} else {

				try {

					errorLog = JSON.parse(error.responseText)["error"].message.value;

				} catch (x) {

					var parser = new DOMParser();
					var xmlDoc = parser.parseFromString(error.responseText, "text/xml");

					try {
						var msg = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;

					} catch (y) {
						var msg = xmlDoc.getElementsByTagName("body")[0].childNodes[0].textContent;
					}

					// var code = xmlDoc.getElementsByTagName("code")[0].childNodes[0].nodeValue;

					errorLog = msg;

				}
			}

			if (errorLog.includes("encaminhado para aprovação") > 0) {

				sap.m.MessageBox.show(
					errorLog, {
					icon: sap.m.MessageBox.Icon.WARNING,
					title: "Pedido Pendente de Aprovação!",
					actions: [sap.m.MessageBox.Action.OK],
					onClose: function (oAction) {

					}
				}
				);
			} else {

				sap.m.MessageBox.show(
					errorLog, {
					icon: sap.m.MessageBox.Icon.WARNING,
					title: "Erro!",
					actions: [sap.m.MessageBox.Action.OK],
					onClose: function (oAction) {

					}
				}
				);
			}
		},

		onCriarBP: function (Cliente, res, rej, that) {

			that.oModel.callFunction("/P_CriarBP", {
				method: "POST",
				urlParameters: Cliente,
				success: function (Data, Response) {

					res(Data);
				},
				error: function (Error) {

					rej(Error);
				}
			});
		},

		onDialogCancelar: function () {

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}
		},

		onTile: function (oEvent) {

			switch (oEvent.getSource().data("opcao")) {
				case "P01":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("pedido");
					break;
				case "P02":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("enviarPedidos");
					break;
				case "P03":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("menuRelatorios");
					break;
				case "P04":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("menuConsultas");
					break;
				case "P05":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("MsgPortal");
					break;
				case "R01":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("relatorioPedidos");
					break;
				case "R02":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("relatorioTabelas");
					break;
				case "R03":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("relatorioTitulos");
					break;
				case "R04":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("relatorioFaturamentoClientes");
					break;
				case "R05":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("relatorioFaturamentoItens");
					break;
				case "R06":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("relatorioNotasFiscais");
					break;
				case "A01":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("relatorioNotasFiscais");
					break;
				case "C01":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("detalheProdutos");
					break;
				case "C02":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("clienteConsultas");
					break;
				case "C03":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("VerbaConsultas");
					break;
				case "C04":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("cadastroRebaixa");
					break;
				case "C05":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("MovVerbas");
					break;
				case "C06":
					sap.ui.core.UIComponent.getRouterFor(this).navTo("CadastroBP");
					break;
				default:
					sap.ui.core.UIComponent.getRouterFor(this).navTo("notFound");
					break;
			}
		},

		setLog: function (sLog, sClasse) {

			console.log("[" + sClasse + "]", sLog);
		},

		onExpandFiltro: function (Event) {

			var filter = Event.getSource();

			if (filter.getExpanded()) {

				filter.setHeaderText("Ocultar Filtros");
			} else {

				filter.setHeaderText("Exibir Filtros");
			}
		},

		onDialogClose: function () {

			if (this._ItemDialog) {
				this._ItemDialog.destroy(true);
			}
		},

		onFormatNumberController: function (value) {

			var oFormatOptions = {

				decimalSeparator: ",",
				minIntegerDigits: 1,
				maxIntegerDigits: 10,
				minFractionDigits: 2,
				maxFractionDigits: 2
			};

			value = parseFloat(value);
			var oFloatFormat = NumberFormat.getFloatInstance(oFormatOptions);
			return oFloatFormat.format(value);
		},

		onChangeDataEntrega: function (oEvent) {
			const oModelPedido = this.getModel("modelPedido");
			const oPedido = oModelPedido.getData();

			// 1. Ativa sinalizador de alteração
			this.getModelGlobal("modelAux").setProperty("/ObrigaSalvar", true);

			// 2. Parse das datas usando os métodos auxiliares (evita manipulação manual de strings)
			// Assumindo que Pedido.DataEntrega está no formato DD/MM/YYYY
			const dEntrega = this.parseDateBR(oPedido.DataEntrega);
			const dSugerida = this.parseDateBR(oPedido.DataEntregaSugerida);

			let sDataLimiteFinal;

			// 3. Lógica de negócio para Data Limite
			if (dEntrega && dSugerida && dEntrega > dSugerida) {
				// Se a entrega for após a sugerida, subtrai o LeadTime
				// Usamos removeDays que retorna um objeto Date, depois formatamos
				const dLimiteCalculada = this.removeDays(dEntrega, oPedido.LeadTime);
				sDataLimiteFinal = this.formatDateBR(dLimiteCalculada);
			} else {
				// Caso contrário, utiliza a data atual do sistema (método auxiliar onDataHora)
				const oDataHoje = this.onDataHora();
				// Se onDataHora retorna um objeto com dia, mes, ano:
				sDataLimiteFinal = `${oDataHoje[2].dia}/${oDataHoje[2].mes}/${oDataHoje[2].ano}`;
			}

			// 4. Atualiza o modelo uma única vez
			oModelPedido.setProperty("/DataLimite", sDataLimiteFinal);
		},

		addDays: function (date, days) {

			var d = new Date(date.getTime());        // cópia
			d.setDate(d.getDate() + Number(days || 0));
			d.setHours(0, 0, 0, 0);                  // evita bug de DST/horário
			return d;
		},

		removeDays: function (date, days) {
			var d = new Date(date.getTime());      // cópia
			d.setDate(d.getDate() - Number(days || 0));
			d.setHours(0, 0, 0, 0);                // evita variação por horário/DST
			return d;
		},

		parseDateBR: function (s) {

			if (!s) return null;

			var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
			if (!m) return null;

			var dd = Number(m[1]);
			var mm = Number(m[2]);
			var yyyy = Number(m[3]);

			// cria a data
			var d = new Date(yyyy, mm - 1, dd);
			d.setHours(0, 0, 0, 0);

			// valida se “voltou” (ex.: 31/11 vira 01/12)
			if (d.getFullYear() !== yyyy || d.getMonth() !== (mm - 1) || d.getDate() !== dd) {
				return null; // inválida
			}
			return d;
		},

		removeDaysBR: function (date, days) {

			return formatDateBR(removeDays(date, days));
		},

		formatDateBR: function (date) {

			var dd = String(date.getDate()).padStart(2, "0");
			var mm = String(date.getMonth() + 1).padStart(2, "0");
			var yyyy = date.getFullYear();
			return dd + "/" + mm + "/" + yyyy;
		},

		formatterStatusIcon: function (status) {

			switch (String(status.trim())) {

				case "1":
					return "sap-icon://edit";

				case "2":
					return "sap-icon://pending";

				case "3":
					return "sap-icon://accept";

				case "4":
					return "sap-icon://process";

				default:
					return "sap-icon://question-mark";
			}

		},
		formatterStatusState: function (status) {

			switch (String(status.trim())) {

				case "1":
					return "None";

				case "2":
					return "Information";

				case "3":
					return "Success";

				case "4":
					return "Warning";

				default:
					return "None";
			}

		},
		formatterForaPoliticaTexto: function (bValor) {
			return (bValor === true || bValor === "true" || bValor === "X")
				? "Nāo"
				: "Sim";
		},

		formatterForaPoliticaIcon: function (bValor) {
			return (bValor === true || bValor === "true" || bValor === "X")
				? "sap-icon://decline"
				: "sap-icon://accept";
		},

		formatterForaPoliticaState: function (bValor) {
			return (bValor === true || bValor === "true" || bValor === "X")
				? "Error"
				: "Success";
		}
	});
});
