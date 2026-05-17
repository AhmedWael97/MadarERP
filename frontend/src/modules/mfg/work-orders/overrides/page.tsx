import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Work Order',
        title: 'أوامر الإنتاج',
        subtitle: 'تنفيذ ومتابعة عمليات التصنيع',
        basePath: '/mfg/work-orders',
        newLabel: 'أمر إنتاج',
        searchField: 'production_item',
        dateField: 'planned_start_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'production_item', header: 'الصنف' },
          { fieldname: 'qty', header: 'الكمية المطلوبة', numeric: true, ltr: true },
          { fieldname: 'produced_qty', header: 'الكمية المنتجة', numeric: true, ltr: true },
          { fieldname: 'planned_start_date', header: 'البداية المخططة' },
          { fieldname: 'planned_end_date', header: 'النهاية المخططة' },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Draft:        { label: 'مسودة',         cls: 'bg-amber-100 text-amber-700' },
          'Not Started': { label: 'لم يبدأ',       cls: 'bg-slate-100 text-slate-700' },
          'In Process': { label: 'جاري التنفيذ',   cls: 'bg-blue-100 text-blue-700' },
          Completed:    { label: 'مكتمل',          cls: 'bg-emerald-100 text-emerald-700' },
          Stopped:      { label: 'متوقف',          cls: 'bg-orange-100 text-orange-700' },
          Closed:       { label: 'مغلق',           cls: 'bg-purple-100 text-purple-700' },
          Cancelled:    { label: 'ملغى',           cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
