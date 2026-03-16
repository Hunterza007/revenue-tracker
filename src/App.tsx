/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Upload,
  Calendar as CalendarIcon,
  Wallet,
  CreditCard,
  QrCode,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Table2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Database,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface RevenueRecord {
  id: string;
  day: number;
  cash: number;
  qr: number;
  credit: number;
}

interface GlassesRecord {
  id: string;
  day: number;
  glassesIn: number;
  glassesOut: number;
}

type RevenueByMonth = Record<string, RevenueRecord[]>;
type GlassesByMonth = Record<string, GlassesRecord[]>;

interface BackupData {
  version: number;
  exportedAt: string;
  revenue: RevenueByMonth;
  glasses: GlassesByMonth;
}

const REVENUE_STORAGE_KEY = 'revenue_records_by_month';
const GLASSES_STORAGE_KEY = 'glasses_records_by_month';

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

type ViewMode = 'daily' | 'summary';

export default function App() {
  const today = new Date();
  const initialMonth = today.getMonth() + 1;
  const initialYear = today.getFullYear() + 543;
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const [allRevenueRecords, setAllRevenueRecords] = useState<RevenueByMonth>(() => {
    const saved = localStorage.getItem(REVENUE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [allGlassesRecords, setAllGlassesRecords] = useState<GlassesByMonth>(() => {
    const saved = localStorage.getItem(GLASSES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');

  const [editingRevenueId, setEditingRevenueId] = useState<string | null>(null);
  const [revenueEntry, setRevenueEntry] = useState({
    day: today.getDate(),
    cash: '',
    qr: '',
    credit: '',
  });

  const [editingGlassesId, setEditingGlassesId] = useState<string | null>(null);
  const [glassesEntry, setGlassesEntry] = useState({
    day: today.getDate(),
    glassesIn: '',
    glassesOut: '',
  });

  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  const revenueRecords = allRevenueRecords[monthKey] || [];
  const glassesRecords = allGlassesRecords[monthKey] || [];

  useEffect(() => {
    try {
      localStorage.setItem(REVENUE_STORAGE_KEY, JSON.stringify(allRevenueRecords));
    } catch (error) {
      console.error(error);
      alert('ไม่สามารถบันทึกข้อมูลรายรับได้ อาจเกิดจากพื้นที่จัดเก็บเต็ม');
    }
  }, [allRevenueRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(GLASSES_STORAGE_KEY, JSON.stringify(allGlassesRecords));
    } catch (error) {
      console.error(error);
      alert('ไม่สามารถบันทึกข้อมูลแว่นได้ อาจเกิดจากพื้นที่จัดเก็บเต็ม');
    }
  }, [allGlassesRecords]);

  const sortedRevenueRecords = useMemo(() => {
    return [...revenueRecords].sort((a, b) => a.day - b.day);
  }, [revenueRecords]);

  const calculatedRevenueData = useMemo(() => {
    let cumulative = 0;

    return sortedRevenueRecords.map((record, index) => {
      const dailyTotal = record.cash + record.qr + record.credit;
      cumulative += dailyTotal;
      const average = cumulative / (index + 1);

      return {
        ...record,
        dailyTotal,
        cumulative,
        average,
      };
    });
  }, [sortedRevenueRecords]);

  const sortedGlassesRecords = useMemo(() => {
    return [...glassesRecords].sort((a, b) => a.day - b.day);
  }, [glassesRecords]);

  const calculatedGlassesData = useMemo(() => {
    let balance = 0;

    return sortedGlassesRecords.map((record) => {
      balance += record.glassesIn - record.glassesOut;
      return {
        ...record,
        balance,
      };
    });
  }, [sortedGlassesRecords]);

  const totalMonthly =
    calculatedRevenueData.length > 0
      ? calculatedRevenueData[calculatedRevenueData.length - 1].cumulative
      : 0;

  const overallAverage =
    calculatedRevenueData.length > 0
      ? calculatedRevenueData[calculatedRevenueData.length - 1].average
      : 0;

  const totalGlassesIn = glassesRecords.reduce((sum, r) => sum + (r.glassesIn || 0), 0);
  const totalGlassesOut = glassesRecords.reduce((sum, r) => sum + (r.glassesOut || 0), 0);

  const yearlySummary = useMemo(() => {
    return THAI_MONTHS.map((monthName, index) => {
      const monthNumber = index + 1;
      const key = `${year}-${String(monthNumber).padStart(2, '0')}`;

      const monthRevenueRecords = allRevenueRecords[key] || [];
      const monthGlassesRecords = allGlassesRecords[key] || [];

      const totalCash = monthRevenueRecords.reduce((sum, r) => sum + r.cash, 0);
      const totalQr = monthRevenueRecords.reduce((sum, r) => sum + r.qr, 0);
      const totalCredit = monthRevenueRecords.reduce((sum, r) => sum + r.credit, 0);
      const total = totalCash + totalQr + totalCredit;

      const totalGlassesInMonth = monthGlassesRecords.reduce(
        (sum, r) => sum + (r.glassesIn || 0),
        0
      );
      const totalGlassesOutMonth = monthGlassesRecords.reduce(
        (sum, r) => sum + (r.glassesOut || 0),
        0
      );

      const daysUsed = monthRevenueRecords.length;
      const avg = daysUsed > 0 ? total / daysUsed : 0;

      return {
        month: monthName,
        monthNumber,
        totalCash,
        totalQr,
        totalCredit,
        total,
        totalGlassesIn: totalGlassesInMonth,
        totalGlassesOut: totalGlassesOutMonth,
        daysUsed,
        avg,
      };
    });
  }, [allRevenueRecords, allGlassesRecords, year]);

  const yearlyTotal = yearlySummary.reduce((sum, m) => sum + m.total, 0);
  const yearlyCash = yearlySummary.reduce((sum, m) => sum + m.totalCash, 0);
  const yearlyQr = yearlySummary.reduce((sum, m) => sum + m.totalQr, 0);
  const yearlyCredit = yearlySummary.reduce((sum, m) => sum + m.totalCredit, 0);
  const yearlyGlassesIn = yearlySummary.reduce((sum, m) => sum + m.totalGlassesIn, 0);
  const yearlyGlassesOut = yearlySummary.reduce((sum, m) => sum + m.totalGlassesOut, 0);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const resetRevenueForm = () => {
    setEditingRevenueId(null);
    setRevenueEntry({
      day: 1,
      cash: '',
      qr: '',
      credit: '',
    });
  };

  const resetGlassesForm = () => {
    setEditingGlassesId(null);
    setGlassesEntry({
      day: 1,
      glassesIn: '',
      glassesOut: '',
    });
  };

  const updateCurrentMonthRevenueRecords = (
    updater: (prevMonthRecords: RevenueRecord[]) => RevenueRecord[]
  ) => {
    setAllRevenueRecords((prev) => {
      const currentMonthRecords = prev[monthKey] || [];
      return {
        ...prev,
        [monthKey]: updater(currentMonthRecords),
      };
    });
  };

  const updateCurrentMonthGlassesRecords = (
    updater: (prevMonthRecords: GlassesRecord[]) => GlassesRecord[]
  ) => {
    setAllGlassesRecords((prev) => {
      const currentMonthRecords = prev[monthKey] || [];
      return {
        ...prev,
        [monthKey]: updater(currentMonthRecords),
      };
    });
  };

  const addOrUpdateRevenueRecord = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      day: Number(revenueEntry.day),
      cash: Number(revenueEntry.cash) || 0,
      qr: Number(revenueEntry.qr) || 0,
      credit: Number(revenueEntry.credit) || 0,
    };

    if (!payload.day || payload.day < 1 || payload.day > 31) {
      alert('กรุณากรอกวันที่ 1 - 31');
      return;
    }

    if (editingRevenueId) {
      updateCurrentMonthRevenueRecords((prevMonthRecords) =>
        prevMonthRecords.map((record) =>
          record.id === editingRevenueId ? { ...record, ...payload } : record
        )
      );
      resetRevenueForm();
      return;
    }

    const duplicateDay = revenueRecords.some((r) => r.day === payload.day);
    if (duplicateDay) {
      alert('เดือนนี้มีข้อมูลรายรับของวันนี้แล้ว กรุณากดแก้ไขจากตาราง');
      return;
    }

    const newRecord: RevenueRecord = {
      id: crypto.randomUUID(),
      ...payload,
    };

    updateCurrentMonthRevenueRecords((prevMonthRecords) => [
      ...prevMonthRecords,
      newRecord,
    ]);

    setRevenueEntry({
      day: payload.day < 31 ? payload.day + 1 : 1,
      cash: '',
      qr: '',
      credit: '',
    });
  };

  const startEditRevenueRecord = (record: RevenueRecord) => {
    setEditingRevenueId(record.id);
    setRevenueEntry({
      day: record.day,
      cash: record.cash ? String(record.cash) : '',
      qr: record.qr ? String(record.qr) : '',
      credit: record.credit ? String(record.credit) : '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteRevenueRecord = (id: string) => {
    const target = revenueRecords.find((r) => r.id === id);
    if (!target) return;

    const ok = confirm(`ต้องการลบข้อมูลรายรับวันที่ ${target.day} ใช่หรือไม่?`);
    if (!ok) return;

    updateCurrentMonthRevenueRecords((prevMonthRecords) =>
      prevMonthRecords.filter((r) => r.id !== id)
    );

    if (editingRevenueId === id) {
      resetRevenueForm();
    }
  };

  const addOrUpdateGlassesRecord = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      day: Number(glassesEntry.day),
      glassesIn: Number(glassesEntry.glassesIn) || 0,
      glassesOut: Number(glassesEntry.glassesOut) || 0,
    };

    if (!payload.day || payload.day < 1 || payload.day > 31) {
      alert('กรุณากรอกวันที่ 1 - 31');
      return;
    }

    if (editingGlassesId) {
      updateCurrentMonthGlassesRecords((prevMonthRecords) =>
        prevMonthRecords.map((record) =>
          record.id === editingGlassesId ? { ...record, ...payload } : record
        )
      );
      resetGlassesForm();
      return;
    }

    const duplicateDay = glassesRecords.some((r) => r.day === payload.day);
    if (duplicateDay) {
      alert('เดือนนี้มีข้อมูลแว่นของวันนี้แล้ว กรุณากดแก้ไขจากตาราง');
      return;
    }

    const newRecord: GlassesRecord = {
      id: crypto.randomUUID(),
      ...payload,
    };

    updateCurrentMonthGlassesRecords((prevMonthRecords) => [
      ...prevMonthRecords,
      newRecord,
    ]);

    setGlassesEntry({
      day: payload.day < 31 ? payload.day + 1 : 1,
      glassesIn: '',
      glassesOut: '',
    });
  };

  const startEditGlassesRecord = (record: GlassesRecord) => {
    setEditingGlassesId(record.id);
    setGlassesEntry({
      day: record.day,
      glassesIn: record.glassesIn ? String(record.glassesIn) : '',
      glassesOut: record.glassesOut ? String(record.glassesOut) : '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteGlassesRecord = (id: string) => {
    const target = glassesRecords.find((r) => r.id === id);
    if (!target) return;

    const ok = confirm(`ต้องการลบข้อมูลแว่นวันที่ ${target.day} ใช่หรือไม่?`);
    if (!ok) return;

    updateCurrentMonthGlassesRecords((prevMonthRecords) =>
      prevMonthRecords.filter((r) => r.id !== id)
    );

    if (editingGlassesId === id) {
      resetGlassesForm();
    }
  };

  const clearCurrentMonth = () => {
    const ok = confirm(`ต้องการล้างข้อมูลทั้งหมดของ ${THAI_MONTHS[month - 1]} ${year} หรือไม่?`);
    if (!ok) return;

    setAllRevenueRecords((prev) => ({
      ...prev,
      [monthKey]: [],
    }));

    setAllGlassesRecords((prev) => ({
      ...prev,
      [monthKey]: [],
    }));

    resetRevenueForm();
    resetGlassesForm();
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    resetRevenueForm();
    resetGlassesForm();

    if (direction === 'prev') {
      if (month === 1) {
        setMonth(12);
        setYear((prev) => prev - 1);
      } else {
        setMonth((prev) => prev - 1);
      }
    } else {
      if (month === 12) {
        setMonth(1);
        setYear((prev) => prev + 1);
      } else {
        setMonth((prev) => prev + 1);
      }
    }
  };

  const exportRevenueCSV = () => {
    const csv = [
      ['วันที่', 'เงินสด', 'QR', 'เครดิต', 'รวมวัน', 'รวมเดือน', 'เฉลี่ย/วัน'],
      ...calculatedRevenueData.map((r) => [
        r.day,
        r.cash,
        r.qr,
        r.credit,
        r.dailyTotal,
        r.cumulative,
        Math.round(r.average),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `revenue_${year}_${String(month).padStart(2, '0')}.csv`;
    link.click();
  };

  const exportGlassesCSV = () => {
    const csv = [
      ['วันที่', 'แว่นเข้า', 'แว่นออก', 'คงเหลือสะสม'],
      ...calculatedGlassesData.map((r) => [r.day, r.glassesIn, r.glassesOut, r.balance]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `glasses_${year}_${String(month).padStart(2, '0')}.csv`;
    link.click();
  };

  const exportYearlySummaryCSV = () => {
    const csv = [
      ['เดือน', 'เงินสด', 'QR', 'เครดิต', 'แว่นเข้า', 'แว่นออก', 'รวมทั้งเดือน', 'จำนวนวันที่บันทึก', 'เฉลี่ยต่อวันที่บันทึก'],
      ...yearlySummary.map((r) => [
        r.month,
        r.totalCash,
        r.totalQr,
        r.totalCredit,
        r.totalGlassesIn,
        r.totalGlassesOut,
        r.total,
        r.daysUsed,
        Math.round(r.avg),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `revenue_summary_${year}.csv`;
    link.click();
  };

  const exportBackupJSON = () => {
    const backupData: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      revenue: allRevenueRecords,
      glasses: allGlassesRecords,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });

    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.download = `daily-ledger-backup-${dateStr}.json`;
    link.click();
  };

  const importBackupJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupData;

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('ไฟล์ไม่ถูกต้อง');
      }

      const revenue = parsed.revenue ?? {};
      const glasses = parsed.glasses ?? {};

      const ok = confirm('ต้องการนำเข้าข้อมูล backup นี้หรือไม่? ข้อมูลปัจจุบันจะถูกแทนที่ทั้งหมด');
      if (!ok) {
        event.target.value = '';
        return;
      }

      setAllRevenueRecords(revenue);
      setAllGlassesRecords(glasses);
      resetRevenueForm();
      resetGlassesForm();

      alert('นำเข้าข้อมูลสำเร็จ');
    } catch (error) {
      console.error(error);
      alert('ไม่สามารถนำเข้าไฟล์นี้ได้ กรุณาตรวจสอบว่าเป็นไฟล์ backup JSON ที่ถูกต้อง');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-serif italic mb-2">Revenue Tracker</h1>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} />
                  <span>
                    {year} / {THAI_MONTHS[month - 1]}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeMonth('prev')}
                    className="p-1 rounded-md hover:bg-black/5"
                    title="เดือนก่อน"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <select
                    value={month}
                    onChange={(e) => {
                      resetRevenueForm();
                      resetGlassesForm();
                      setMonth(Number(e.target.value));
                    }}
                    className="bg-white border border-black/10 rounded-lg px-2 py-1 text-xs"
                  >
                    {THAI_MONTHS.map((m, index) => (
                      <option key={m} value={index + 1}>
                        {m}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={year}
                    onChange={(e) => {
                      resetRevenueForm();
                      resetGlassesForm();
                      setYear(Number(e.target.value));
                    }}
                    className="bg-white border border-black/10 rounded-lg px-3 py-1 text-xs w-24"
                    placeholder="ปี"
                  />

                  <button
                    onClick={() => changeMonth('next')}
                    className="p-1 rounded-md hover:bg-black/5"
                    title="เดือนถัดไป"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                <p className="text-[10px] uppercase tracking-tighter text-gray-400 mb-1">
                  รวมเดือนนี้
                </p>
                <p className="text-2xl font-mono font-medium">
                  ฿{formatNumber(totalMonthly)}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                <p className="text-[10px] uppercase tracking-tighter text-gray-400 mb-1">
                  เฉลี่ยต่อวัน
                </p>
                <p className="text-2xl font-mono font-medium">
                  ฿{formatNumber(overallAverage)}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                <p className="text-[10px] uppercase tracking-tighter text-gray-400 mb-1 flex items-center gap-1">
                  <ArrowDownToLine size={12} /> แว่นเข้า
                </p>
                <p className="text-2xl font-mono font-medium">
                  {formatNumber(totalGlassesIn)}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                <p className="text-[10px] uppercase tracking-tighter text-gray-400 mb-1 flex items-center gap-1">
                  <ArrowUpFromLine size={12} /> แว่นออก
                </p>
                <p className="text-2xl font-mono font-medium">
                  {formatNumber(totalGlassesOut)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-xl border text-sm flex items-center gap-2 ${
                viewMode === 'daily'
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-white text-gray-700 border-black/10'
              }`}
            >
              <Table2 size={16} />
              บันทึกรายวัน
            </button>

            <button
              onClick={() => setViewMode('summary')}
              className={`px-4 py-2 rounded-xl border text-sm flex items-center gap-2 ${
                viewMode === 'summary'
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-white text-gray-700 border-black/10'
              }`}
            >
              <BarChart3 size={16} />
              สรุปทุกเดือน
            </button>

            <button
              onClick={exportBackupJSON}
              className="px-4 py-2 rounded-xl border text-sm flex items-center gap-2 bg-white text-gray-700 border-black/10 hover:bg-gray-50"
            >
              <Database size={16} />
              Backup JSON
            </button>

            <button
              onClick={() => backupInputRef.current?.click()}
              className="px-4 py-2 rounded-xl border text-sm flex items-center gap-2 bg-white text-gray-700 border-black/10 hover:bg-gray-50"
            >
              <Upload size={16} />
              Import JSON
            </button>

            <input
              ref={backupInputRef}
              type="file"
              accept=".json,application/json"
              onChange={importBackupJSON}
              className="hidden"
            />
          </div>
        </header>

        {viewMode === 'daily' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <section className="lg:col-span-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 sticky top-8">
                  <h2 className="text-xl font-serif italic mb-3 flex items-center gap-2">
                    {editingRevenueId ? <Pencil size={20} /> : <Plus size={20} />}
                    {editingRevenueId ? 'แก้ไขข้อมูลรายวัน' : 'เพิ่มข้อมูลรายวัน'}
                  </h2>

                  <p className="text-xs text-gray-400 mb-6">
                    เดือนที่กำลังใช้งาน: {THAI_MONTHS[month - 1]} {year}
                  </p>

                  <form onSubmit={addOrUpdateRevenueRecord} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                        วันที่
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={revenueEntry.day}
                        onChange={(e) =>
                          setRevenueEntry({ ...revenueEntry, day: Number(e.target.value) })
                        }
                        className="w-full bg-[#F5F5F0] border-none rounded-xl p-3 focus:ring-2 focus:ring-black/5 outline-none font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
                        <Wallet size={12} /> เงินสด
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={revenueEntry.cash}
                        onChange={(e) =>
                          setRevenueEntry({ ...revenueEntry, cash: e.target.value })
                        }
                        className="w-full bg-[#F5F5F0] border-none rounded-xl p-3 focus:ring-2 focus:ring-black/5 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
                        <QrCode size={12} /> QR Payment
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={revenueEntry.qr}
                        onChange={(e) =>
                          setRevenueEntry({ ...revenueEntry, qr: e.target.value })
                        }
                        className="w-full bg-[#F5F5F0] border-none rounded-xl p-3 focus:ring-2 focus:ring-black/5 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
                        <CreditCard size={12} /> เครดิต (CR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={revenueEntry.credit}
                        onChange={(e) =>
                          setRevenueEntry({ ...revenueEntry, credit: e.target.value })
                        }
                        className="w-full bg-[#F5F5F0] border-none rounded-xl p-3 focus:ring-2 focus:ring-black/5 outline-none font-mono"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-[#1A1A1A] text-white rounded-xl py-4 font-medium hover:bg-black transition-colors"
                      >
                        {editingRevenueId ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}
                      </button>

                      {editingRevenueId && (
                        <button
                          type="button"
                          onClick={resetRevenueForm}
                          className="px-4 rounded-xl border border-black/10 bg-white hover:bg-gray-50 transition-colors"
                          title="ยกเลิก"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </section>

              <section className="lg:col-span-8">
                <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5">
                            วันที่
                          </th>
                          <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5">
                            เงินสด
                          </th>
                          <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5">
                            QR
                          </th>
                          <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5">
                            เครดิต
                          </th>
                          <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5 bg-[#F9F9F7]">
                            รวมวัน
                          </th>
                          <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5 bg-[#F9F9F7]">
                            รวมเดือน
                          </th>
                          <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5 bg-[#F9F9F7]">
                            เฉลี่ย/วัน
                          </th>
                          <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5 text-right">
                            จัดการ
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        <AnimatePresence initial={false}>
                          {calculatedRevenueData.length === 0 ? (
                            <tr>
                              <td
                                colSpan={8}
                                className="p-12 text-center text-gray-400 italic font-serif"
                              >
                                ยังไม่มีข้อมูลรายรับสำหรับเดือนนี้
                              </td>
                            </tr>
                          ) : (
                            calculatedRevenueData.map((row) => (
                              <motion.tr
                                key={row.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`group transition-colors border-b border-black/5 last:border-0 hover:bg-[#F5F5F0]/50 ${
                                  editingRevenueId === row.id ? 'bg-amber-50' : ''
                                }`}
                              >
                                <td className="p-4 font-mono font-bold">{row.day}</td>
                                <td className="p-4 font-mono text-sm">
                                  {row.cash > 0 ? formatNumber(row.cash) : '-'}
                                </td>
                                <td className="p-4 font-mono text-sm">
                                  {row.qr > 0 ? formatNumber(row.qr) : '-'}
                                </td>
                                <td className="p-4 font-mono text-sm">
                                  {row.credit > 0 ? formatNumber(row.credit) : '-'}
                                </td>
                                <td className="p-4 font-mono font-medium bg-[#F9F9F7]/50">
                                  {formatNumber(row.dailyTotal)}
                                </td>
                                <td className="p-4 font-mono font-medium bg-[#F9F9F7]/50">
                                  {formatNumber(row.cumulative)}
                                </td>
                                <td className="p-4 font-mono font-medium bg-[#F9F9F7]/50 text-emerald-600">
                                  {formatNumber(Math.round(row.average))}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => startEditRevenueRecord(row)}
                                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                      title="แก้ไข"
                                    >
                                      <Pencil size={16} />
                                    </button>

                                    <button
                                      onClick={() => deleteRevenueRecord(row.id)}
                                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                      title="ลบ"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))
                          )}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-4 flex-wrap">
                  <button
                    onClick={exportRevenueCSV}
                    className="text-xs text-gray-600 hover:text-black transition-colors flex items-center gap-1"
                  >
                    <Download size={14} /> ส่งออก CSV รายรับ
                  </button>
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <section className="lg:col-span-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
                  <h2 className="text-xl font-serif italic mb-3 flex items-center gap-2">
                    {editingGlassesId ? <Pencil size={20} /> : <Plus size={20} />}
                    {editingGlassesId ? 'แก้ไขแว่นเข้า-ออก' : 'บันทึกแว่นเข้า-ออก'}
                  </h2>

                  <p className="text-xs text-gray-400 mb-6">
                    เดือนที่กำลังใช้งาน: {THAI_MONTHS[month - 1]} {year}
                  </p>

                  <form onSubmit={addOrUpdateGlassesRecord} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                        วันที่
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={glassesEntry.day}
                        onChange={(e) =>
                          setGlassesEntry({ ...glassesEntry, day: Number(e.target.value) })
                        }
                        className="w-full bg-[#F5F5F0] border-none rounded-xl p-3 focus:ring-2 focus:ring-black/5 outline-none font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
                        <ArrowDownToLine size={12} /> แว่นเข้า
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={glassesEntry.glassesIn}
                        onChange={(e) =>
                          setGlassesEntry({ ...glassesEntry, glassesIn: e.target.value })
                        }
                        className="w-full bg-[#F5F5F0] border-none rounded-xl p-3 focus:ring-2 focus:ring-black/5 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
                        <ArrowUpFromLine size={12} /> แว่นออก
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={glassesEntry.glassesOut}
                        onChange={(e) =>
                          setGlassesEntry({ ...glassesEntry, glassesOut: e.target.value })
                        }
                        className="w-full bg-[#F5F5F0] border-none rounded-xl p-3 focus:ring-2 focus:ring-black/5 outline-none font-mono"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-[#1A1A1A] text-white rounded-xl py-4 font-medium hover:bg-black transition-colors"
                      >
                        {editingGlassesId ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}
                      </button>

                      {editingGlassesId && (
                        <button
                          type="button"
                          onClick={resetGlassesForm}
                          className="px-4 rounded-xl border border-black/10 bg-white hover:bg-gray-50 transition-colors"
                          title="ยกเลิก"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </section>

              <section className="lg:col-span-8">
                <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5">
                            วันที่
                          </th>
                          <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5">
                            แว่นเข้า
                          </th>
                          <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5">
                            แว่นออก
                          </th>
                          <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5 bg-[#F9F9F7]">
                            คงเหลือสะสม
                          </th>
                          <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5 text-right">
                            จัดการ
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        <AnimatePresence initial={false}>
                          {calculatedGlassesData.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="p-12 text-center text-gray-400 italic font-serif"
                              >
                                ยังไม่มีข้อมูลแว่นสำหรับเดือนนี้
                              </td>
                            </tr>
                          ) : (
                            calculatedGlassesData.map((row) => (
                              <motion.tr
                                key={row.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`group transition-colors border-b border-black/5 last:border-0 hover:bg-[#F5F5F0]/50 ${
                                  editingGlassesId === row.id ? 'bg-amber-50' : ''
                                }`}
                              >
                                <td className="p-4 font-mono font-bold">{row.day}</td>
                                <td className="p-4 font-mono text-sm">
                                  {row.glassesIn > 0 ? formatNumber(row.glassesIn) : '-'}
                                </td>
                                <td className="p-4 font-mono text-sm">
                                  {row.glassesOut > 0 ? formatNumber(row.glassesOut) : '-'}
                                </td>
                                <td className="p-4 font-mono font-medium bg-[#F9F9F7]/50">
                                  {formatNumber(row.balance)}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => startEditGlassesRecord(row)}
                                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                      title="แก้ไข"
                                    >
                                      <Pencil size={16} />
                                    </button>

                                    <button
                                      onClick={() => deleteGlassesRecord(row.id)}
                                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                      title="ลบ"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))
                          )}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-4 flex-wrap">
                  <button
                    onClick={exportGlassesCSV}
                    className="text-xs text-gray-600 hover:text-black transition-colors flex items-center gap-1"
                  >
                    <Download size={14} /> ส่งออก CSV แว่นเข้า-ออก
                  </button>
                </div>
              </section>
            </div>

            <div className="flex justify-end">
              <button
                onClick={clearCurrentMonth}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <Trash2 size={14} /> ล้างข้อมูลเดือนนี้ทั้งหมด
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                  ยอดรวมทั้งปี
                </p>
                <p className="text-2xl font-mono">฿{formatNumber(yearlyTotal)}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                  เงินสดทั้งปี
                </p>
                <p className="text-2xl font-mono">฿{formatNumber(yearlyCash)}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                  QR ทั้งปี
                </p>
                <p className="text-2xl font-mono">฿{formatNumber(yearlyQr)}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                  เครดิตทั้งปี
                </p>
                <p className="text-2xl font-mono">฿{formatNumber(yearlyCredit)}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                  แว่นเข้าทั้งปี
                </p>
                <p className="text-2xl font-mono">{formatNumber(yearlyGlassesIn)}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                  แว่นออกทั้งปี
                </p>
                <p className="text-2xl font-mono">{formatNumber(yearlyGlassesOut)}</p>
              </div>
            </section>

            <section className="bg-white rounded-3xl shadow-sm border border-black/5 p-6">
              <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <h2 className="text-2xl font-serif italic">กราฟสรุปยอดรายเดือน</h2>
                  <p className="text-sm text-gray-400 mt-1">ดูแนวโน้มรายรับของแต่ละเดือนในปี {year}</p>
                </div>

                <button
                  onClick={exportYearlySummaryCSV}
                  className="text-xs text-gray-600 hover:text-black transition-colors flex items-center gap-1"
                >
                  <Download size={14} /> ส่งออกสรุปรายปี CSV
                </button>
              </div>

              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlySummary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                    <Tooltip
                      formatter={(value: number) => [`฿${formatNumber(value)}`, 'ยอดรวม']}
                      labelFormatter={(label) => `เดือน ${label}`}
                    />
                    <Bar dataKey="total" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
              <div className="p-6 border-b border-black/5">
                <h2 className="text-2xl font-serif italic">ตารางสรุปทุกเดือน</h2>
                <p className="text-sm text-gray-400 mt-1">
                  แสดงยอดรวมรายรับและจำนวนแว่นเข้า / ออก ของแต่ละเดือน
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5">
                        เดือน
                      </th>
                      <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5">
                        เงินสด
                      </th>
                      <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5">
                        QR
                      </th>
                      <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5">
                        เครดิต
                      </th>
                      <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5">
                        แว่นเข้า
                      </th>
                      <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5">
                        แว่นออก
                      </th>
                      <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5 bg-[#F9F9F7]">
                        รวมทั้งเดือน
                      </th>
                      <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5">
                        วันที่บันทึก
                      </th>
                      <th className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-black/5">
                        เฉลี่ย/วันที่บันทึก
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {yearlySummary.map((row) => (
                      <tr
                        key={row.monthNumber}
                        className={`border-b border-black/5 last:border-0 hover:bg-[#F5F5F0]/50 ${
                          row.monthNumber === month ? 'bg-amber-50/60' : ''
                        }`}
                      >
                        <td className="p-4 font-medium">{row.month}</td>
                        <td className="p-4 font-mono">{formatNumber(row.totalCash)}</td>
                        <td className="p-4 font-mono">{formatNumber(row.totalQr)}</td>
                        <td className="p-4 font-mono">{formatNumber(row.totalCredit)}</td>
                        <td className="p-4 font-mono">{formatNumber(row.totalGlassesIn)}</td>
                        <td className="p-4 font-mono">{formatNumber(row.totalGlassesOut)}</td>
                        <td className="p-4 font-mono font-semibold bg-[#F9F9F7]/50">
                          {formatNumber(row.total)}
                        </td>
                        <td className="p-4 font-mono">{row.daysUsed}</td>
                        <td className="p-4 font-mono text-emerald-600">
                          {formatNumber(Math.round(row.avg))}
                        </td>
                      </tr>
                    ))}

                    <tr className="bg-black/[0.03]">
                      <td className="p-4 font-bold">รวมทั้งปี</td>
                      <td className="p-4 font-mono font-bold">{formatNumber(yearlyCash)}</td>
                      <td className="p-4 font-mono font-bold">{formatNumber(yearlyQr)}</td>
                      <td className="p-4 font-mono font-bold">{formatNumber(yearlyCredit)}</td>
                      <td className="p-4 font-mono font-bold">{formatNumber(yearlyGlassesIn)}</td>
                      <td className="p-4 font-mono font-bold">{formatNumber(yearlyGlassesOut)}</td>
                      <td className="p-4 font-mono font-bold">{formatNumber(yearlyTotal)}</td>
                      <td className="p-4 font-mono">
                        {yearlySummary.reduce((sum, row) => sum + row.daysUsed, 0)}
                      </td>
                      <td className="p-4 font-mono">
                        {formatNumber(
                          Math.round(
                            yearlySummary.reduce((sum, row) => sum + row.daysUsed, 0) > 0
                              ? yearlyTotal /
                                  yearlySummary.reduce((sum, row) => sum + row.daysUsed, 0)
                              : 0
                          )
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>

      <footer className="mt-20 text-center border-t border-black/5 pt-8 pb-12">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">
          Daily Ledger System &copy; 2026
        </p>
      </footer>
    </div>
  );
}