import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useFrappeGetDocList,
  useFrappeGetDocCount,
  useFrappeCreateDoc,
  useFrappeUpdateDoc,
  useFrappeGetDoc,
} from 'frappe-react-sdk';
import { Plus, GraduationCap, Users, BookOpen, BadgeCheck, Search, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageShell } from '../components/erp/PageShell';
import { StatCard } from '../components/erp/StatCard';
import { FormCard } from '../components/erp/FormCard';
import { FormField, FIELD_INPUT_CLASS, FormSubmit, FormCancel, FormBackButton } from '../components/erp/FormField';

// Map every /lms/* sub-route to a Frappe DocType + column list. This lets one
// React file serve every list page without an explosion of one-off components.
interface LmsSection {
  key: string;
  doctype: string;
  titleAr: string;
  titleEn: string;
  fields: string[];
  columns: Array<{ id: string; ar: string; en: string; render?: (v: any) => React.ReactNode }>;
  createForm?: 'course' | 'lesson' | 'enrollment' | 'batch';
}

const SECTIONS: Record<string, LmsSection> = {
  'courses':     { key: 'courses',     doctype: 'Madaar LMS Course',
                   titleAr: 'الدورات',  titleEn: 'Courses',
                   fields: ['name', 'course_code', 'title_ar', 'title_en', 'instructor', 'duration_hours', 'price', 'is_published'],
                   columns: [
                     { id: 'course_code', ar: 'الكود', en: 'Code' },
                     { id: 'title_ar', ar: 'العنوان', en: 'Title' },
                     { id: 'instructor', ar: 'المدرس', en: 'Instructor' },
                     { id: 'duration_hours', ar: 'المدة (س)', en: 'Hours' },
                     { id: 'price', ar: 'السعر', en: 'Price', render: (v) => Number(v ?? 0).toLocaleString() },
                     { id: 'is_published', ar: 'منشورة', en: 'Published', render: (v) => v ? '✓' : '—' },
                   ],
                   createForm: 'course' },
  'lessons':     { key: 'lessons', doctype: 'Madaar LMS Lesson',
                   titleAr: 'الدروس', titleEn: 'Lessons',
                   fields: ['name', 'title', 'course', 'sort_order', 'duration_min'],
                   columns: [
                     { id: 'title', ar: 'العنوان', en: 'Title' },
                     { id: 'course', ar: 'الدورة', en: 'Course' },
                     { id: 'sort_order', ar: 'الترتيب', en: 'Order' },
                     { id: 'duration_min', ar: 'المدة (د)', en: 'Min' },
                   ],
                   createForm: 'lesson' },
  'enrollments': { key: 'enrollments', doctype: 'Madaar LMS Enrollment',
                   titleAr: 'التسجيلات', titleEn: 'Enrollments',
                   fields: ['name', 'student', 'course', 'batch', 'enrolled_on', 'progress_pct', 'status', 'amount_paid'],
                   columns: [
                     { id: 'student', ar: 'الطالب', en: 'Student' },
                     { id: 'course',  ar: 'الدورة', en: 'Course' },
                     { id: 'batch',   ar: 'الدفعة', en: 'Batch' },
                     { id: 'enrolled_on', ar: 'تاريخ التسجيل', en: 'Enrolled' },
                     { id: 'progress_pct', ar: 'التقدم', en: 'Progress', render: (v) => `${v ?? 0}%` },
                     { id: 'status', ar: 'الحالة', en: 'Status' },
                     { id: 'amount_paid', ar: 'المدفوع', en: 'Paid', render: (v) => Number(v ?? 0).toLocaleString() },
                   ],
                   createForm: 'enrollment' },
  'batches':     { key: 'batches', doctype: 'Madaar LMS Batch',
                   titleAr: 'الدفعات', titleEn: 'Batches',
                   fields: ['name', 'batch_code', 'course', 'instructor', 'start_date', 'end_date', 'max_seats', 'is_active'],
                   columns: [
                     { id: 'batch_code', ar: 'الكود', en: 'Code' },
                     { id: 'course',     ar: 'الدورة', en: 'Course' },
                     { id: 'instructor', ar: 'المدرس', en: 'Instructor' },
                     { id: 'start_date', ar: 'البداية', en: 'Start' },
                     { id: 'end_date',   ar: 'النهاية', en: 'End' },
                     { id: 'max_seats',  ar: 'المقاعد', en: 'Seats' },
                     { id: 'is_active',  ar: 'نشطة', en: 'Active', render: (v) => v ? '✓' : '—' },
                   ],
                   createForm: 'batch' },
};

// ───────────────────────────────────────────────────────────────────────────
// LMS dashboard — /lms
// ───────────────────────────────────────────────────────────────────────────
export default function LMS() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { data: coursesCount }     = useFrappeGetDocCount('Madaar LMS Course');
  const { data: lessonsCount }     = useFrappeGetDocCount('Madaar LMS Lesson');
  const { data: enrollmentsCount } = useFrappeGetDocCount('Madaar LMS Enrollment');
  const { data: batchesCount }     = useFrappeGetDocCount('Madaar LMS Batch');

  const SUB_LINKS = [
    { to: '/lms/courses',     ar: 'الدورات',     en: 'Courses',     icon: BookOpen,    color: 'cyan' },
    { to: '/lms/lessons',     ar: 'الدروس',     en: 'Lessons',     icon: BookOpen,    color: 'blue' },
    { to: '/lms/batches',     ar: 'الدفعات',    en: 'Batches',     icon: Users,       color: 'violet' },
    { to: '/lms/enrollments', ar: 'التسجيلات', en: 'Enrollments', icon: BadgeCheck,  color: 'emerald' },
  ];

  return (
    <PageShell
      title={isAr ? 'منصة التعليم — LMS' : 'Learning Management System'}
      subtitle={isAr ? 'الدورات، الطلاب، الدفعات، والتسجيلات' : 'Courses, students, batches and enrollments'}
      actions={
        <Link to="/lms/courses/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-sm">
          <Plus size={16} />
          {isAr ? 'دورة جديدة' : 'New course'}
        </Link>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard color="cyan"    icon={<BookOpen size={22} />}   label={isAr ? 'الدورات' : 'Courses'}        value={coursesCount ?? '—'} />
        <StatCard color="blue"    icon={<BookOpen size={22} />}   label={isAr ? 'الدروس' : 'Lessons'}         value={lessonsCount ?? '—'} />
        <StatCard color="violet"  icon={<Users size={22} />}      label={isAr ? 'الدفعات' : 'Batches'}        value={batchesCount ?? '—'} />
        <StatCard color="emerald" icon={<BadgeCheck size={22} />} label={isAr ? 'التسجيلات' : 'Enrollments'}  value={enrollmentsCount ?? '—'} />
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SUB_LINKS.map((l) => {
          const Icon = l.icon;
          const Chevron = isAr ? ChevronLeft : ChevronRight;
          return (
            <Link
              key={l.to}
              to={l.to}
              className="group flex items-center gap-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--color-brand-100)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-800 dark:text-white">{isAr ? l.ar : l.en}</div>
              </div>
              <Chevron size={16} className="shrink-0 text-slate-300 dark:text-slate-600 transition-colors group-hover:text-[color:var(--color-brand-500)]" />
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Generic LMS list — /lms/:section
// ───────────────────────────────────────────────────────────────────────────
export function LMSList() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { section = 'courses' } = useParams<{ section: string }>();
  const cfg = SECTIONS[section];
  const [query, setQuery] = useState('');

  if (!cfg) {
    return (
      <PageShell title={section} subtitle={isAr ? 'قسم غير معروف' : 'Unknown section'}>
        <p className="text-sm text-slate-400">{isAr ? 'لا يوجد قسم بهذا الاسم.' : 'No such section.'}</p>
      </PageShell>
    );
  }

  const { data: rows } = useFrappeGetDocList<any>(cfg.doctype, {
    fields: cfg.fields,
    limit: 50,
    orderBy: { field: 'modified', order: 'desc' },
  });
  const filtered = (rows ?? []).filter((r: any) =>
    !query ? true : JSON.stringify(r).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <PageShell
      title={isAr ? cfg.titleAr : cfg.titleEn}
      subtitle={isAr ? 'إدارة العناصر الخاصة بهذا القسم' : 'Manage records in this section'}
      actions={
        cfg.createForm && (
          <Link to={`/lms/${cfg.key}/create`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-sm">
            <Plus size={16} />
            {isAr ? 'إضافة جديد' : 'Add new'}
          </Link>
        )
      }
    >
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={isAr ? 'بحث…' : 'Search…'}
                   className="w-full ps-9 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-white/5" />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5">
              {cfg.columns.map((c) => (
                <th key={c.id} className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? c.ar : c.en}</th>
              ))}
              <th className="px-5 py-3 text-end text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
            {filtered.map((r: any) => (
              <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                {cfg.columns.map((c) => (
                  <td key={c.id} className="px-5 py-3 text-slate-700 dark:text-slate-200">
                    {c.render ? c.render(r[c.id]) : (r[c.id] ?? '—')}
                  </td>
                ))}
                <td className="px-5 py-3 text-end">
                  {cfg.createForm && (
                    <Link to={`/lms/${cfg.key}/${encodeURIComponent(r.name)}/edit`} className="inline-flex items-center gap-1 text-xs text-[color:var(--color-brand-600)] font-bold hover:underline">
                      <Edit3 size={12} />{isAr ? 'تعديل' : 'Edit'}
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={cfg.columns.length + 1} className="px-5 py-10 text-center text-sm text-slate-400">
                {isAr ? 'لا توجد بيانات' : 'No records yet'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Generic LMS form — /lms/:section/create  +  /lms/:section/:name/edit
// ───────────────────────────────────────────────────────────────────────────
export function LMSForm() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { section = 'courses', name } = useParams<{ section: string; name?: string }>();
  const navigate = useNavigate();
  const cfg = SECTIONS[section];
  const isEdit = !!name;

  const { data: existing } = useFrappeGetDoc<any>(cfg?.doctype ?? '', name ?? '', name && cfg ? `${cfg.doctype}-${name}` : null);
  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const [form, setForm] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  // Hydrate form from existing doc — must be a useEffect, not a render-time setState.
  useEffect(() => {
    if (existing && Object.keys(form).length === 0) {
      setForm(existing as Record<string, any>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  if (!cfg) {
    return <PageShell title={section}><p className="text-sm text-slate-400">{isAr ? 'قسم غير معروف' : 'Unknown section'}</p></PageShell>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit) {
        await updateDoc(cfg.doctype, name!, form);
      } else {
        await createDoc(cfg.doctype, { doctype: cfg.doctype, ...form });
      }
      navigate(`/lms/${cfg.key}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || String(err));
    }
  }

  // Field config per form type — same FormField/FormCard pattern as the rest.
  function renderFields() {
    if (cfg.createForm === 'course') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={isAr ? 'كود الدورة' : 'Course code'} required>
            <input value={form.course_code ?? ''} onChange={(e) => setForm({ ...form, course_code: e.target.value })} required disabled={isEdit} className={FIELD_INPUT_CLASS} dir="ltr" />
          </FormField>
          <FormField label={isAr ? 'منشورة' : 'Published'}>
            <label className="inline-flex items-center gap-2 mt-2">
              <input type="checkbox" checked={!!form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked ? 1 : 0 })} />
              <span className="text-xs text-slate-600 dark:text-slate-400">{isAr ? 'متاحة للطلاب' : 'Visible to students'}</span>
            </label>
          </FormField>
          <FormField label={isAr ? 'العنوان بالعربية' : 'Title (Arabic)'} required>
            <input value={form.title_ar ?? ''} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} required className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'العنوان بالإنجليزية' : 'Title (English)'} required>
            <input value={form.title_en ?? ''} onChange={(e) => setForm({ ...form, title_en: e.target.value })} required dir="ltr" className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'المدرس' : 'Instructor'}>
            <input value={form.instructor ?? ''} onChange={(e) => setForm({ ...form, instructor: e.target.value })} placeholder="user@madaar.app" dir="ltr" className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'المدة (ساعات)' : 'Duration (hours)'}>
            <input type="number" step="0.5" min={0} value={form.duration_hours ?? ''} onChange={(e) => setForm({ ...form, duration_hours: parseFloat(e.target.value) || 0 })} className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'السعر' : 'Price'}>
            <input type="number" min={0} step="0.01" value={form.price ?? ''} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'العملة' : 'Currency'}>
            <input value={form.currency ?? 'EGP'} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'الوصف' : 'Description'} span="full">
            <textarea rows={4} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className={FIELD_INPUT_CLASS} />
          </FormField>
        </div>
      );
    }
    if (cfg.createForm === 'lesson') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={isAr ? 'الدورة' : 'Course'} required>
            <input value={form.course ?? ''} onChange={(e) => setForm({ ...form, course: e.target.value })} required dir="ltr" className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'العنوان' : 'Title'} required>
            <input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'الترتيب' : 'Sort order'}>
            <input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value || '0', 10) })} className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'المدة (دقائق)' : 'Duration (min)'}>
            <input type="number" value={form.duration_min ?? 0} onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value || '0', 10) })} className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'رابط فيديو' : 'Video URL'} span="full">
            <input value={form.video_url ?? ''} onChange={(e) => setForm({ ...form, video_url: e.target.value })} dir="ltr" placeholder="https://…" className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'المحتوى' : 'Body'} span="full">
            <textarea rows={6} value={form.body ?? ''} onChange={(e) => setForm({ ...form, body: e.target.value })} className={FIELD_INPUT_CLASS} />
          </FormField>
        </div>
      );
    }
    if (cfg.createForm === 'batch') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label={isAr ? 'كود الدفعة' : 'Batch code'} required>
            <input value={form.batch_code ?? ''} onChange={(e) => setForm({ ...form, batch_code: e.target.value })} required disabled={isEdit} dir="ltr" className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'الدورة' : 'Course'} required>
            <input value={form.course ?? ''} onChange={(e) => setForm({ ...form, course: e.target.value })} required dir="ltr" className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'المدرس' : 'Instructor'}>
            <input value={form.instructor ?? ''} onChange={(e) => setForm({ ...form, instructor: e.target.value })} dir="ltr" className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'تاريخ البداية' : 'Start date'}>
            <input type="date" value={form.start_date ?? ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'تاريخ النهاية' : 'End date'}>
            <input type="date" value={form.end_date ?? ''} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'المقاعد' : 'Max seats'}>
            <input type="number" min={1} value={form.max_seats ?? 30} onChange={(e) => setForm({ ...form, max_seats: parseInt(e.target.value || '0', 10) })} className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'نشطة' : 'Active'}>
            <label className="inline-flex items-center gap-2 mt-2">
              <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} />
              <span className="text-xs text-slate-600 dark:text-slate-400">{isAr ? 'الدفعة نشطة' : 'Active batch'}</span>
            </label>
          </FormField>
        </div>
      );
    }
    if (cfg.createForm === 'enrollment') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={isAr ? 'الطالب' : 'Student'} required>
            <input value={form.student ?? ''} onChange={(e) => setForm({ ...form, student: e.target.value })} required dir="ltr" placeholder="user@example.com" className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'الدورة' : 'Course'} required>
            <input value={form.course ?? ''} onChange={(e) => setForm({ ...form, course: e.target.value })} required dir="ltr" className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'الدفعة' : 'Batch'}>
            <input value={form.batch ?? ''} onChange={(e) => setForm({ ...form, batch: e.target.value })} dir="ltr" className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'تاريخ التسجيل' : 'Enrolled on'}>
            <input type="date" value={form.enrolled_on ?? ''} onChange={(e) => setForm({ ...form, enrolled_on: e.target.value })} className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'المبلغ المدفوع' : 'Amount paid'}>
            <input type="number" min={0} step="0.01" value={form.amount_paid ?? 0} onChange={(e) => setForm({ ...form, amount_paid: parseFloat(e.target.value) || 0 })} className={FIELD_INPUT_CLASS} />
          </FormField>
          <FormField label={isAr ? 'الحالة' : 'Status'}>
            <select value={form.status ?? 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })} className={FIELD_INPUT_CLASS}>
              <option value="active">{isAr ? 'نشط' : 'Active'}</option>
              <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
              <option value="dropped">{isAr ? 'منسحب' : 'Dropped'}</option>
              <option value="refunded">{isAr ? 'مسترد' : 'Refunded'}</option>
            </select>
          </FormField>
        </div>
      );
    }
    return null;
  }

  const color = cfg.createForm === 'course' ? 'brand' : cfg.createForm === 'enrollment' ? 'emerald' : cfg.createForm === 'batch' ? 'violet' : 'amber';

  return (
    <PageShell
      title={isEdit ? (isAr ? `تعديل — ${name}` : `Edit — ${name}`) : (isAr ? `إضافة ${cfg.titleAr}` : `Add ${cfg.titleEn}`)}
      subtitle={isAr ? 'بيانات السجل' : 'Record details'}
      actions={<FormBackButton to={`/lms/${cfg.key}`}>{isAr ? 'رجوع' : 'Back'}</FormBackButton>}
    >
      <form onSubmit={submit} className="space-y-6">
        <FormCard color={color as any} title={isAr ? cfg.titleAr : cfg.titleEn} icon={<GraduationCap size={20} />}>
          {renderFields()}
        </FormCard>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex items-center gap-3">
          <FormSubmit loading={creating || updating}>
            {isEdit ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'حفظ' : 'Save')}
          </FormSubmit>
          <FormCancel href={`/lms/${cfg.key}`}>{isAr ? 'إلغاء' : 'Cancel'}</FormCancel>
        </div>
      </form>
    </PageShell>
  );
}
