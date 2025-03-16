sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/Title",
    "sap/m/VBox",
    "sap/m/ObjectHeader",
    "sap/m/ObjectStatus",
    "sap/m/ObjectAttribute",
    "sap/m/CustomListItem",
    "sap/m/HBox"
], function (Controller, JSONModel, MessageToast, Filter, FilterOperator, 
            Dialog, Button, Text, Title, VBox, ObjectHeader, ObjectStatus, ObjectAttribute,
            CustomListItem, HBox) {
    "use strict";

    return Controller.extend("todolist.controller.ToDoList", {
        
        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */
        
        onInit: function () {
            // Get the todo model from the component
            this.getView().setModel(this.getOwnerComponent().getModel("todoModel"), "todoModel");
            
            // Set initial filter to "All"
            this._currentCategoryFilter = "All";
        },
        
        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */
        
        /**
         * Handles adding a new todo
         */
        onAddTodo: function () {
            var oModel = this.getView().getModel("todoModel");
            var sNewTodo = oModel.getProperty("/newTodo").trim();
            var sNewDescription = oModel.getProperty("/newDescription") || "";
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
                description: sNewDescription,
                status: "todo",
                category: sNewCategory,
                completed: false
            });
            
            oModel.setProperty("/todos", aTodos);
            oModel.setProperty("/newTodo", "");
            oModel.setProperty("/newDescription", "");
            // Don't reset category selection to allow adding multiple tasks of the same category
            
            oModel.refresh(true);
            MessageToast.show("Todo added");
        },
        
        /**
         * Handles clicking on a task to view details
         */
        onTaskPress: function (oEvent) {
            var oListItem = oEvent.getSource();
            var oContext = oListItem.getBindingContext("todoModel");
            var oTodo = oContext.getObject();
            
            // Create dialog if it doesn't exist yet
            if (!this._oTaskDialog) {
                this._oTaskDialog = new Dialog({
                    title: "Task Details",
                    contentWidth: "400px",
                    content: [
                        new ObjectHeader({
                            title: "{todoModel>title}",
                            statuses: [
                                new ObjectStatus({
                                    text: {
                                        path: 'todoModel>status',
                                        formatter: function(sStatus) {
                                            if (sStatus === "todo") return "To Do";
                                            if (sStatus === "inProgress") return "In Progress";
                                            return "Done";
                                        }
                                    },
                                    state: "Information"
                                }),
                                new ObjectStatus({
                                    text: "{todoModel>category}",
                                    state: {
                                        path: 'todoModel>category',
                                        formatter: function(sCategory) {
                                            if (sCategory === "Task") return "Success";
                                            if (sCategory === "Bug") return "Error";
                                            return "Warning";
                                        }
                                    }
                                })
                            ],
                            attributes: [
                                new ObjectAttribute({
                                    title: "Description",
                                    text: "{todoModel>description}"
                                })
                            ]
                        })
                    ],
                    beginButton: new Button({
                        text: "Close",
                        press: function () {
                            this._oTaskDialog.close();
                        }.bind(this)
                    })
                });
                
                this.getView().addDependent(this._oTaskDialog);
            }
            
            // Bind dialog to the selected todo
            this._oTaskDialog.bindElement({
                path: oContext.getPath(),
                model: "todoModel"
            });
            
            this._oTaskDialog.open();
        },
        
        /**
         * Handles category filter selection
         */
        onCategoryFilterSelect: function (oEvent) {
            var sKey = oEvent.getParameter("key");
            this._currentCategoryFilter = sKey;
            
            this._applyFiltersToLists();
            
            MessageToast.show("Showing " + (sKey === "All" ? "all tasks" : sKey + " tasks"));
        },
        
        /**
         * Move a todo to To Do status
         */
        onMoveToTodo: function (oEvent) {
            var iTodoId = parseInt(oEvent.getSource().getCustomData()[0].getValue());
            this._updateTodo(iTodoId, "todo");
            this._stopPropagation(oEvent);
            MessageToast.show("Moved to To Do");
        },
        
        /**
         * Move a todo to In Progress status
         */
        onMoveToInProgress: function (oEvent) {
            var iTodoId = parseInt(oEvent.getSource().getCustomData()[0].getValue());
            this._updateTodo(iTodoId, "inProgress");
            this._stopPropagation(oEvent);
            MessageToast.show("Moved to In Progress");
        },
        
        /**
         * Move a todo to Done status
         */
        onMoveToDone: function (oEvent) {
            var iTodoId = parseInt(oEvent.getSource().getCustomData()[0].getValue());
            this._updateTodo(iTodoId, "done");
            this._stopPropagation(oEvent);
            MessageToast.show("Moved to Done");
        },
        
        /**
         * Toggle the completed status of a todo
         */
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
                this._stopPropagation(oEvent);
                MessageToast.show(oTodo.completed ? "Todo marked as completed" : "Todo marked as active");
            }
        },
        
        /**
         * Delete a todo
         */
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
                this._stopPropagation(oEvent);
                MessageToast.show("Todo deleted");
            }
        },
        
        /**
         * Factory function for creating todo list items
         */
        todoItemFactory: function (sId, oContext) {
            var oTodo = oContext.getObject();
            var that = this;
            
            var aButtons = [];
            
            // Add buttons based on task status
            if (oTodo.status === "todo") {
                aButtons.push(new Button({
                    icon: "sap-icon://forward",
                    tooltip: "Move to In Progress",
                    press: function(oEvent) {
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
                            },
                            stopPropagation: function() {}
                        });
                    }
                }));
            } else if (oTodo.status === "inProgress") {
                aButtons.push(new Button({
                    icon: "sap-icon://media-rewind",
                    tooltip: "Move to To Do",
                    press: function(oEvent) {
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
                            },
                            stopPropagation: function() {}
                        });
                    }
                }));
                
                aButtons.push(new Button({
                    icon: "sap-icon://media-forward",
                    tooltip: "Move to Done",
                    press: function(oEvent) {
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
                            },
                            stopPropagation: function() {}
                        });
                    }
                }));
            } else if (oTodo.status === "done") {
                aButtons.push(new Button({
                    icon: "sap-icon://media-rewind",
                    tooltip: "Move to In Progress",
                    press: function(oEvent) {
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
                            },
                            stopPropagation: function() {}
                        });
                    }
                }));
            }
            
            // Add delete button for all statuses
            aButtons.push(new Button({
                icon: "sap-icon://delete",
                tooltip: "Delete Task",
                press: function(oEvent) {
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
                        },
                        stopPropagation: function() {}
                    });
                }
            }));
            
            // Determine category styling
            var sCategoryState = "Information";
            if (oTodo.category === "Bug") {
                sCategoryState = "Error";
            } else if (oTodo.category === "Task") {
                sCategoryState = "Success";
            } else if (oTodo.category === "Consultation") {
                sCategoryState = "Warning";
            }
            
            // Create the list item with content
            return new CustomListItem({
                type: "Active",
                press: [that.onTaskPress, that],
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
        
        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */
        
        /**
         * Apply category filters to all lists
         */
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
        
        /**
         * Get a todo by ID
         */
        _getTodoById: function(id) {
            var aTodos = this.getView().getModel("todoModel").getProperty("/todos");
            return aTodos.find(function(todo) {
                return todo.id === id;
            });
        },
        
        /**
         * Update a todo status
         */
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
        
        /**
         * Prevent event propagation
         */
        _stopPropagation: function(oEvent) {
            if (oEvent && oEvent.stopPropagation) {
                oEvent.stopPropagation();
            }
        }
    });
});