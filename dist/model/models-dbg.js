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
                NomeRazaoTE: "",
                CnpjVE: "None",
                CnpjTE: "",
                IeVE: "None",
                IeTE: "",
                Telefone1VE: "None",
                Telefone1TE: "",
                Telefone2VE: "None",
                Telefone2TE: "",
                Telefone3VE: "None",
                Telefone3TE: "",
                EmailXmlVE: "None",
                EmailXmlTE: "",
                EmailCompradorVE: "None",
                EmailCompradorTE: "",
                EmailFinanceiroVE: "None",
                EmailFinanceiroTE: "",
                EmailContabilVE: "None",
                EmailContabilTE: "",
                IsProdutorRuralVE: "None",
                IsProdutorRuralTE: "",
                CepVE: "None",
                CepTE: "",
                CidadeVE: "None",
                CidadeTE: "",
                EstadoVE: "None",
                EstadoTE: "",
                RuaVE: "None",
                RuaTE: "",
                NumeroVE: "None",
                NumeroTE: "",
                ComplementoVE: "None",
                ComplementoTE: "",
                ObsNf1VE: "None",
                ObsNf1TE: "",
                ObsNf2VE: "None",
                ObsNf2TE: ""
            };

            var oModel = new JSONModel(aux);
            return oModel;
        },

    };
});