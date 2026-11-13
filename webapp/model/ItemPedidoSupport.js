sap.ui.define(["sap/m/Dialog", "sap/m/Button", "sap/m/Label", "sap/m/Text", "sap/m/VBox", "sap/m/Panel", "sap/ui/layout/Grid", "sap/ui/layout/GridData", "sap/ui/core/format/NumberFormat", "sap/ui/Device"], function (Dialog, Button, Label, Text, VBox, Panel, Grid, GridData, NumberFormat, Device) {
	"use strict";

	var oNumero = NumberFormat.getFloatInstance({ minFractionDigits: 2, maxFractionDigits: 2, groupingEnabled: true, groupingSeparator: ".", decimalSeparator: "," });
	var oQuantidade = NumberFormat.getFloatInstance({ minFractionDigits: 0, maxFractionDigits: 3, groupingEnabled: true, groupingSeparator: ".", decimalSeparator: "," });
	var mRotulos = {
		Kunnr: "Cliente", Bukrs: "Empresa", Werks: "Centro", Usuario: "Representante", Waerk: "Moeda", AliquotaIcm: "Alíquota ICMS (%)", CondAliquotaIcm: "Condição de ICMS",
		ValFinsocial: "Valor Finsocial", ValFinSocial: "Valor Finsocial", ValIcmsIt: "Valor de ICMS", ValPromocao: "Valor da promoção", ValContrato: "Valor do contrato",
		IdItem: "Identificador do item", IndexItem: "Posição", NrPedido: "Pedido", Matnr: "Item", Maktx: "Descrição", Meins: "Unidade básica", Vrkme: "Unidade de venda", QtdPedida: "Qnt (CX)",
		ValPrecoInform: "Valor venda", ValPrecoInformAntigo: "Valor venda anterior", ValPrecoMinBase: "Líq. Tab.", ValPrecoOrig: "Preço tabela", ValPrecoUnit: "Tabela menos canal", ValorTotal: "Valor total", ValTotItemSt: "Valor + ST",
		ValPrecoUnitSt: "Preço caixa com ST", ValPrecoUnitFat: "Preço unidade", ValPrecoUnitStFat: "Preço unidade com ST", ValPrecoMin: "Preço mínimo", PrecoMinBase: "Preço mínimo base", ValPrecoMax: "Preço máximo", ValPrecoTabela: "Preço da tabela", ValPrecoTabelaMin: "Preço mínimo da tabela",
		PercCanal: "Canal (%)", PercCanalMax: "Canal máximo (%)", CondPercCanal: "Condição do canal", PercPromo: "Promoção (%)", PercPromoMax: "Promoção máxima (%)", CondPercPromoMax: "Condição da promoção máxima", PercCampFlex: "Campanha flexível (%)", CondCampFlex: "Condição da campanha flexível",
		ValPctDescontoReduc: "Rebaixa (%)", ValVerbaItem: "Investimento preço", VerbaRepres: "Verba disponível", VerbaOrig: "Verba original", ValVerbaOrig: "Valor da verba original", ValFatModeradorVerba: "Valor do fator moderador de verba", PctDescContrato: "Contrato (%)",
		DataUltCompraUltMes: "Data da última compra", QtdUltCompraUltMes: "Quantidade da última compra (CX)", ValorUltCompraUltMes: "Valor da última compra", ValorAjuste: "Valor do reajuste", QntPallet: "Quantidade por pallet", PerSubTri: "Substituição tributária (%)",
		PercLucro: "Rentabilidade (%)", ValLucro: "Lucro", RentImg: "Indicador de rentabilidade", PathImg: "Imagem do produto", ForaPolitica: "Fora da política", CodCampanha: "Campanha", IdCorGrid: "Grupo do item", Draft: "Item em edição", TotalDesc: "Desconto total", ValLiqItem: "Valor líquido", QtdUnFat: "Quantidade na unidade de faturamento",
		ValDescDisp: "Desconto disponível", ValPctDescCamp: "Desconto da campanha (%)", QtdMultiplaCamp: "Quantidade múltipla da campanha", ExcIncent: "Exclui incentivo", ExcVerba: "Exclui verba", Ntgew: "Peso líquido", Provg: "Grupo de comissão", Mtpos: "Grupo de categoria do item",
		Mvgr1: "Grupo de material 1", Mvgr2: "Grupo de material 2", Mvgr3: "Grupo de material 3", Mvgr4: "Grupo de material 4", Mvgr5: "Grupo de material 5", PrecoSt: "Preço ST", CondPrecoSt: "Condição de ST", ValPrecoBase: "Preço base", CondValPrecoBase: "Condição do preço base"
	};
	var mComponentes = { Comissao: "Comissão", CustoFixo: "Custo fixo", Cpmf: "CPMF", Ganho: "Ganho", Ir: "IR", Cofins: "COFINS", Pis: "PIS", Royalties: "Royalties", Frete: "Frete", PromoRent: "Promoção de rentabilidade", AliquotaIcm: "Alíquota ICMS" };
	Object.keys(mComponentes).forEach(function (sChave) {
		mRotulos["Perc" + sChave] = mComponentes[sChave] + " (%)";
		mRotulos["CondPerc" + sChave] = "Condição: " + mComponentes[sChave];
		mRotulos["Val" + sChave] = "Valor: " + mComponentes[sChave];
	});

	function numero(vValor) {
		if (vValor === null || vValor === undefined || String(vValor).trim() === "") { return NaN; }
		return Number(vValor);
	}

	function calcularDesconto(vVenda, vLiquido) {
		var nVenda = numero(vVenda);
		var nLiquido = numero(vLiquido);
		return isFinite(nVenda) && isFinite(nLiquido) && nLiquido > 0 ? (nVenda / nLiquido - 1) * 100 : null;
	}

	var aPrincipais = ["Matnr", "Maktx", "QtdPedida", "ValPrecoMinBase", "ValPrecoInform", "ValorTotal", "ValTotItemSt", "ValorUltCompraUltMes", "QtdUltCompraUltMes", "DataUltCompraUltMes"];
	var mNumericos = {};
	Object.keys(mRotulos).forEach(function (sCampo) {
		if (/^(Val|Valor|Qtd|Qnt|Perc|Pct|Preco|Verba)/.test(sCampo) || ["TotalDesc", "PerSubTri", "Ntgew", "AliquotaIcm"].indexOf(sCampo) !== -1) { mNumericos[sCampo] = true; }
	});

	function dataValida(nAno, nMes, nDia) {
		if (nAno < 1 || nAno > 9999) { return "—"; }
		var oData = new Date(0);
		oData.setUTCFullYear(nAno, nMes - 1, nDia);
		if (oData.getUTCFullYear() !== nAno || oData.getUTCMonth() !== nMes - 1 || oData.getUTCDate() !== nDia) { return "—"; }
		return ("0" + nDia).slice(-2) + "/" + ("0" + nMes).slice(-2) + "/" + ("0000" + nAno).slice(-4);
	}

	function formatarData(vValor) {
		if (vValor === null || vValor === undefined || vValor === "") { return "—"; }
		var oData, aPartes, sValor = String(vValor).trim();
		if (Object.prototype.toString.call(vValor) === "[object Date]") { oData = vValor; }
		else if ((aPartes = /^\/Date\((-?\d+)(?:[+-]\d{4})?\)\/$/.exec(sValor))) { oData = new Date(Number(aPartes[1])); }
		else if ((aPartes = /^(\d{4})-?(\d{2})-?(\d{2})(?:T.*)?$/.exec(sValor))) { return dataValida(Number(aPartes[1]), Number(aPartes[2]), Number(aPartes[3])); }
		else if ((aPartes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(sValor))) { return dataValida(Number(aPartes[3]), Number(aPartes[2]), Number(aPartes[1])); }
		// Datas OData representam o dia fiscal; UTC evita recuar um dia no fuso do navegador.
		return oData && !isNaN(oData.getTime()) ? dataValida(oData.getUTCFullYear(), oData.getUTCMonth() + 1, oData.getUTCDate()) : "—";
	}

	function formatarValor(vValor, sCampo) {
		if (sCampo === "DataUltCompraUltMes" || Object.prototype.toString.call(vValor) === "[object Date]") { return formatarData(vValor); }
		if (vValor === null || vValor === undefined || vValor === "") { return "—"; }
		if (typeof vValor === "boolean") { return vValor ? "Sim" : "Não"; }
		if (mNumericos[sCampo]) {
			var nValor = numero(vValor);
			return isFinite(nValor) ? (/^(Qtd|Qnt)/.test(sCampo) || sCampo === "Ntgew" ? oQuantidade : oNumero).format(nValor) : "—";
		}
		if (typeof vValor === "object") { return JSON.stringify(vValor); }
		return String(vValor);
	}

	function campoVisivel(sCampo) {
		var sNormalizado = sCampo.replace(/_/g, "").toUpperCase();
		return sCampo.indexOf("__") !== 0 && !/^(IVBUKRS|IVWERKS|IVUSUARIO|IVKUNNR)/.test(sNormalizado);
	}

	function grupoDoCampo(sCampo) {
		if (/FatModeradorVerba|Lucro|Rent|Comissao|Custo|Cpmf|Ganho|Royalties|Cofins|Pis|Finsocial|FinSocial|Icms|Icm|Frete|SubTri|PrecoSt/.test(sCampo) || /^(PercIr|CondPercIr|ValIr)$/.test(sCampo)) { return "Tributos e rentabilidade"; }
		if (/^(Val|Preco|Perc|Pct|Cond|Verba|TotalDesc|Exc)/.test(sCampo) || sCampo === "CodCampanha" || sCampo === "ForaPolitica") { return "Preços e condições"; }
		if (/^(Qtd|Qnt|Mvgr)/.test(sCampo) || ["Meins", "Vrkme", "Ntgew", "Provg", "Mtpos", "PathImg"].indexOf(sCampo) !== -1) { return "Produto e logística"; }
		return "Informações complementares";
	}

	function criarCampo(sCampo, sTexto, bPrincipal) {
		var oRotulo = new Label({ wrapping: true, design: bPrincipal ? "Bold" : "Standard" }).setText(mRotulos[sCampo] || sCampo.replace(/([a-z])([A-Z])/g, "$1 $2")).setTooltip(sCampo);
		var oTexto = new Text({ wrapping: true, width: "100%" }).setText(sTexto);
		var oCampo = new VBox({ width: "100%", items: [oRotulo, oTexto] });
		if (sCampo === "Maktx") { oCampo.setLayoutData(new GridData({ span: "XL9 L9 M8 S12" })); }
		return oCampo;
	}

	function criarGrupo(sTitulo, aCampos, bPrincipal) {
		return new Panel({ headerText: sTitulo, expandable: !bPrincipal, expanded: bPrincipal, content: [new Grid({ defaultSpan: "XL3 L3 M4 S12", hSpacing: 1, vSpacing: 1, content: aCampos })] });
	}

	return {
		formatarDescricao: function (sDescricao) {
			var aCaracteres = Array.from(String(sDescricao || ""));
			return aCaracteres.length > 30 ? aCaracteres.slice(0, 29).join("") + "…" : aCaracteres.join("");
		},
		calcularDesconto: calcularDesconto,
		formatarDesconto: function (vVenda, vLiquido) {
			var nDesconto = calcularDesconto(vVenda, vLiquido);
			return nDesconto === null ? "—" : oNumero.format(Math.abs(nDesconto) < 0.0000001 ? 0 : nDesconto) + " %";
		},
		formatarData: formatarData,
		abrirDetalhes: function (oController, oItem) {
			if (!oItem) { return; }
			var aCamposPrincipais = [], mGrupos = {}, aConteudo = [];
			aPrincipais.forEach(function (sCampo) {
				if (Object.prototype.hasOwnProperty.call(oItem, sCampo)) { aCamposPrincipais.push(criarCampo(sCampo, formatarValor(oItem[sCampo], sCampo), true)); }
				if (sCampo === "ValPrecoInform" && calcularDesconto(oItem.ValPrecoInform, oItem.ValPrecoMinBase) !== null) {
					var oCampoDesconto = criarCampo("Desconto calculado (%)", this.formatarDesconto(oItem.ValPrecoInform, oItem.ValPrecoMinBase), true);
					aCamposPrincipais.push(oCampoDesconto);
				}
			}, this);
			Object.keys(oItem).filter(campoVisivel).forEach(function (sCampo) {
				if (aPrincipais.indexOf(sCampo) !== -1) { return; }
				var sGrupo = grupoDoCampo(sCampo);
				if (sGrupo === "Tributos e rentabilidade" || sGrupo === "Informações complementares") { return; }
				if (!mGrupos[sGrupo]) { mGrupos[sGrupo] = []; }
				mGrupos[sGrupo].push(criarCampo(sCampo, formatarValor(oItem[sCampo], sCampo), false));
			});
			if (aCamposPrincipais.length) { aConteudo.push(criarGrupo("Dados principais", aCamposPrincipais, true)); }
			["Preços e condições", "Produto e logística"].forEach(function (sGrupo) {
				if (mGrupos[sGrupo]) { aConteudo.push(criarGrupo(sGrupo, mGrupos[sGrupo], false)); }
			});
			var oDialog = new Dialog({
				contentWidth: "64rem", stretch: Device.system.phone, resizable: true, draggable: true, content: aConteudo,
				endButton: new Button({ text: "Fechar", press: function () { oDialog.close(); } }), afterClose: function () { oController.getView().removeDependent(oDialog); oDialog.destroy(); }
			});
			oDialog.addStyleClass("sapUiSizeCompact");
			oDialog.setTitle("Detalhes do item " + String(oItem.Matnr || ""));
			oController.getView().addDependent(oDialog);
			oDialog.open();
		}
	};
});
