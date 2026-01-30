sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], function (Controller, Filter, FilterOperator, MessageBox, MessageToast, Fragment) {
    "use strict";

    return Controller.extend("ns.books.controller.Main", {
        onInit: function () {
            this._oTable = this.byId("booksTable");
        },

        onRefresh: function () {
            this._oTable.getBinding("items").refresh();
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var aFilters = [];
            if (sQuery) {
                aFilters.push(new Filter("title", FilterOperator.Contains, sQuery));
            }
            this._oTable.getBinding("items").filter(aFilters);
        },

        onSelectionChange: function () {
            var bSelected = !!this._oTable.getSelectedItem();
            this.byId("editButton").setEnabled(bSelected);
            this.byId("deleteButton").setEnabled(bSelected);
        },

        onCreate: function () {
            var oListBinding = this._oTable.getBinding("items");
            // Create a new entry in the OData model context
            this._oContext = oListBinding.create({
                "ID": null,
                "title": "",
                "stock": 0
            });

            this._openDialog(this._oContext);
        },

        onEdit: function () {
            var oItem = this._oTable.getSelectedItem();
            if (!oItem) return;
            
            this._oContext = oItem.getBindingContext();
            this._openDialog(this._oContext);
        },

        onDelete: function () {
            var oItem = this._oTable.getSelectedItem();
            if (!oItem) return;

            var oContext = oItem.getBindingContext();
            var sTitle = oContext.getProperty("title");

            MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("msgDeleteConfirm") + " (" + sTitle + ")", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        oContext.delete().then(function () {
                            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgDeleteSuccess"));
                        }.bind(this)).catch(function (oError) {
                            MessageBox.error(oError.message);
                        });
                    }
                }.bind(this)
            });
        },

        _openDialog: function (oContext) {
            var oView = this.getView();

            if (!this._pDialog) {
                this._pDialog = Fragment.load({
                    id: oView.getId(),
                    name: "ns.books.fragment.BookDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this._pDialog.then(function (oDialog) {
                oDialog.setBindingContext(oContext);
                oDialog.open();
            });
        },

        onSaveDialog: function () {
            var oModel = this.getView().getModel();
            var bCreate = this._oContext.isTransient();

            // In OData V4 with $auto, changes are sent automatically.
            // We just need to ensure everything is valid and close the dialog.
            this.byId("bookDialog").setBusy(true);
            
            // We can wait for the specific context to be created/updated
            this._oContext.created().then(function() {
                this.byId("bookDialog").setBusy(false);
                this.byId("bookDialog").close();
                MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText(bCreate ? "msgCreateSuccess" : "msgUpdateSuccess"));
            }.bind(this)).catch(function(oError) {
                this.byId("bookDialog").setBusy(false);
                // If it's not transient, created() might reject if it's just an update
                // So we check if it's just a regular save
                if (!bCreate) {
                    this.byId("bookDialog").close();
                    MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgUpdateSuccess"));
                } else {
                    MessageBox.error(oError.message);
                }
            }.bind(this));

            // If it's not a create, we don't have a 'created' promise to wait for in the same way for updates
            if (!bCreate) {
                this.byId("bookDialog").setBusy(false);
                this.byId("bookDialog").close();
                MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgUpdateSuccess"));
            }
        },

        onCancelDialog: function () {
            // Reset changes or delete transient context
            if (this._oContext.isTransient()) {
                this._oContext.delete();
            } else {
                this.getView().getModel().resetChanges();
            }
            this.byId("bookDialog").close();
        }
    });
});
