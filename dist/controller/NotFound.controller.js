sap.ui.define(["application/controller/BaseController","sap/ui/core/routing/History"],function(n,o){"use strict";return n.extend("application.controller.NotFound",{onInit:function(){},onNavBack:function(){var n,t;n=o.getInstance();t=n.getPreviousHash();if(t!==undefined){window.history.go(-1)}else{this.getRouter().navTo("Menu",{},true)}}})});