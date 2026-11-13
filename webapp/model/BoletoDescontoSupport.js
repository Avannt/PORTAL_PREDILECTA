sap.ui.define([], function () {
    "use strict";

    function arredondar(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

    function numeroModelo(v) {
        if (v === null || v === undefined || String(v).trim() === "") { return 0; }
        var n = Number(v);
        if (!isFinite(n)) { throw new Error("Existe um valor inválido nos dados do desconto de boleto."); }
        return n;
    }

    function numeroEntrada(v) {
        var n, s;
        if (typeof v === "number") { n = v; }
        else {
            s = String(v === null || v === undefined ? "" : v).trim();
            if (!s) { return 0; }
            if (s.indexOf(",") >= 0) {
                if (!/^-?(?:\d+|[1-9]\d{0,2}(?:\.\d{3})+),\d{0,2}$/.test(s)) { throw new Error("Informe um valor válido com até duas casas decimais."); }
                n = Number(s.replace(/\./g, "").replace(",", "."));
            } else if (/^-?[1-9]\d{0,2}(?:\.\d{3})+$/.test(s)) { n = Number(s.replace(/\./g, "")); }
            else {
                if (!/^-?\d+(?:\.\d{0,2})?$/.test(s)) { throw new Error("Informe um valor válido com até duas casas decimais."); }
                n = Number(s);
            }
        }
        if (!isFinite(n) || n < 0) { throw new Error("Informe um desconto de boleto maior ou igual a zero."); }
        return arredondar(n);
    }

    function taxaPonderada(aItens) {
        var total = 0, ponderado = 0;
        (aItens || []).forEach(function (item) {
            var quantidade = numeroModelo(item.QtdPedida), preco = numeroModelo(item.ValPrecoInform);
            if (quantidade < 0 || preco < 0) { throw new Error("Existe item com quantidade ou preço negativo no cálculo do boleto."); }
            var valor = quantidade * preco;
            if (valor === 0) { return; }
            // Preserva a fórmula existente: módulo da soma das alíquotas por item.
            var taxa = Math.abs(numeroModelo(item.AliquotaIcm) + numeroModelo(item.PercCofins) + numeroModelo(item.PercPis)) / 100;
            ponderado += taxa * valor;
            total += valor;
        });
        if (!isFinite(total) || !isFinite(ponderado) || total <= 0) { throw new Error("Inclua itens com valor positivo para calcular o desconto de boleto."); }
        var taxa = ponderado / total;
        if (!isFinite(taxa) || taxa < 0 || taxa >= 1) { throw new Error("A taxa ponderada do pedido deve ser menor que 100% para calcular o boleto."); }
        return taxa;
    }

    function brutoDoLiquido(vLiquido, aItens) {
        var liquido = numeroModelo(vLiquido);
        if (liquido < 0) { throw new Error("Informe um desconto de boleto maior ou igual a zero."); }
        if (liquido === 0) { return { bruto: 0, liquido: 0, taxa: 0 }; }
        var taxa = taxaPonderada(aItens), bruto = arredondar(liquido / (1 - taxa));
        if (!isFinite(bruto)) { throw new Error("Não foi possível calcular o valor antes da redução do boleto."); }
        return { bruto: bruto, liquido: arredondar(liquido), taxa: taxa };
    }

    function liquidoDoBruto(vBruto, aItens) {
        var bruto = numeroModelo(vBruto);
        if (bruto < 0) { throw new Error("O desconto de boleto gravado não pode ser negativo."); }
        if (bruto === 0) { return { bruto: 0, liquido: 0, taxa: 0 }; }
        var taxa = taxaPonderada(aItens);
        return { bruto: bruto, liquido: arredondar(bruto * (1 - taxa)), taxa: taxa };
    }

    return { arredondar: arredondar, numeroModelo: numeroModelo, numeroEntrada: numeroEntrada, taxaPonderada: taxaPonderada, brutoDoLiquido: brutoDoLiquido, liquidoDoBruto: liquidoDoBruto };
});
