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
	'sap/ui/model/FilterOperator'
], function (Controller, History, UIComponent, MessageBox, JSONModel, FileSizeFormat, Filter, FilterOperator) {
	"use strict";

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

		onFormatCancelaSaldo: function (value) {

			if (value != undefined) {

				if (value == "S") {

					return "Não";

				} else if (value == "N") {

					return "Sim";
				}
			}
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

		onFormatNumberPedido: function (Obj) {

			for (var property in Obj) {

				if (property != "Completo" && property != "CheckIncentivo" && property != "EnviarEmailCliente" && property != "DataIniConv" &&
					property != "EnviarEmailRepres" && property != "LogVerbaRentNeg" && property != "TotalItens" && property != "LogProposta") {

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

		onBuscarItensPedido: function (res, rej, NrPedido) {

			var that = this;

			that.oModel.read("/P_ItensPedidoQ", {
				urlParameters: {
					"$filter": "IvNrPedido eq '" + NrPedido + "'"
				},
				success: function (dataItens) {

					res(dataItens.results);
				},
				error: function (error) {

					rej(error);
				}
			});
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

				if (property == "ExcIncent" || property == "ExcVerba" || property == "Draft") {
					Obj[property] = String(Obj[property]) == "true" ? true : false;
				}
			}

			return Obj;
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

			sap.m.MessageBox.show(
				errorLog, {
				icon: sap.m.MessageBox.Icon.WARNING,
				title: "Erro!",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: function (oAction) {

				}
			}
			);
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
		}

	});
});