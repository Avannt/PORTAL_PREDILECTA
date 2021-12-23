/*eslint-disable no-console, no-alert */
/*eslint-disable eqeqeq, no-alert */
/*eslint-disable sap-no-hardcoded-url, no-alert */
/*eslint-disable no-shadow, no-alert */
/*eslint-disable consistent-return, no-alert */
sap.ui.define([
	"application/controller/BaseController",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	"application/model/formatter"
], function (BaseController, History, JSONModel, formatter) {
	"use strict";

	return BaseController.extend("application.controller.verbaConsultasDetalhe", {

		onInit: function (oEvent) {

			this.getRouter().getRoute("verbaConsultasDetalhe").attachPatternMatched(this._onLoadFields, this);
		},

		_onLoadFields: function () {

			var that = this;

			var oModel = new JSONModel({

				Bukrs: "",
				CodMotivVerba: "",
				DatMovto: "",
				HraMovto: "",
				IdMovtoVerba: "",
				IvUsuario: "",
				Lifnr: "",
				NrPedido: "",
				OrigemMovto: "",
				Periodo: "",
				TipoMovto: "",
				Usuario: "",
				ValMovto: "",
				ValSaldo: ""

			});
			that.setModel(oModel, "modelMov");

			var Bukrs = this.getModelGlobal("modelVerba").getProperty("/Bukrs");
			var Periodo  = this.getModelGlobal("modelVerba").getProperty("/Periodo");
			var repres = that.getModelGlobal("modelAux").getProperty("/CodRepres");
			that.oModel = that.getModelGlobal("modelAux").getProperty("/DBModel");
			
			var ChaveAcesso = Bukrs + "." + Periodo;
			
			this.byId("idTopLevelIconTabBar").setSelectedKey("tab1");

			var oItemVerbas = [];
			
			// that.byId("detail").setBusy(true);

			that.oModel.read("/MovimentacaoVerbas", {
				urlParameters: {
					"$filter": "IvUsuario eq '" + repres + "'"
				},
				success: function (retorno) {

					that.vetorMovVerbasAux = retorno.results;
					that.vetorMovVerbas = [];

					for (var i = 0; i < that.vetorMovVerbasAux.length; i++) {

						if (that.vetorMovVerbasAux[i].Bukrs == Bukrs) {

							that.vetorMovVerbas.push(that.vetorMovVerbasAux[i]);

						}
					}

					// that.byId("detail").setBusy(false);
					that.getModel("modelMov").setData(that.vetorMovVerbas);

				},
				error: function (error) {
					that.byId("detail").setBusy(false);
					that.onMensagemErroODATA(error);
				}
			});
			
			// var open = indexedDB.open("PRED");

			// open.onerror = function (error) {
			// 	alert(open.error.mensage);
			// };

			// open.onsuccess = function () {
			// 	var db = open.result;

			// 	var str = db.transaction("TabelaMovimentacao", "readwrite");
			// 	var objStr = str.objectStore("TabelaMovimentacao");
			// 	var indexStr = objStr.index("IndexAcesso");

			// 	var request = indexStr.getAll(ChaveAcesso);

			// 	request.onsuccess = function (e) {

			// 		var result = e.target.result;

			// 		if (result !== undefined) {

			// 			var aux = result;
			// 			var vetorTrans = [];

			// 			var data = new Date();
			// 			var Ano = data.getFullYear();

			// 			var Mes = data.getMonth() + 1;
			// 			Mes = String(Mes).length == 1 ? "0" + String(Mes) : Mes;

			// 			var Dia = data.getDate();
			// 			Dia = String(Dia).length == 1 ? "0" + String(Dia) : Dia;

			// 			data = Ano + Mes + Dia;

			// 			for (var i = 0; i < aux.length; i++) {

			// 				var aux2 = aux[i];
			// 				delete aux2._metadata;

			// 				if (aux2.TipoMovto == "02") {

			// 					aux2.PathImg = sap.ui.require.toUrl("application/img/S.png");

			// 				} else {

			// 					aux2.PathImg = sap.ui.require.toUrl("application/img/R.png");
			// 				}

			// 				try {

			// 					var dataAux3 = aux2.DatMovto.indexOf("T");

			// 					if (dataAux3 > 0) {

			// 						dataAux3 = aux2.DatMovto.split("T");
			// 						dataAux3 = dataAux3[0].split("-");
			// 						var dataFormatada2 = dataAux3[2] + "/" + dataAux3[1] + "/" + dataAux3[0];

			// 					}

			// 				} catch (x) {

			// 					dataAux3 = aux2.DatMovto;

			// 					if (dataAux3 != undefined) {

			// 						Ano = String(dataAux3.getFullYear());

			// 						Mes = dataAux3.getMonth() + 1;
			// 						Mes = String(Mes).length == 1 ? "0" + String(Mes) : String(Mes);

			// 						Dia = dataAux3.getDate();
			// 						Dia = String(Dia).length == 1 ? "0" + String(Dia) : String(Dia);

			// 						dataFormatada2 = Dia + "/" + Mes + "/" + Ano;
			// 					}

			// 				}
							
			// 				aux2.DatMovto = dataFormatada2;

			// 				vetorTrans.push(aux2);
			// 			}

			// 			// model = new JSONModel(vetorTrans);
			// 			that.getModel("modelMov").setData(vetorTrans);
			// 		}
			// 	};
			// };
		},

		formatTipo: function (value) {

			if (value == "02") {
				return "Crédito";
			} else if (value == "01") {
				return "Débito";
			}
		}
	});
});