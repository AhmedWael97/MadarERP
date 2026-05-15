#!/usr/bin/env node
/**
 * Scaffold the missing Madaar custom apps + their DocTypes.
 *
 * The `URL_TO_DOCTYPE` map in the frontend references ~28 DocTypes that don't yet
 * exist on the Frappe side, spread across 6 modules (fleet, construction, workshop,
 * restaurant, logistics, ecommerce, tax). Manually maintaining 100+ JSON+py files
 * is tedious; this script generates them from a single declarative spec below.
 *
 * Re-running is safe: existing files are left untouched (the script writes only
 * what's missing). To regenerate a file, delete it first.
 *
 * Run from the repo root:
 *   node madaar-apps/scripts/scaffold-doctypes.mjs
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPS_ROOT = path.resolve(__dirname, '..');
const TODAY = new Date().toISOString().slice(0, 10) + ' 00:00:00';

// ---------- Spec ----------
//
// One entry per app. Each app gets its own pyproject.toml + hooks.py + DocType set.
// Each DocType is described with a minimal-but-useful set of fields. The schema
// mirrors Frappe's DocType JSON closely so the output is drop-in usable.
//
// Field shorthand:
//   ['my_field', 'Data', { reqd: 1, label: 'My Field' }]
//   ['amount',   'Currency']
//   ['parent_link', 'Link', { options: 'Other DocType' }]
//   ['section_<n>', 'Section Break', { label: 'Section Header' }]
//
// Naming convention:
//   - autoname: optional; e.g., 'TRP-.####' uses Frappe's auto-numbering.
//   - title_field: optional; defaults to first reqd Data field.

const APPS = [
  {
    name: 'madaar_fleet',
    label: 'Madaar Fleet',
    description: 'Fleet management — vehicles, drivers, trips, fuel, maintenance, GPS.',
    doctypes: [
      {
        name: 'Madaar Vehicle',
        autoname: 'field:vehicle_number',
        title_field: 'vehicle_number',
        fields: [
          ['vehicle_number', 'Data', { reqd: 1, label: 'Vehicle Number', unique: 1 }],
          ['license_plate', 'Data', { reqd: 1, label: 'License Plate' }],
          ['make', 'Data', { label: 'Make' }],
          ['model', 'Data', { label: 'Model' }],
          ['year', 'Int', { label: 'Year' }],
          ['vin', 'Data', { label: 'VIN' }],
          ['column_break_1', 'Column Break'],
          ['fuel_type', 'Select', { label: 'Fuel Type', options: 'Petrol\nDiesel\nElectric\nHybrid\nLPG' }],
          ['current_odometer', 'Int', { label: 'Current Odometer (km)' }],
          ['status', 'Select', { label: 'Status', options: 'Active\nIn Service\nOut of Service\nSold', default: 'Active' }],
          ['driver', 'Link', { label: 'Default Driver', options: 'Madaar Driver Profile' }],
        ],
      },
      {
        name: 'Madaar Driver Profile',
        autoname: 'field:driver_name',
        title_field: 'driver_name',
        fields: [
          ['driver_name', 'Data', { reqd: 1, label: 'Driver Name', unique: 1 }],
          ['employee', 'Link', { label: 'Employee', options: 'Employee' }],
          ['phone', 'Data', { label: 'Phone' }],
          ['column_break_1', 'Column Break'],
          ['license_number', 'Data', { label: 'License Number' }],
          ['license_expiry', 'Date', { label: 'License Expiry' }],
          ['status', 'Select', { label: 'Status', options: 'Active\nOn Leave\nInactive', default: 'Active' }],
        ],
      },
      {
        name: 'Madaar Trip',
        autoname: 'TRP-.YYYY.-.####',
        title_field: 'trip_number',
        fields: [
          ['trip_number', 'Data', { read_only: 1, label: 'Trip Number' }],
          ['vehicle', 'Link', { reqd: 1, label: 'Vehicle', options: 'Madaar Vehicle' }],
          ['driver', 'Link', { label: 'Driver', options: 'Madaar Driver Profile' }],
          ['route', 'Link', { label: 'Route', options: 'Madaar Route' }],
          ['column_break_1', 'Column Break'],
          ['start_date', 'Datetime', { reqd: 1, label: 'Start' }],
          ['end_date', 'Datetime', { label: 'End' }],
          ['status', 'Select', { label: 'Status', options: 'Planned\nIn Progress\nCompleted\nCancelled', default: 'Planned' }],
          ['section_odo', 'Section Break', { label: 'Odometer' }],
          ['start_odometer', 'Int', { label: 'Start Odometer (km)' }],
          ['end_odometer', 'Int', { label: 'End Odometer (km)' }],
          ['column_break_2', 'Column Break'],
          ['distance_km', 'Float', { label: 'Distance (km)' }],
          ['purpose', 'Small Text', { label: 'Purpose' }],
        ],
      },
      {
        name: 'Madaar Fuel Log',
        autoname: 'FUEL-.YYYY.-.####',
        fields: [
          ['vehicle', 'Link', { reqd: 1, label: 'Vehicle', options: 'Madaar Vehicle' }],
          ['date', 'Date', { reqd: 1, label: 'Date' }],
          ['driver', 'Link', { label: 'Driver', options: 'Madaar Driver Profile' }],
          ['column_break_1', 'Column Break'],
          ['fuel_type', 'Select', { label: 'Fuel Type', options: 'Petrol\nDiesel\nElectric\nLPG' }],
          ['quantity', 'Float', { reqd: 1, label: 'Quantity (L / kWh)' }],
          ['unit_price', 'Currency', { reqd: 1, label: 'Unit Price' }],
          ['total_cost', 'Currency', { label: 'Total Cost', read_only: 1 }],
          ['odometer', 'Int', { label: 'Odometer (km)' }],
        ],
      },
      {
        name: 'Madaar Vehicle Maintenance Request',
        autoname: 'MAINT-.YYYY.-.####',
        fields: [
          ['vehicle', 'Link', { reqd: 1, label: 'Vehicle', options: 'Madaar Vehicle' }],
          ['request_date', 'Date', { reqd: 1, label: 'Request Date' }],
          ['maintenance_type', 'Select', { label: 'Type', options: 'Routine\nRepair\nInspection\nEmergency', default: 'Routine' }],
          ['priority', 'Select', { label: 'Priority', options: 'Low\nMedium\nHigh\nCritical', default: 'Medium' }],
          ['column_break_1', 'Column Break'],
          ['assigned_technician', 'Link', { label: 'Technician', options: 'Employee' }],
          ['status', 'Select', { label: 'Status', options: 'Open\nIn Progress\nCompleted\nCancelled', default: 'Open' }],
          ['estimated_cost', 'Currency', { label: 'Estimated Cost' }],
          ['actual_cost', 'Currency', { label: 'Actual Cost' }],
          ['description', 'Text', { label: 'Description' }],
        ],
      },
      {
        name: 'Madaar Route',
        autoname: 'field:route_name',
        title_field: 'route_name',
        fields: [
          ['route_name', 'Data', { reqd: 1, label: 'Route Name', unique: 1 }],
          ['origin', 'Data', { reqd: 1, label: 'Origin' }],
          ['destination', 'Data', { reqd: 1, label: 'Destination' }],
          ['column_break_1', 'Column Break'],
          ['distance_km', 'Float', { label: 'Distance (km)' }],
          ['estimated_duration', 'Int', { label: 'Est. Duration (minutes)' }],
          ['waypoints', 'Text', { label: 'Waypoints' }],
        ],
      },
      {
        name: 'Madaar Vehicle Violation',
        autoname: 'VIO-.YYYY.-.####',
        fields: [
          ['vehicle', 'Link', { reqd: 1, label: 'Vehicle', options: 'Madaar Vehicle' }],
          ['driver', 'Link', { label: 'Driver', options: 'Madaar Driver Profile' }],
          ['date', 'Date', { reqd: 1, label: 'Date' }],
          ['violation_type', 'Data', { label: 'Type' }],
          ['column_break_1', 'Column Break'],
          ['fine_amount', 'Currency', { label: 'Fine Amount' }],
          ['location', 'Data', { label: 'Location' }],
          ['status', 'Select', { label: 'Status', options: 'Unpaid\nPaid\nContested\nDismissed', default: 'Unpaid' }],
          ['notes', 'Small Text', { label: 'Notes' }],
        ],
      },
      {
        name: 'Madaar Vehicle Accident',
        autoname: 'ACC-.YYYY.-.####',
        fields: [
          ['vehicle', 'Link', { reqd: 1, label: 'Vehicle', options: 'Madaar Vehicle' }],
          ['driver', 'Link', { label: 'Driver', options: 'Madaar Driver Profile' }],
          ['accident_datetime', 'Datetime', { reqd: 1, label: 'Date / Time' }],
          ['location', 'Data', { label: 'Location' }],
          ['column_break_1', 'Column Break'],
          ['severity', 'Select', { label: 'Severity', options: 'Minor\nModerate\nMajor\nTotal Loss', default: 'Minor' }],
          ['estimated_repair_cost', 'Currency', { label: 'Est. Repair Cost' }],
          ['insurance_claim_number', 'Data', { label: 'Insurance Claim #' }],
          ['status', 'Select', { label: 'Status', options: 'Reported\nUnder Review\nRepaired\nClosed', default: 'Reported' }],
          ['description', 'Text', { label: 'Description' }],
        ],
      },
    ],
  },

  {
    name: 'madaar_construction',
    label: 'Madaar Construction',
    description: 'Construction — BOQ, progress bills (mostakhlas), change orders, project budgets, labor.',
    doctypes: [
      {
        name: 'Madaar BOQ',
        autoname: 'BOQ-.YYYY.-.####',
        fields: [
          ['project', 'Link', { reqd: 1, label: 'Project', options: 'Project' }],
          ['date', 'Date', { reqd: 1, label: 'Date' }],
          ['status', 'Select', { label: 'Status', options: 'Draft\nApproved\nLocked', default: 'Draft' }],
          ['column_break_1', 'Column Break'],
          ['total_amount', 'Currency', { label: 'Total Amount', read_only: 1 }],
          ['currency', 'Link', { label: 'Currency', options: 'Currency', default: 'EGP' }],
          ['section_items', 'Section Break', { label: 'BOQ Items' }],
          ['items', 'Table', { label: 'Items', options: 'Madaar BOQ Item' }],
        ],
      },
      {
        name: 'Madaar BOQ Item',
        istable: 1,
        fields: [
          ['item_name', 'Data', { reqd: 1, label: 'Item Name', in_list_view: 1 }],
          ['description', 'Small Text', { label: 'Description' }],
          ['unit', 'Data', { label: 'Unit', in_list_view: 1 }],
          ['quantity', 'Float', { reqd: 1, label: 'Quantity', in_list_view: 1 }],
          ['unit_rate', 'Currency', { reqd: 1, label: 'Unit Rate', in_list_view: 1 }],
          ['amount', 'Currency', { label: 'Amount', read_only: 1, in_list_view: 1 }],
        ],
      },
      {
        name: 'Madaar Progress Bill',
        autoname: 'PROG-.YYYY.-.####',
        fields: [
          ['project', 'Link', { reqd: 1, label: 'Project', options: 'Project' }],
          ['boq', 'Link', { reqd: 1, label: 'BOQ', options: 'Madaar BOQ' }],
          ['period_start', 'Date', { reqd: 1, label: 'Period Start' }],
          ['period_end', 'Date', { reqd: 1, label: 'Period End' }],
          ['column_break_1', 'Column Break'],
          ['completion_pct', 'Percent', { label: 'Completion %' }],
          ['gross_amount', 'Currency', { label: 'Gross Amount' }],
          ['retention_pct', 'Percent', { label: 'Retention %', default: 10 }],
          ['retention_amount', 'Currency', { label: 'Retention Amount', read_only: 1 }],
          ['net_amount', 'Currency', { label: 'Net Amount', read_only: 1 }],
          ['status', 'Select', { label: 'Status', options: 'Draft\nSubmitted\nApproved\nPaid', default: 'Draft' }],
          ['linked_sales_invoice', 'Link', { label: 'Sales Invoice', options: 'Sales Invoice', read_only: 1 }],
        ],
      },
      {
        name: 'Madaar Change Order',
        autoname: 'CO-.YYYY.-.####',
        fields: [
          ['project', 'Link', { reqd: 1, label: 'Project', options: 'Project' }],
          ['boq', 'Link', { label: 'BOQ', options: 'Madaar BOQ' }],
          ['date', 'Date', { reqd: 1, label: 'Date' }],
          ['column_break_1', 'Column Break'],
          ['amount_change', 'Currency', { label: 'Amount Change' }],
          ['status', 'Select', { label: 'Status', options: 'Pending\nApproved\nRejected', default: 'Pending' }],
          ['description', 'Text', { label: 'Description' }],
        ],
      },
      {
        name: 'Madaar Project Budget',
        autoname: 'BUD-.YYYY.-.####',
        fields: [
          ['project', 'Link', { reqd: 1, label: 'Project', options: 'Project' }],
          ['fiscal_year', 'Link', { reqd: 1, label: 'Fiscal Year', options: 'Fiscal Year' }],
          ['category', 'Data', { label: 'Category' }],
          ['column_break_1', 'Column Break'],
          ['planned_amount', 'Currency', { label: 'Planned' }],
          ['actual_amount', 'Currency', { label: 'Actual', read_only: 1 }],
          ['variance', 'Currency', { label: 'Variance', read_only: 1 }],
        ],
      },
      {
        name: 'Madaar Labor Record',
        autoname: 'LBR-.YYYY.-.####',
        fields: [
          ['project', 'Link', { reqd: 1, label: 'Project', options: 'Project' }],
          ['date', 'Date', { reqd: 1, label: 'Date' }],
          ['employee', 'Link', { label: 'Employee', options: 'Employee' }],
          ['column_break_1', 'Column Break'],
          ['hours_worked', 'Float', { label: 'Hours' }],
          ['hourly_rate', 'Currency', { label: 'Hourly Rate' }],
          ['total_cost', 'Currency', { label: 'Total Cost', read_only: 1 }],
          ['task_description', 'Small Text', { label: 'Task' }],
        ],
      },
    ],
  },

  {
    name: 'madaar_workshop',
    label: 'Madaar Workshop',
    description: 'Vehicle workshop — job cards, service types, maintenance packages.',
    doctypes: [
      {
        name: 'Madaar Vehicle Job Card',
        autoname: 'WJ-.YYYY.-.####',
        fields: [
          ['customer', 'Link', { reqd: 1, label: 'Customer', options: 'Customer' }],
          ['vehicle_make', 'Data', { label: 'Make' }],
          ['vehicle_model', 'Data', { label: 'Model' }],
          ['license_plate', 'Data', { reqd: 1, label: 'License Plate' }],
          ['column_break_1', 'Column Break'],
          ['assigned_technician', 'Link', { label: 'Technician', options: 'Employee' }],
          ['status', 'Select', { label: 'Status', options: 'Received\nIn Progress\nReady\nDelivered\nCancelled', default: 'Received' }],
          ['total_cost', 'Currency', { label: 'Total Cost' }],
          ['section_details', 'Section Break', { label: 'Details' }],
          ['complaint', 'Text', { label: 'Customer Complaint' }],
          ['work_performed', 'Text', { label: 'Work Performed' }],
        ],
      },
      {
        name: 'Madaar Service Type',
        autoname: 'field:service_type',
        title_field: 'service_type',
        fields: [
          ['service_type', 'Data', { reqd: 1, label: 'Service Type', unique: 1 }],
          ['description', 'Small Text', { label: 'Description' }],
          ['column_break_1', 'Column Break'],
          ['standard_duration_minutes', 'Int', { label: 'Standard Duration (min)' }],
          ['standard_price', 'Currency', { label: 'Standard Price' }],
        ],
      },
      {
        name: 'Madaar Maintenance Package',
        autoname: 'field:package_name',
        title_field: 'package_name',
        fields: [
          ['package_name', 'Data', { reqd: 1, label: 'Package Name', unique: 1 }],
          ['description', 'Small Text', { label: 'Description' }],
          ['total_price', 'Currency', { label: 'Total Price' }],
          ['section_services', 'Section Break', { label: 'Services' }],
          ['services', 'Table', { label: 'Services', options: 'Madaar Maintenance Package Service' }],
        ],
      },
      {
        name: 'Madaar Maintenance Package Service',
        istable: 1,
        fields: [
          ['service_type', 'Link', { reqd: 1, label: 'Service Type', options: 'Madaar Service Type', in_list_view: 1 }],
          ['price', 'Currency', { label: 'Price', in_list_view: 1 }],
          ['notes', 'Small Text', { label: 'Notes' }],
        ],
      },
    ],
  },

  {
    name: 'madaar_restaurant',
    label: 'Madaar Restaurant',
    description: 'Restaurant — halls, tables, modifiers, reservations, KDS.',
    doctypes: [
      {
        name: 'Madaar Hall',
        autoname: 'field:hall_name',
        title_field: 'hall_name',
        fields: [
          ['hall_name', 'Data', { reqd: 1, label: 'Hall Name', unique: 1 }],
          ['branch', 'Link', { label: 'Branch', options: 'Branch' }],
          ['capacity', 'Int', { label: 'Capacity' }],
          ['column_break_1', 'Column Break'],
          ['is_active', 'Check', { label: 'Active', default: 1 }],
        ],
      },
      {
        name: 'Madaar Table',
        autoname: 'field:table_number',
        title_field: 'table_number',
        fields: [
          ['table_number', 'Data', { reqd: 1, label: 'Table Number', unique: 1 }],
          ['hall', 'Link', { reqd: 1, label: 'Hall', options: 'Madaar Hall' }],
          ['capacity', 'Int', { label: 'Seats' }],
          ['column_break_1', 'Column Break'],
          ['status', 'Select', { label: 'Status', options: 'Available\nOccupied\nReserved\nOut of Service', default: 'Available' }],
        ],
      },
      {
        name: 'Madaar Modifier Group',
        autoname: 'field:group_name',
        title_field: 'group_name',
        fields: [
          ['group_name', 'Data', { reqd: 1, label: 'Group Name', unique: 1 }],
          ['min_selections', 'Int', { label: 'Min Selections', default: 0 }],
          ['max_selections', 'Int', { label: 'Max Selections', default: 1 }],
          ['section_modifiers', 'Section Break', { label: 'Modifiers' }],
          ['modifiers', 'Table', { label: 'Modifiers', options: 'Madaar Modifier' }],
        ],
      },
      {
        name: 'Madaar Modifier',
        istable: 1,
        fields: [
          ['modifier_name', 'Data', { reqd: 1, label: 'Name', in_list_view: 1 }],
          ['price_delta', 'Currency', { label: 'Price Δ', in_list_view: 1 }],
          ['is_default', 'Check', { label: 'Default', default: 0 }],
        ],
      },
      {
        name: 'Madaar Reservation',
        autoname: 'RES-.YYYY.-.####',
        fields: [
          ['customer_name', 'Data', { reqd: 1, label: 'Customer Name' }],
          ['customer_phone', 'Data', { label: 'Phone' }],
          ['reservation_datetime', 'Datetime', { reqd: 1, label: 'Date / Time' }],
          ['column_break_1', 'Column Break'],
          ['hall', 'Link', { label: 'Hall', options: 'Madaar Hall' }],
          ['table_link', 'Link', { label: 'Table', options: 'Madaar Table' }],
          ['party_size', 'Int', { label: 'Party Size' }],
          ['status', 'Select', { label: 'Status', options: 'Pending\nConfirmed\nSeated\nCompleted\nCancelled\nNo Show', default: 'Pending' }],
        ],
      },
    ],
  },

  {
    name: 'madaar_logistics',
    label: 'Madaar Logistics',
    description: 'Last-mile logistics — COD settlement, live tracking events.',
    doctypes: [
      {
        name: 'Madaar COD Settlement',
        autoname: 'COD-.YYYY.-.####',
        fields: [
          ['shipment', 'Link', { reqd: 1, label: 'Shipment', options: 'Shipment' }],
          ['settlement_date', 'Date', { reqd: 1, label: 'Settlement Date' }],
          ['amount_collected', 'Currency', { reqd: 1, label: 'Amount Collected' }],
          ['column_break_1', 'Column Break'],
          ['payment_method', 'Select', { label: 'Payment Method', options: 'Cash\nCard\nBank Transfer\nWallet' }],
          ['status', 'Select', { label: 'Status', options: 'Pending\nReceived\nReconciled', default: 'Pending' }],
        ],
      },
      {
        name: 'Madaar Tracking Event',
        autoname: 'TRK-.YYYY.-.######',
        fields: [
          ['shipment', 'Link', { reqd: 1, label: 'Shipment', options: 'Shipment' }],
          ['vehicle', 'Link', { label: 'Vehicle', options: 'Madaar Vehicle' }],
          ['event_datetime', 'Datetime', { reqd: 1, label: 'Event Time' }],
          ['column_break_1', 'Column Break'],
          ['latitude', 'Float', { label: 'Latitude' }],
          ['longitude', 'Float', { label: 'Longitude' }],
          ['status_text', 'Data', { label: 'Status' }],
        ],
      },
    ],
  },

  {
    name: 'madaar_ecommerce',
    label: 'Madaar Ecommerce',
    description: 'Online store — banners, CMS pages, stores.',
    doctypes: [
      {
        name: 'Madaar Banner',
        autoname: 'field:banner_name',
        title_field: 'banner_name',
        fields: [
          ['banner_name', 'Data', { reqd: 1, label: 'Banner Name', unique: 1 }],
          ['image', 'Attach Image', { label: 'Image' }],
          ['link_url', 'Data', { label: 'Link URL' }],
          ['column_break_1', 'Column Break'],
          ['position', 'Int', { label: 'Position', default: 0 }],
          ['is_active', 'Check', { label: 'Active', default: 1 }],
          ['start_date', 'Date', { label: 'Start' }],
          ['end_date', 'Date', { label: 'End' }],
        ],
      },
      {
        name: 'Madaar CMS Page',
        autoname: 'field:page_slug',
        title_field: 'title',
        fields: [
          ['page_slug', 'Data', { reqd: 1, label: 'Slug', unique: 1 }],
          ['title', 'Data', { reqd: 1, label: 'Title' }],
          ['column_break_1', 'Column Break'],
          ['is_published', 'Check', { label: 'Published', default: 0 }],
          ['published_date', 'Date', { label: 'Publish Date' }],
          ['section_content', 'Section Break', { label: 'Content' }],
          ['content', 'Text Editor', { label: 'Content' }],
        ],
      },
      {
        name: 'Madaar Store',
        autoname: 'field:store_name',
        title_field: 'store_name',
        fields: [
          ['store_name', 'Data', { reqd: 1, label: 'Store Name', unique: 1 }],
          ['warehouse', 'Link', { label: 'Warehouse', options: 'Warehouse' }],
          ['column_break_1', 'Column Break'],
          ['currency', 'Link', { label: 'Currency', options: 'Currency', default: 'EGP' }],
          ['is_default', 'Check', { label: 'Default Store' }],
        ],
      },
    ],
  },

  {
    name: 'madaar_egov_tax',
    label: 'Madaar E-Gov Tax',
    description: 'Egyptian e-invoicing (ETA) submissions, bulk batches, VAT returns.',
    doctypes: [
      {
        name: 'Madaar VAT Return',
        autoname: 'VAT-.YYYY.-.####',
        fields: [
          ['period_start', 'Date', { reqd: 1, label: 'Period Start' }],
          ['period_end', 'Date', { reqd: 1, label: 'Period End' }],
          ['column_break_1', 'Column Break'],
          ['output_vat', 'Currency', { label: 'Output VAT' }],
          ['input_vat', 'Currency', { label: 'Input VAT' }],
          ['net_payable', 'Currency', { label: 'Net Payable', read_only: 1 }],
          ['status', 'Select', { label: 'Status', options: 'Draft\nFiled\nPaid', default: 'Draft' }],
          ['filed_date', 'Date', { label: 'Filed Date' }],
        ],
      },
      {
        name: 'Madaar EInvoice Submission',
        autoname: 'EINV-.YYYY.-.######',
        fields: [
          ['invoice', 'Link', { reqd: 1, label: 'Sales Invoice', options: 'Sales Invoice' }],
          ['uuid', 'Data', { label: 'UUID', read_only: 1 }],
          ['long_id', 'Data', { label: 'Long ID', read_only: 1 }],
          ['column_break_1', 'Column Break'],
          ['status', 'Select', {
            label: 'Status',
            options: 'Pending\nSigned\nSubmitted\nAccepted\nRejected\nFailed',
            default: 'Pending',
          }],
          ['retry_count', 'Int', { label: 'Retry Count', default: 0 }],
          ['last_attempt', 'Datetime', { label: 'Last Attempt', read_only: 1 }],
          ['section_error', 'Section Break', { label: 'Error' }],
          ['error_message', 'Text', { label: 'Error Message', read_only: 1 }],
        ],
      },
      {
        name: 'Madaar EInvoice Bulk Batch',
        autoname: 'EBATCH-.YYYY.-.####',
        fields: [
          ['batch_date', 'Datetime', { reqd: 1, label: 'Batch Date' }],
          ['invoice_count', 'Int', { label: 'Invoice Count', read_only: 1 }],
          ['column_break_1', 'Column Break'],
          ['status', 'Select', { label: 'Status', options: 'Pending\nIn Progress\nCompleted\nFailed', default: 'Pending' }],
          ['section_results', 'Section Break', { label: 'Results' }],
          ['notes', 'Text', { label: 'Notes' }],
        ],
      },
    ],
  },
];

// ---------- File writers ----------

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function writeIfMissing(p, content) {
  if (existsSync(p)) return false;
  ensureDir(path.dirname(p));
  writeFileSync(p, content, 'utf8');
  return true;
}

function expandField([fieldname, fieldtype, opts = {}]) {
  const out = { fieldname, fieldtype };
  if (!out.label && fieldtype !== 'Section Break' && fieldtype !== 'Column Break') {
    out.label = opts.label ?? toLabel(fieldname);
  } else if (opts.label) {
    out.label = opts.label;
  }
  for (const [k, v] of Object.entries(opts)) {
    if (k !== 'label') out[k] = v;
  }
  return out;
}

function toLabel(fieldname) {
  return fieldname.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Replica of Frappe's `frappe.scrub` — lowercase + replace hyphens AND spaces with underscores. */
function scrubLabel(label) {
  return String(label ?? '').replace(/-/g, ' ').replace(/\s+/g, '_').toLowerCase();
}

function doctypeJSON({ name, doctype, app }) {
  const fields = doctype.fields.map(expandField);
  const fieldOrder = fields.map((f) => f.fieldname);
  const istable = doctype.istable ? 1 : 0;
  const json = {
    actions: [],
    allow_rename: 0,
    autoname: doctype.autoname ?? undefined,
    creation: TODAY,
    doctype: 'DocType',
    engine: 'InnoDB',
    field_order: fieldOrder,
    fields,
    istable,
    issingle: 0,
    links: [],
    modified: TODAY,
    modified_by: 'Administrator',
    module: app.label,
    name,
    owner: 'Administrator',
    permissions: istable
      ? []
      : [
          {
            create: 1,
            delete: 1,
            email: 1,
            export: 1,
            print: 1,
            read: 1,
            report: 1,
            role: 'System Manager',
            share: 1,
            write: 1,
          },
        ],
    sort_field: 'modified',
    sort_order: 'DESC',
    title_field: doctype.title_field ?? undefined,
    track_changes: 1,
  };
  return JSON.stringify(json, null, 2) + '\n';
}

function doctypePy(name) {
  const cls = name.replace(/\s+/g, '');
  return `# Copyright (c) 2026, Madaar Software and contributors
# For license information, please see license.txt

from __future__ import annotations

from frappe.model.document import Document


class ${cls}(Document):
    """${name} — auto-scaffolded; add lifecycle hooks as the business logic lands."""
    pass
`.replace('${cls}', cls).replace('${name}', name);
}

function appHooks(app) {
  return `app_name = "${app.name}"
app_title = "${app.label}"
app_publisher = "Madaar Software"
app_description = "${app.description}"
app_license = "MIT"
app_version = "0.0.1"
`;
}

function appPyproject(app) {
  return `[project]
name = "${app.name}"
version = "0.0.1"
description = "${app.description}"
authors = [
    { name = "Madaar Software", email = "dev@madaar.app" }
]
requires-python = ">=3.10"
readme = "README.md"
dependencies = []

[build-system]
requires = ["flit_core >=3.4,<4"]
build-backend = "flit_core.buildapi"

[tool.flit.module]
name = "${app.name}"
`;
}

function appReadme(app) {
  return `# ${app.label}\n\n${app.description}\n\nAuto-scaffolded by \`madaar-apps/scripts/scaffold-doctypes.mjs\`.\n`;
}

// ---------- Main ----------

function main() {
  let createdFiles = 0;
  let createdApps = 0;
  let createdDoctypes = 0;

  for (const app of APPS) {
    // Frappe app layout has THREE levels of nesting:
    //   <repo-root>/<app_name>/                  ← repo root (pyproject.toml lives here)
    //   <repo-root>/<app_name>/<app_name>/       ← Python package (hooks.py, modules.txt)
    //   <repo-root>/<app_name>/<app_name>/<module>/  ← module folder (snake-cased from app.label)
    //                                            └── doctype/<dt_slug>/<dt_slug>.{json,py}
    // The module folder name MUST match what's listed in modules.txt (snake-cased)
    // because Frappe imports DocType classes as `<app>.<module>.doctype.<dt>.<dt>.<Class>`.
    // The previous version of this script skipped the module level → Frappe's app loader
    // failed to import and crashed every request with a 500.
    const appRoot = path.join(APPS_ROOT, app.name);
    const pkg = path.join(appRoot, app.name);
    // Module folder name MUST match Frappe's scrub() — which lowercases AND replaces
    // both whitespace AND hyphens with underscores. Without the hyphen replacement
    // a label like "Madaar E-Gov Tax" produces "madaar_e-gov_tax", an invalid Python
    // identifier — Frappe then can't import the module and the whole app fails to load.
    const moduleSlug = scrubLabel(app.label);
    const moduleFolder = path.join(pkg, moduleSlug);
    const dtRoot = path.join(moduleFolder, 'doctype');

    if (!existsSync(appRoot)) createdApps += 1;

    if (writeIfMissing(path.join(appRoot, 'pyproject.toml'), appPyproject(app))) createdFiles++;
    if (writeIfMissing(path.join(appRoot, 'README.md'), appReadme(app))) createdFiles++;
    if (writeIfMissing(path.join(appRoot, 'license.txt'), 'MIT\n')) createdFiles++;
    if (writeIfMissing(path.join(appRoot, 'requirements.txt'), '')) createdFiles++;

    // Python package level — hooks.py, modules.txt, patches.txt all live here.
    if (writeIfMissing(path.join(pkg, '__init__.py'), `__version__ = "0.0.1"\n`)) createdFiles++;
    if (writeIfMissing(path.join(pkg, 'hooks.py'), appHooks(app))) createdFiles++;
    if (writeIfMissing(path.join(pkg, 'modules.txt'), `${app.label}\n`)) createdFiles++;
    if (writeIfMissing(path.join(pkg, 'patches.txt'), '')) createdFiles++;

    // Module folder — what Frappe scans for DocTypes belonging to this module.
    if (writeIfMissing(path.join(moduleFolder, '__init__.py'), '')) createdFiles++;
    if (writeIfMissing(path.join(dtRoot, '__init__.py'), '')) createdFiles++;

    for (const doctype of app.doctypes) {
      const dtSlug = doctype.name.toLowerCase().replace(/\s+/g, '_');
      const dtDir = path.join(dtRoot, dtSlug);
      const jsonPath = path.join(dtDir, `${dtSlug}.json`);
      const pyPath = path.join(dtDir, `${dtSlug}.py`);
      const initPath = path.join(dtDir, '__init__.py');

      if (!existsSync(jsonPath)) createdDoctypes += 1;

      if (writeIfMissing(jsonPath, doctypeJSON({ name: doctype.name, doctype, app }))) createdFiles++;
      if (writeIfMissing(pyPath, doctypePy(doctype.name))) createdFiles++;
      if (writeIfMissing(initPath, '')) createdFiles++;
    }
  }

  console.log(`✓ scaffold complete`);
  console.log(`  apps created:     ${createdApps}`);
  console.log(`  doctypes created: ${createdDoctypes}`);
  console.log(`  files written:    ${createdFiles}`);
  console.log(`  (run \`bench --site … install-app madaar_<name>\` for each new app to activate them)`);
}

main();
