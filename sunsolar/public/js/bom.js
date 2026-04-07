frappe.ui.form.on('BOM', {
    refresh: function (frm) {
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button(__('Material Request'), function () {

                let today = frappe.datetime.get_today();
                let due_date = frappe.datetime.add_days(today, 7);

                let items = [];
                (frm.doc.items || []).forEach(item => {
                    items.push({
                        item_code: item.item_code,
                        item_name: item.item_name,
                        description: item.description || '',
                        qty: item.qty,
                        uom: item.uom,
                        stock_uom: item.stock_uom,
                        conversion_factor: item.conversion_factor || 1,
                        schedule_date: due_date,
                        warehouse: item.source_warehouse || '',
                        t_warehouse: frm.doc.fg_warehouse || '',
                        s_warehouse: item.source_warehouse || '',
                        bom_no: frm.doc.name,
                    });
                });

                // ✅ Use frappe.call to create the doc server-side, then redirect
                frappe.call({
                    method: 'frappe.client.insert',
                    args: {
                        doc: {
                            doctype: 'Material Request',
                            material_request_type: 'Material Transfer',
                            company: frm.doc.company,
                            schedule_date: due_date,
                            items: items
                        }
                    },
                    freeze: true,
                    freeze_message: __('Creating Material Request...'),
                    callback: function (r) {
                        if (r.message) {
                            frappe.set_route('Form', 'Material Request', r.message.name);
                            frappe.show_alert({
                                message: __('Material Request {0} created', [r.message.name]),
                                indicator: 'green'
                            });
                        }
                    }
                });

            }, __('Create'));
        }

        if (frm.doc.docstatus === 0) {
            frm.trigger('set_customer_from_project');
        }
    },

    project: function (frm) {
        frm.trigger('set_customer_from_project');
    },

    set_customer_from_project: function (frm) {
        if (!frm.doc.project) return;
        frappe.db.get_value('Project', frm.doc.project, 'custom_customer')
            .then(r => {
                if (r && r.message && r.message.custom_customer) {
                    frm.set_value('custom_customer', r.message.custom_customer);
                }
            });
    }
});