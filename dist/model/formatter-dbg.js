sap.ui.define(function() {
	"use strict";
	
	return {
		
		formatterText: function(fValue) {
			try {
				var valor = fValue;
				
				if (valor == 1) {
					
					return "Error";
				} else if (valor == 2) {
					
					return "Warning";
				} else {
					
					return "Success";
				}
			} catch (err) {
				
				return "None";
			}
		}
	};
});