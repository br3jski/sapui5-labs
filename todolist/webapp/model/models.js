sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (JSONModel, Device) {
    "use strict";

    return {
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },
        
        createTodoListModel: function () {
            var oModel = new JSONModel({
                todos: [
                    { id: 1, title: "Task 1", description: "Task 1 from SAPUI5 Framework", status: "todo", category: "Task", completed: false },
                    { id: 2, title: "Task 2", description: "Whatever. I just wanna pass", status: "inProgress", category: "Bug", completed: false }
                ],
                statuses: [
                    { key: "todo", name: "To Do" },
                    { key: "inProgress", name: "In Progress" },
                    { key: "done", name: "Done" }
                ],
                categories: [
                    { key: "Task", name: "Task" },
                    { key: "Bug", name: "Bug" },
                    { key: "Consultation", name: "Consultation" }
                ],
                newTodo: "",
                newDescription: "",
                newCategory: "Task"
            });
            return oModel;
        }
    };
});