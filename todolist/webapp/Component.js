sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "todolist/model/models"
], function (UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend("todolist.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");
            
            // set the todo list model
            this.setModel(models.createTodoListModel(), "todoModel");
            
            // create the views based on the url/hash
            this.getRouter().initialize();
        },
        
        /**
         * Returns the content density class based on the device
         * @returns {string} CSS class for content density
         */
        getContentDensityClass: function () {
            if (!this._sContentDensityClass) {
                // check whether FLP has already set the content density class
                if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
                    this._sContentDensityClass = "";
                } else if (!Device.support.touch) {
                    // apply "compact" mode if touch is not supported
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    // "cozy" in case of touch support
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        }
    });
});