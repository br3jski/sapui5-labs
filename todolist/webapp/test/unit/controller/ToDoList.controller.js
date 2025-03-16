/*global QUnit*/

sap.ui.define([
	"todolist/controller/ToDoList.controller"
], function (Controller) {
	"use strict";

	QUnit.module("ToDoList Controller");

	QUnit.test("I should test the ToDoList controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
