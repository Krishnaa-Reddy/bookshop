sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (BaseController) {
    "use strict";

    return BaseController.extend("ns.books.controller.Main", {
        onInit: function () {
        },

        onRefresh: function () {
            this.byId("booksTable").getBinding("items").refresh();
        }
    });
});
