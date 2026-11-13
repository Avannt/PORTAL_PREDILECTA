sap.ui.define([
    "application/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, MessageBox, Filter, FilterOperator) {
    "use strict";
    return BaseController.extend("application.controller.relatorioTabelas", {
        onInit: function () { this.getRouter().getRoute("relatorioTabelas").attachPatternMatched(this._onLoadFields, this); },
        onExit: function () { this._consulta = (this._consulta || 0) + 1; this.getRouter().getRoute("relatorioTabelas").detachPatternMatched(this._onLoadFields, this); },
        _ler: function (sPath, mOptions) {
            var that = this;
            return new Promise(function (resolve, reject) { that.oModel.read(sPath, Object.assign({}, mOptions, { success: resolve, error: reject })); });
        },
        _texto: function (vValue) { return vValue === undefined || vValue === null ? "" : String(vValue).trim(); },
        _literal: function (vValue) { return "'" + this._texto(vValue).replace(/'/g, "''") + "'"; },
        _erro: function (oError) { if (oError && oError.message && !oError.responseText) { MessageBox.error(oError.message); } else { this.onMensagemErroODATA(oError); } },
        _onLoadFields: function () {
            var that = this;
            var nConsulta = this._consulta = (this._consulta || 0) + 1;
            this.oModel = this.getModelGlobal("modelAux").getProperty("/DBModel");
            this.onInicializarModels();
            this.getModel("modelEstado").setProperty("/Carregando", true);
            Promise.all([
                this._ler("/Centros", { urlParameters: { "$filter": "IvUsuario eq " + this._literal(this.getModelGlobal("modelAux").getProperty("/CodRepres")) } }),
                this._ler("/Fretes")
            ]).then(function (aRetornos) {
                if (that._consulta !== nConsulta) { return; }
                that.vetorCentros = aRetornos[0].results || [];
                that.getModel("modelCentros").setData(that.vetorCentros);
                that.getModel("modelFretes").setData(aRetornos[1].results || []);
                that.getModel("modelEstado").setProperty("/Carregando", false);
            }).catch(function (oError) { if (that._consulta !== nConsulta) { return; } that.getModel("modelEstado").setProperty("/Carregando", false); that._erro(oError); });
        },
        onInicializarModels: function () {
            this.setModelGlobal(new JSONModel({ Exibicao: "CAIXA", Pltyp: "", Indice: 0, Contrato: "", Vencimento: "", Werks: "", Kunnr: "", Inco1: "", UFOrigem: "", UFDestino: "", Kvgr2: "", DescKvgr2: "", DescCentro: "", DescTabelaPreco: "", DescTipoFrete: "", NomeCliente: "", DescVencto: "", Bukrs: "", Name1: "", CodRepres: this.getModelGlobal("modelAux").getProperty("/CodRepres") }), "modelTela");
            this.setModel(new JSONModel({ Carregando: false, Cliente: false, ContratoFixo: false }), "modelEstado");
            var that = this;
            ["modelCentros", "modelFretes", "modelClientes", "modelVencimentos", "modelTbPreco", "modelTabPrecos"].forEach(function (sName) { var oLista = new JSONModel([]); oLista.setSizeLimit(100000); that.setModel(oLista, sName); });
            this.setModelGlobal(new JSONModel({}), "modelCentro");
            this.setModelGlobal(new JSONModel({}), "modelCliente");
            this.setModelGlobal(new JSONModel([]), "modelContratos");
            this.setModelGlobal(new JSONModel([{ idExibicao: "CAIXA", descricao: "Caixa" }, { idExibicao: "UNIDADE", descricao: "Unidade" }]), "ComboExibicao");
            this.vetorCentros = []; this.vetorVencimentos = []; this.vetorTabPrecos = [];
        },
        _limparCliente: function () {
            var oTela = this.getModelGlobal("modelTela");
            ["NomeCliente", "Name1", "UFDestino", "Kvgr2", "DescKvgr2", "Pltyp", "DescTabelaPreco", "Vencimento", "DescVencto", "Contrato"].forEach(function (sKey) { oTela.setProperty("/" + sKey, ""); });
            oTela.setProperty("/Indice", 0);
            this.getModel("modelEstado").setProperty("/ContratoFixo", false);
            this.getModel("modelTbPreco").setData([]); this.getModel("modelVencimentos").setData([]);
            this.setModelGlobal(new JSONModel({}), "modelCliente");
            this.vetorTabPrecos = []; this.vetorVencimentos = []; this._indiceContrato = null;
        },
        onChangeEstabelecimento: function (oEvent) {
            var that = this;
            var nConsulta = this._consulta = (this._consulta || 0) + 1;
            var sCentro = oEvent.getSource().getSelectedKey();
            var oCentro = this.vetorCentros.filter(function (oItem) { return String(oItem.Werks) === String(sCentro); })[0];
            var oTela = this.getModelGlobal("modelTela");
            this._limparCliente(); oTela.setProperty("/Kunnr", ""); this.getModel("modelClientes").setData([]);
            this.getModel("modelEstado").setProperty("/Carregando", false);
            this.getModel("modelEstado").setProperty("/Cliente", false);
            this.setModelGlobal(new JSONModel(oCentro || {}), "modelCentro");
            oTela.setProperty("/Werks", sCentro); oTela.setProperty("/Bukrs", oCentro ? oCentro.Bukrs : ""); oTela.setProperty("/UFOrigem", oCentro ? oCentro.Regio : "");
            oTela.setProperty("/DescCentro", oEvent.getSource().getSelectedItem() ? oEvent.getSource().getSelectedItem().getText() : "");
            if (!oCentro) { return; }
            this.getModel("modelEstado").setProperty("/Carregando", true);
            return new Promise(function (resolve, reject) { that.onBuscarClientes(oTela.getProperty("/CodRepres"), resolve, reject, that); }).then(function (aClientes) {
                if (that._consulta !== nConsulta) { return; }
                that.getModel("modelClientes").setData(aClientes || []); that.getModel("modelEstado").setProperty("/Carregando", false); that.byId("idCliente").focus();
            }).catch(function (oError) { if (that._consulta !== nConsulta) { return; } that.getModel("modelEstado").setProperty("/Carregando", false); that._erro(oError); });
        },
        onChangeCliente: function (oEvent) {
            var that = this;
            var oTela = this.getModelGlobal("modelTela");
            var oSuggestion = oEvent && oEvent.getParameter("suggestionItem");
            var sCliente = this._texto(oSuggestion ? oSuggestion.getKey() : this.byId("idCliente").getValue());
            var nConsulta = this._consulta = (this._consulta || 0) + 1;
            this._limparCliente(); oTela.setProperty("/Kunnr", sCliente);
            this.getModel("modelEstado").setProperty("/Cliente", false);
            if (!sCliente) { return; }
            if (!oTela.getProperty("/Werks")) { MessageBox.error("Selecione o centro antes de consultar o cliente."); return; }
            this.getModel("modelEstado").setProperty("/Cliente", true);
            var sPath = "/ClienteR(IvUsuario=" + this._literal(oTela.getProperty("/CodRepres")) + ",IvCliente=" + this._literal(sCliente) + ")";
            return this._ler(sPath).then(function (oCliente) {
                if (that._consulta !== nConsulta) { return null; }
                that.setModelGlobal(new JSONModel(oCliente), "modelCliente");
                oTela.setProperty("/Kunnr", oCliente.Kunnr || sCliente); oTela.setProperty("/NomeCliente", (oCliente.Kunnr || sCliente) + " - " + (oCliente.Name1 || ""));
                oTela.setProperty("/UFDestino", oCliente.Regio || ""); oTela.setProperty("/Name1", oCliente.Name1 || "");
                return new Promise(function (resolve, reject) { that.onBuscarClienteEmpresa(oTela.getProperty("/Kunnr"), oTela.getProperty("/Bukrs"), resolve, reject, that); });
            }).then(function (oEmpresa) {
                if (!oEmpresa || that._consulta !== nConsulta) { return null; }
                that.vetorTabPrecos = oEmpresa.Pltyp ? [{ Kunnr: oEmpresa.Kunnr, Name1: oTela.getProperty("/Name1"), Pltyp: oEmpresa.Pltyp, Ptext: oEmpresa.DescPltyp }] : [];
                that.getModel("modelTbPreco").setData(that.vetorTabPrecos);
                oTela.setProperty("/Pltyp", oEmpresa.Pltyp || ""); oTela.setProperty("/DescTabelaPreco", oEmpresa.Pltyp ? oEmpresa.Pltyp + " - " + (oEmpresa.DescPltyp || "") : "");
                oTela.setProperty("/Kvgr2", oEmpresa.Kvgr2 || ""); oTela.setProperty("/DescKvgr2", (oEmpresa.Kvgr2 || "") + " - " + (oEmpresa.DescKvgr2 || ""));
                return that.onBuscarContrato(nConsulta);
            }).then(function () { if (that._consulta === nConsulta) { that.getModel("modelEstado").setProperty("/Cliente", false); } }).catch(function (oError) {
                if (that._consulta !== nConsulta) { return; }
                that._limparCliente(); that.getModel("modelEstado").setProperty("/Cliente", false); that._erro(oError);
            });
        },
        onBuscarContrato: function (nConsulta) {
            var that = this;
            var nAtual = typeof nConsulta === "number" ? nConsulta : this._consulta;
            var oTela = this.getModelGlobal("modelTela");
            var sKvgr4 = this.getModelGlobal("modelCliente").getProperty("/Kvgr4");
            var pContrato = sKvgr4 ? this._ler("/P_ContratoR(IvBukrs=" + this._literal(oTela.getProperty("/Bukrs")) + ",IvKvgr4=" + this._literal(sKvgr4) + ")") : Promise.resolve({});
            return Promise.all([this._ler("/Vencimentos"), pContrato]).then(function (aRetornos) {
                if (that._consulta !== nAtual) { return; }
                var oContrato = aRetornos[1];
                that.vetorVencimentos = (aRetornos[0].results || []).slice();
                var bContrato = !!oContrato.ContratoInterno;
                var sZterm = bContrato ? oContrato.Zterm || "" : "";
                var oVencimento = that.vetorVencimentos.filter(function (oItem) { return oItem.Zterm === sZterm; })[0];
                if (sZterm && !oVencimento) { oVencimento = { Zterm: sZterm, DescCond: oContrato.DescCond || sZterm, Kbetr: 0 }; that.vetorVencimentos.push(oVencimento); }
                that.getModel("modelVencimentos").setData(that.vetorVencimentos);
                var bPrioridade = oContrato.AtlOrdem === true || String(oContrato.AtlOrdem).toLowerCase() === "true";
                that._indiceContrato = bContrato && bPrioridade ? oContrato.IndiceContrato : null;
                oTela.setProperty("/Contrato", oContrato.ContratoInterno || ""); oTela.setProperty("/Vencimento", sZterm);
                oTela.setProperty("/DescVencto", oVencimento ? oVencimento.DescCond : "");
                oTela.setProperty("/Indice", that._indiceContrato !== null ? that._indiceContrato : oVencimento ? oVencimento.Kbetr || 0 : 0);
                that.getModel("modelEstado").setProperty("/ContratoFixo", !!sZterm);
            });
        },
        onCarregarPrecos: function () {
            var that = this;
            var oTela = this.getModelGlobal("modelTela");
            if (this.getModel("modelEstado").getProperty("/Carregando") || this.getModel("modelEstado").getProperty("/Cliente")) { return; }
            var aCampos = [["Werks", "idEstabelecimento", "Selecione o centro."], ["Kunnr", "idCliente", "Informe e consulte o cliente."], ["NomeCliente", "idCliente", "Confirme o cliente pela pesquisa antes de continuar."], ["Pltyp", "idTabelaPreco", "Selecione a tabela de preço."], ["Vencimento", "idVencimento", "Selecione o vencimento."], ["Inco1", "idTipoTransporte", "Selecione o tipo de transporte."]];
            for (var i = 0; i < aCampos.length; i++) {
                if (!this._texto(oTela.getProperty("/" + aCampos[i][0]))) { var sId = aCampos[i][1]; MessageBox.error(aCampos[i][2], { onClose: function () { that.byId(sId).focus(); } }); return; }
            }
            if (this.byId("idCliente").getValue().trim() !== this._texto(oTela.getProperty("/Kunnr"))) { MessageBox.error("Consulte novamente o código informado para o cliente."); return; }
            var sIndice = this._texto(oTela.getProperty("/Indice")).replace(",", ".");
            if (!sIndice || !isFinite(Number(sIndice))) { MessageBox.error("O índice de preço é inválido. Selecione novamente o vencimento."); return; }
            oTela.setProperty("/Indice", Number(sIndice));
            var oVenc = this.vetorVencimentos.filter(function (oItem) { return oItem.Zterm === oTela.getProperty("/Vencimento"); })[0];
            if (oVenc) { oTela.setProperty("/DescVencto", oVenc.DescCond); }
            var oFrete = this.byId("idTipoTransporte").getSelectedItem();
            if (oFrete) { oTela.setProperty("/DescTipoFrete", oFrete.getText()); }
            MessageBox.show("O tipo de frete escolhido é " + oTela.getProperty("/Inco1") + ". Deseja continuar?", { icon: MessageBox.Icon.WARNING, title: "Confirmar consulta", actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL], onClose: function (sAction) { if (sAction === MessageBox.Action.YES) { that.getRouter().navTo("detalhesRelatorioTabelas"); } } });
        },
        onClienteLiveChange: function () { this._consulta = (this._consulta || 0) + 1; this._limparCliente(); this.getModel("modelEstado").setProperty("/Cliente", false); },
        onChangeTabelaPreco: function (oEvent) { var oItem = oEvent.getSource().getSelectedItem(); this.getModelGlobal("modelTela").setProperty("/DescTabelaPreco", oItem ? oItem.getText() : ""); },
        onChangeTipoFrete: function (oEvent) { var oItem = oEvent.getSource().getSelectedItem(); this.getModelGlobal("modelTela").setProperty("/DescTipoFrete", oItem ? oItem.getText() : ""); },
        onChangeVencimento: function (oEvent) {
            var oTela = this.getModelGlobal("modelTela"); var sKey = oEvent.getSource().getSelectedKey();
            var oItem = this.vetorVencimentos.filter(function (oVenc) { return oVenc.Zterm === sKey; })[0];
            oTela.setProperty("/DescVencto", oItem ? oItem.DescCond : ""); oTela.setProperty("/Indice", this._indiceContrato !== null && this._indiceContrato !== undefined ? this._indiceContrato : oItem ? oItem.Kbetr || 0 : 0);
        },
        myFormatterDataVencimento: function (vValue) { var sValue = this._texto(vValue); return sValue.length === 1 ? "0" + sValue : sValue; },
        _handleValueHelpSearch: function (oEvent) {
            var oSource = oEvent.getSource(); var sValue = oSource.getValue(); var oBinding = oSource.getBinding("suggestionItems");
            if (oBinding) { oBinding.filter([new Filter({ filters: [new Filter("Kunnr", FilterOperator.StartsWith, sValue), new Filter("Name1", FilterOperator.Contains, sValue)], and: false })]); oSource.suggest(); }
        }
    });
});
