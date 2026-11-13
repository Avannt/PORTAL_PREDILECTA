sap.ui.define(["sap/ui/core/format/NumberFormat"], function (NumberFormat) {
    "use strict";
    var CAMPOS = ["DescCampAdicional", "IdCamp", "IdCampEscal"];
    var CAMPOS_RETORNO = CAMPOS.concat(["DescCampAplicado", "ValBaseCamp", "ValPrecoMinSemCamp", "ValPrecoMinCamp", "CampInconsistente", "CampMsg", "CampanhasVenda", "CampanhasEscal", "ValPctDescontoReduc"]);
    function numero(v) { if (v === null || v === undefined || String(v).trim() === "") { return null; } var n = Number(v); return isFinite(n) ? n : null; }
    function aplicadoNuloOuZero(v) { return v === null || v === undefined || String(v).trim() === "" || numero(v) === 0; }
    function material(v) { var s = String(v === null || v === undefined ? "" : v).trim(); return /^\d+$/.test(s) ? s.replace(/^0+(?=\d)/, "") : s; }
    function chave(o) { return String(o.NrPedido || o.IvNrPedido || "") + "|" + material(o.Matnr); }
    function copiar(o) {
        if (o instanceof Date) { return new Date(o.getTime()); }
        if (Array.isArray(o)) { return o.map(copiar); }
        if (o && typeof o === "object") { var n = {}; Object.keys(o).forEach(function (k) { n[k] = copiar(o[k]); }); return n; }
        return o;
    }
    function tipo(oMeta, sSet) { var oSet = oMeta.getODataEntitySet(sSet); return oSet && oMeta.getODataEntityType(oSet.entityType); }
    function possui(oMeta, oTipo, sCampo) { return !!(oTipo && oMeta.getODataProperty(oTipo, sCampo)); }
    function parametros(oFuncao) { return (oFuncao && oFuncao.parameter) || []; }
    var CAMPOS_CONSUMO = ["DescCampAplicado", "ValBaseCamp", "ValPrecoMinSemCamp", "ValPrecoMinCamp", "CampInconsistente", "CampMsg"];
    function escalaPrecoCampanha(oMeta, oTipo, oFuncao) {
        var oCampo = oTipo && oMeta.getODataProperty(oTipo, "ValPrecoInform");
        var oParametro = parametros(oFuncao).filter(function (p) { return p.name === "ValPrecoInform"; })[0];
        var aEscalas = [oCampo && oCampo.scale, oParametro && oParametro.scale].filter(function (v) {
            return /^\d+$/.test(String(v));
        }).map(Number);
        return aEscalas.length ? Math.min.apply(null, [3].concat(aEscalas)) : 2;
    }
    function contrato(oMeta) {
        var oSet = oMeta.getODataEntitySet("P_ItensPedidoPR"), oTipo = tipo(oMeta, "P_ItensPedidoPR"), oLeitura = tipo(oMeta, "P_ItensPedidoQ");
        var bCampos = CAMPOS.every(function (s) { return possui(oMeta, oTipo, s); });
        var oSim = oMeta.getODataFunctionImport("P_Simular_CampanhasItem");
        var bSim = !!(bCampos && oSim && oSim.httpMethod === "POST" && oSim.returnType === "Collection(" + oSet.entityType + ")");
        var bParametroAplicado = parametros(oSim).some(function (p) { return p.name === "DescCampAplicado" && (!p.mode || p.mode === "In"); });
        var bConsultaGrade = CAMPOS.every(function (s) { return possui(oMeta, oLeitura, s); });
        var aAutomaticos = CAMPOS_RETORNO.filter(function (s) { return CAMPOS.indexOf(s) < 0; });
        var bAutomatico = !!(bSim && !bParametroAplicado && aAutomaticos.every(function (s) { return possui(oMeta, oTipo, s) && possui(oMeta, oLeitura, s); }));
        var oPreco = oMeta.getODataFunctionImport("P_Get_PrecoItem");
        var bConsumoGrade = !!(bConsultaGrade && CAMPOS_CONSUMO.every(function (s) { return possui(oMeta, oLeitura, s); }));
        var bPrecoIndividual = !!(bCampos && oPreco && oPreco.httpMethod === "POST"
            && oPreco.returnType === oSet.entityType && !parametros(oPreco).some(function (p) { return p.name === "DescCampAplicado" && (!p.mode || p.mode === "In"); })
            && CAMPOS_CONSUMO.every(function (s) { return possui(oMeta, oTipo, s); }));
        var bConsumo = bAutomatico || bPrecoIndividual;
        return { ConsultaItem: bCampos, ConsultaGrade: bConsultaGrade, SimulacaoPedido: bAutomatico, AplicacaoItem: bConsumo,
            EscalaPrecoCampanha: escalaPrecoCampanha(oMeta, oTipo, bAutomatico ? oSim : oPreco), ConsumoAutomatico: bConsumo, ConsumoIndividual: bPrecoIndividual, ConsumoGrade: bConsumoGrade, Funcao: bAutomatico ? "P_Simular_CampanhasItem" : "P_Get_PrecoItem",
            Mensagem: !bCampos ? "A disponibilidade de campanha por item ainda não pode ser consultada." : bAutomatico ? "Reduza o preço de venda para utilizar a campanha. Liberado e aplicado são exibidos por caixa." : bPrecoIndividual ? "O consumo é calculado para o item consultado. Após salvar, os valores dos demais itens serão consultados novamente." : "A consulta atualiza o item em digitação. O consumo pelo preço e a atualização dos demais itens aguardam integração do serviço." };
    }
    function normalizar(oItem, bContrato, bConsumo) {
        var o = copiar(oItem), n = numero(o.DescCampAdicional);
        var bConfirmada = !!(bContrato && n !== null && n >= 0 && CAMPOS.every(function (s) { return Object.prototype.hasOwnProperty.call(o, s) && o[s] !== null && o[s] !== undefined; }));
        o.DescCampAdicional = bConfirmada ? n : null;
        o.IdCamp = bConfirmada ? String(o.IdCamp).trim() : "";
        o.IdCampEscal = bConfirmada ? String(o.IdCampEscal).trim() : "";
        o._CampanhaConsultaPendente = !bConfirmada;
        o._CampanhaConfirmada = bConfirmada;
        o._CampanhaSimulada = false;
        delete o._CampanhaErroRetorno;
        if (bConfirmada && n === 0) {
            var nMinimoPolitica = numero(o.ValPrecoMinSemCamp);
            var nMinimoCampanha = numero(o.ValPrecoMinCamp);
            if (nMinimoPolitica !== null && nMinimoPolitica >= 0 && nMinimoCampanha !== null && nMinimoCampanha >= 0) {
                // Sem saldo de campanha, a unica referencia de preco e o piso da politica recebido do SAP.
                o.ValPrecoMinCamp = o.ValPrecoMinSemCamp;
            }
        }
        if (bConsumo && bConfirmada) {
            var sErro = inconsistenciaRetorno(o);
            if (sErro) { o._CampanhaErroRetorno = sErro; o._CampanhaConfirmada = false; o._CampanhaConsultaPendente = true; }
        }
        return o;
    }
    function selecionar(oData, oEntrada, oContrato) {
        if (!oContrato.SimulacaoPedido) {
            if (!oData || Array.isArray(oData) || Array.isArray(oData.results)) { throw new Error("A consulta não retornou o item em digitação."); }
            if (oData.NrPedido && String(oData.NrPedido) !== String(oEntrada.NrPedido || "") || oData.Matnr && material(oData.Matnr) !== material(oEntrada.Matnr)) { throw new Error("A consulta retornou um item diferente do solicitado."); }
            var oIndividual = normalizar(oData, oContrato.ConsultaItem);
            if (oContrato.ConsumoAutomatico) {
                if (!oIndividual.NrPedido || !material(oIndividual.Matnr)) { throw new Error("A consulta não identificou o pedido e o material do retorno."); }
                validarRetornoConsumo(oIndividual);
            }
            return oIndividual;
        }
        var a = Array.isArray(oData) ? oData : oData && oData.results;
        if (!Array.isArray(a)) { throw new Error("Não foi possível receber os limites atualizados dos itens do pedido."); }
        var aNormalizados = [], aChaves = {}, oAtual = null;
        a.forEach(function (o) {
            if (String(o.NrPedido || "") !== String(oEntrada.NrPedido || "") || !material(o.Matnr)) { throw new Error("A simulação retornou um item de outro pedido ou sem material."); }
            if (o.TipoErro === "E" || o.TipoErro === "A") { throw new Error(o.MsgErro || "Não foi possível calcular as campanhas do pedido."); }
            var k = chave(o);
            if (aChaves[k]) { throw new Error("A simulação retornou o mesmo material mais de uma vez."); }
            aChaves[k] = true;
            var n = normalizar(o, true);
            if (!n._CampanhaConfirmada) { throw new Error("A simulação não confirmou o limite de campanha de todos os itens."); }
            validarRetornoConsumo(n);
            if (CAMPOS_RETORNO.some(function (s) { return n[s] === undefined || n[s] === null; })) { throw new Error("O retorno de campanhas está incompleto."); }
            aNormalizados.push(n);
            if (material(o.Matnr) === material(oEntrada.Matnr)) { oAtual = n; }
        });
        if (!oAtual) { throw new Error("O item em digitação não foi encontrado no retorno da simulação."); }
        oAtual = copiar(oAtual);
        oAtual.__CampItensSimulados = aNormalizados;
        return oAtual;
    }
    function inconsistenciaRetorno(o) {
        for (var i = 0, a = ["DescCampAplicado", "ValBaseCamp", "ValPrecoMinSemCamp", "ValPrecoMinCamp"]; i < a.length; i++) {
            if (numero(o[a[i]]) === null || numero(o[a[i]]) < 0) { return "A consulta não retornou " + a[i] + " válido para o item."; }
        }
        if (CAMPOS_CONSUMO.some(function (s) { return o[s] === undefined || o[s] === null; })) { return "O retorno de consumo da campanha está incompleto."; }
        return "";
    }
    function validarRetornoConsumo(o) {
        if (o._CampanhaErroRetorno) { throw new Error(o._CampanhaErroRetorno); }
        if (!o._CampanhaConfirmada || o._CampanhaConsultaPendente) { throw new Error("A consulta não confirmou o valor liberado e as campanhas deste item."); }
        var sErro = inconsistenciaRetorno(o);
        if (sErro) { throw new Error(sErro); }
    }
    function mesclarRetornoGravacao(oCalculado, oGravado, bConsumo) {
        var n = copiar(oCalculado), r = oGravado || {};
        Object.keys(r).forEach(function (s) { if (s !== "__metadata" && r[s] !== undefined) { n[s] = copiar(r[s]); } });
        if (bConsumo && CAMPOS.concat(CAMPOS_CONSUMO).some(function (s) { return !Object.prototype.hasOwnProperty.call(r, s) || r[s] === null || r[s] === undefined; })) {
            CAMPOS_RETORNO.forEach(function (s) { n[s] = null; });
            n._CampanhaConsultaPendente = true; n._CampanhaConfirmada = false;
            n._CampanhaRetornoGravacaoPendente = true;
        } else {
            delete n._CampanhaRetornoGravacaoPendente;
            if (bConsumo) { n = normalizar(n, true, true); }
        }
        return n;
    }
    function filtrarParametros(oMeta, sFuncao, oEntrada, oAnterior) {
        var oFuncao = oMeta.getODataFunctionImport(sFuncao);
        if (!oFuncao) { throw new Error("Não foi possível consultar o preço do item neste serviço."); }
        var bAceitaAplicado = parametros(oFuncao).some(function (p) { return p.name === "DescCampAplicado" && (!p.mode || p.mode === "In"); });
        var c = contrato(oMeta), bAutomatico = c.ConsumoAutomatico && c.Funcao === sFuncao;
        if (oEntrada.Evento === "ChangeCampanha") { throw new Error("Aplique a campanha reduzindo o preço de venda; o valor aplicado é calculado pelo servidor."); }
        if (!bAutomatico && !bAceitaAplicado && (!aplicadoNuloOuZero(oEntrada.DescCampAplicado) || !aplicadoNuloOuZero(oAnterior && oAnterior.DescCampAplicado))) {
            throw new Error("O serviço ainda não permite recalcular um item com desconto de campanha aplicado ou alterar essa aplicação. Conclua a integração antes de salvar.");
        }
        var oSaida = {};
        parametros(oFuncao).forEach(function (p) { if ((!p.mode || p.mode === "In") && oEntrada[p.name] !== undefined && oEntrada[p.name] !== null) { oSaida[p.name] = oEntrada[p.name]; } });
        return oSaida;
    }
    function atualizarGrade(aGrade, aSimulados) {
        var oMapa = {}, aResultado = [];
        (aSimulados || []).forEach(function (o) { oMapa[chave(o)] = o; });
        (aGrade || []).forEach(function (o) {
            var n = copiar(o), s = oMapa[chave(o)];
            if (s) { CAMPOS_RETORNO.forEach(function (p) { n[p] = s[p] === undefined ? null : copiar(s[p]); }); n._CampanhaConsultaPendente = false; n._CampanhaConfirmada = true; n._CampanhaSimulada = true; delete n._CampanhaErroRetorno; }
            else if (String(n.IdCorGrid) === "0") { n._CampanhaConsultaPendente = true; n._CampanhaConfirmada = false; }
            aResultado.push(n);
        });
        return aResultado;
    }
    function pendente(o) { var n = copiar(o); n._CampanhaConsultaPendente = true; n._CampanhaConfirmada = false; return n; }
    function validarAplicado(o) {
        if (o._CampanhaErroRetorno) { throw new Error(o._CampanhaErroRetorno); }
        if (o.CampInconsistente === true || o.CampInconsistente === "X" || o.CampInconsistente === "true") { throw new Error(o.CampMsg || "O preço está abaixo do mínimo permitido com as campanhas atuais."); }
        var a = numero(o.DescCampAplicado);
        if (a === null) { if (o.DescCampAplicado !== null && o.DescCampAplicado !== undefined && String(o.DescCampAplicado).trim() !== "") { throw new Error("Digite um desconto aplicado válido."); } return; }
        if (a < 0) { throw new Error("O desconto aplicado deve ser maior ou igual a zero."); }
        if (a > 0 && (!o._CampanhaConfirmada || o._CampanhaConsultaPendente)) { throw new Error("Atualize a disponibilidade de campanha antes de aplicar o desconto."); }
        var d = numero(o.DescCampAdicional);
        if (d !== null && Math.round(a * 100) > Math.round(d * 100)) { throw new Error("O desconto aplicado excede a disponibilidade deste item."); }
    }
    function formatar(v, bPendente) { var n = numero(v); return bPendente || n === null ? "—" : "R$ " + NumberFormat.getFloatInstance({ minFractionDigits: 2, maxFractionDigits: 2 }).format(n); }
    // Os campos OData permanecem totais por linha; converter somente na exibicao.
    function formatarPorCaixa(vTotal, vQuantidade, bPendente) {
        var nTotal = numero(vTotal), nQuantidade = numero(vQuantidade);
        if (bPendente || nTotal === null || nTotal < 0 || nQuantidade === null || nQuantidade <= 0) { return "—"; }
        return formatar(nTotal / nQuantidade, false);
    }
    function formatarUnitario(v, bPendente) { var n = numero(v); return bPendente || n === null ? "—" : "R$ " + NumberFormat.getFloatInstance({ minFractionDigits: 2, maxFractionDigits: 3 }).format(n); }
    function formatarMinimoPermitido(vPolitica, vCampanha, bPendente) {
        var nPolitica = numero(vPolitica), nCampanha = numero(vCampanha);
        if (nPolitica === null || nCampanha === null) { return "—"; }
        return formatarUnitario(Math.min(nPolitica, nCampanha), bPendente);
    }
    function codigoAtivo(v) {
        return String(v === null || v === undefined ? "" : v).split(",").some(function (s) { s = s.trim(); return !!s && !/^0+$/.test(s); });
    }
    function campanhaAtiva(vVenda, vEscal, sVendas, sEscal, bPendente) {
        return !bPendente && [vVenda, vEscal, sVendas, sEscal].some(codigoAtivo);
    }
    function estadoCampanha(vVenda, vEscal, sVendas, sEscal, vAplicado, bPendente) {
        if (!campanhaAtiva(vVenda, vEscal, sVendas, sEscal, bPendente)) { return "sem-campanha"; }
        var nAplicado = numero(vAplicado);
        if (nAplicado === null || nAplicado < 0) { return "consulta-pendente"; }
        return nAplicado > 0 ? "aplicada" : "pendente";
    }
    function iconeCampanha(vVenda, vEscal, sVendas, sEscal, vAplicado, bPendente) {
        return estadoCampanha(vVenda, vEscal, sVendas, sEscal, vAplicado, bPendente) === "aplicada" ? "sap-icon://paid-leave" : "sap-icon://unpaid-leave";
    }
    function tooltipAplicacao(vLiberado, vAplicado, vQuantidade, vPreco, vPiso, bConfirmada, bPendente, iCasas) {
        if (bPendente || !bConfirmada) { return "Atualize o pedido para confirmar a campanha."; }
        if (podeAplicarSaldo(vLiberado, vAplicado, vQuantidade, vPreco, vPiso, bConfirmada, bPendente, iCasas)) { return "Aplicar desconto: usar o preço mínimo permitido pela campanha."; }
        if (numero(vAplicado) > 0) { return "Desconto de campanha aplicado ao item."; }
        return "Item participante de campanha, sem desconto disponível para aplicar.";
    }
    function podeAcionarCampanha(vLiberado, vAplicado, vQuantidade, vPreco, vPiso, bConfirmada, bPendente, iCasas, bProcessando, bEditando, bAutomatico, bGrade, vStatus) {
        return !bProcessando && !bEditando && !!bAutomatico && !!bGrade && ["2", "3", "4"].indexOf(String(vStatus)) < 0
            && podeAplicarSaldo(vLiberado, vAplicado, vQuantidade, vPreco, vPiso, bConfirmada, bPendente, iCasas);
    }
    function formatarCodigo(v, bPendente, sLista) {
        if (bPendente) { return "—"; }
        return codigoAtivo(sLista) ? String(sLista).trim() : codigoAtivo(v) ? String(v).trim() : "—";
    }
    function formatarIdentificacao(vVenda, vEscal, sVendas, sEscal, bPendente) {
        if (bPendente) { return "—"; }
        var aResultado = [];
        function adicionar(vCodigo, sLista, sTipo) {
            var aCodigos = [], sOrigem = codigoAtivo(sLista) ? sLista : vCodigo;
            String(sOrigem === null || sOrigem === undefined ? "" : sOrigem).split(",").forEach(function (s) {
                s = s.trim();
                if (!s || /^0+$/.test(s)) { return; }
                if (/^\d+$/.test(s)) { s = s.replace(/^0+(?=\d)/, ""); }
                if (aCodigos.indexOf(s) < 0) { aCodigos.push(s); aResultado.push(sTipo + " - " + s); }
            });
        }
        adicionar(vVenda, sVendas, "Combo");
        adicionar(vEscal, sEscal, "Escala");
        return aResultado.length ? aResultado.join(" / ") : "—";
    }
    function podeAplicarSaldo(vLiberado, vAplicado, vQuantidade, vPreco, vPiso, bConfirmada, bPendente, iCasas) {
        return precoComSaldoCampanha({ DescCampAdicional: vLiberado, DescCampAplicado: vAplicado, QtdPedida: vQuantidade,
            ValPrecoInform: vPreco, ValPrecoMinCamp: vPiso, _CampanhaConfirmada: bConfirmada, _CampanhaConsultaPendente: bPendente }, iCasas) !== null;
    }
    function precoComSaldoCampanha(o, iCasas) {
        var l = numero(o.DescCampAdicional), a = numero(o.DescCampAplicado), q = numero(o.QtdPedida);
        var p = numero(o.ValPrecoInform), m = numero(o.ValPrecoMinCamp);
        if (o._CampanhaConfirmada !== true || o._CampanhaConsultaPendente || l === null || a === null ||
            a < 0 || l <= a || !(q > 0) || p === null || m === null || m < 0 || p <= m) { return null; }
        var nFator = Math.pow(10, typeof iCasas === "number" ? iCasas : 2);
        // O piso do servidor ja inclui toda a campanha da linha, inclusive a parte ja aplicada.
        var nNovo = Math.ceil(m * nFator - 0.00000001) / nFator;
        return nNovo < p ? nNovo : null;
    }
    function lerItensPedido(oModel, sNrPedido, fnNormalizarCor) {
        return new Promise(function (res, rej) {
            if (!sNrPedido) { rej(new Error("Informe o pedido para atualizar os itens.")); return; }
            oModel.read("/P_ItensPedidoQ", {
                headers: { "Cache-Control": "no-cache" },
                urlParameters: { "$filter": "IvNrPedido eq '" + String(sNrPedido).replace(/'/g, "''") + "'" },
                success: function (oData) {
                    if (!oData || !Array.isArray(oData.results) || oData.__next) {
                        rej(new Error("A leitura dos itens não retornou a coleção completa do pedido.")); return;
                    }
                    res(oData.results.map(function (o) {
                        var n = copiar(o);
                        n.IdCorGrid = fnNormalizarCor(n.IdCorGrid);
                        return n;
                    }));
                }, error: rej
            });
        });
    }
    function formatarSaldo(vLiberado, vAplicado, bPendente) { var d = numero(vLiberado), a = numero(vAplicado); return bPendente || d === null || a === null ? "—" : formatar(d - a, false); }
    function tooltip(v, sVenda, sEscal, bPendente, bSimulada, sErro) {
        if (sErro) { return sErro; }
        if (bPendente || numero(v) === null) { return "Disponibilidade de campanha ainda não confirmada."; }
        var a = [bSimulada ? "Disponibilidade simulada para a digitação atual." : "Disponibilidade consultada para este item."];
        if (sVenda && !/^0+$/.test(String(sVenda).trim())) { a.push("Campanha de venda: " + sVenda + "."); }
        if (sEscal && !/^0+$/.test(String(sEscal).trim())) { a.push("Campanha escalonada: " + sEscal + "."); }
        return a.join(" ");
    }
    return { CAMPOS: CAMPOS, CAMPOS_RETORNO: CAMPOS_RETORNO, numero: numero, aplicadoNuloOuZero: aplicadoNuloOuZero, material: material, chave: chave, contrato: contrato, normalizar: normalizar,
        selecionar: selecionar, filtrarParametros: filtrarParametros, atualizarGrade: atualizarGrade, pendente: pendente,
        lerItensPedido: lerItensPedido, inconsistenciaRetorno: inconsistenciaRetorno, validarRetornoConsumo: validarRetornoConsumo, mesclarRetornoGravacao: mesclarRetornoGravacao, validarAplicado: validarAplicado, formatar: formatar, formatarPorCaixa: formatarPorCaixa, formatarUnitario: formatarUnitario, formatarMinimoPermitido: formatarMinimoPermitido, campanhaAtiva: campanhaAtiva, estadoCampanha: estadoCampanha, iconeCampanha: iconeCampanha, tooltipAplicacao: tooltipAplicacao, podeAcionarCampanha: podeAcionarCampanha, podeAplicarSaldo: podeAplicarSaldo, precoComSaldoCampanha: precoComSaldoCampanha, formatarCodigo: formatarCodigo, formatarIdentificacao: formatarIdentificacao, formatarSaldo: formatarSaldo, tooltip: tooltip };
});
