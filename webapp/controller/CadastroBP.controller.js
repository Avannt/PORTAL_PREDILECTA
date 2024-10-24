sap.ui.define([
    "application/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "application/model/formatter",
    "sap/ui/model/odata/v2/ODataModel",
    "application/model/models"

], function (BaseController, JSONModel, MessageBox, formatter, ODataModel, models) {
    "use strict";

    return BaseController.extend("application.controller.CadastroBP", {

        onInit: function () {
            this.getRouter().getRoute("CadastroBP").attachPatternMatched(this._onLoadFields, this);
        },

        _onLoadFields: function () {

            var that = this;

            this.onInicializaModels();
        },

        onInicializaModels: function () {

            this.oModel = this.getView().getModel();

            this.onCriarModelBP();
        },

        onCriarModelBP: function () {

            // var Obj = {
            //     Repres: this.getModelGlobal("modelAux").getProperty("/CodRepres"),
            //     NomeRazao: "Ricardo Cardilo",
            //     Cnpj: "54790504000181",
            //     Telefone: "16991925345",
            //     Email: "ricardocardilo@gmail.com",
            //     Ie: "ISENTO",
            //     IsProdutorRural: false,
            //     Cep: "14150-000",
            //     Rua: "10 de abril",
            //     Complemento: "",
            //     Numero: "376",
            //     Bairro: "Centro",
            //     Cidade: "Serrana",
            //     Estado: "SP",
            //     EmailXml: "ricardocardilo2@gmail.com",
            //     EmailComprador: "ricardocardilo3@gmail.com",
            //     TelComprador: "16991925345",
            //     EmailFinanceiro: "ricardocardilo4@gmail.com",
            //     TelFinanceiro: "16991925345",
            //     EmailContabilidade: "ricardocardilo5@gmail.com",
            //     TelContabilidade: "16991925345",
            //     CodSuframa: "99",
            //     ObsNf1: "Segunda á Sexta",
            //     ObsNf2: "das 8 as 15",
            //     Rede: "ND",
            //     Bandeira: "ND",
            //     PedidoParcial: false,
            //     ReceberSaldo: false,
            //     DeclarImposto: "",
            //     NomeComprador: "TESTE",
            //     RegimeEspecial: ""
            // };

            var Obj = {
                Repres: this.getModelGlobal("modelAux").getProperty("/CodRepres"),
                NomeRazao: "",
                Cnpj: "",
                Telefone: "",
                Email: "",
                Ie: "",
                IsProdutorRural: false,
                Cep: "",
                Rua: "",
                Complemento: "",
                Numero: "",
                Bairro: "",
                Cidade: "",
                Estado: "",
                EmailXml: "",
                EmailComprador: "",
                EmailFinanceiro: "",
                EmailContabilidade: "",
                TelComprador: "",
                TelFinanceiro: "",
                TelContabilidade: "",
                CodSuframa: "",
                ObsNf1: "",
                ObsNf2: "",
                Rede: "",
                Bandeira: "",
                PedidoParcial: false,
                ReceberSaldo: false,
                DeclarImposto: "02",
                NomeComprador: "",
                RegimeEspecial: ""
            };

            var modelObj = new JSONModel(Obj);
            this.setModel(modelObj, "modelBP");

            var aux = [{
                key: "Regime Especial"
            },
            {
                key: "Isenção"
            }];
            
            var modelObj = new JSONModel(aux);
            this.setModel(modelObj, "modelRegime");

            var aux2 = [{
                key: "01",
                text: "Sim"
            },
            {
                key: "02",
                text: "Não"
            }];

            var modelObj = new JSONModel(aux2);
            this.setModel(modelObj, "modelSN");

            this.setModel(models.createValidaBPModel(), "modelValidaBP");
        },

        onCriarCliente: function () {

            var that = this;

            var cliente = this.getModel("modelBP").getData();

            if (cliente.NomeRazao.length == 0) {

                that.getModel("modelValidaBP").setProperty("/NomeRazaoVE", "Error");
                that.getModel("modelValidaBP").setProperty("/NomeRazaoTE", "Preencher o campo nome do BP.");

            } else if (cliente.Cnpj.length > 14) {

                that.getModel("modelValidaBP").setProperty("/CnpjVE", "Error");
                that.getModel("modelValidaBP").setProperty("/CnpjTE", "Quantidade de 14 caracteres excedida para o campo de CPF / CNPJ.");

            } else if (cliente.Cnpj.length < 14) {

                that.getModel("modelValidaBP").setProperty("/CnpjVE", "Error");
                that.getModel("modelValidaBP").setProperty("/CnpjTE", "Preencher o campo CPF / CNPJ com 14 caracteres.");

            }
            // else if (cliente.Ie.length == 0) {

            // 	that.getModel("modelValidaBP").setProperty("/IeVE", "Error");
            // 	that.getModel("modelValidaBP").setProperty("/IeTE", "Preencher o campo de Inscrição Estadual.");

            // } 
            // else if (cliente.TelComprador.length > 11) {

            //     that.getModel("modelValidaBP").setProperty("/Telefone1VE", "Error");
            //     that.getModel("modelValidaBP").setProperty("/Telefone1TE", "Quantidade de 11 caracteres excedida para o campo de telefone.");

            // }
            // else if (cliente.TelContabilidade.length > 11) {

            //     that.getModel("modelValidaBP").setProperty("/Telefone2VE", "Error");
            //     that.getModel("modelValidaBP").setProperty("/Telefone2TE", "Quantidade de 11 caracteres excedida para o campo de telefone.");

            // }
            // else if (cliente.TelFinanceiro.length == 0) {

            //     that.getModel("modelValidaBP").setProperty("/Telefone3VE", "Error");
            //     that.getModel("modelValidaBP").setProperty("/Telefone3TE", "Quantidade de 11 caracteres excedida para o campo de telefone.");

            // }
             else if (cliente.TelComprador.length == 0) {

                that.getModel("modelValidaBP").setProperty("/Telefone1VE", "Error");
                that.getModel("modelValidaBP").setProperty("/Telefone1TE", "Preencher o Telefone.");

            } 
            // else if (cliente.TelFinanceiro.length == 0) {

            //     that.getModel("modelValidaBP").setProperty("/Telefone2VE", "Error");
            //     that.getModel("modelValidaBP").setProperty("/Telefone2TE", "Preencher o campo Telefone com 11 caracteres.");

            // } 
            // else if (cliente.TelContabilidade.length == 0) {

            //     that.getModel("modelValidaBP").setProperty("/Telefone3VE", "Error");
            //     that.getModel("modelValidaBP").setProperty("/Telefone3TE", "Preencher o campo Telefone com 11 caracteres.");

            // } 
            else if (cliente.Ie.length > 12) {

                that.getModel("modelValidaBP").setProperty("/IeVE", "Error");
                that.getModel("modelValidaBP").setProperty("/IeTE", "Quantidade de 12 caracteres excedida para o campo de Inscrição Estadual.");

            } 
            else if (cliente.EmailXml.lenght == 0) {

                that.getModel("modelValidaBP").setProperty("/EmailXmlVE", "Error");
                that.getModel("modelValidaBP").setProperty("/EmailXmlTE", "Preencher E-mail.");

            } 
            else if (cliente.EmailComprador.lenght == 0) {
                
                that.getModel("modelValidaBP").setProperty("/EmailCompradorVE", "Error");
                that.getModel("modelValidaBP").setProperty("/EmailCompradorTE", "Preencher E-mail.");

            } 
            else if (cliente.EmailXml.includes("@") == false & cliente.EmailXml.lenght > 0) {

                that.getModel("modelValidaBP").setProperty("/EmailXmlVE", "Error");
                that.getModel("modelValidaBP").setProperty("/EmailXmlTE", "Verifique se o E-mail está válido.");

            } 
            else if (cliente.EmailFinanceiro.includes("@") == false & cliente.EmailFinanceiro.lenght > 0) {

                that.getModel("modelValidaBP").setProperty("/EmailFinanceiroVE", "Error");
                that.getModel("modelValidaBP").setProperty("/EmailFinanceiroTE", "Verifique se o E-mail está válido.");

            } 
            else if (cliente.EmailContabilidade.includes("@") == false & cliente.EmailContabilidade.lenght > 0) {

                that.getModel("modelValidaBP").setProperty("/EmailContabilVE", "Error");
                that.getModel("modelValidaBP").setProperty("/EmailContabilTE", "Verifique se o E-mail está válido.");

            } 
            else if (cliente.EmailComprador.includes("@") == false & cliente.EmailComprador.lenght > 0) {
                
                that.getModel("modelValidaBP").setProperty("/EmailCompradorVE", "Error");
                that.getModel("modelValidaBP").setProperty("/EmailCompradorTE", "Verifique se o E-mail está válido.");

            } 
            else if (cliente.Cep.length == 0) {

                that.getModel("modelValidaBP").setProperty("/CepVE", "Error");
                that.getModel("modelValidaBP").setProperty("/CepTE", "Preencher o campo CEP.");

            } else if (cliente.Cep.length > 9 || cliente.Cep.includes("-") == false) {

                that.getModel("modelValidaBP").setProperty("/CepVE", "Error");
                that.getModel("modelValidaBP").setProperty("/CepTE", "CEP deve ser de 9 caracteres e com hífem (-).");

            } else if (cliente.Cidade.length == 0) {

                that.getModel("modelValidaBP").setProperty("/CidadeVE", "Error");
                that.getModel("modelValidaBP").setProperty("/CidadeTE", "Preencher o campo Cidade.");

            } else if (cliente.Estado.length == 0) {

                that.getModel("modelValidaBP").setProperty("/EstadoVE", "Error");
                that.getModel("modelValidaBP").setProperty("/EstadoTE", "Preencher o campo Estado.");

            } else if (cliente.Numero.length > 6) {

                that.getModel("modelValidaBP").setProperty("/NumeroVE", "Error");
                that.getModel("modelValidaBP").setProperty("/NumeroTE", "Quantidade de 6 caracteres excedida para o campo Número.");

            } else if (cliente.Numero.length == 0) {

                that.getModel("modelValidaBP").setProperty("/NumeroVE", "Error");
                that.getModel("modelValidaBP").setProperty("/NumeroTE", "Preencher o campo Número.");

            } else if (cliente.Rua.length == 0) {

                that.getModel("modelValidaBP").setProperty("/RuaVE", "Error");
                that.getModel("modelValidaBP").setProperty("RuaTE", "Preencher o campo Rua.");

            } else if (cliente.Bairro.length == 0) {

                that.getModel("modelValidaBP").setProperty("/BairroVE", "Error");
                that.getModel("modelValidaBP").setProperty("BairroTE", "Preencher o campo Bairro.");

            } else {

                this.setModel(models.createValidaBPModel(), "modelValidaBP");

                MessageBox.show("Deseja criar o cliente?", {
                    icon: MessageBox.Icon.INFORMATION,
                    title: "Criação",
                    actions: [MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                    onClose: function (oAction) {

                        if (oAction == sap.m.MessageBox.Action.YES) {

                            that.byId("idPage").setBusy(true);

                            new Promise(function (res, rej) {

                                var Obj = {
                                    NomeRazao: that.getModel("modelBP").getProperty("/NomeRazao"),
                                    CpfCpnj: that.getModel("modelBP").getProperty("/Cnpj"),
                                    Telefone: that.getModel("modelBP").getProperty("/Telefone"),
                                    Email: that.getModel("modelBP").getProperty("/Email"),
                                    Ie: that.getModel("modelBP").getProperty("/Ie"),
                                    IsProdutorRural: that.getModel("modelBP").getProperty("/IsProdutorRural"),
                                    Cep: that.getModel("modelBP").getProperty("/Cep"),
                                    Rua: that.getModel("modelBP").getProperty("/Rua"),
                                    Complemento: that.getModel("modelBP").getProperty("/Complemento"),
                                    Numero: that.getModel("modelBP").getProperty("/Numero"),
                                    Bairro: that.getModel("modelBP").getProperty("/Bairro"),
                                    Cidade: that.getModel("modelBP").getProperty("/Cidade"),
                                    Estado: that.getModel("modelBP").getProperty("/Estado"),
                                    EmailXml: that.getModel("modelBP").getProperty("/EmailXml"),
                                    EmailComprador: that.getModel("modelBP").getProperty("/EmailComprador"),
                                    TelComprador: that.getModel("modelBP").getProperty("/TelComprador"),
                                    EmailFinanceiro: that.getModel("modelBP").getProperty("/EmailFinanceiro"),
                                    TelFinanceiro: that.getModel("modelBP").getProperty("/TelFinanceiro"),
                                    EmailContabilidade: that.getModel("modelBP").getProperty("/EmailContabilidade"),
                                    TelContabilidade: that.getModel("modelBP").getProperty("/TelContabilidade"),
                                    CodSuframa: that.getModel("modelBP").getProperty("/CodSuframa"),
                                    ObsNf1: that.getModel("modelBP").getProperty("/ObsNf1"),
                                    ObsNf2: that.getModel("modelBP").getProperty("/ObsNf2"),
                                    Rede: that.getModel("modelBP").getProperty("/Rede"),
                                    Bandeira: that.getModel("modelBP").getProperty("/Bandeira"),
                                    ReceberSaldo: that.getModel("modelBP").getProperty("/ReceberSaldo"),
                                    PedidoParcial: that.getModel("modelBP").getProperty("/PedidoParcial"),
                                    Repres: that.getModel("modelBP").getProperty("/Repres"),
                                    DeclarImposto: that.getModel("modelBP").getProperty("/DeclarImposto"),
                                    NomeComprador: that.getModel("modelBP").getProperty("/NomeComprador"),
                                    RegimeEspecial: that.getModel("modelBP").getProperty("/RegimeEspecial")                                    
                                };

                                that.onCriarBP(Obj, res, rej, that);

                            }).then(function (returnData) {

                                that.byId("idPage").setBusy(false);

                                if (returnData.Type == "E") {

                                    MessageBox.show(returnData.Message, {
                                        icon: MessageBox.Icon.ERROR,
                                        title: "Criação BP!",
                                        actions: ["OK"],
                                        onClose: function (oAction) {

                                        }
                                    });

                                } else {

                                    MessageBox.show("BP " + returnData.EvBp + " criado com sucesso!", {
                                        icon: MessageBox.Icon.SUCCESS,
                                        title: "BP!",
                                        actions: ["OK"],
                                        onClose: function (oAction) {

                                            that.onDialogCancelar();
                                            that.onCriarModelBP();
                                        }
                                    });
                                }
                            }).catch(function (error) {

                                that.byId("idPage").setBusy(false);
                                that.onMensagemErroODATA(error);
                            });
                        }
                    }
                });
            }
        },

        onCnaeSearchFieldSuggest: function (oEvent) {

            var sValue = evt.getSource().getValue();
            var aFilters = [];
            var oFilter = [
                new sap.ui.model.Filter("Key", sap.ui.model.FilterOperator.Contains, sValue),
                new sap.ui.model.Filter("Text", sap.ui.model.FilterOperator.Contains, sValue)];

            var allFilters = new sap.ui.model.Filter(oFilter, false);

            aFilters.push(allFilters);
            this.byId("idCnaeSearchField").getBinding("suggestionItems").filter(aFilters);
            this.byId("idCnaeSearchField").suggest();

        },

        onNaturezaJuridicaSearchFieldSuggest: function (oEvent) {

            var sValue = evt.getSource().getValue();

            var aFilters = [];

            var oFilter = [
                new sap.ui.model.Filter("Key", sap.ui.model.FilterOperator.Contains, sValue),
                new sap.ui.model.Filter("Text", sap.ui.model.FilterOperator.Contains, sValue)];

            var allFilters = new sap.ui.model.Filter(oFilter, false);

            aFilters.push(allFilters);
            this.byId("idNaturezaJuridicaSearchField").getBinding("suggestionItems").filter(aFilters);
            this.byId("idNaturezaJuridicaSearchField").suggest();
        },

        onTransportadoraInputValueHelpRequest: function (oEvent) {

            var sInputValue = oEvent.getSource().getValue(),
                oView = this.getView();

            if (!this._CreateMaterialFragment) {

                this._ItemDialog = sap.ui.xmlfragment(
                    "application.view.dialog.Transportadora",
                    this
                );
                this.getView().addDependent(this._ItemDialog);
            }

            this._ItemDialog.open();
        },
        onRepresentanteInputValueHelpRequest: function (oEvent) {

            var sInputValue = oEvent.getSource().getValue(),
                oView = this.getView();

            if (!this._CreateMaterialFragment) {

                this._ItemDialog = sap.ui.xmlfragment(
                    "application.view.dialog.Representante",
                    this
                );
                this.getView().addDependent(this._ItemDialog);
            }

            this._ItemDialog.open();
        },

        onRedespachoInputValueHelpRequest: function (oEvent) {

            var sInputValue = oEvent.getSource().getValue(),
                oView = this.getView();

            if (!this._CreateMaterialFragment) {

                this._ItemDialog = sap.ui.xmlfragment(
                    "application.view.dialog.Redespacho",
                    this
                );
                this.getView().addDependent(this._ItemDialog);
            }

            this._ItemDialog.open();
        },

        onDialogTransportadoraAfterOpen: function (oEvent) {

            var that = this;
            var NrPedido = this.getModelGlobal("modelPedido").getProperty("/NrPedido");
            this.getModelGlobal("modelParamTela").setProperty("/TransportadoraDialog", true);

            new Promise(function (res, rej) {

                var Input = {
                    Parvw: 'SP'
                }

                that.onGetTransportadora(Input, res, rej, that);

            }).then(function (dataItens) {

                var vetorTransportador = new JSONModel(dataItens.results);
                that.setModel(vetorTransportador, "modelTransportadora");

                that.getModel("modelParamTela").setProperty("/TransportadoraDialog", false);

            }).catch(function (error) {

                that.getModel("modelParamTela").setProperty("/TransportadoraDialog", false);
                that.onMensagemErroODATA(error);
            });
        },
        onDialogRedespachoAfterOpen: function (oEvent) {

            var that = this;
            var NrPedido = this.getModelGlobal("modelPedido").getProperty("/NrPedido");
            var Kunnr = this.getModelGlobal("modelPedido").getProperty("/Kunnr");
            var Vkorg = this.getModelGlobal("modelPedido").getProperty("/Vkorg");
            var Parvw = '';

            this.getModelGlobal("modelParamTela").setProperty("/TransportadoraDialog", true);

            new Promise(function (res, rej) {

                var Input = {
                    Parvw: 'SP'
                }

                that.onGetTransportadora(Input, res, rej, that);

            }).then(function (dataItens) {

                var vetorTransportador = new JSONModel(dataItens.results);
                that.setModel(vetorTransportador, "modelTransportador");

                that.getModel("modelParamTela").setProperty("/TransportadoraDialog", false);

            }).catch(function (error) {

                that.getModel("modelParamTela").setProperty("/TransportadoraDialog", false);
                that.onMensagemErroODATA(error);
            });
        },
        onDialogRedespachoAfterOpen: function (oEvent) {

            var that = this;
            var NrPedido = this.getModelGlobal("modelPedido").getProperty("/NrPedido");
            var Kunnr = this.getModelGlobal("modelPedido").getProperty("/Kunnr");
            var Vkorg = this.getModelGlobal("modelPedido").getProperty("/Vkorg");
            var Parvw = '';

            this.getModelGlobal("modelParamTela").setProperty("/TransportadoraDialog", true);

            new Promise(function (res, rej) {

                var Input = {
                    Parvw: 'SP'
                }

                that.onGetTransportadora(Input, res, rej, that);

            }).then(function (dataItens) {

                var vetorTransportador = new JSONModel(dataItens.results);
                that.setModel(vetorTransportador, "modelTransportador");

                that.getModel("modelParamTela").setProperty("/TransportadoraDialog", false);

            }).catch(function (error) {

                that.getModel("modelParamTela").setProperty("/TransportadoraDialog", false);
                that.onMensagemErroODATA(error);
            });
        },

        onTableRedespachoSelectionChange: function (oEvent) {

            var that = this;
            var NrPedido = this.getModelGlobal("modelPedido").getProperty("/NrPedido");
            var Kunnr = this.getModelGlobal("modelPedido").getProperty("/Kunnr");
            var Vkorg = this.getModelGlobal("modelPedido").getProperty("/Vkorg");
            var Parvw = '';

            this.getModelGlobal("modelParamTela").setProperty("/TransportadoraDialog", true);

            new Promise(function (res, rej) {

                var Input = {
                    Parvw: 'FB'
                }

                that.onGetTransportadors(Input, res, rej, that);

            }).then(function (dataItens) {

                var vetorTransportador = new JSONModel(dataItens.results);
                that.setModel(vetorTransportador, "modelTransportador");

                that.getModel("modelParamTela").setProperty("/TransportadoraDialog", false);

            }).catch(function (error) {

                that.getModel("modelParamTela").setProperty("/TransportadoraDialog", false);
                that.onMensagemErroODATA(error);
            });
        },

        onTableAutorizadoSelectionChange: function (oEvent) {

            var that = this;
            var NrPedido = this.getModelGlobal("modelPedido").getProperty("/NrPedido");
            var Kunnr = this.getModelGlobal("modelPedido").getProperty("/Kunnr");
            var Vkorg = this.getModelGlobal("modelPedido").getProperty("/Vkorg");
            var Parvw = '';

            this.getModelGlobal("modelParamTela").setProperty("/AutorizadoDialog", true);

            new Promise(function (res, rej) {

                var Input = {
                    Partner: Kunnr,
                    Vtweg: 'MI',
                    Parvw: 'Z0',
                    Vkorg: Vkorg
                }

                that.onGetTransportadors(Input, res, rej, that);

            }).then(function (dataItens) {

                var vetorAutorizado = new JSONModel(dataItens.results);
                that.setModel(vetorAutorizado, "modelAutorizado");

                that.getModel("modelParamTela").setProperty("/AutorizadoDialog", false);

            }).catch(function (error) {

                that.getModel("modelParamTela").setProperty("/AutorizadoDialog", false);
                that.onMensagemErroODATA(error);
            });
        }
    });
});