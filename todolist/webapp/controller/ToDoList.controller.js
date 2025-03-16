sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/CustomListItem",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/m/Text",
    "sap/m/Button",
    "sap/m/ObjectStatus"
], function (Controller, JSONModel, MessageToast, Filter, FilterOperator, 
            CustomListItem, HBox, VBox, Text, Button, ObjectStatus) {
    "use strict";

    return Controller.extend("todolist.controller.ToDoList", {
        onInit: function () {
            this.getView().setModel(this.getOwnerComponent().getModel("todoModel"), "todoModel");
            
            this._currentCategoryFilter = "All";
        },
        
        onAddTodo: function () {
            var oModel = this.getView().getModel("todoModel");
            var sNewTodo = oModel.getProperty("/newTodo").trim();
            var sNewCategory = oModel.getProperty("/newCategory");
            
            if (!sNewTodo) {
                MessageToast.show("Please enter a todo title");
                return;
            }
            
            var aTodos = oModel.getProperty("/todos");
            var iNextId = aTodos.length > 0 ? Math.max.apply(Math, aTodos.map(function(o) { return o.id; })) + 1 : 1;
            
            aTodos.push({
                id: iNextId,
                title: sNewTodo,
                status: "todo",
                category: sNewCategory,
                completed: false
            });
            
            oModel.setProperty("/todos", aTodos);
            oModel.setProperty("/newTodo", "");
            
            oModel.refresh(true);
            MessageToast.show("Todo added");
        },
        
        onCategoryFilterSelect: function(oEvent) {
            var sKey = oEvent.getParameter("key");
            this._currentCategoryFilter = sKey;
            
            this._applyFiltersToLists();
            
            MessageToast.show("Showing " + (sKey === "All" ? "all tasks" : sKey + " tasks"));
        },
        
        _applyFiltersToLists: function() {
            var aLists = ["todoList", "inProgressList", "doneList"];
            var that = this;
            
            aLists.forEach(function(sListId) {
                var oList = that.byId(sListId);
                if (!oList) {
                    return;
                }
                
                var oBinding = oList.getBinding("items");
                if (!oBinding) {
                    return; 
                }
                
                var sStatus;
                if (sListId === "todoList") {
                    sStatus = "todo";
                } else if (sListId === "inProgressList") {
                    sStatus = "inProgress";
                } else if (sListId === "doneList") {
                    sStatus = "done";
                }
                
                var oStatusFilter = new Filter("status", FilterOperator.EQ, sStatus);
                
                var aFilters = [oStatusFilter];
                
                if (that._currentCategoryFilter !== "All") {
                    var oCategoryFilter = new Filter("category", FilterOperator.EQ, that._currentCategoryFilter);
                    aFilters.push(oCategoryFilter);
                }
                
                var oCombinedFilter = new Filter({
                    filters: aFilters,
                    and: true
                });
                
                oBinding.filter(oCombinedFilter);
            });
        },
        
        todoItemFactory: function(sId, oContext) {
            var oTodo = oContext.getObject();
            var that = this;
            
            var aButtons = [];
            
            if (oTodo.status === "todo") {
                aButtons.push(new Button({
                    icon: "sap-icon://forward",
                    tooltip: "Move to In Progress",
                    press: function() {
                        that.onMoveToInProgress({
                            getSource: function() {
                                return {
                                    getCustomData: function() {
                                        return [{
                                            getValue: function() {
                                                return oTodo.id;
                                            }
                                        }];
                                    }
                                };
                            }
                        });
                    }
                }));
            } else if (oTodo.status === "inProgress") {
                aButtons.push(new Button({
                    icon: "sap-icon://media-rewind",
                    tooltip: "Move to To Do",
                    press: function() {
                        that.onMoveToTodo({
                            getSource: function() {
                                return {
                                    getCustomData: function() {
                                        return [{
                                            getValue: function() {
                                                return oTodo.id;
                                            }
                                        }];
                                    }
                                };
                            }
                        });
                    }
                }));
                
                aButtons.push(new Button({
                    icon: "sap-icon://media-forward",
                    tooltip: "Move to Done",
                    press: function() {
                        that.onMoveToDone({
                            getSource: function() {
                                return {
                                    getCustomData: function() {
                                        return [{
                                            getValue: function() {
                                                return oTodo.id;
                                            }
                                        }];
                                    }
                                };
                            }
                        });
                    }
                }));
            } else if (oTodo.status === "done") {
                aButtons.push(new Button({
                    icon: "sap-icon://media-rewind",
                    tooltip: "Move to In Progress",
                    press: function() {
                        that.onMoveToInProgress({
                            getSource: function() {
                                return {
                                    getCustomData: function() {
                                        return [{
                                            getValue: function() {
                                                return oTodo.id;
                                            }
                                        }];
                                    }
                                };
                            }
                        });
                    }
                }));
            }
            
            aButtons.push(new Button({
                icon: "sap-icon://delete",
                tooltip: "Delete Task",
                press: function() {
                    that.onDeleteTodo({
                        getSource: function() {
                            return {
                                getCustomData: function() {
                                    return [{
                                        getValue: function() {
                                            return oTodo.id;
                                        }
                                    }];
                                }
                            };
                        }
                    });
                }
            }));
            
            var sCategoryState = "Information";
            if (oTodo.category === "Bug") {
                sCategoryState = "Error";
            } else if (oTodo.category === "Task") {
                sCategoryState = "Success";
            }
            
            return new CustomListItem({
                content: [
                    new HBox({
                        width: "100%",
                        justifyContent: "SpaceBetween",
                        alignItems: "Center",
                        items: [
                            new VBox({
                                items: [
                                    new Text({text: oTodo.title}),
                                    new ObjectStatus({
                                        text: oTodo.category,
                                        state: sCategoryState
                                    })
                                ]
                            }),
                            new HBox({
                                items: aButtons
                            })
                        ]
                    })
                ]
            });
        },
        
        _getTodoById: function(id) {
            var aTodos = this.getView().getModel("todoModel").getProperty("/todos");
            return aTodos.find(function(todo) {
                return todo.id === id;
            });
        },
        
        _updateTodo: function(id, newStatus) {
            var oModel = this.getView().getModel("todoModel");
            var aTodos = oModel.getProperty("/todos");
            var oTodo = this._getTodoById(id);
            
            if (oTodo) {
                oTodo.status = newStatus;
                if (newStatus === "done") {
                    oTodo.completed = true;
                } else {
                    oTodo.completed = false;
                }
                
                oModel.setProperty("/todos", aTodos);
                oModel.refresh(true);
            }
        },
        
        onMoveToTodo: function(oEvent) {
            var iTodoId = parseInt(oEvent.getSource().getCustomData()[0].getValue());
            this._updateTodo(iTodoId, "todo");
            MessageToast.show("Moved to To Do");
        },
        
        onMoveToInProgress: function(oEvent) {
            var iTodoId = parseInt(oEvent.getSource().getCustomData()[0].getValue());
            this._updateTodo(iTodoId, "inProgress");
            MessageToast.show("Moved to In Progress");
        },
        
        onMoveToDone: function(oEvent) {
            var iTodoId = parseInt(oEvent.getSource().getCustomData()[0].getValue());
            this._updateTodo(iTodoId, "done");
            MessageToast.show("Moved to Done");
        },
        
        onToggleCompleted: function (oEvent) {
            var oSource = oEvent.getSource();
            var oModel = this.getView().getModel("todoModel");
            var aTodos = oModel.getProperty("/todos");
            var iTodoId = parseInt(oSource.getCustomData()[0].getValue());
            
            var oTodo = this._getTodoById(iTodoId);
            
            if (oTodo) {
                oTodo.completed = !oTodo.completed;
                if (oTodo.completed) {
                    oTodo.status = "done";
                }
                oModel.setProperty("/todos", aTodos);
                oModel.refresh(true);
                MessageToast.show(oTodo.completed ? "Todo marked as completed" : "Todo marked as active");
            }
        },
        
        onDeleteTodo: function (oEvent) {
            var oSource = oEvent.getSource();
            var oModel = this.getView().getModel("todoModel");
            var aTodos = oModel.getProperty("/todos");
            var iTodoId = parseInt(oSource.getCustomData()[0].getValue());
            
            var iIndex = aTodos.findIndex(function(todo) {
                return todo.id === iTodoId;
            });
            
            if (iIndex !== -1) {
                aTodos.splice(iIndex, 1);
                oModel.setProperty("/todos", aTodos);
                oModel.refresh(true);
                MessageToast.show("Todo deleted");
            }
        }
    });
});