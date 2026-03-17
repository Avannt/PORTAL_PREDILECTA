/*eslint-disable no-console, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
], function (BaseController, JSONModel, Fragment) {
	"use strict";

	return BaseController.extend("application.controller.Menu", {

		onInit: function () {

			this.getRouter().getRoute("menu").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: async function () {

			try {
				this.oModel = this.getView().getModel();

				var codRepres = this.getModelGlobal("modelAux").getProperty("/CodRepres");
				var cliente = "";
				var envio = true;

				this.byId("idPage").setBusy(true);

				// count pedidos
				var dataCount = await new Promise(function (resolve, reject) {
					this.onBuscarPedidosCount(cliente, codRepres, envio, resolve, reject, this);
				}.bind(this));

				// monta menu
				var menu = this.getModelGlobal("modelMenu").getData() || [];
				var objGeral = { Principal: [], Consultas: [], Relatorios: [] };

				for (var i = 0; i < menu.length; i++) {
					var posicao = menu[i].Posicao;

					var item = {
						id: menu[i].IdMenu,
						icon: menu[i].Icone,
						title: menu[i].DescMenu,
						info: menu[i].InfoAdic,
						visible: menu[i].Ativo,
						number: menu[i].Numero
					};

					if (posicao === "01") {
						if (item.id === "P02") item.number = dataCount;
						objGeral.Principal.push(item);
					} else if (posicao === "02") {
						objGeral.Consultas.push(item);
					} else if (posicao === "03") {
						objGeral.Relatorios.push(item);
					}
				}

				this.getModel("menu").setData(objGeral);

				var oAux = this.getModelGlobal("modelAux");

				if (!oAux.getProperty("/carouselLoaded")) {

					oAux.setProperty("/carouselLoaded", true);

					await this._openCarouselWithRepresMsgs();
				}

			} catch (error) {
				this.onMensagemErroODATA(error);
			} finally {
				this.byId("idPage").setBusy(false);
			}
		},

		_onRouteMatched: async function (oEvent) {

			try {
				const db = await this._openIndexedDB();

				const pedidos = await this._getPrePedidosByStatus(db, 2);

				const qntItens = pedidos.length;

				var menus = this.getModel("modelMenu").getData();

				if (menus && menus.Principal) {

					for (var i = 0; i < menus.Principal.length; i++) {

						menus.Principal[i].Number = "";

						if (menus.Principal[i].IdMenu === "P02") {
							menus.Principal[i].Number = qntItens;
						}
					}

					this.getModel("modelMenu").refresh(true);
				}

			} catch (error) {

				MessageBox.show(error?.message || "Erro ao acessar banco de dados.", {
					icon: MessageBox.Icon.ERROR,
					title: "Banco não encontrado!",
					actions: [MessageBox.Action.OK]
				});

				console.error("Erro em _onRouteMatched:", error);
			}
		},

		_openCarouselWithRepresMsgs: async function () {
			var codRepres = this.getModelGlobal("modelAux").getProperty("/CodRepres");

			var aMsgs = await this._loadMsgsWithAnexosAsync(codRepres);

			// garante modelMsg
			if (!this.getModel("modelMsg")) {
				this.setModel(new JSONModel([]), "modelMsg");
			}
			this.getModel("modelMsg").setData(aMsgs);

			// monta itens do carousel
			var aCarouselItems = this._buildCarouselItemsFromMsgs(aMsgs);

			// set model carousel
			this.setModel(new JSONModel({ items: aCarouselItems }), "modelCarousel");

			if (aCarouselItems.length > 0) {

				var oDialog = await this._getAnexosDialog();
				oDialog.open();

				if (!aCarouselItems.length) {
					sap.m.MessageToast.show("Nenhuma imagem encontrada para promoções.");
				}

				var oModel = this.getModel("modelCarousel");
				oModel.setProperty("/visitedIds", {});                 // mapa de vistos
				oModel.setProperty("/visitedCount", 0);
				oModel.setProperty("/total", aCarouselItems.length);
				oModel.setProperty("/canClose", aCarouselItems.length <= 1); // se 0/1 já pode fechar

				var oDialog = await this._getAnexosDialog();
				oDialog.open();

				// marca a primeira imagem como vista (quando abrir)
				this._markCurrentCarouselItemAsVisited();
			}
		},

		_markCurrentCarouselItemAsVisited: function () {
			var oCarousel = sap.ui.getCore().byId("carAnexos");
			if (!oCarousel) return;

			var oModel = this.getModel("modelCarousel");
			if (!oModel) return;

			var aPages = oCarousel.getPages();
			if (!aPages || !aPages.length) return;

			var iIndex = oCarousel.getActivePage(); // id da página ativa
			var oPage = sap.ui.getCore().byId(iIndex);
			if (!oPage) return;

			var oCtx = oPage.getBindingContext("modelCarousel");
			if (!oCtx) return;

			var oItem = oCtx.getObject();
			var sId = oItem && oItem.documentId;
			if (!sId) return;

			var mVisited = oModel.getProperty("/visitedIds") || {};
			if (mVisited[sId]) return; // já contado

			mVisited[sId] = true;
			oModel.setProperty("/visitedIds", mVisited);

			var visitedCount = Object.keys(mVisited).length;
			var total = oModel.getProperty("/total") || 0;

			oModel.setProperty("/visitedCount", visitedCount);
			oModel.setProperty("/canClose", total > 0 && visitedCount >= total);
		},

		onAnexosCarouselPageChanged: function () {
			this._markCurrentCarouselItemAsVisited();
		},

		onCloseAnexosDialog: function () {

			var oDialog = this._getAnexosDialog();
			oDialog.close();
		},

		onBeforeCloseAnexosDialog: function (oEvent) {

			var oModel = this.getModel("modelCarousel");
			var canClose = oModel && oModel.getProperty("/canClose");

			// if (!canClose) {
			// 	oEvent.preventDefault(); // impede fechar
			// 	sap.m.MessageToast.show("Visualize todos os anexos para liberar o fechamento.");
			// }
		},

		onEscapeAnexosDialog: function (oPromise) {

			var oModel = this.getModel("modelCarousel");
			var canClose = oModel && oModel.getProperty("/canClose");

			// if (!canClose) {
			// 	sap.m.MessageToast.show("Visualize todos os anexos para sair.");
			// 	oPromise.resolve(); // “consome” o ESC sem fechar
			// 	return;
			// }

			// permite fechar no ESC quando liberado
			this.onCloseAnexosDialog().finally(function () {
				oPromise.resolve();
			});
		},

		_loadMsgsWithAnexosAsync: async function (codRepres) {
			var oData = await this._readOData("/P_Msgs", {
				urlParameters: {
					"$filter": "Usuario eq '" + codRepres + "'",
					"$expand": "CodMsg",
					"$select": "CodMensagem,Usuario,TituloMensagem,TextoMensagem,DatCriacao,Prioridade,DescPrioridade,CodMsg"
				}
			});

			return (oData && oData.results) ? oData.results : [];
		},

		_buildCarouselItemsFromMsgs: function (aMsgs) {
			var that = this;
			var aItems = [];

			(aMsgs || []).forEach(function (msg) {
				var anexos = (msg.CodMsg && msg.CodMsg.results) ? msg.CodMsg.results : [];

				anexos.forEach(function (a) {
					if (!that._isImageMime(a.Mimetype)) return;

					var idAnexo = (a.Filename || "") + "|" + (a.CodMensagem || msg.CodMensagem || "");
					var src = that._toDataUrl(a.Mimetype, a.Value) || that._buildFileStreamUrl(idAnexo);

					aItems.push({
						documentId: idAnexo,
						fileName: a.Filename,
						mimeType: a.Mimetype,
						src: src,

						// contexto opcional
						codMensagem: msg.CodMensagem,
						tituloMensagem: msg.TituloMensagem,
						textoMensagem: msg.TextoMensagem,
						datCriacao: msg.DatCriacao,
						prioridade: msg.Prioridade,
						descPrioridade: msg.DescPrioridade
					});
				});
			});

			return aItems;
		},

		_readOData: function (sPath, mOptions) {
			var that = this;
			return new Promise(function (resolve, reject) {
				that.getModel().read(sPath, Object.assign({}, mOptions, {
					success: function (oData) { resolve(oData); },
					error: function (oErr) { reject(oErr); }
				}));
			});
		},

		_getAnexosDialog: function () {
			if (!this._oAnexosDialog) {
				this._oAnexosDialog = new sap.ui.xmlfragment(
					"application.view.dialog.Promocoes",
					this
				);
				this.getView().addDependent(this._oAnexosDialog);
			}
			return this._oAnexosDialog;
		},

		_buildFileStreamUrl: function (idAnexo) {
			return "/sap/opu/odata/sap/ZSF_FV_SRV/Files('" + encodeURIComponent(idAnexo) + "')/$value";
		},

		_isImageMime: function (mime) {
			mime = (mime || "").toLowerCase();
			return mime.indexOf("image/") === 0;
		},

		_toDataUrl: function (mime, base64) {
			if (!mime || !base64) return "";
			return "data:" + mime + ";base64," + String(base64).replace(/\s/g, "");
		}
	});
});
