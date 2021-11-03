sap.ui.define(["sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    //	"./utilities",
    "sap/ui/core/routing/History",
    "sap/ui/core/BusyIndicator",
], function (BaseController,
    MessageBox,
    //    Utilities, 
    History,
    BusyIndicator
) {
    "use strict";

    const mainUrlServices = 'https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com/api/';

    return BaseController.extend("com.tasa.tolvas.ingresodescargamanual.controller.Main", {
        handleRouteMatched: function (oEvent) {
            var sAppId = "App60f18d59421c8929c54cd9bf";

            var oParams = {};

            if (oEvent.mParameters.data.context) {
                this.sContext = oEvent.mParameters.data.context;

            } else {
                if (this.getOwnerComponent().getComponentData()) {
                    var patternConvert = function (oParam) {
                        if (Object.keys(oParam).length !== 0) {
                            for (var prop in oParam) {
                                if (prop !== "sourcePrototype" && prop.includes("Set")) {
                                    return prop + "(" + oParam[prop][0] + ")";
                                }
                            }
                        }
                    };

                    this.sContext = patternConvert(this.getOwnerComponent().getComponentData().startupParameters);

                }
            }

            var oPath;

            if (this.sContext) {
                oPath = {
                    path: "/" + this.sContext,
                    parameters: oParams
                };
                this.getView().bindObject(oPath);
            }

            this.loadComboBalanza();
            this.loadPuntoDescarga();

        },

        loadComboBalanza: function () {
            let oView = this.getView();
            let oReq = {
                "fields": [
                    "CDBAL",
                    "DSBAL",
                    "INBAL"
                ],
                "p_option": [
                    {
                        "wa": "ESREG = 'S'"
                    },
                    {
                        "wa": "AND CDPTA = '0012'"
                    }
                ],
                "p_user": "FGARCIA",
                "rowcount": "200"
            }
            let url = "https://flota-approuterqas.cfapps.us10.hana.ondemand.com/api/tolvas/registrotolvas_listar";
            return fetch(url, {
                method: 'POST',
                body: JSON.stringify(oReq)
            })
                .then(response => response.json())
                // .then(data => console.log(data));
                .then(data => {
                    oView.setModel(new JSONModel(data.data), "RegistroTolvasModel");
                });
        },

        loadPuntoDescarga: function () {
            let oView = this.getView();
            let oReq = {
                "fields": [],
                "p_option": [
                    {
                        "wa": "CDPTA LIKE '0012'"
                    }
                ],
                "p_user": "FGARCIA",
                "rowcount": "200"
            }
            let url = "https://flota-approuterqas.cfapps.us10.hana.ondemand.com/api/tolvas/registrotolvas_listar";
            return fetch(url, {
                method: 'POST',
                body: JSON.stringify(oReq)
            })
                .then(response => response.json())
                // .then(data => console.log(data));
                .then(data => {
                    oView.setModel(new JSONModel(data.data), "RegistroTolvasModel");
                });
        },

        onInit: function () {
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("TargetMain").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
            var oView = this.getView();
            oView.addEventDelegate({
                onBeforeShow: function () {
                    if (sap.ui.Device.system.phone) {
                        var oPage = oView.getContent()[0];
                        if (oPage.getShowNavButton && !oPage.getShowNavButton()) {
                            oPage.setShowNavButton(true);
                            oPage.attachNavButtonPress(function () {
                                this.oRouter.navTo("", {}, true);
                            }.bind(this));
                        }
                    }
                }.bind(this)
            });

            this.loadInitData();
        },

        loadInitData: function () {
            BusyIndicator.show(0);
            var oModel = this.getOwnerComponent().getModel("ComboModel");
            let centros = [];
            let zinprpDom = [];
            let balanzas = [];
            let puntoDesc = [];
            let especies = [];

            const bodyAyudaBusqueda = {
                "nombreAyuda": "BSQCENTRO",
                "p_user": this.getCurrentUser()
            };

            fetch(`${mainUrlServices}General/AyudasBusqueda/`,
                {
                    method: 'POST',
                    body: JSON.stringify(bodyAyudaBusqueda)
                })
                .then(resp => resp.json()).then(data => {
                    console.log("Busqueda: ", data);
                    centros = data.data;
                    oModel.setProperty("/Centros", centros);
                    BusyIndicator.hide();
                }).catch(error => console.log(error));

            const bodyDominios = {
                "dominios": [
                    {
                        "domname": "ZINPRP",
                        "status": "A"
                    },
                    {
                        "domname": "ZCDTBA",
                        "status": "A"
                    },
                    {
                        "domname": "ZCDTPD",
                        "status": "A"
                    },
                    {
                        "domname": "ZDO_ESPECIES",
                        "status": "A"
                    }
                ]
            };

            fetch(`${mainUrlServices}dominios/Listar`,
                {
                    method: 'POST',
                    body: JSON.stringify(bodyDominios)
                })
                .then(resp => resp.json()).then(data => {
                    zinprpDom = data.data.find(d => d.dominio == "ZINPRP").data;
                    balanzas = data.data.find(d => d.dominio == "ZCDTBA").data;
                    puntoDesc = data.data.find(d => d.dominio == "ZCDTPD").data;
                    especies = data.data.find(d => d.dominio == "ZDO_ESPECIES").data;
                    oModel.setProperty("/IndProp", zinprpDom);
                    oModel.setProperty("/Balanzas", balanzas);
                    oModel.setProperty("/PtsDesc", puntoDesc);
                    oModel.setProperty("/Especies", especies);
                }).catch(error => console.log(error));
        },

        onSearchEmbarcacion: function () {
            BusyIndicator.show(0);
            var oModel = this.getOwnerComponent().getModel("ComboModel");
            var idEmbarcacion = sap.ui.getCore().byId("idEmba").getValue();
            var idEmbarcacionDesc = sap.ui.getCore().byId("idNombEmba").getValue();
            var idMatricula = sap.ui.getCore().byId("idMatricula").getValue();
            var idRuc = sap.ui.getCore().byId("idRucArmador").getValue();
            var idArmador = sap.ui.getCore().byId("idDescArmador").getValue();
            var idPropiedad = sap.ui.getCore().byId("indicadorPropiedad").getSelectedKey();
            var options = [];
            var options2 = [];
            let embarcaciones = [];
            options.push({
                "cantidad": "20",
                "control": "COMBOBOX",
                "key": "ESEMB",
                "valueHigh": "",
                "valueLow": "O"
            })
            if (idEmbarcacion) {
                options.push({
                    "cantidad": "20",
                    "control": "COMBOBOX",
                    "key": "CDEMB",
                    "valueHigh": "",
                    "valueLow": idEmbarcacion

                });
            }
            if (idEmbarcacionDesc) {
                options.push({
                    "cantidad": "20",
                    "control": "COMBOBOX",
                    "key": "NMEMB",
                    "valueHigh": "",
                    "valueLow": idEmbarcacionDesc

                });
            }
            if (idMatricula) {
                options.push({
                    "cantidad": "20",
                    "control": "COMBOBOX",
                    "key": "MREMB",
                    "valueHigh": "",
                    "valueLow": idMatricula
                })
            }
            if (idPropiedad) {
                options.push({
                    "cantidad": "20",
                    "control": "COMBOBOX",
                    "key": "INPRP",
                    "valueHigh": "",
                    "valueLow": idPropiedad
                })
            }
            if (idRuc) {
                options2.push({
                    "cantidad": "20",
                    "control": "COMBOBOX",
                    "key": "STCD1",
                    "valueHigh": "",
                    "valueLow": idRuc
                })
            }
            if (idArmador) {
                options2.push({
                    "cantidad": "20",
                    "control": "COMBOBOX",
                    "key": "NAME1",
                    "valueHigh": "",
                    "valueLow": idArmador
                })
            }

            var body = {
                "option": [

                ],
                "option2": [

                ],
                "options": options,
                "options2": options2,
                "p_user": "BUSQEMB"
            };

            fetch(`${mainUrlServices}embarcacion/ConsultarEmbarcacion/`,
                {
                    method: 'POST',
                    body: JSON.stringify(body)
                })
                .then(resp => resp.json()).then(data => {
                    embarcaciones = data.data;
                    oModel.setProperty("/Embarcaciones", embarcaciones);
                    BusyIndicator.hide();
                }).catch(error => console.log(error));
        },

        onSelectEmba: function (evt) {
            var oModel = this.getOwnerComponent().getModel("FormModel");
            var objeto = evt.getSource().getBindingContext("ComboModel").getObject();
            if (objeto) {
                var descEmba =  objeto.NMEMB + "    " + objeto.MREMB;
                oModel.setProperty("/Embarcacion", objeto.CDEMB);
                oModel.setProperty("/DescEmba", descEmba);
                oModel.refresh();
                this.getView().byId("embarcacion").setValueState("None");
                this.getDialog().close();
            }
            
        },

        onAbrirAyudaEmbarcacion: function (evt) {
            this.getDialog().open();
        },

        onCerrarEmba: function () {
            this.getDialog().close();
        },

        getDialog: function () {
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment("com.tasa.tolvas.ingresodescargamanual.view.Embarcacion", this);
                this.getView().addDependent(this.oDialog);
            }
            return this.oDialog;
        },

        onPressCentro: function (evt) {
            var objeto = evt.getParameter("selectedRow").getBindingContext("ComboModel").getObject();
            if (objeto) {
                var oModel = this.getOwnerComponent().getModel("FormModel");
                oModel.setProperty("/Centro", objeto.WERKS);
                oModel.setProperty("/DescCentro", objeto.NAME1);
                oModel.refresh();
            }
        },

        onPressEspecie: function(evt){
            var objeto = evt.getParameter("selectedRow").getBindingContext("ComboModel").getObject();
            if (objeto) {
                var oModel = this.getOwnerComponent().getModel("FormModel");
                oModel.setProperty("/Especie", objeto.id);
                oModel.setProperty("/DescEsp", objeto.descripcion);
                oModel.refresh();
            }
        },

        onGuardar: function(){
            var oModel = this.getOwnerComponent().getModel("FormModel");
            var centro = oModel.getProperty("/Centro");
            var embarcacion = oModel.getProperty("/Embarcacion");
            var balanza = oModel.getProperty("/Balanza");
            var puntoDesc = oModel.getProperty("/PuntoDesc");
            var ticket = oModel.getProperty("/Ticket");
            var especie = oModel.getProperty("/Especie");
            var pescDesc = oModel.getProperty("/PescDesc");
            var bOk = true;

            if(!centro){
                bOk = false;
                this.getView().byId("centro").setValueState("Error");                
            }

            if(!embarcacion){
                bOk = false;
                this.getView().byId("embarcacion").setValueState("Error");                
            }

            if(!balanza){
                bOk = false;
                this.getView().byId("cbxBalanza").setValueState("Error");                
            }

            if(!puntoDesc){
                bOk = false;
                this.getView().byId("cbxPuntoDesc").setValueState("Error");                
            }

            if(!ticket){
                bOk = false;
                this.getView().byId("ticket").setValueState("Error");                
            }

            if(!especie){
                bOk = false;
                this.getView().byId("especies").setValueState("Error");                
            }

            if(!pescDesc){
                bOk = false;
                this.getView().byId("pescDesc").setValueState("Error");                
            }


            if (bOk) {
                //consumir rfc guardar
            } else {
                MessageBox.error("Hay campos obligatorios que estan vacios.");
            }

        },

        onChangeInput: function(evt){
            var idControl = evt.getSource().getId();
            var input = this.getView().byId(idControl);
            if(idControl.includes("centro")){
                input.setValueState("Information");
            }
            if(idControl.includes("ticket")){
                input.setValueState("None");
            }
            if(idControl.includes("especies")){
                input.setValueState("Information");
            }
            if(idControl.includes("pescDesc")){
                input.setValueState("None");
            }
            
        },

        onChange: function(evt){
            var idControl = evt.getSource().getId();
            var combo = this.getView().byId(idControl);
            if(idControl.includes("cbxBalanza")){
                combo.setValueState("None");
            }
            if(idControl.includes("cbxPuntoDesc")){
                combo.setValueState("None");
            }
        },

        getCurrentUser: function () {
            return "FGARCIA";
        }
    });
}, /* bExport= */ true);
