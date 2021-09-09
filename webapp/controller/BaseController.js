/*global history */
/*eslint-disable no-console, no-alert */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel"
], function (Controller, History, UIComponent, MessageBox, JSONModel) {
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

				if (property != "Completo" && property != "CheckIncentivo" && property != "EnviarEmailCliente" &&
					property != "EnviarEmailRepres" && property != "LogVerbaRentNeg" && property != "TotalItens" && property != "LogProposta") {

					Obj[property] = String(Obj[property]);
				}

				if (property == "LogVerbaRentNeg" || property == "LogProposta") {
					Obj[property] = String(Obj[property]) == "true" ? true : false;
				}
			}

			return Obj;
		},

		onCheckPedido: function (CodRepres, Cliente, res, rej, that) {

			that.oModel.read("/P_CheckPedidoR(IvUsuario='" + CodRepres + "',IvKunnr='" + Cliente + "')", {
				success: function (result) {

					res(result);
				},
				error: function (error) {

					rej(error);
				}
			});
		},

		onBuscarPedidos: function (Cliente, CodRepres, Envio, res, rej, that, Count) {

			if (Count == true) {

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

			} else {

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
			}
		},

		onBuscarProdutos: function (CodRepres, res, rej, that) {

			that.oModel.read("/Produtos", {
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

		onBuscarPedido: function (NrPedido, res, rej) {

			var that = this;

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

		onFormatNumberItem: function (Obj) {

			for (var property in Obj) {

				if (property != "QtdPedida" && property != "IndexItem" && property != "ExcIncent" && property != "ExcVerba") {

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

					var errorLog = String(error);

				} else {

					var error2 = error.response.body;

					if (error2 == undefined) {

						errorLog = error.message;

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

		setLog: function (sLog, sClasse) {
			console.log("[" + sClasse + "]", sLog);
		}

	});
});