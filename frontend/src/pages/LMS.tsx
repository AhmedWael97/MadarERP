import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useFrappeGetDocList,
  useFrappeGetDocCount,
  useFrappeCreateDoc,
  useFrappeUpdateDoc,
  useFrappeGetDoc,
} from 'frappe-react-sdk';
import { Plus, GraduationCap, Users, BookOpen, BadgeCheck, Search, Edit3, ChevronLeft, ChevronRight, Layers, FileCheck2, Award, BarChart3, CalendarDays, CheckSquare, CreditCard, UserCheck, BookMarked, FilePlus2 } from 'lucide-react';
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
  createForm?: 'course' | 'lesson' | 'enrollment' | 'batch' | 'auto' | 'payment';
  /** Used by the generic 'auto' form: list of editable fields with optional input hints. */
  formFields?: Array<{
    name: string;
    ar: string;
    en: string;
    type?: 'text' | 'number' | 'date' | 'time' | 'datetime' | 'checkbox' | 'textarea' | 'select';
    options?: string[];
    required?: boolean;
    span?: 'full';
  }>;
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

  // ── Phase 2 — generic 'auto' sections backed by 12 new doctypes ────────────
  'programs':    { key: 'programs', doctype: 'Madaar LMS Program',
                   titleAr: 'البرامج التعليمية', titleEn: 'Programs',
                   fields: ['name', 'program_code', 'title_ar', 'title_en', 'coordinator', 'duration_months', 'price', 'is_published'],
                   columns: [
                     { id: 'program_code', ar: 'الكود', en: 'Code' },
                     { id: 'title_ar', ar: 'العنوان', en: 'Title' },
                     { id: 'coordinator', ar: 'المنسق', en: 'Coordinator' },
                     { id: 'duration_months', ar: 'المدة (شهر)', en: 'Months' },
                     { id: 'price', ar: 'السعر', en: 'Price', render: (v) => Number(v ?? 0).toLocaleString() },
                     { id: 'is_published', ar: 'منشور', en: 'Published', render: (v) => v ? '✓' : '—' },
                   ],
                   createForm: 'auto',
                   formFields: [
                     { name: 'program_code', ar: 'كود البرنامج', en: 'Program Code', required: true },
                     { name: 'title_ar', ar: 'العنوان بالعربية', en: 'Title (Arabic)', required: true },
                     { name: 'title_en', ar: 'العنوان بالإنجليزية', en: 'Title (English)', required: true },
                     { name: 'coordinator', ar: 'المنسق (بريد المستخدم)', en: 'Coordinator (user email)' },
                     { name: 'duration_months', ar: 'المدة (أشهر)', en: 'Duration (months)', type: 'number' },
                     { name: 'price', ar: 'السعر', en: 'Price', type: 'number' },
                     { name: 'currency', ar: 'العملة', en: 'Currency' },
                     { name: 'is_published', ar: 'منشور', en: 'Published', type: 'checkbox' },
                     { name: 'description', ar: 'الوصف', en: 'Description', type: 'textarea', span: 'full' },
                   ] },

  'chapters':    { key: 'chapters', doctype: 'Madaar LMS Chapter',
                   titleAr: 'الفصول', titleEn: 'Chapters',
                   fields: ['name', 'course', 'title', 'sort_order'],
                   columns: [
                     { id: 'course', ar: 'الدورة', en: 'Course' },
                     { id: 'title', ar: 'العنوان', en: 'Title' },
                     { id: 'sort_order', ar: 'الترتيب', en: 'Order' },
                   ],
                   createForm: 'auto',
                   formFields: [
                     { name: 'course', ar: 'الدورة', en: 'Course', required: true },
                     { name: 'title', ar: 'العنوان', en: 'Title', required: true },
                     { name: 'sort_order', ar: 'الترتيب', en: 'Sort Order', type: 'number' },
                     { name: 'summary', ar: 'ملخص', en: 'Summary', type: 'textarea', span: 'full' },
                   ] },

  'quizzes':     { key: 'quizzes', doctype: 'Madaar LMS Quiz',
                   titleAr: 'الاختبارات', titleEn: 'Quizzes',
                   fields: ['name', 'title', 'course', 'time_limit_min', 'total_marks', 'pass_mark', 'is_published'],
                   columns: [
                     { id: 'title', ar: 'العنوان', en: 'Title' },
                     { id: 'course', ar: 'الدورة', en: 'Course' },
                     { id: 'total_marks', ar: 'الدرجة الكلية', en: 'Total' },
                     { id: 'time_limit_min', ar: 'المدة (د)', en: 'Time (min)' },
                     { id: 'is_published', ar: 'منشور', en: 'Published', render: (v) => v ? '✓' : '—' },
                   ],
                   createForm: 'auto',
                   formFields: [
                     { name: 'title', ar: 'العنوان', en: 'Title', required: true },
                     { name: 'course', ar: 'الدورة', en: 'Course', required: true },
                     { name: 'chapter', ar: 'الفصل', en: 'Chapter' },
                     { name: 'time_limit_min', ar: 'المدة (دقيقة)', en: 'Time Limit (min)', type: 'number' },
                     { name: 'total_marks', ar: 'الدرجة الكلية', en: 'Total Marks', type: 'number' },
                     { name: 'pass_mark', ar: 'درجة النجاح', en: 'Pass Mark', type: 'number' },
                     { name: 'is_published', ar: 'منشور', en: 'Published', type: 'checkbox' },
                     { name: 'description', ar: 'الوصف', en: 'Description', type: 'textarea', span: 'full' },
                   ] },

  'assignments': { key: 'assignments', doctype: 'Madaar LMS Assignment',
                   titleAr: 'المهام والواجبات', titleEn: 'Assignments',
                   fields: ['name', 'title', 'course', 'due_date', 'max_marks', 'is_published'],
                   columns: [
                     { id: 'title', ar: 'العنوان', en: 'Title' },
                     { id: 'course', ar: 'الدورة', en: 'Course' },
                     { id: 'due_date', ar: 'تاريخ التسليم', en: 'Due Date' },
                     { id: 'max_marks', ar: 'الدرجة العظمى', en: 'Max' },
                     { id: 'is_published', ar: 'منشور', en: 'Published', render: (v) => v ? '✓' : '—' },
                   ],
                   createForm: 'auto',
                   formFields: [
                     { name: 'title', ar: 'العنوان', en: 'Title', required: true },
                     { name: 'course', ar: 'الدورة', en: 'Course', required: true },
                     { name: 'due_date', ar: 'تاريخ التسليم', en: 'Due Date', type: 'date' },
                     { name: 'max_marks', ar: 'الدرجة العظمى', en: 'Max Marks', type: 'number' },
                     { name: 'is_published', ar: 'منشور', en: 'Published', type: 'checkbox' },
                     { name: 'description', ar: 'الوصف', en: 'Description', type: 'textarea', span: 'full' },
                   ] },

  'students':    { key: 'students', doctype: 'Madaar LMS Student',
                   titleAr: 'الطلاب', titleEn: 'Students',
                   fields: ['name', 'student_id', 'full_name', 'email', 'phone', 'joined_on', 'status'],
                   columns: [
                     { id: 'student_id', ar: 'الكود', en: 'ID' },
                     { id: 'full_name', ar: 'الاسم', en: 'Name' },
                     { id: 'email', ar: 'البريد', en: 'Email' },
                     { id: 'joined_on', ar: 'تاريخ الانضمام', en: 'Joined' },
                     { id: 'status', ar: 'الحالة', en: 'Status' },
                   ],
                   createForm: 'auto',
                   formFields: [
                     { name: 'student_id', ar: 'كود الطالب', en: 'Student ID', required: true },
                     { name: 'full_name', ar: 'الاسم الكامل', en: 'Full Name', required: true },
                     { name: 'email', ar: 'البريد الإلكتروني', en: 'Email' },
                     { name: 'phone', ar: 'الهاتف', en: 'Phone' },
                     { name: 'national_id', ar: 'الرقم القومي', en: 'National ID' },
                     { name: 'birth_date', ar: 'تاريخ الميلاد', en: 'Date of Birth', type: 'date' },
                     { name: 'gender', ar: 'النوع', en: 'Gender', type: 'select', options: ['', 'Male', 'Female'] },
                     { name: 'joined_on', ar: 'تاريخ الانضمام', en: 'Joined On', type: 'date' },
                     { name: 'status', ar: 'الحالة', en: 'Status', type: 'select', options: ['Active', 'Graduated', 'Dropped', 'Suspended'] },
                     { name: 'notes', ar: 'ملاحظات', en: 'Notes', type: 'textarea', span: 'full' },
                   ] },

  'instructors': { key: 'instructors', doctype: 'Madaar LMS Instructor',
                   titleAr: 'المدرسين', titleEn: 'Instructors',
                   fields: ['name', 'instructor_code', 'full_name', 'email', 'specialty', 'is_active'],
                   columns: [
                     { id: 'instructor_code', ar: 'الكود', en: 'Code' },
                     { id: 'full_name', ar: 'الاسم', en: 'Name' },
                     { id: 'email', ar: 'البريد', en: 'Email' },
                     { id: 'specialty', ar: 'التخصص', en: 'Specialty' },
                     { id: 'is_active', ar: 'نشط', en: 'Active', render: (v) => v ? '✓' : '—' },
                   ],
                   createForm: 'auto',
                   formFields: [
                     { name: 'instructor_code', ar: 'كود المدرس', en: 'Instructor Code', required: true },
                     { name: 'full_name', ar: 'الاسم الكامل', en: 'Full Name', required: true },
                     { name: 'user', ar: 'حساب المستخدم', en: 'Linked User' },
                     { name: 'email', ar: 'البريد', en: 'Email' },
                     { name: 'phone', ar: 'الهاتف', en: 'Phone' },
                     { name: 'specialty', ar: 'التخصص', en: 'Specialty' },
                     { name: 'hourly_rate', ar: 'سعر الساعة', en: 'Hourly Rate', type: 'number' },
                     { name: 'currency', ar: 'العملة', en: 'Currency' },
                     { name: 'is_active', ar: 'نشط', en: 'Active', type: 'checkbox' },
                     { name: 'bio', ar: 'السيرة', en: 'Biography', type: 'textarea', span: 'full' },
                   ] },

  'grades':      { key: 'grades', doctype: 'Madaar LMS Grade',
                   titleAr: 'الدرجات', titleEn: 'Grades',
                   fields: ['name', 'student', 'course', 'assessment_type', 'marks', 'grade_letter'],
                   columns: [
                     { id: 'student', ar: 'الطالب', en: 'Student' },
                     { id: 'course', ar: 'الدورة', en: 'Course' },
                     { id: 'assessment_type', ar: 'النوع', en: 'Type' },
                     { id: 'marks', ar: 'الدرجة', en: 'Marks' },
                     { id: 'grade_letter', ar: 'التقدير', en: 'Grade' },
                   ],
                   createForm: 'auto',
                   formFields: [
                     { name: 'student', ar: 'الطالب', en: 'Student', required: true },
                     { name: 'course', ar: 'الدورة', en: 'Course', required: true },
                     { name: 'assessment_type', ar: 'نوع التقييم', en: 'Assessment Type', type: 'select', options: ['Quiz', 'Assignment', 'Midterm', 'Final', 'Project'] },
                     { name: 'marks', ar: 'الدرجة', en: 'Marks', type: 'number' },
                     { name: 'max_marks', ar: 'الدرجة العظمى', en: 'Max Marks', type: 'number' },
                     { name: 'grade_letter', ar: 'التقدير', en: 'Grade', type: 'select', options: ['', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'] },
                     { name: 'graded_on', ar: 'تاريخ التقدير', en: 'Graded On', type: 'date' },
                     { name: 'graded_by', ar: 'بواسطة', en: 'Graded By' },
                     { name: 'notes', ar: 'ملاحظات', en: 'Notes', type: 'textarea', span: 'full' },
                   ] },

  'certificates':{ key: 'certificates', doctype: 'Madaar LMS Certificate',
                   titleAr: 'الشهادات', titleEn: 'Certificates',
                   fields: ['name', 'certificate_no', 'student', 'course', 'issued_on', 'status'],
                   columns: [
                     { id: 'certificate_no', ar: 'رقم الشهادة', en: 'Cert. No' },
                     { id: 'student', ar: 'الطالب', en: 'Student' },
                     { id: 'course', ar: 'الدورة', en: 'Course' },
                     { id: 'issued_on', ar: 'تاريخ الإصدار', en: 'Issued' },
                     { id: 'status', ar: 'الحالة', en: 'Status' },
                   ],
                   createForm: 'auto',
                   formFields: [
                     { name: 'certificate_no', ar: 'رقم الشهادة', en: 'Certificate No', required: true },
                     { name: 'student', ar: 'الطالب', en: 'Student', required: true },
                     { name: 'course', ar: 'الدورة', en: 'Course', required: true },
                     { name: 'issued_on', ar: 'تاريخ الإصدار', en: 'Issued On', type: 'date' },
                     { name: 'expires_on', ar: 'ينتهي في', en: 'Expires On', type: 'date' },
                     { name: 'status', ar: 'الحالة', en: 'Status', type: 'select', options: ['Issued', 'Revoked', 'Expired'] },
                     { name: 'verification_url', ar: 'رابط التحقق', en: 'Verification URL' },
                     { name: 'issued_by', ar: 'صادرة من', en: 'Issued By' },
                     { name: 'notes', ar: 'ملاحظات', en: 'Notes', type: 'textarea', span: 'full' },
                   ] },

  'progress':    { key: 'progress', doctype: 'Madaar LMS Progress',
                   titleAr: 'متابعة التقدم', titleEn: 'Progress',
                   fields: ['name', 'student', 'course', 'completion_pct', 'last_activity_on', 'status'],
                   columns: [
                     { id: 'student', ar: 'الطالب', en: 'Student' },
                     { id: 'course', ar: 'الدورة', en: 'Course' },
                     { id: 'completion_pct', ar: 'التقدم', en: 'Progress', render: (v) => `${Number(v ?? 0).toFixed(0)}%` },
                     { id: 'last_activity_on', ar: 'آخر نشاط', en: 'Last Activity' },
                     { id: 'status', ar: 'الحالة', en: 'Status' },
                   ],
                   createForm: 'auto',
                   formFields: [
                     { name: 'student', ar: 'الطالب', en: 'Student', required: true },
                     { name: 'course', ar: 'الدورة', en: 'Course', required: true },
                     { name: 'completion_pct', ar: 'نسبة الإنجاز %', en: 'Completion %', type: 'number' },
                     { name: 'lessons_completed', ar: 'الدروس المنجزة', en: 'Lessons Completed', type: 'number' },
                     { name: 'total_lessons', ar: 'إجمالي الدروس', en: 'Total Lessons', type: 'number' },
                     { name: 'last_activity_on', ar: 'آخر نشاط', en: 'Last Activity', type: 'datetime' },
                     { name: 'status', ar: 'الحالة', en: 'Status', type: 'select', options: ['Not Started', 'In Progress', 'Completed', 'Stalled'] },
                   ] },

  'schedule':    { key: 'schedule', doctype: 'Madaar LMS Schedule',
                   titleAr: 'الجدول الزمني', titleEn: 'Schedule',
                   fields: ['name', 'class_date', 'start_time', 'course', 'batch', 'status'],
                   columns: [
                     { id: 'class_date', ar: 'التاريخ', en: 'Date' },
                     { id: 'start_time', ar: 'الوقت', en: 'Time' },
                     { id: 'course', ar: 'الدورة', en: 'Course' },
                     { id: 'batch', ar: 'الدفعة', en: 'Batch' },
                     { id: 'status', ar: 'الحالة', en: 'Status' },
                   ],
                   createForm: 'auto',
                   formFields: [
                     { name: 'class_date', ar: 'تاريخ الحصة', en: 'Class Date', type: 'date', required: true },
                     { name: 'start_time', ar: 'وقت البداية', en: 'Start Time', type: 'time' },
                     { name: 'end_time', ar: 'وقت النهاية', en: 'End Time', type: 'time' },
                     { name: 'course', ar: 'الدورة', en: 'Course' },
                     { name: 'batch', ar: 'الدفعة', en: 'Batch' },
                     { name: 'instructor', ar: 'المدرس', en: 'Instructor' },
                     { name: 'room', ar: 'القاعة', en: 'Room' },
                     { name: 'topic', ar: 'الموضوع', en: 'Topic' },
                     { name: 'status', ar: 'الحالة', en: 'Status', type: 'select', options: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'] },
                   ] },

  'attendance':  { key: 'attendance', doctype: 'Madaar LMS Attendance',
                   titleAr: 'الحضور', titleEn: 'Attendance',
                   fields: ['name', 'student', 'batch', 'class_date', 'status'],
                   columns: [
                     { id: 'student', ar: 'الطالب', en: 'Student' },
                     { id: 'batch', ar: 'الدفعة', en: 'Batch' },
                     { id: 'class_date', ar: 'التاريخ', en: 'Date' },
                     { id: 'status', ar: 'الحالة', en: 'Status' },
                   ],
                   createForm: 'auto',
                   formFields: [
                     { name: 'student', ar: 'الطالب', en: 'Student', required: true },
                     { name: 'class_date', ar: 'تاريخ الحصة', en: 'Class Date', type: 'date', required: true },
                     { name: 'batch', ar: 'الدفعة', en: 'Batch' },
                     { name: 'schedule', ar: 'الجلسة', en: 'Schedule' },
                     { name: 'status', ar: 'الحالة', en: 'Status', type: 'select', options: ['Present', 'Absent', 'Late', 'Excused'] },
                     { name: 'notes', ar: 'ملاحظات', en: 'Notes', type: 'textarea', span: 'full' },
                   ] },

  'payments':    { key: 'payments', doctype: 'Madaar LMS Payment',
                   titleAr: 'الرسوم والمدفوعات', titleEn: 'Payments',
                   fields: ['name', 'student', 'course', 'amount', 'payment_date', 'method', 'status'],
                   columns: [
                     { id: 'student', ar: 'الطالب', en: 'Student' },
                     { id: 'course', ar: 'الدورة', en: 'Course' },
                     { id: 'amount', ar: 'المبلغ', en: 'Amount', render: (v) => Number(v ?? 0).toLocaleString() },
                     { id: 'payment_date', ar: 'تاريخ الدفع', en: 'Date' },
                     { id: 'method', ar: 'الوسيلة', en: 'Method' },
                     { id: 'status', ar: 'الحالة', en: 'Status' },
                   ],
                   createForm: 'auto',
                   formFields: [
                     { name: 'student', ar: 'الطالب', en: 'Student', required: true },
                     { name: 'course', ar: 'الدورة', en: 'Course' },
                     { name: 'enrollment', ar: 'التسجيل', en: 'Enrollment' },
                     { name: 'amount', ar: 'المبلغ', en: 'Amount', type: 'number', required: true },
                     { name: 'currency', ar: 'العملة', en: 'Currency' },
                     { name: 'payment_date', ar: 'تاريخ الدفع', en: 'Payment Date', type: 'date' },
                     { name: 'method', ar: 'وسيلة الدفع', en: 'Method', type: 'select', options: ['Cash', 'Bank Transfer', 'Card', 'Mobile Wallet', 'Other'] },
                     { name: 'reference_no', ar: 'رقم المرجع', en: 'Reference No' },
                     { name: 'status', ar: 'الحالة', en: 'Status', type: 'select', options: ['Paid', 'Pending', 'Refunded', 'Failed'] },
                     { name: 'notes', ar: 'ملاحظات', en: 'Notes', type: 'textarea', span: 'full' },
                   ] },
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
  const { data: studentsCount }    = useFrappeGetDocCount('Madaar LMS Student');
  const { data: paymentsCount }    = useFrappeGetDocCount('Madaar LMS Payment');

  const SUB_LINKS = [
    { to: '/lms/courses',      ar: 'الدورات',            en: 'Courses',         icon: BookOpen,     color: 'cyan' },
    { to: '/lms/lessons',      ar: 'الدروس',             en: 'Lessons',         icon: BookMarked,   color: 'blue' },
    { to: '/lms/batches',      ar: 'الدفعات',            en: 'Batches',         icon: Users,        color: 'violet' },
    { to: '/lms/enrollments',  ar: 'التسجيلات',          en: 'Enrollments',     icon: BadgeCheck,   color: 'emerald' },
    { to: '/lms/students',     ar: 'الطلاب',             en: 'Students',        icon: UserCheck,    color: 'amber' },
    { to: '/lms/instructors',  ar: 'المدرسين',           en: 'Instructors',     icon: GraduationCap, color: 'rose' },
    { to: '/lms/payments',     ar: 'الرسوم والمدفوعات', en: 'Payments',        icon: CreditCard,   color: 'teal' },
    { to: '/lms/grades',       ar: 'الدرجات',            en: 'Grades',          icon: BarChart3,    color: 'orange' },
    { to: '/lms/certificates', ar: 'الشهادات',           en: 'Certificates',    icon: Award,        color: 'yellow' },
    { to: '/lms/schedule',     ar: 'الجدول الزمني',     en: 'Schedule',        icon: CalendarDays, color: 'indigo' },
    { to: '/lms/attendance',   ar: 'الحضور',             en: 'Attendance',      icon: CheckSquare,  color: 'green' },
    { to: '/lms/progress',     ar: 'متابعة التقدم',     en: 'Progress',        icon: BarChart3,    color: 'blue' },
    { to: '/lms/programs',     ar: 'البرامج التعليمية', en: 'Programs',        icon: Layers,       color: 'purple' },
    { to: '/lms/quizzes',      ar: 'الاختبارات',         en: 'Quizzes',         icon: FileCheck2,   color: 'red' },
    { to: '/lms/assignments',  ar: 'الواجبات',           en: 'Assignments',     icon: FilePlus2,    color: 'cyan' },
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
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard color="cyan"    icon={<BookOpen size={22} />}     label={isAr ? 'الدورات' : 'Courses'}        value={coursesCount ?? '—'} />
        <StatCard color="blue"    icon={<BookOpen size={22} />}     label={isAr ? 'الدروس' : 'Lessons'}         value={lessonsCount ?? '—'} />
        <StatCard color="violet"  icon={<Users size={22} />}        label={isAr ? 'الدفعات' : 'Batches'}        value={batchesCount ?? '—'} />
        <StatCard color="emerald" icon={<BadgeCheck size={22} />}   label={isAr ? 'التسجيلات' : 'Enrollments'}  value={enrollmentsCount ?? '—'} />
        <StatCard color="amber"   icon={<UserCheck size={22} />}    label={isAr ? 'الطلاب' : 'Students'}        value={studentsCount ?? '—'} />
        <StatCard color="teal"    icon={<CreditCard size={22} />}   label={isAr ? 'المدفوعات' : 'Payments'}     value={paymentsCount ?? '—'} />
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

  // Hooks must run on every render, in the same order — call them unconditionally
  // and pass an empty doctype + null swrKey when the section is unknown to keep
  // the SDK from firing a real request.
  const { data: rows } = useFrappeGetDocList<any>(cfg?.doctype ?? 'DocType', {
    fields: cfg?.fields ?? ['name'],
    limit: 50,
    orderBy: { field: 'modified', order: 'desc' },
  }, cfg ? undefined : null);

  if (!cfg) {
    return (
      <PageShell title={section} subtitle={isAr ? 'قسم غير معروف' : 'Unknown section'}>
        <p className="text-sm text-slate-400">{isAr ? 'لا يوجد قسم بهذا الاسم.' : 'No such section.'}</p>
      </PageShell>
    );
  }

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

  // ── Reference data for linked-field dropdowns ─────────────────────────────
  const { data: coursesRef } = useFrappeGetDocList<{ name: string; title_ar?: string; course_code?: string }>(
    'Madaar LMS Course', { fields: ['name', 'title_ar', 'course_code'], limit: 200 },
  );
  const { data: instructorsRef } = useFrappeGetDocList<{ name: string; full_name?: string; instructor_code?: string }>(
    'Madaar LMS Instructor', { fields: ['name', 'full_name', 'instructor_code'], limit: 200 },
  );
  const { data: allBatchesRef } = useFrappeGetDocList<{ name: string; batch_code?: string; course?: string }>(
    'Madaar LMS Batch', { fields: ['name', 'batch_code', 'course'], limit: 200 },
  );
  const { data: studentsRef } = useFrappeGetDocList<{ name: string; full_name?: string; student_id?: string }>(
    'Madaar LMS Student', { fields: ['name', 'full_name', 'student_id'], limit: 200 },
  );
  const { data: enrollmentsRef } = useFrappeGetDocList<{ name: string; student?: string; course?: string }>(
    'Madaar LMS Enrollment', { fields: ['name', 'student', 'course'], limit: 200 },
  );
  // ── Accounting integration data ───────────────────────────────────────────
  const { data: modesOfPaymentRef } = useFrappeGetDocList<{ name: string }>(
    'Mode of Payment', { fields: ['name'], limit: 50 },
  );
  const { data: bankCashAccountsRef } = useFrappeGetDocList<{ name: string }>(
    'Account',
    { fields: ['name'], filters: [['account_type', 'in', ['Cash', 'Bank']]] as any, limit: 100 },
  );
  const { data: globalDefaults } = useFrappeGetDoc<{ default_company?: string }>(
    'Global Defaults', 'Global Defaults', 'global-defaults',
  );
  // Batches filtered by course currently selected in the form
  const courseBatchesRef = useMemo(
    () => (form.course ? (allBatchesRef ?? []).filter((b) => b.course === form.course) : (allBatchesRef ?? [])),
    [allBatchesRef, form.course],
  );
  // Payment Entry accounting state
  const [postToAccounting, setPostToAccounting] = useState(true);
  const [paidToAccount, setPaidToAccount] = useState('');

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
        // ── Accounting integration: LMS Payment → ERPNext Payment Entry ──────
        if (section === 'payments' && postToAccounting && form.status !== 'Pending' && form.status !== 'Failed') {
          try {
            await createDoc('Payment Entry', {
              payment_type: 'Receive',
              mode_of_payment: form.method || 'Cash',
              company: globalDefaults?.default_company ?? '',
              paid_to: paidToAccount || undefined,
              paid_amount: Number(form.amount) || 0,
              received_amount: Number(form.amount) || 0,
              reference_no: form.reference_no ?? '',
              reference_date: form.payment_date || new Date().toISOString().slice(0, 10),
              remarks: `LMS Payment — Student: ${form.student ?? ''} — Course: ${form.course ?? ''} — Enrollment: ${form.enrollment ?? ''}`,
            } as any);
          } catch (accErr: any) {
            // Non-blocking: LMS record already saved
            console.warn('ERPNext Payment Entry creation (non-blocking):', accErr?.message ?? accErr);
          }
        }
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
            <select value={form.instructor ?? ''} onChange={(e) => setForm({ ...form, instructor: e.target.value })} className={FIELD_INPUT_CLASS}>
              <option value="">— {isAr ? 'اختر مدرساً' : 'Select instructor'} —</option>
              {(instructorsRef ?? []).map((i) => (
                <option key={i.name} value={i.name}>{i.instructor_code ? `[${i.instructor_code}] ` : ''}{i.full_name ?? i.name}</option>
              ))}
            </select>
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
            <select required value={form.course ?? ''} onChange={(e) => setForm({ ...form, course: e.target.value })} className={FIELD_INPUT_CLASS}>
              <option value="">— {isAr ? 'اختر دورة' : 'Select course'} —</option>
              {(coursesRef ?? []).map((c) => (
                <option key={c.name} value={c.name}>{c.course_code ? `[${c.course_code}] ` : ''}{c.title_ar ?? c.name}</option>
              ))}
            </select>
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
            <select required value={form.course ?? ''} onChange={(e) => setForm({ ...form, course: e.target.value })} className={FIELD_INPUT_CLASS}>
              <option value="">— {isAr ? 'اختر دورة' : 'Select course'} —</option>
              {(coursesRef ?? []).map((c) => (
                <option key={c.name} value={c.name}>{c.course_code ? `[${c.course_code}] ` : ''}{c.title_ar ?? c.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label={isAr ? 'المدرس' : 'Instructor'}>
            <select value={form.instructor ?? ''} onChange={(e) => setForm({ ...form, instructor: e.target.value })} className={FIELD_INPUT_CLASS}>
              <option value="">— {isAr ? 'اختر مدرساً' : 'Select instructor'} —</option>
              {(instructorsRef ?? []).map((i) => (
                <option key={i.name} value={i.name}>{i.instructor_code ? `[${i.instructor_code}] ` : ''}{i.full_name ?? i.name}</option>
              ))}
            </select>
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
    if (cfg.createForm === 'auto' && cfg.formFields) {
      // Generic renderer: one FormField per declared field. Used by every section
      // beyond course/lesson/batch/enrollment so we don't hand-write 12 forms.
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cfg.formFields.map((f) => {
            const val = form[f.name];
            const label = isAr ? f.ar : f.en;
            const setVal = (v: any) => setForm({ ...form, [f.name]: v });
            const common = { className: FIELD_INPUT_CLASS };
            let input: React.ReactNode;
            if (f.type === 'checkbox') {
              input = (
                <label className="inline-flex items-center gap-2 mt-2">
                  <input type="checkbox" checked={!!val} onChange={(e) => setVal(e.target.checked ? 1 : 0)} />
                  <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
                </label>
              );
            } else if (f.type === 'textarea') {
              input = <textarea rows={4} value={val ?? ''} onChange={(e) => setVal(e.target.value)} {...common} />;
            } else if (f.type === 'select') {
              input = (
                <select value={val ?? f.options?.[0] ?? ''} onChange={(e) => setVal(e.target.value)} {...common}>
                  {(f.options ?? []).map((o) => <option key={o} value={o}>{o || '—'}</option>)}
                </select>
              );
            } else if (f.type === 'number') {
              input = <input type="number" step="any" value={val ?? ''} onChange={(e) => setVal(e.target.value === '' ? null : parseFloat(e.target.value))} required={f.required} {...common} />;
            } else if (f.type === 'date') {
              input = <input type="date" value={val ?? ''} onChange={(e) => setVal(e.target.value)} required={f.required} {...common} />;
            } else if (f.type === 'time') {
              input = <input type="time" value={val ?? ''} onChange={(e) => setVal(e.target.value)} required={f.required} {...common} />;
            } else if (f.type === 'datetime') {
              input = <input type="datetime-local" value={val ?? ''} onChange={(e) => setVal(e.target.value)} required={f.required} {...common} />;
            } else {
              input = <input value={val ?? ''} onChange={(e) => setVal(e.target.value)} required={f.required} {...common} />;
            }
            return (
              <FormField key={f.name} label={label} required={f.required} span={f.span}>
                {input}
              </FormField>
            );
          })}
        </div>
      );
    }
    if (cfg.createForm === 'enrollment') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={isAr ? 'الطالب' : 'Student'} required>
            <select required value={form.student ?? ''} onChange={(e) => setForm({ ...form, student: e.target.value })} className={FIELD_INPUT_CLASS}>
              <option value="">— {isAr ? 'اختر طالباً' : 'Select student'} —</option>
              {(studentsRef ?? []).map((s) => (
                <option key={s.name} value={s.name}>{s.student_id ? `[${s.student_id}] ` : ''}{s.full_name ?? s.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label={isAr ? 'الدورة' : 'Course'} required>
            <select required value={form.course ?? ''} onChange={(e) => setForm({ ...form, course: e.target.value, batch: '' })} className={FIELD_INPUT_CLASS}>
              <option value="">— {isAr ? 'اختر دورة' : 'Select course'} —</option>
              {(coursesRef ?? []).map((c) => (
                <option key={c.name} value={c.name}>{c.course_code ? `[${c.course_code}] ` : ''}{c.title_ar ?? c.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label={isAr ? 'الدفعة' : 'Batch'}>
            <select value={form.batch ?? ''} onChange={(e) => setForm({ ...form, batch: e.target.value })} className={FIELD_INPUT_CLASS}>
              <option value="">— {isAr ? 'اختر دفعة' : 'Select batch'} —</option>
              {courseBatchesRef.map((b) => (
                <option key={b.name} value={b.name}>{b.batch_code ?? b.name}</option>
              ))}
            </select>
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
    if (cfg.createForm === 'payment') {
      return (
        <div className="space-y-6">
          {/* LMS payment fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={isAr ? 'الطالب' : 'Student'} required>
              <select required value={form.student ?? ''} onChange={(e) => setForm({ ...form, student: e.target.value })} className={FIELD_INPUT_CLASS}>
                <option value="">— {isAr ? 'اختر طالباً' : 'Select student'} —</option>
                {(studentsRef ?? []).map((s) => (
                  <option key={s.name} value={s.name}>{s.student_id ? `[${s.student_id}] ` : ''}{s.full_name ?? s.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label={isAr ? 'الدورة' : 'Course'}>
              <select value={form.course ?? ''} onChange={(e) => setForm({ ...form, course: e.target.value })} className={FIELD_INPUT_CLASS}>
                <option value="">— {isAr ? 'اختر دورة' : 'Select course'} —</option>
                {(coursesRef ?? []).map((c) => (
                  <option key={c.name} value={c.name}>{c.course_code ? `[${c.course_code}] ` : ''}{c.title_ar ?? c.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label={isAr ? 'التسجيل' : 'Enrollment'}>
              <select value={form.enrollment ?? ''} onChange={(e) => setForm({ ...form, enrollment: e.target.value })} className={FIELD_INPUT_CLASS}>
                <option value="">— {isAr ? 'اختر تسجيلاً' : 'Select enrollment'} —</option>
                {(enrollmentsRef ?? [])
                  .filter((en) => !form.student || en.student === form.student)
                  .map((en) => <option key={en.name} value={en.name}>{en.name}</option>)}
              </select>
            </FormField>
            <FormField label={isAr ? 'المبلغ' : 'Amount'} required>
              <input type="number" step="0.01" min={0} required value={form.amount ?? ''} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'العملة' : 'Currency'}>
              <input value={form.currency ?? 'EGP'} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'تاريخ الدفع' : 'Payment date'}>
              <input type="date" value={form.payment_date ?? ''} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'وسيلة الدفع' : 'Method'}>
              <select value={form.method ?? ''} onChange={(e) => setForm({ ...form, method: e.target.value })} className={FIELD_INPUT_CLASS}>
                <option value="">—</option>
                {(modesOfPaymentRef ?? []).length > 0
                  ? (modesOfPaymentRef ?? []).map((m) => <option key={m.name} value={m.name}>{m.name}</option>)
                  : ['Cash', 'Bank Transfer', 'Card', 'Mobile Wallet', 'Other'].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </FormField>
            <FormField label={isAr ? 'رقم المرجع' : 'Reference No'}>
              <input value={form.reference_no ?? ''} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} dir="ltr" className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الحالة' : 'Status'}>
              <select value={form.status ?? 'Paid'} onChange={(e) => setForm({ ...form, status: e.target.value })} className={FIELD_INPUT_CLASS}>
                <option value="Paid">{isAr ? 'مدفوع' : 'Paid'}</option>
                <option value="Pending">{isAr ? 'معلق' : 'Pending'}</option>
                <option value="Refunded">{isAr ? 'مسترد' : 'Refunded'}</option>
                <option value="Failed">{isAr ? 'فشل' : 'Failed'}</option>
              </select>
            </FormField>
            <FormField label={isAr ? 'ملاحظات' : 'Notes'} span="full">
              <textarea rows={3} value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={FIELD_INPUT_CLASS} />
            </FormField>
          </div>
          {/* Accounting integration — only shown on create */}
          {!isEdit && (
            <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    {isAr ? 'الترحيل المحاسبي — ERPNext' : 'Post to Accounting (ERPNext)'}
                  </span>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={postToAccounting} onChange={(e) => setPostToAccounting(e.target.checked)} />
                  <span className="text-xs text-emerald-700 dark:text-emerald-400">{isAr ? 'إنشاء قيد دفع' : 'Create Payment Entry'}</span>
                </label>
              </div>
              {postToAccounting && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label={isAr ? 'حساب الإيداع (صندوق/بنك)' : 'Deposit Account (Cash/Bank)'}>
                    <select value={paidToAccount} onChange={(e) => setPaidToAccount(e.target.value)} className={FIELD_INPUT_CLASS}>
                      <option value="">— {isAr ? 'اختر حساباً' : 'Select account'} —</option>
                      {(bankCashAccountsRef ?? []).map((a) => (
                        <option key={a.name} value={a.name}>{a.name}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label={isAr ? 'الشركة' : 'Company'}>
                    <input value={globalDefaults?.default_company ?? ''} readOnly className={`${FIELD_INPUT_CLASS} opacity-70 cursor-default`} />
                  </FormField>
                  <p className="col-span-full text-xs text-emerald-700 dark:text-emerald-500">
                    {isAr
                      ? '* سيتم إنشاء قيد قبض (Receive) في ERPNext تلقائياً. في حالة فشل الترحيل سيتم حفظ سجل LMS بدون قيد.'
                      : '* A Receive Payment Entry will be auto-created in ERPNext. If accounting fails the LMS record is still saved.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  }

  const color = cfg.createForm === 'course' ? 'brand'
              : cfg.createForm === 'enrollment' ? 'emerald'
              : cfg.createForm === 'batch' ? 'violet'
              : cfg.createForm === 'payment' ? 'amber'
              : cfg.createForm === 'auto' ? 'cyan'
              : 'amber';

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
