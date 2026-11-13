sap.ui.define([
    "application/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/export/library", "sap/ui/export/Spreadsheet", "sap/ui/core/format/NumberFormat"
], function (BaseController, JSONModel, MessageBox, Filter, FilterOperator, exportLibrary, Spreadsheet, NumberFormat) {
    "use strict";
    var EdmType = exportLibrary.EdmType;
    var oNumero = NumberFormat.getFloatInstance({ minFractionDigits: 2, maxFractionDigits: 2, groupingEnabled: true, groupingSeparator: ".", decimalSeparator: "," });
    return BaseController.extend("application.controller.detalhesRelatorioTabelas", {
        onInit: function () { this.getRouter().getRoute("detalhesRelatorioTabelas").attachPatternMatched(this._onLoadFields, this); },
        onExit: function () { this._consulta = (this._consulta || 0) + 1; this.getRouter().getRoute("detalhesRelatorioTabelas").detachPatternMatched(this._onLoadFields, this); },
        _literal: function (vValue) { return "'" + String(vValue === undefined || vValue === null ? "" : vValue).trim().replace(/'/g, "''") + "'"; },
        _valorAusente: function (vValue) { return vValue === null || vValue === undefined || String(vValue).trim() === "" || !isFinite(Number(vValue)); },
        formatarValor: function (vValue) { return this._valorAusente(vValue) ? "—" : oNumero.format(Number(vValue)); },
        formatarStatusST: function (vValue) { return this._valorAusente(vValue) ? "Warning" : "None"; },
        _filtroProduto: function (sValue) { return new Filter({ filters: [new Filter("Matnr", FilterOperator.Contains, sValue), new Filter("Maktx", FilterOperator.Contains, sValue)], and: false }); },
        _handleValueHelpSearch: function (oEvent) {
            var oSource = oEvent.getSource(); var oBinding = oSource.getBinding("suggestionItems");
            if (oBinding) { oBinding.filter(oSource.getValue() ? [this._filtroProduto(oSource.getValue())] : []); oSource.suggest(); }
        },
        onItemChange: function (oEvent) {
            var oSource = oEvent.getSource(); var oItem = oEvent.getParameter("suggestionItem"); var sValue = oItem ? oItem.getKey() : oSource.getValue();
            if (oItem) { oSource.setValue(sValue); }
            var oBinding = this.byId("idtablePrecos").getBinding("items");
            if (oBinding) { oBinding.filter(sValue ? [this._filtroProduto(sValue)] : []); }
        },
        onUpdateFinished: function (oEvent) { var oModel = this.getModel("modelResumo"); if (oModel) { oModel.setProperty("/Visiveis", oEvent.getParameter("total") || 0); } },
		createColumnConfig: function () {
			var aCols = [];

			aCols.push({
				label: "Material",
				property: "Matnr",
				type: EdmType.String
			});

			aCols.push({
				label: "Descrição",
				property: "Maktx",
				type: EdmType.String
			});

			aCols.push({
				label: "Categoria",
				property: "Mvgr1Text",
				type: EdmType.String
			});

			aCols.push({
				label: "SubCategoria",
				property: "Mvgr2Text",
				type: EdmType.String
			});

			aCols.push({
				label: "Família",
				property: "Mvgr3Text",
				type: EdmType.String
			});

			aCols.push({
				label: "Pallet",
				property: "QntPallet",
				type: EdmType.Integer
			});

			aCols.push({
				label: "CXs",
				property: "QntCaixa",
				type: EdmType.String
			});

			aCols.push({
				label: "Preço Bruto",
				property: "ValPrecoOrig",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "%Canal",
				property: "PercCanal",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "%Promocional",
				property: "PercPromoMax",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "Preço Líquido",
				property: "ValPrecoInform",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "Preço c/ST",
				property: "ValPrecoUnitSt",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "%ST",
				property: "PerSubTri",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			aCols.push({
				label: "%Contrato",
				property: "PctDescContrato",
				type: EdmType.Number,
				scale: 2,
				delimiter: true
			});

			return aCols;
		},

        onExport: function () {
            var that = this; var oResumo = this.getModel("modelResumo");
            if (oResumo.getProperty("/Carregando") || oResumo.getProperty("/Exportando")) { return; }
            var oBinding = this.byId("idtablePrecos").getBinding("items");
            var aRows = oBinding ? oBinding.getContexts(0, oBinding.getLength()).map(function (oContext) { return Object.assign({}, oContext.getObject()); }) : [];
            if (!aRows.length) { MessageBox.information("Não há itens para exportar com a pesquisa atual."); return; }
            var p = this.getModel("modelParametros").getData();
            var aInfos = [["Centro", p.DescCentro], ["UF Origem", p.UFOrigem], ["Cliente", p.NomeCliente], ["UF Destino", p.UFDestino], ["Canal", p.CanalAtuacao], ["Tabela de preço", p.DescTabelaPreco], ["Vencimento", p.DescVencto], ["Índice (%)", p.Indice], ["Frete", p.DescTipoFrete], ["Exibição", p.Exibicao], ["RCA", p.CodRepres], ["Emitido em", new Date().toLocaleString("pt-BR")]];
            var sNome = ["Lista", p.Centro, p.Cliente, p.UFOrigem, p.UFDestino, p.Frete].join("_").replace(/[\\/:*?"<>|]/g, "_") + ".xlsx";
            var oSheet;
            oResumo.setProperty("/Exportando", true);
            try {
                oSheet = new Spreadsheet({ workbook: { columns: this.createColumnConfig(), context: { application: "Portal Predilecta", title: "Relatório de Tabelas de Preço", sheetName: "Lista de Preço", metaSheetName: "Parâmetros", metainfo: [{ name: "Parâmetros de seleção", items: aInfos.map(function (aInfo) { return { key: aInfo[0], value: aInfo[1] === undefined || aInfo[1] === null ? "" : String(aInfo[1]) }; }) }] } }, dataSource: aRows, fileName: sNome, worker: false });
                return oSheet.build().then(function () { oSheet.destroy(); oResumo.setProperty("/Exportando", false); }, function (oError) { oSheet.destroy(); oResumo.setProperty("/Exportando", false); that.onMensagemErroODATA(oError); });
            } catch (oError) { if (oSheet) { oSheet.destroy(); } oResumo.setProperty("/Exportando", false); MessageBox.error(oError.message || "Não foi possível exportar o relatório."); }
        },
        _onLoadFields: function () {
            var that = this; var nConsulta = this._consulta = (this._consulta || 0) + 1;
            this.oModel = this.getModelGlobal("modelAux").getProperty("/DBModel");
            var oOrigem = this.getModelGlobal("modelTela");
            if (!oOrigem) { this.getRouter().navTo("relatorioTabelas"); return Promise.resolve(); }
            var oTela = oOrigem.getData();
            var p = { CodRepres: this.getModelGlobal("modelAux").getProperty("/CodRepres"), Centro: oTela.Werks, DescCentro: oTela.DescCentro, UFOrigem: oTela.UFOrigem, Cliente: oTela.Kunnr, NomeCliente: oTela.NomeCliente, UFDestino: oTela.UFDestino, CanalAtuacao: oTela.DescKvgr2, TabPreco: oTela.Pltyp, DescTabelaPreco: oTela.DescTabelaPreco, Vencimento: oTela.Vencimento, DescVencto: oTela.DescVencto, Indice: oTela.Indice, Frete: oTela.Inco1, DescTipoFrete: oTela.DescTipoFrete, Exibicao: oTela.Exibicao };
            this.setModel(new JSONModel(p), "modelParametros");
            var oRows = new JSONModel([]); oRows.setSizeLimit(100000); this.setModel(oRows, "modelTabPreco");
            this.setModel(new JSONModel({ Carregando: true, Exportando: false, Total: 0, Visiveis: 0, SemPrecoST: 0, Erro: false }), "modelResumo");
            this.byId("idProdutoRelatorio").setValue("");
            if (!p.Centro || !p.Cliente || !p.TabPreco || !p.Frete || String(p.Indice).trim() === "" || p.Indice === null || !isFinite(Number(p.Indice))) {
                this.getModel("modelResumo").setProperty("/Carregando", false); MessageBox.error("Os parâmetros da consulta estão incompletos. Volte e revise os filtros."); return Promise.resolve();
            }
            var sFiltro = "Usuario eq " + this._literal(p.CodRepres) + " and Centro eq " + this._literal(p.Centro) + " and Cliente eq " + this._literal(p.Cliente) + " and TabPreco eq " + this._literal(p.TabPreco) + " and Indice eq " + Number(p.Indice) + " and Frete eq " + this._literal(p.Frete) + " and Exibicao eq " + this._literal(p.Exibicao);
            var mVistos = {}; var aTodos = [];
            function ler(mParametros) {
                return new Promise(function (resolve, reject) { that.oModel.read("/P_RelTabPreco", { urlParameters: mParametros, success: resolve, error: reject }); }).then(function (oRetorno) {
                    if (that._consulta !== nConsulta) { return null; }
                    if (!Array.isArray(oRetorno.results)) { throw new Error("O serviço não retornou uma coleção válida de preços."); }
                    aTodos = aTodos.concat(oRetorno.results);
                    if (!oRetorno.__next) { return aTodos; }
                    var sNext = String(oRetorno.__next); var sQuery = sNext.split("?")[1];
                    if (mVistos[sNext] || !sQuery) { throw new Error("Não foi possível concluir a paginação dos preços. Refaça a consulta."); }
                    mVistos[sNext] = true; var mProximos = {};
                    sQuery.split("&").forEach(function (sParte) { var i = sParte.indexOf("="); if (i > 0) { mProximos[decodeURIComponent(sParte.slice(0, i))] = decodeURIComponent(sParte.slice(i + 1).replace(/\+/g, " ")); } });
                    return ler(mProximos);
                });
            }
            return ler({ "$filter": sFiltro }).then(function (aRows) {
                if (that._consulta !== nConsulta || aRows === null) { return; }
                oRows.setSizeLimit(Math.max(1000, aRows.length)); oRows.setData(aRows);
                var oResumo = that.getModel("modelResumo"); oResumo.setProperty("/Total", aRows.length); oResumo.setProperty("/Visiveis", aRows.length);
                oResumo.setProperty("/SemPrecoST", aRows.filter(function (oItem) { return that._valorAusente(oItem.ValPrecoUnitSt); }).length);
                oResumo.setProperty("/Carregando", false);
            }).catch(function (oError) {
                if (that._consulta !== nConsulta) { return; }
                var oResumo = that.getModel("modelResumo"); oResumo.setProperty("/Carregando", false); oResumo.setProperty("/Erro", true);
                if (oError.message && !oError.responseText) { MessageBox.error(oError.message); } else { that.onMensagemErroODATA(oError); }
            });
        }
    });
});
