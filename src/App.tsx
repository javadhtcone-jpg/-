/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Upload, 
  Smartphone, 
  Copy, 
  Check, 
  RefreshCw, 
  Search, 
  UserCheck, 
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Settings,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ContactItem {
  id: string;
  name: string;
  phone: string;
  cleanedPhone: string;
  isValid: boolean;
  selected: boolean;
}

export default function App() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [countryCode, setCountryCode] = useState<string>('+98');
  const [activeTab, setActiveTab] = useState<'add' | 'preview' | 'export'>('add');
  
  // Single contact form
  const [singleName, setSingleName] = useState('');
  const [singlePhone, setSinglePhone] = useState('');

  // Bulk input
  const [bulkText, setBulkText] = useState('');
  const [namePrefix, setNamePrefix] = useState('مخاطب');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'invalid'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  // Copied state
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Duplicate Report Modal State
  const [duplicateReport, setDuplicateReport] = useState<{ open: boolean; removed: Array<{ name: string; phone: string }> }>({ open: false, removed: [] });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to convert Persian/Arabic digits to English digits
  const normalizeDigits = (str: string): string => {
    const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let res = str;
    for (let i = 0; i < 10; i++) {
      res = res.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
    }
    return res;
  };

  // Format phone number with country code and remove leading 0
  const formatPhone = (inputPhone: string, code: string): { cleaned: string; isValid: boolean } => {
    let normalized = normalizeDigits(inputPhone).trim();
    // Keep only digits and leading plus
    let hasPlus = normalized.startsWith('+');
    let digitsOnly = normalized.replace(/\D/g, '');

    if (!digitsOnly) {
      return { cleaned: inputPhone, isValid: false };
    }

    // Handle standard Iranian numbers or general leading zero removal
    // If it starts with country code already (e.g. 989123456789 or +989123456789)
    if (code === '+98') {
      if (digitsOnly.startsWith('98') && digitsOnly.length === 12) {
        digitsOnly = digitsOnly.substring(2);
      } else if (digitsOnly.startsWith('098') && digitsOnly.length === 13) {
        digitsOnly = digitsOnly.substring(3);
      } else if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
        // Standard Iranian mobile 0912xxxxxxx -> 912xxxxxxx
        digitsOnly = digitsOnly.substring(1);
      } else if (digitsOnly.startsWith('0') && digitsOnly.length > 10) {
        digitsOnly = digitsOnly.substring(1);
      }
    } else {
      // General leading zero removal for other country codes
      if (digitsOnly.startsWith('0')) {
        digitsOnly = digitsOnly.substring(1);
      }
    }

    const cleaned = `${code}${digitsOnly}`;
    // Basic validation: code + at least 8-10 digits
    const isValid = digitsOnly.length >= 8 && digitsOnly.length <= 12;

    return { cleaned, isValid };
  };

  // Add single contact
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim() || !singlePhone.trim()) {
      showToast('لطفاً نام و شماره تلفن را وارد کنید.');
      return;
    }

    const { cleaned, isValid } = formatPhone(singlePhone, countryCode);
    const newContact: ContactItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: singleName.trim(),
      phone: singlePhone.trim(),
      cleanedPhone: cleaned,
      isValid,
      selected: true,
    };

    setContacts(prev => [newContact, ...prev]);
    setSingleName('');
    setSinglePhone('');
    showToast('مخاطب با موفقیت افزوده شد.');
    setActiveTab('preview');
  };

  // Process Bulk Text
  const handleBulkImport = () => {
    if (!bulkText.trim()) {
      showToast('لطفاً لیست مخاطبین را وارد کنید.');
      return;
    }

    const lines = bulkText.split('\n');
    let addedCount = 0;
    const newItems: ContactItem[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let name = '';
      let phone = '';

      const separators = [',', ':', '-', '\t', '|'];
      let matched = false;

      for (const sep of separators) {
        if (trimmed.includes(sep)) {
          const parts = trimmed.split(sep);
          if (parts.length >= 2) {
            const p1 = parts[0].trim();
            const p2 = parts[1].trim();
            if (/\d/.test(p2) && !/[آ-یa-zA-Z]{3,}/.test(p2)) {
              name = p1;
              phone = p2;
            } else if (/\d/.test(p1)) {
              name = p2;
              phone = p1;
            } else {
              name = p1;
              phone = p2;
            }
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        const words = trimmed.split(/\s+/);
        const lastWord = words[words.length - 1];
        if (/\d/.test(lastWord) && lastWord.replace(/\D/g, '').length >= 7) {
          phone = lastWord;
          name = words.slice(0, words.length - 1).join(' ');
        } else {
          phone = trimmed;
        }
      }

      if (!name) {
        name = `${namePrefix} ${contacts.length + addedCount + 1}`;
      }

      const { cleaned, isValid } = formatPhone(phone, countryCode);
      newItems.push({
        id: Math.random().toString(36).substring(2, 9) + index,
        name,
        phone,
        cleanedPhone: cleaned,
        isValid,
        selected: true,
      });
      addedCount++;
    });

    if (newItems.length > 0) {
      setContacts(prev => [...newItems, ...prev]);
      setBulkText('');
      showToast(`${addedCount} مخاطب با موفقیت پردازش و اضافه شد.`);
      setActiveTab('preview');
    } else {
      showToast('هیچ شماره معتبری یافت نشد.');
    }
  };

  // Upload and parse VCF File
  const handleVCFFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const vcards = content.split(/BEGIN:VCARD/i);
      const newItems: ContactItem[] = [];

      vcards.forEach((card, index) => {
        if (!card.includes('END:VCARD')) return;

        let name = '';
        let phone = '';

        const lines = card.split(/\r?\n/);
        lines.forEach(line => {
          const upperLine = line.toUpperCase();
          if (upperLine.startsWith('FN:')) {
            name = line.substring(3).trim();
          } else if (upperLine.startsWith('N:') && !name) {
            const parts = line.substring(2).split(';');
            const given = parts[1] || '';
            const family = parts[0] || '';
            name = `${given} ${family}`.trim();
          } else if (upperLine.startsWith('TEL')) {
            const colonIdx = line.indexOf(':');
            if (colonIdx !== -1) {
              phone = line.substring(colonIdx + 1).trim();
            }
          }
        });

        if (phone) {
          if (!name) {
            name = `مخاطب فایل ${index + 1}`;
          }
          const { cleaned, isValid } = formatPhone(phone, countryCode);
          newItems.push({
            id: 'vcf-file-' + Math.random().toString(36).substring(2, 9) + index,
            name,
            phone,
            cleanedPhone: cleaned,
            isValid,
            selected: true,
          });
        }
      });

      if (newItems.length > 0) {
        setContacts(prev => [...newItems, ...prev]);
        showToast(`${newItems.length} مخاطب از فایل VCF با موفقیت وارد شد.`);
        setActiveTab('preview');
      } else {
        showToast('مخاطب معتبری در فایل VCF یافت نشد.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Load sample Iranian contacts
  const loadSampleContacts = () => {
    const samples = [
      { name: 'علی رضایی', phone: '09123456789' },
      { name: 'سارا محمدی', phone: '09351122334' },
      { name: 'رضا کریمی', phone: '09198877665' },
      { name: 'مریم احمدی', phone: '09214433221' },
      { name: 'مهدی ناصری', phone: '09145566778' },
    ];

    const newItems: ContactItem[] = samples.map((s, idx) => {
      const { cleaned, isValid } = formatPhone(s.phone, countryCode);
      return {
        id: 'sample-' + idx + '-' + Math.random().toString(36).substring(2, 6),
        name: s.name,
        phone: s.phone,
        cleanedPhone: cleaned,
        isValid,
        selected: true,
      };
    });

    setContacts(prev => [...newItems, ...prev]);
    showToast('مخاطبین نمونه بارگذاری شدند.');
    setActiveTab('preview');
  };

  // Delete contact
  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    showToast('مخاطب حذف شد.');
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  // Select all / Deselect all
  const handleSelectAll = (select: boolean) => {
    setContacts(prev => prev.map(c => ({ ...c, selected: select })));
  };

  // Delete selected
  const handleDeleteSelected = () => {
    setContacts(prev => prev.filter(c => !c.selected));
    showToast('مخاطبین انتخاب شده حذف شدند.');
  };

  // Remove duplicates based on core digits (ignoring leading 0 and +98)
  const handleRemoveDuplicates = () => {
    if (contacts.length === 0) {
      showToast('لیست مخاطبین خالی است.');
      return;
    }

    const seenMap = new Map<string, ContactItem>();
    const removedLog: Array<{ name: string; phone: string }> = [];

    const getCoreDigits = (phoneStr: string) => {
      let digits = normalizeDigits(phoneStr).replace(/\D/g, '');
      if (digits.startsWith('98') && digits.length === 12) {
        digits = digits.substring(2);
      } else if (digits.startsWith('098') && digits.length === 13) {
        digits = digits.substring(3);
      } else if (digits.startsWith('0') && digits.length === 11) {
        digits = digits.substring(1);
      } else if (digits.startsWith('0') && digits.length > 10) {
        digits = digits.substring(1);
      }
      return digits;
    };

    contacts.forEach(c => {
      const core = getCoreDigits(c.phone);
      if (!core) {
        seenMap.set(c.id, c);
        return;
      }

      if (seenMap.has(core)) {
        const existing = seenMap.get(core)!;
        const existingHas98 = existing.phone.includes('+98') || existing.cleanedPhone.includes('+98');
        const currentHas98 = c.phone.includes('+98') || c.cleanedPhone.includes('+98');

        if (currentHas98 && !existingHas98) {
          seenMap.set(core, c);
          removedLog.push({ name: existing.name, phone: existing.phone });
        } else {
          removedLog.push({ name: c.name, phone: c.phone });
        }
      } else {
        seenMap.set(core, c);
      }
    });

    const uniqueContacts = Array.from(seenMap.values());
    setContacts(uniqueContacts);

    if (removedLog.length > 0) {
      setDuplicateReport({ open: true, removed: removedLog });
    } else {
      showToast('هیچ شماره تکراری در لیست یافت نشد.');
    }

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Clear all
  const handleClearAll = () => {
    if (window.confirm('آیا از حذف تمام مخاطبین مطمئن هستید؟')) {
      setContacts([]);
      showToast('تمام مخاطبین پاک شدند.');
    }
  };

  // Filtered contacts for preview table
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.phone.includes(searchQuery) || 
                            c.cleanedPhone.includes(searchQuery);
      if (filterStatus === 'valid') return matchesSearch && c.isValid;
      if (filterStatus === 'invalid') return matchesSearch && !c.isValid;
      return matchesSearch;
    });
  }, [contacts, searchQuery, filterStatus]);

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage) || 1;
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredContacts.slice(start, start + itemsPerPage);
  }, [filteredContacts, currentPage, itemsPerPage]);

  // Download CSV File
  const handleDownloadCSV = () => {
    const selectedContacts = contacts.filter(c => c.selected && c.isValid);
    if (selectedContacts.length === 0) {
      showToast('هیچ مخاطب معتبر و انتخاب‌شده‌ای برای خروجی CSV وجود ندارد.');
      return;
    }

    let csvContent = '\uFEFFName,Original Phone,Cleaned Phone\n';
    selectedContacts.forEach(c => {
      const safeName = `"${c.name.replace(/"/g, '""')}"`;
      csvContent += `${safeName},"${c.phone}","${c.cleanedPhone}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `contacts_${countryCode.replace('+', '')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 }
    });

    showToast(`فایل CSV با موفقیت دانلود شد (${selectedContacts.length} مخاطب).`);
  };

  // Generate VCF Content
  const generateVCFContent = (): string => {
    const selectedContacts = contacts.filter(c => c.selected && c.isValid);
    let vcfString = '';

    selectedContacts.forEach(c => {
      vcfString += 'BEGIN:VCARD\n';
      vcfString += 'VERSION:3.0\n';
      // Escape special characters in name if needed
      vcfString += `FN:${c.name}\n`;
      vcfString += `N:;${c.name};;;\n`;
      vcfString += `TEL;TYPE=CELL:${c.cleanedPhone}\n`;
      vcfString += 'END:VCARD\n';
    });

    return vcfString;
  };

  // Download VCF File
  const handleDownloadVCF = () => {
    const selectedCount = contacts.filter(c => c.selected && c.isValid).length;
    if (selectedCount === 0) {
      showToast('هیچ مخاطب معتبر و انتخاب‌شده‌ای برای دانلود وجود ندارد.');
      return;
    }

    const vcfData = generateVCFContent();
    const blob = new Blob([vcfData], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `contacts_${countryCode.replace('+', '')}_${Date.now()}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    showToast(`فایل VCF با موفقیت دانلود شد (${selectedCount} مخاطب).`);
  };

  // Copy VCF to clipboard
  const handleCopyVCF = () => {
    const vcfData = generateVCFContent();
    if (!vcfData) {
      showToast('مخاطبی برای کپی کردن وجود ندارد.');
      return;
    }
    navigator.clipboard.writeText(vcfData);
    setCopied(true);
    showToast('متن VCF در کلیپ‌بورد کپی شد.');
    setTimeout(() => setCopied(false), 2500);
  };

  // Direct Device Contacts Import using Contacts API if available
  const handleDirectDeviceImport = async () => {
    if (window.self !== window.top) {
      showToast('دسترسی به مخاطبین گوشی در محیط پیش‌نمایش (iframe) توسط مرورگر مسدود است. لطفاً فایل VCF را دانلود کنید.');
      return;
    }

    if (!('contacts' in navigator && 'select' in (navigator as any).contacts)) {
      showToast('مرورگر شما از افزودن مستقیم به مخاطبین پشتیبانی نمی‌کند. لطفاً فایل VCF را دانلود کنید.');
      return;
    }

    try {
      const props = ['name', 'tel'];
      const opts = { multiple: true };
      const selectedContacts = await (navigator as any).contacts.select(props, opts);

      if (selectedContacts && selectedContacts.length > 0) {
        const newItems: ContactItem[] = [];
        selectedContacts.forEach((sc: any, idx: number) => {
          const name = sc.name && sc.name[0] ? sc.name[0] : `مخاطب گوشی ${idx + 1}`;
          const rawPhone = sc.tel && sc.tel[0] ? sc.tel[0] : '';
          if (rawPhone) {
            const { cleaned, isValid } = formatPhone(rawPhone, countryCode);
            newItems.push({
              id: 'device-' + Math.random().toString(36).substring(2, 9),
              name,
              phone: rawPhone,
              cleanedPhone: cleaned,
              isValid,
              selected: true,
            });
          }
        });

        if (newItems.length > 0) {
          setContacts(prev => [...newItems, ...prev]);
          showToast(`${newItems.length} مخاطب از گوشی شما وارد شد.`);
          setActiveTab('preview');
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.name === 'InvalidStateError' || err.message?.includes('top frame')) {
        showToast('مرورگر اجازه دسترسی به مخاطبین را در این صفحه نمی‌دهد. لطفاً از فایل VCF استفاده کنید.');
      } else {
        showToast('خطا در دسترسی به مخاطبین گوشی.');
      }
    }
  };

  const stats = useMemo(() => {
    const total = contacts.length;
    const valid = contacts.filter(c => c.isValid).length;
    const selected = contacts.filter(c => c.selected && c.isValid).length;
    return { total, valid, selected };
  }, [contacts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 font-sans pb-16" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-indigo-900/50 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                مبدل و پاکساز شماره به VCF
              </h1>
              <p className="text-xs text-indigo-300/80">
                اصلاح خودکار صفر اول، افزودن پیش‌شماره {countryCode} و خروجی استاندارد مخاطبین
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/90 border border-indigo-500/30 rounded-xl px-3 py-1.5 shadow-inner">
              <Settings className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-slate-300">پیش‌شماره:</span>
              <select 
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-slate-900 text-indigo-300 text-xs font-bold rounded-lg px-2 py-1 outline-none border border-indigo-500/20 cursor-pointer"
              >
                <option value="+98">ایران (+98)</option>
                <option value="+1">آمریکا (+1)</option>
                <option value="+44">انگلستان (+44)</option>
                <option value="+49">آلمان (+49)</option>
                <option value="+971">امارات (+971)</option>
                <option value="+90">ترکیه (+90)</option>
              </select>
            </div>

            {contacts.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium px-3 py-2 rounded-xl transition-all"
                title="پاکسازی همه"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">حذف همه</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-2 mb-8 bg-slate-800/60 p-1.5 rounded-2xl border border-indigo-900/40 max-w-xl mx-auto shadow-lg">
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'add'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Plus className="w-4 h-4" />
            افزودن و ورود اطلاعات
          </button>
          
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all relative ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-4 h-4" />
            پیش‌نمایش و لیست
            {contacts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
                {contacts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'export'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Download className="w-4 h-4" />
            خروجی VCF
          </button>
        </div>

        {/* TAB 1: ADD & IMPORT */}
        {activeTab === 'add' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
            {/* Bulk Paste Card */}
            <div className="bg-slate-800/50 backdrop-blur border border-indigo-900/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <span>ورود گروهی (کپی و پیست لیست)</span>
                  </div>
                  <button
                    onClick={loadSampleContacts}
                    className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-xl border border-indigo-500/30 transition-all flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    بارگذاری نمونه
                  </button>
                </div>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  لیست مخاطبین خود (نام و شماره) را از اکسل، واتساپ، تلگرام یا متن در زیر کپی کنید. برنامه‌ به طور هوشمند نام و شماره‌ها را جدا کرده و صفر اول را اصلاح می‌کند.
                </p>

                <div className="mb-4">
                  <label className="block text-xs text-slate-300 mb-1">پیشوند نام پیش‌فرض (اگر نامی وارد نشده بود):</label>
                  <input
                    type="text"
                    value={namePrefix}
                    onChange={(e) => setNamePrefix(e.target.value)}
                    className="w-full bg-slate-900/90 border border-indigo-900/50 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all"
                    placeholder="مثلا: مشتری"
                  />
                </div>

                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="مثال:&#10;علی رضایی 09123456789&#10;سارا محمدی, 09351122334&#10;09198877665 (بدون نام)"
                  className="w-full bg-slate-900/90 border border-indigo-900/50 rounded-2xl p-4 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-all font-mono leading-relaxed resize-none"
                />
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <label className="w-full sm:w-auto bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-3 rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2 border border-slate-600/50 shadow-md">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>انتخاب فایل VCF از دستگاه</span>
                  <input
                    type="file"
                    accept=".vcf,.vcard,.txt"
                    onChange={handleVCFFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleBulkImport}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  پردازش و افزودن لیست
                </button>
              </div>
            </div>

            {/* Single Contact & Direct Contacts */}
            <div className="flex flex-col gap-6">
              {/* Single Contact Form */}
              <div className="bg-slate-800/50 backdrop-blur border border-indigo-900/50 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm mb-4">
                  <Plus className="w-5 h-5 text-indigo-400" />
                  <span>افزودن تک مخاطب</span>
                </div>

                <form onSubmit={handleAddSingle} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1.5">نام و نام خانوادگی</label>
                    <input
                      type="text"
                      value={singleName}
                      onChange={(e) => setSingleName(e.target.value)}
                      placeholder="مثلا: علی رضایی"
                      className="w-full bg-slate-900/90 border border-indigo-900/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1.5">شماره تلفن (با صفر یا بدون صفر)</label>
                    <input
                      type="text"
                      value={singlePhone}
                      onChange={(e) => setSinglePhone(e.target.value)}
                      placeholder="مثلا: 09123456789"
                      className="w-full bg-slate-900/90 border border-indigo-900/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن به لیست
                  </button>
                </form>
              </div>

              {/* Direct Device Contacts Access */}
              {window.self === window.top && 'contacts' in navigator && 'select' in (navigator as any).contacts && (
                <div className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-indigo-500/30 rounded-3xl p-6 shadow-xl flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-400" />
                      وارد کردن از مخاطبین گوشی
                    </h3>
                    <p className="text-xs text-indigo-200/80">
                      مستقیماً از دفترچه تلفن گوشی خود مخاطبین را انتخاب و اصلاح کنید.
                    </p>
                  </div>
                  <button
                    onClick={handleDirectDeviceImport}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-lg transition-all whitespace-nowrap flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    انتخاب از گوشی
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PREVIEW & MANAGEMENT */}
        {activeTab === 'preview' && (
          <div className="bg-slate-800/50 backdrop-blur border border-indigo-900/50 rounded-3xl p-6 shadow-xl animate-fadeIn">
            {/* Top Bar Stats & Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b border-indigo-900/50">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="bg-slate-900/80 border border-indigo-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-slate-300">کل مخاطبین:</span>
                  <span className="text-sm font-bold text-white">{stats.total}</span>
                </div>

                <div className="bg-emerald-950/40 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-300">معتبر ({countryCode}):</span>
                  <span className="text-sm font-bold text-emerald-200">{stats.valid}</span>
                </div>

                <div className="bg-indigo-950/40 border border-indigo-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-indigo-300">آماده خروجی:</span>
                  <span className="text-sm font-bold text-indigo-200">{stats.selected}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleSelectAll(true)}
                  className="flex-1 md:flex-initial text-xs bg-slate-700/80 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl transition-all font-medium"
                >
                  انتخاب همه
                </button>
                <button
                  onClick={() => handleSelectAll(false)}
                  className="flex-1 md:flex-initial text-xs bg-slate-700/80 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl transition-all font-medium"
                >
                  لغو انتخاب
                </button>
                <button
                  onClick={handleRemoveDuplicates}
                  className="flex-1 md:flex-initial text-xs bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 px-3 py-2 rounded-xl transition-all font-medium flex items-center justify-center gap-1 cursor-pointer"
                  title="حذف شماره‌های تکراری با حفظ شماره دارای +98"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  حذف تکراری‌ها
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="flex-1 md:flex-initial text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-3 py-2 rounded-xl transition-all font-medium flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف انتخاب‌شده‌ها
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو بر اساس نام یا شماره..."
                  className="w-full bg-slate-900/90 border border-indigo-900/50 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 hover:text-white'}`}
                >
                  همه ({contacts.length})
                </button>
                <button
                  onClick={() => setFilterStatus('valid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterStatus === 'valid' ? 'bg-emerald-600 text-white' : 'bg-slate-900/60 text-slate-400 hover:text-white'}`}
                >
                  معتبر
                </button>
                <button
                  onClick={() => setFilterStatus('invalid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterStatus === 'invalid' ? 'bg-rose-600 text-white' : 'bg-slate-900/60 text-slate-400 hover:text-white'}`}
                >
                  مشکوک / نامعتبر
                </button>
              </div>
            </div>

            {/* Contacts Table */}
            {filteredContacts.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">مخاطبی یافت نشد.</p>
                <button
                  onClick={() => setActiveTab('add')}
                  className="mt-4 text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium shadow-md hover:bg-indigo-500 transition-all"
                >
                  افزودن مخاطب جدید
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-2xl border border-indigo-900/40">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900/80 text-indigo-300 uppercase font-semibold">
                      <tr>
                        <th className="p-3.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={filteredContacts.length > 0 && filteredContacts.every(c => c.selected)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setContacts(prev => prev.map(c => {
                                const match = filteredContacts.find(fc => fc.id === c.id);
                                return match ? { ...c, selected: checked } : c;
                              }));
                            }}
                            className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </th>
                        <th className="p-3.5">نام مخاطب</th>
                        <th className="p-3.5">شماره اولیه</th>
                        <th className="p-3.5">شماره اصلاح‌شده ({countryCode})</th>
                        <th className="p-3.5 text-center">وضعیت</th>
                        <th className="p-3.5 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-950/50 bg-slate-900/40 font-mono">
                      {paginatedContacts.map((c, index) => (
                        <tr key={c.id} className="hover:bg-indigo-950/20 transition-all">
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={c.selected}
                              onChange={() => handleToggleSelect(c.id)}
                              className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3.5 font-sans font-medium text-slate-200">
                            {c.name}
                          </td>
                          <td className="p-3.5 text-slate-400">
                            {c.phone}
                          </td>
                          <td className="p-3.5 text-indigo-300 font-bold">
                            {c.cleanedPhone}
                          </td>
                          <td className="p-3.5 text-center">
                            {c.isValid ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold">
                                <CheckCircle2 className="w-3 h-3" />
                                معتبر
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold">
                                <AlertCircle className="w-3 h-3" />
                                بررسی شود
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleDeleteContact(c.id)}
                              className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-indigo-950/50">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>نمایش</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-slate-900 text-indigo-300 font-bold px-2 py-1 rounded-lg border border-indigo-900 outline-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>مخاطب در صفحه (مجموع فیلتر شده: {filteredContacts.length})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 disabled:opacity-40 text-xs text-slate-300 border border-indigo-900/40 transition-all cursor-pointer"
                    >
                      قبلی
                    </button>
                    <span className="text-xs text-indigo-300 font-bold px-3 py-1.5 bg-indigo-950/50 rounded-xl border border-indigo-900/40">
                      صفحه {currentPage} از {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 disabled:opacity-40 text-xs text-slate-300 border border-indigo-900/40 transition-all cursor-pointer"
                    >
                      بعدی
                    </button>
                  </div>
                </div>
              </>
            )}

            {contacts.length > 0 && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setActiveTab('export')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  ادامه به مرحله خروجی VCF ({stats.selected} مخاطب آماده)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXPORT VCF */}
        {activeTab === 'export' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* VCF Download Card */}
            <div className="bg-slate-800/50 backdrop-blur border border-indigo-900/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm mb-4">
                  <Download className="w-5 h-5 text-indigo-400" />
                  <span>دانلود فایل مخاطبین (VCF)</span>
                </div>

                <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                  فایل خروجی با پسوند <code className="bg-indigo-950 px-2 py-0.5 rounded text-indigo-300 font-mono">.vcf</code> ساخته می‌شود که سازگار با تمامی گوشی‌های اندروید، آیفون (iOS)، واتساپ و گوگل کنتکتز است. با یک تپ روی فایل دانلود شده، تمام مخاطبین به گوشی شما اضافه می‌شوند.
                </p>

                <div className="bg-slate-900/80 border border-indigo-900/50 rounded-2xl p-4 mb-6 space-y-3 font-sans">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">تعداد کل مخاطبین آماده:</span>
                    <span className="text-white font-bold">{stats.selected} عدد</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">پیش‌شماره اعمال شده:</span>
                    <span className="text-indigo-400 font-bold">{countryCode}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">فرمت استاندارد:</span>
                    <span className="text-emerald-400 font-bold">vCard v3.0 (UTF-8)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDownloadVCF}
                  disabled={stats.selected === 0}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-sm font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  دانلود فایل VCF ({stats.selected} مخاطب)
                </button>

                <button
                  onClick={handleDownloadCSV}
                  disabled={stats.selected === 0}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-sm font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  دانلود فایل CSV / اکسل ({stats.selected} مخاطب)
                </button>

                <button
                  onClick={handleCopyVCF}
                  disabled={stats.selected === 0}
                  className="w-full bg-slate-700/80 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'کپی شد!' : 'کپی متن VCF در کلیپ‌بورد'}
                </button>
              </div>
            </div>

            {/* Guide & Instructions Card */}
            <div className="bg-slate-800/50 backdrop-blur border border-indigo-900/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm mb-4">
                  <HelpCircle className="w-5 h-5 text-indigo-400" />
                  <span>راهنمای وارد کردن در گوشی</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-300 leading-relaxed list-disc list-inside">
                  <li>
                    <strong className="text-white">اندروید (Android):</strong> پس از دانلود فایل VCF، روی آن در بخش دانلودها ضربه بزنید و گزینه Contacts (مخاطبین) را انتخاب کنید تا همه مخاطبین ذخیره شوند.
                  </li>
                  <li>
                    <strong className="text-white">آیفون (iPhone / iOS):</strong> فایل VCF دانلود شده را لمس کنید یا از طریق پیام‌رسان (مثل تلگرام یا ایتا) برای خود بفرستید و روی آن بزنید تا گزینه Add All Contacts نمایش داده شود.
                  </li>
                  <li>
                    <strong className="text-white">گوگل جیمیل (Google Contacts):</strong> به سایت contacts.google.com بروید و از منوی Import فایل VCF را آپلود کنید.
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-6 border-t border-indigo-900/50 flex items-center justify-between text-[11px] text-slate-400">
                <span>امنیت کامل (پردازش ۱۰۰٪ لوکال در مرورگر)</span>
                <span className="text-emerald-400 font-semibold">بدون نیاز به سرور</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Duplicate Removal Report Modal */}
      {duplicateReport.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-indigo-950">
              <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-violet-400" />
                <span>گزارش حذف مخاطبین تکراری</span>
              </div>
              <button
                onClick={() => setDuplicateReport({ open: false, removed: [] })}
                className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1 rounded-xl bg-slate-800 cursor-pointer"
              >
                ✕ بستن
              </button>
            </div>

            <div className="mb-4 bg-violet-950/35 border border-violet-500/30 rounded-2xl p-4 text-xs text-violet-200">
              <p className="font-semibold mb-1">
                تعداد کل موارد تکراری شناسایی و حذف‌شده: <span className="text-white font-bold">{duplicateReport.removed.length}</span> مخاطب
              </p>
              <p className="text-[11px] text-violet-300/80 leading-relaxed">
                شماره‌های تکراری بر اساس بخش اصلی شماره (بدون صفر اول و پیش‌شماره) شناسایی شدند و شماره‌های دارای پیش‌شماره +98 در اولویت حفظ قرار گرفتند.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {duplicateReport.removed.map((item, idx) => (
                <div key={idx} className="bg-slate-800/80 border border-indigo-950 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                  <span className="font-sans font-medium text-slate-200">{item.name}</span>
                  <span className="text-rose-400">{item.phone}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-indigo-950 flex justify-end">
              <button
                onClick={() => setDuplicateReport({ open: false, removed: [] })}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow transition-all cursor-pointer"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
