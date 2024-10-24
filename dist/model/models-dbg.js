sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createValidaBPModel: function () {
			var aux = {
                NomeRazaoVE: "None",
                NomeRazaoTE: "None",
                CnpjVE: "None",
                CnpjTE: "None",
                IeVE: "None",
                IeTE: "None",
                Telefone1VE: "None",
                Telefone1TE: "None",
                Telefone2VE: "None",
                Telefone2TE: "None",
                Telefone3VE: "None",
                Telefone3TE: "None",
                EmailXmlVE: "None",
                EmailXmlTE: "None",
                EmailCompradorVE: "None",
                EmailCompradorTE: "None",
                EmailFinanceiroVE: "None",
                EmailFinanceiroTE: "None",
                EmailContabilVE: "None",
                EmailContabilTE: "None",
                IsProdutorRuralVE: "None",
                IsProdutorRuralTE: "None",
                CepVE: "None",
                CepTE: "None",
                CidadeVE: "None",
                CidadeTE: "None",
                EstadoVE: "None",
                EstadoTE: "None",
                RuaVE: "None",
                RuaTE: "None",
                NumeroVE: "None",
                NumeroTE: "None",
                ComplementoVE: "None",
                ComplementoTE: "None",
            };

			var oModel = new JSONModel(aux);
			return oModel;
		},

	};
});