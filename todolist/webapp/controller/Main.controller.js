sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("com.example.todolist.controller.Main", { // Zmień na namespace Twojej aplikacji
        onInit: function () {
            // Inicjalizacja modelu danych
            var oViewModel = new JSONModel({
                tasks:
            });
            this.getView().setModel(oViewModel);
        },

        onInputChange: function (oEvent) {
            // Możesz tutaj dodać logikę do walidacji wprowadzania tekstu, jeśli chcesz
        },

        onAddTask: function () {
            var oModel = this.getView().getModel();
            var aTasks = oModel.getProperty("/tasks");
            var sNewTask = this.byId("newTaskInput").getValue();

            if (sNewTask) {
                aTasks.push({ title: sNewTask, completed: false });
                oModel.setProperty("/tasks", aTasks);
                this.byId("newTaskInput").setValue(""); // Wyczyść pole input
            }
        },

        onToggleTask: function (oEvent) {
            var oItem = oEvent.getSource();
            var oBindingContext = oItem.getBindingContext();
            var oModel = this.getView().getModel();
            var sPath = oBindingContext.getPath();
            var oTask = oModel.getObject(sPath);

            oTask.completed = !oTask.completed;
            oModel.setProperty(sPath, oTask);
        }
    });
});