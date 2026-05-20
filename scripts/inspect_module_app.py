import frappe

ma = frappe.local.module_app
keys = sorted([k for k in ma if 'madaar' in k.lower() or 'event' in k.lower()])
print("matched_keys:", keys)
for k in keys:
    print(" ", k, "->", ma[k])
print("len_total:", len(ma))
print("get_installed_apps:", frappe.get_installed_apps())
print("get_module_list_events:", frappe.get_module_list('madaar_events'))
