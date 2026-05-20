/**
 * Support Ticket create form.
 * Matches reference: screenshots/176_فتح-تذكرة-دعم-جديدة.png
 * ERPNext doctype: Issue
 * Layout: two-column — left: category cards + priority radio, right: subject + description + submit
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeCreateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { MessageSquare, DollarSign, Wrench, Zap, Bug, Sparkles, Send } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'General',          label: 'General',          icon: MessageSquare, color: 'text-blue-500' },
  { value: 'Billing',          label: 'مالي / فواتير',    icon: DollarSign,    color: 'text-amber-500' },
  { value: 'Technical Support',label: 'دعم فني',          icon: Wrench,        color: 'text-slate-500' },
  { value: 'Upgrade',          label: 'ترقية الباقة',     icon: Zap,           color: 'text-purple-500' },
  { value: 'Bug',              label: 'خطأ في النظام',    icon: Bug,           color: 'text-red-500' },
  { value: 'Feature Request',  label: 'طلب ميزة',         icon: Sparkles,      color: 'text-emerald-500' },
] as const;

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITIES = [
  { value: 'Low',    label: 'Low',    dot: 'bg-emerald-500' },
  { value: 'Medium', label: 'Medium', dot: 'bg-blue-500' },
  { value: 'High',   label: 'High',   dot: 'bg-orange-500' },
  { value: 'Urgent', label: 'Urgent', dot: 'bg-red-500' },
] as const;

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SupportTicketForm() {
  const navigate = useNavigate();
  const { createDoc, loading } = useFrappeCreateDoc();

  const [category, setCategory] = useState<string>('General');
  const [priority, setPriority] = useState<string>('Medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error('يرجى كتابة عنوان التذكرة');
      return;
    }
    if (!description.trim()) {
      toast.error('يرجى وصف المشكلة أو الطلب');
      return;
    }
    try {
      await createDoc('Issue', {
        subject: subject.trim(),
        description: description.trim(),
        priority,
        issue_type: category,
      });
      toast.success('تم إرسال التذكرة بنجاح');
      navigate('/support-tickets');
    } catch (e: any) {
      toast.error(e?.message ?? 'تعذر إرسال التذكرة');
    }
  }

  return (
    <PageShell
      title="فتح تذكرة دعم جديدة"
      subtitle="أخبرنا كيف يمكننا مساعدتك"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Left column: category + priority ─────────────────────────── */}
          <div className="space-y-6">
            {/* Category */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                فئة التذكرة <span className="text-red-500">*</span>
              </p>
              <div className="space-y-2">
                {CATEGORIES.map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-right transition-all text-sm font-medium ${
                      category === value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon size={18} className={category === value ? 'text-indigo-500' : color} />
                    <span className="flex-1">{label}</span>
                    {category === value && (
                      <span className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                Priority <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PRIORITIES.map(({ value, label, dot }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriority(value)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      priority === value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    } text-slate-700 dark:text-slate-300`}
                  >
                    <span className={`w-3 h-3 rounded-full ${dot}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column: subject + description + submit ──────────────── */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-6 flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="اكتب عنوان مختصر للمشكلة أو الطلب..."
                className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Order <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اشرح المشكلة أو الطلب بالتفصيل..."
                className="w-full h-48 px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
              >
                <Send size={15} />
                {loading ? '…' : 'إرسال التذكرة'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/support-tickets')}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </PageShell>
  );
}
