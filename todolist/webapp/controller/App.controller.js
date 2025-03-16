sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("todolist.controller.App", {
      onInit: function() {
          // Set app view model for UI state
          var oViewModel = new JSONModel({
              busy: false,
              delay: 0,
              layout: "OneColumn",
              previousLayout: "",
              actionButtonsInfo: {
                  midColumn: {
                      fullScreen: false
                  }
              }
          });
          this.getView().setModel(oViewModel, "appView");
          
          // Apply content density mode based on the device
          this.getUIComponent().getContentDensityClass();
      },
      
      getUIComponent: function () {
          return this.getOwnerComponent();
      }
  });
});