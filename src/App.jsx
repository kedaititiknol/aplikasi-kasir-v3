import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  fetchAllData, 
  sendTransaction, 
  saveProductToSheet, 
  deleteProductFromSheet, 
  saveExpenseToSheet 
} from './services/api';

import Pengaturan from './components/Pengaturan';

const defaultUsers = [
  { id: 1, name: 'Administrator', username: 'admin', password: 'admin', role: 'admin' },
  { id: 2, name: 'Kasir Utama', username: 'kasir', password: 'kasir', role: 'kasir' }
];

const defaultSettings = {
  storeName: 'KEDAI TITIK NOL',
  address: 'Jl. Blok Gantar, RT/RW 01/01, Desa Gantar',
  phone: '0823-1598-9130',
  receiptFooter: 'Terima Kasih Atas Kunjungan Anda!'
};

const initialCategories = [
  { id: 'ALL', name: 'Semua Kategori' },
  { id: 1, name: 'Kopi' },
  { id: 2, name: 'Non-Kopi' },
  { id: 3, name: 'Makanan' },
  { id: 4, name: 'Snack' }
];

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(number) || 0);
};

const formatDate = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? String(isoString) : date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const saveSettingsToSheet = async (settingsData) => {
  try {
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxlHJz6aHc_iSfTWslxM4ttpbJtY_CZg1zDNJV_DF9Po9pH105tybvFr3BsUJp3wuai/exec"; 
    
    const payload = {
      action: 'saveSettings',
      ...settingsData
    };
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Gagal sinkronisasi pengaturan:", error);
    throw error;
  }
};

const saveShiftToSheets = async (actionType, shiftData) => {
  try {
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxlHJz6aHc_iSfTWslxM4ttpbJtY_CZg1zDNJV_DF9Po9pH105tybvFr3BsUJp3wuai/exec"; 
    
    const payload = {
      action: actionType,
      ...shiftData
    };
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Gagal sinkronisasi shift:", error);
    throw error;
  }
};

const Icon = ({ name, className = "w-5 h-5" }) => {
  const icons = {
    dashboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
    pos: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
    product: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
    history: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    expense: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
    report: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 00-2 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    settings: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    plus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />,
    minus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />,
    print: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />,
    edit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    logout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
    user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    alert: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    sync: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
    menu: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />,
    barcode: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />,
    download: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
    bluetooth: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l5-5m0 0l5 5m-5-5v12m0-12l4-4m-4 4L7 4" />,
    cashDrawer: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
    reset: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  };
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {icons[name] || null}
    </svg>
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  const [toast, setToast] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tn_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('tn_users');
      return saved ? JSON.parse(saved) : defaultUsers;
    } catch {
      return defaultUsers;
    }
  });

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('tn_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [categories] = useState(initialCategories);

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('tn_expenses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('tn_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [currentShift, setCurrentShift] = useState(() => {
    try {
      const saved = localStorage.getItem('tn_current_shift');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [initialCashInput, setInitialCashInput] = useState('');
  const [actualCashInput, setActualCashInput] = useState('');
  const [shiftHistory, setShiftHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('tn_shift_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportPaymentMethod, setReportPaymentMethod] = useState('ALL');
  const [reportSearch, setReportSearch] = useState('');

  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [payAmount, setPayAmount] = useState('');
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState({ name: '', categoryId: 1, stock: 0, costPrice: 0, sellPrice: 0 });

  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [expenseFormData, setExpenseFormData] = useState({ description: '', amount: '' });

  // --- FUNGSI RESET CACHE LOKAL KHUSUS ADMIN ---
  const handleLocalReset = () => {
    if (window.confirm('Yakin ingin membersihkan seluruh cache lokal dan menyelaraskan ulang dengan Google Sheets?')) {
      localStorage.removeItem('tn_transactions');
      localStorage.removeItem('tn_shift_history');
      localStorage.removeItem('tn_expenses');
      localStorage.removeItem('tn_products');
      localStorage.removeItem('tn_data_version');
      showToast('Cache lokal berhasil dibersihkan. Memuat ulang data...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  function handleLogin(e) {
    e.preventDefault();
    const inputUsername = loginForm.username.trim().toLowerCase();
    const inputPassword = loginForm.password.trim();

    const foundUser = users.find(
      u => String(u.username).trim().toLowerCase() === inputUsername && 
           String(u.password).trim() === inputPassword
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      localStorage.setItem('tn_user', JSON.stringify(foundUser));
      setLoginForm({ username: '', password: '' });
      showToast(`Selamat datang, ${foundUser.name}!`, 'success');
    } else {
      showToast('Username atau password salah!', 'error');
    }
  }

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const queueOfflineAction = (actionType, payload) => {
    const currentQueue = JSON.parse(localStorage.getItem('tn_offline_queue') || '[]');
    
    // Ambil ID unik universal dari payload (bisa id, id_transaksi, id_shift, dll)
    const payloadId = payload?.id || payload?.id_transaksi || payload?.id_shift || payload?.idShift;

    let filteredQueue = currentQueue;

    // Untuk aksi saveProduct atau editProduct, cegah duplikasi berdasarkan ID produk
    if (actionType === 'saveProduct' || actionType === 'editProduct') {
      filteredQueue = currentQueue.filter(item => {
        const itemId = item.payload?.id;
        return !( (item.action === 'saveProduct' || item.action === 'editProduct') && itemId === payloadId );
      });
    } 
    // Untuk transaksi atau pengeluaran, pastikan ID yang sama tidak berbaris-baris
    else if (actionType === 'sendTransaction' || actionType === 'saveExpense') {
      filteredQueue = currentQueue.filter(item => {
        const itemId = item.payload?.id;
        return !( item.action === actionType && itemId === payloadId );
      });
    }
    // Untuk shift
    else if (actionType === 'openShift' || actionType === 'closeShift') {
      filteredQueue = currentQueue.filter(item => {
        const itemId = item.payload?.id_shift || item.payload?.idShift;
        return !( (item.action === 'openShift' || item.action === 'closeShift') && itemId === payloadId );
      });
    }

    filteredQueue.push({ action: actionType, payload, timestamp: Date.now() });
    localStorage.setItem('tn_offline_queue', JSON.stringify(filteredQueue));
  };

  const isProcessingQueueRef = useRef(false);

  const processOfflineQueue = useCallback(async () => {
    if (!navigator.onLine || isProcessingQueueRef.current) return;
    isProcessingQueueRef.current = true;

    const queue = JSON.parse(localStorage.getItem('tn_offline_queue') || '[]');
    if (queue.length === 0) {
      isProcessingQueueRef.current = false;
      return;
    }

    // Kosongkan antrean sementara untuk mencegah pembacaan paralel
    localStorage.setItem('tn_offline_queue', JSON.stringify([]));

    const remainingQueue = [];

    for (const item of queue) {
      try {
        if (item.action === 'sendTransaction') {
          // Cek apakah transaksi dengan ID ini sudah ada di state transactions online/lokal utama
          const exists = transactions.some(t => t.id === item.payload.id);
          if (!exists) {
            await sendTransaction(item.payload);
          }
        } else if (item.action === 'saveExpense') {
          const exists = expenses.some(e => e.id === item.payload.id);
          if (!exists) {
            await saveExpenseToSheet(item.payload);
          }
        } else if (item.action === 'saveProduct' || item.action === 'editProduct') {
          await saveProductToSheet(item.payload);
        } else if (item.action === 'openShift' || item.action === 'closeShift') {
          const shiftId = item.payload.id_shift || item.payload.idShift;
          const exists = shiftHistory.some(s => (s.idShift || s.id_shift) === shiftId);
          // Kirim hanya jika belum ada di riwayat shift server/lokal yang sudah tertutup
          if (!exists || item.action === 'openShift') {
            await saveShiftToSheets(item.action, item.payload);
          }
        } else if (item.action === 'saveSettings') {
          await saveSettingsToSheet(item.payload);
        }
      } catch (error) {
        console.error("Gagal mengirim antrean offline:", error);
        remainingQueue.push(item);
      }
    }

    if (remainingQueue.length > 0) {
      const currentQueue = JSON.parse(localStorage.getItem('tn_offline_queue') || '[]');
      localStorage.setItem('tn_offline_queue', JSON.stringify([...remainingQueue, ...currentQueue]));
    } else {
      showToast('Antrean data berhasil disinkronkan tanpa duplikasi!', 'success');
      loadSheetData(false);
      fetchShiftFromSheets();
    }

    isProcessingQueueRef.current = false;
  }, [transactions, expenses, shiftHistory, showToast, loadSheetData, fetchShiftFromSheets]);

  const fetchShiftFromSheets = useCallback(async () => {
    try {
      const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxlHJz6aHc_iSfTWslxM4ttpbJtY_CZg1zDNJV_DF9Po9pH105tybvFr3BsUJp3wuai/exec"; 
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getShiftData`);
      const result = await response.json();
      
      if (result && result.status === 'success' && Array.isArray(result.data)) {
        const mappedHistory = result.data.map(s => ({
          idShift: s.idShift || s.id_shift,
          kasir: s.kasir || s.nama_kasir,
          waktuBuka: s.waktuBuka || s.waktu_buka,
          waktuTutup: s.waktuTutup || s.waktu_tutup,
          modalAwal: Number(s.modalAwal || s.modal_awal || 0),
          totalTunai: Number(s.totalTunai || s.total_tunai || 0),
          totalNonTunai: Number(s.totalNonTunai || s.total_nontunai || 0),
          uangAktual: Number(s.uangAktual || s.uang_aktual || 0),
          selisih: Number(s.selisih || s.variance || 0),
          status: s.status || 'CLOSED'
        })).sort((a, b) => new Date(b.waktuTutup || 0) - new Date(a.waktuTutup || 0));

        setShiftHistory(mappedHistory);
        localStorage.setItem('tn_shift_history', JSON.stringify(mappedHistory));
      }
    } catch (error) {
      console.error("Gagal menarik data shift dari Google Sheets:", error);
    }
  }, []);

  const loadSheetData = useCallback(async (showLoadingState = false) => {
    if (isSyncingRef.current && !showLoadingState) return;
    isSyncingRef.current = true;
    if (showLoadingState) setIsSyncing(true);

    try {
      const data = await fetchAllData();
      if (data) {
        const serverVersion = String(data.version || data.dataVersion || '1.0');
        const localVersion = localStorage.getItem('tn_data_version');

        if (localVersion !== serverVersion) {
          console.log("Versi data atau struktur server berubah. Membersihkan cache lokal lama...");
          localStorage.removeItem('tn_transactions');
          localStorage.removeItem('tn_shift_history');
          localStorage.removeItem('tn_expenses');
          localStorage.setItem('tn_data_version', serverVersion);
          
          setTransactions([]);
          setShiftHistory([]);
          setExpenses([]);
        }

        if (Array.isArray(data.produk)) {
          const mappedProducts = data.produk.map((p, idx) => ({
            id: p?.id ? String(p.id) : `PROD-${idx + 1}`,
            name: String(p?.nama_produk || p?.name || `Produk ${idx + 1}`),
            stock: Number(p?.stok ?? p?.stock ?? 0),
            costPrice: Number(p?.harga_beli ?? p?.costPrice ?? 0),
            sellPrice: Number(p?.harga_jual ?? p?.sellPrice ?? 0),
            categoryId: Number(p?.kategori ?? p?.categoryId ?? 1)
          }));
          setProducts(mappedProducts);
          localStorage.setItem('tn_products', JSON.stringify(mappedProducts));
        }

        if (Array.isArray(data.users) && data.users.length > 0) {
          const mappedUsers = data.users.map((u, idx) => ({
            id: u?.id || idx + 1,
            name: String(u?.nama || u?.name || u?.username || 'User'),
            username: String(u?.username || u?.user || '').trim(),
            password: String(u?.password || u?.pass || '').trim(),
            role: String(u?.role || 'kasir').toLowerCase()
          }));
          setUsers(mappedUsers);
          localStorage.setItem('tn_users', JSON.stringify(mappedUsers));
        }

        if (data.settings) {
          const fetchedSettings = {
            storeName: data.settings.storeName || data.settings.namaToko || defaultSettings.storeName,
            address: data.settings.address || data.settings.alamat || defaultSettings.address,
            phone: data.settings.phone || data.settings.telepon || defaultSettings.phone,
            receiptFooter: data.settings.receiptFooter || data.settings.footer || defaultSettings.receiptFooter
          };
          setSettings(fetchedSettings);
          localStorage.setItem('pos_settings', JSON.stringify(fetchedSettings));
        }

        const offlineQueue = JSON.parse(localStorage.getItem('tn_offline_queue') || '[]');
        const pendingExpenses = offlineQueue
          .filter(q => q.action === 'saveExpense')
          .map(q => q.payload);

        if (Array.isArray(data.expenses)) {
          const mappedExpenses = data.expenses.map((e, idx) => ({
            id: e?.id ? String(e.id) : `EXP-${idx + 1}`,
            date: e?.tanggal || e?.date || new Date().toISOString(),
            kategori: String(e?.kategori || e?.keterangan || e?.description || 'Pengeluaran'),
            description: String(e?.kategori || e?.keterangan || e?.description || 'Pengeluaran'),
            amount: Number(e?.nominal ?? e?.amount ?? 0)
          }));

          const mergedExpenses = [...pendingExpenses, ...mappedExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
          setExpenses(mergedExpenses);
          localStorage.setItem('tn_expenses', JSON.stringify(mergedExpenses));
        }

        const pendingTransactions = offlineQueue
          .filter(q => q.action === 'sendTransaction')
          .map(q => q.payload);

        if (Array.isArray(data.transactions)) {
          const mappedTransactions = data.transactions.map((t, idx) => {
            let parsedItems = t?.items;
            if (typeof parsedItems === 'string') {
              try { parsedItems = JSON.parse(parsedItems); } catch (e) { parsedItems = []; }
            }
            if (Array.isArray(parsedItems)) {
              parsedItems = parsedItems.map(item => {
                let parsedItem = typeof item === 'string' ? JSON.parse(item) : item;
                
                if (!parsedItem.costPrice || parsedItem.costPrice === 0) {
                  const matchedProd = products.find(p => p.id === parsedItem.productId || p.name === parsedItem.name);
                  parsedItem.costPrice = matchedProd ? matchedProd.costPrice : 0;
                }
                return parsedItem;
              });
            } else {
              parsedItems = [];
            }

            return {
              id: t?.id_transaksi || t?.id || `TRX-${idx + 1}`,
              date: t?.tanggal || t?.date || new Date().toISOString(),
              cashier: t?.kasir || t?.cashier || 'Kasir',
              paymentMethod: t?.metode_bayar || t?.paymentMethod || 'Tunai',
              total: Number(t?.total) || 0,
              payment: Number(t?.bayar || t?.payment || t?.total) || 0,
              change: Number(t?.kembali || t?.change) || 0,
              items: parsedItems
            };
          });

          const mergedTransactions = [...pendingTransactions, ...mappedTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
          setTransactions(mergedTransactions);
          localStorage.setItem('tn_transactions', JSON.stringify(mergedTransactions));
        }
      }
    } catch (error) {
      console.error("Gagal memuat data dari Google Sheets:", error);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
      setLoading(false);
    }
  }, [products]);

  useEffect(() => {
    fetchShiftFromSheets();
    loadSheetData(true);
    
    if (navigator.onLine) {
      processOfflineQueue();
    }

    const interval = setInterval(() => {
      if (navigator.onLine) {
        processOfflineQueue();
        loadSheetData(false);
      }
    }, 20000);

    const handleOnline = () => {
      showToast('Koneksi internet kembali aktif! Memproses antrean data...', 'info');
      processOfflineQueue().then(() => {
        loadSheetData(false);
      });
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
  }, [loadSheetData, showToast, fetchShiftFromSheets, processOfflineQueue]);

  const handleLogout = () => {
    if (window.confirm('Yakin ingin keluar aplikasi?')) {
      setCurrentUser(null);
      localStorage.removeItem('tn_user');
      setCart([]);
      showToast('Berhasil keluar sesi.', 'info');
    }
  };

  const handleOpenShift = async (e) => {
    e.preventDefault();
    const amount = parseFloat(initialCashInput) || 0;
    const shiftId = `SHIFT-${Date.now().toString().slice(-6)}`;
    const currentTime = new Date().toISOString();
    const cashierName = currentUser?.name || 'Kasir';

    const newShift = {
      id_shift: shiftId,
      idShift: shiftId,
      isOpen: true,
      startTime: currentTime,
      waktu_buka: currentTime,
      initialCash: amount,
      modal_awal: amount,
      cashier: cashierName,
      kasir: cashierName,
      totalTunai: 0,
      totalNonTunai: 0,
      status: 'OPEN'
    };

    setCurrentShift(newShift);
    localStorage.setItem('tn_current_shift', JSON.stringify(newShift));
    setInitialCashInput('');

    const payloadShift = {
      id_shift: shiftId,
      nama_kasir: cashierName,
      modal_awal: amount,
      waktu_buka: currentTime
    };

    try {
      if (navigator.onLine) {
        await saveShiftToSheets('openShift', payloadShift);
        showToast('Shift kasir berhasil dibuka & disinkronkan!', 'success');
      } else {
        queueOfflineAction('openShift', payloadShift);
        showToast('Offline: Shift dibuka lokal & akan disinkronkan saat online.', 'info');
      }
    } catch (err) {
      queueOfflineAction('openShift', payloadShift);
      showToast('Koneksi terganggu, pembukaan shift masuk antrean sync.', 'info');
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    const actualAmount = parseFloat(actualCashInput) || 0;
    const expectedCash = (currentShift?.initialCash || currentShift?.modal_awal || 0) + (currentShift?.totalTunai || 0);
    const variance = actualAmount - expectedCash;
    const closeTime = new Date().toISOString();

    const closedShift = {
      ...currentShift,
      endTime: closeTime,
      waktu_tutup: closeTime,
      expectedCash: expectedCash,
      actualCash: actualAmount,
      uang_aktual: actualAmount,
      variance: variance,
      selisih: variance,
      totalTransactions: shiftTransactions.length,
      cashSales: currentShift?.totalTunai || 0,
      status: 'CLOSED'
    };

    const updatedHistory = [closedShift, ...shiftHistory];
    setShiftHistory(updatedHistory);
    localStorage.setItem('tn_shift_history', JSON.stringify(updatedHistory));

    const payloadClose = {
      id_shift: currentShift?.id_shift || currentShift?.idShift,
      waktu_tutup: closeTime,
      total_tunai: currentShift?.totalTunai || 0,
      total_nontunai: currentShift?.totalNonTunai || 0,
      uang_aktual: actualAmount,
      selisih: variance
    };

    try {
      if (navigator.onLine) {
        await saveShiftToSheets('closeShift', payloadClose);
        showToast(`Shift ditutup & disinkronkan. Selisih kas: ${formatRupiah(variance)}`, variance === 0 ? 'success' : 'info');
      } else {
        queueOfflineAction('closeShift', payloadClose);
        showToast(`Offline: Shift ditutup lokal. Selisih kas: ${formatRupiah(variance)}`, 'info');
      }
    } catch (err) {
      queueOfflineAction('closeShift', payloadClose);
      showToast('Koneksi terganggu, penutupan shift masuk antrean sync.', 'info');
    }

    setCurrentShift(null);
    localStorage.removeItem('tn_current_shift');
    setActualCashInput('');
  };

  const shiftTransactions = useMemo(() => {
    if (!currentShift) return [];
    const shiftStartTime = new Date(currentShift.startTime || currentShift.waktu_buka).getTime();
    return transactions.filter(t => new Date(t.date).getTime() >= shiftStartTime);
  }, [transactions, currentShift]);

  const shiftCashSales = useMemo(() => {
    return shiftTransactions
      .filter(t => String(t.paymentMethod).toLowerCase() === 'tunai')
      .reduce((sum, t) => sum + (t.total || 0), 0);
  }, [shiftTransactions]);

  const expectedCashInDrawer = useMemo(() => {
    const initial = Number(currentShift?.initialCash || currentShift?.modal_awal || 0);
    return initial + shiftCashSales;
  }, [currentShift, shiftCashSales]);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      showToast('Stok produk habis!', 'error');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stock) {
          showToast('Stok tidak mencukupi!', 'error');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1, notes: '' }];
    });
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const foundProduct = products.find(p => String(p.id).toLowerCase() === code.toLowerCase() || String(p.name).toLowerCase() === code.toLowerCase());
    
    if (foundProduct) {
      addToCart(foundProduct);
      setBarcodeInput('');
    } else {
      showToast(`Produk dengan kode/ID "${code}" tidak ditemukan!`, 'error');
      setBarcodeInput('');
    }
  };

  const updateCartQty = useCallback((id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        const product = products.find(p => p.id === id);
        if (product && newQty > product.stock) {
          showToast('Stok tidak mencukupi!', 'error');
          return item;
        }
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  }, [products, showToast]);

  const updateCartItemNotes = useCallback((id, notes) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, notes } : item));
  }, []);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.sellPrice * item.qty), 0), [cart]);
  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

  const processPayment = async () => {
    const payNum = parseFloat(payAmount) || 0;
    if (paymentMethod === 'Tunai' && payNum < cartTotal) {
      showToast('Uang pembayaran kurang!', 'error');
      return;
    }

    const change = paymentMethod === 'Tunai' ? payNum - cartTotal : 0;
    const newTrx = {
      id: `TRX-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      items: cart.map(i => ({ 
        productId: i.id, 
        name: i.name, 
        qty: i.qty, 
        price: i.sellPrice, 
        costPrice: i.costPrice || 0,
        subtotal: i.sellPrice * i.qty,
        notes: i.notes || '' 
      })),
      total: cartTotal,
      payment: paymentMethod === 'Tunai' ? payNum : cartTotal,
      change: change,
      cashier: currentUser?.name || 'Kasir',
      paymentMethod,
      id_shift: currentShift?.id_shift || currentShift?.idShift || ''
    };

    const updatedProducts = products.map(prod => {
      const cartItem = cart.find(c => c.id === prod.id);
      return cartItem ? { ...prod, stock: prod.stock - cartItem.qty } : prod;
    });

    setProducts(updatedProducts);
    localStorage.setItem('tn_products', JSON.stringify(updatedProducts));

    const updatedTransactions = [newTrx, ...transactions];
    setTransactions(updatedTransactions);
    localStorage.setItem('tn_transactions', JSON.stringify(updatedTransactions));

    if (currentShift) {
      const isTunai = String(paymentMethod).toLowerCase() === 'tunai';
      const updatedShift = {
        ...currentShift,
        totalTunai: isTunai ? (currentShift.totalTunai || 0) + cartTotal : (currentShift.totalTunai || 0),
        totalNonTunai: !isTunai ? (currentShift.totalNonTunai || 0) + cartTotal : (currentShift.totalNonTunai || 0)
      };
      setCurrentShift(updatedShift);
      localStorage.setItem('tn_current_shift', JSON.stringify(updatedShift));
    }

    try {
      if (navigator.onLine) {
        await sendTransaction(newTrx);
        showToast('Transaksi berhasil disimpan & disinkronkan!', 'success');
      } else {
        queueOfflineAction('sendTransaction', newTrx);
        showToast('Offline: Transaksi tersimpan lokal & akan dikirim saat online.', 'info');
      }
    } catch (err) {
      queueOfflineAction('sendTransaction', newTrx);
      showToast('Koneksi terganggu, transaksi masuk antrean sinkronisasi.', 'info');
    }

    setLastTransaction(newTrx);
    setCart([]);
    setPayAmount('');
    setPaymentModalOpen(false);
    setMobileCartOpen(false);
    setReceiptModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const isEdit = !!editingProduct;
    
    const productData = {
      id: isEdit ? editingProduct.id : `PROD-${Date.now()}`,
      name: String(productFormData.name || 'Produk Tanpa Nama'),
      categoryId: Number(productFormData.categoryId || 1),
      stock: Number(productFormData.stock || 0),
      costPrice: Number(productFormData.costPrice || 0),
      sellPrice: Number(productFormData.sellPrice || 0),
      actionType: isEdit ? 'editProduct' : 'saveProduct'
    };

    setProducts(prev => {
      const updated = isEdit 
        ? prev.map(p => p.id === productData.id ? productData : p) 
        : [...prev, productData];
      localStorage.setItem('tn_products', JSON.stringify(updated));
      return updated;
    });

    try {
      if (navigator.onLine) {
        await saveProductToSheet(productData);
        showToast(isEdit ? 'Produk berhasil diperbarui & disinkronkan!' : 'Produk berhasil disimpan & disinkronkan!', 'success');
      } else {
        queueOfflineAction(productData.actionType, productData);
        showToast('Offline: Perubahan produk disimpan lokal & akan disinkronkan saat online.', 'info');
      }
    } catch (err) {
      queueOfflineAction(productData.actionType, productData);
      showToast('Koneksi terganggu, perubahan produk masuk antrean sync.', 'info');
    }

    setProductFormOpen(false);
    setEditingProduct(null);
    setProductFormData({ name: '', categoryId: 1, stock: 0, costPrice: 0, sellPrice: 0 });
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('Yakin ingin menghapus produk ini?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
      deleteProductFromSheet(id);
      showToast('Produk berhasil dihapus.', 'info');
    }
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const currentTime = new Date().toISOString();
    const expDescription = String(expenseFormData.description || 'Pengeluaran');
    const expAmount = Number(expenseFormData.amount || 0);

    const newExp = {
      id: `EXP-${Date.now()}`,
      date: currentTime,
      tanggal: currentTime,
      kategori: expDescription,
      description: expDescription,
      amount: expAmount,
      nominal: expAmount
    };

    setExpenses(prev => {
      const updated = [newExp, ...prev];
      localStorage.setItem('tn_expenses', JSON.stringify(updated));
      return updated;
    });

    try {
      if (navigator.onLine) {
        await saveExpenseToSheet(newExp);
        showToast('Pengeluaran berhasil dicatat & disinkronkan!', 'success');
      } else {
        queueOfflineAction('saveExpense', newExp);
        showToast('Offline: Pengeluaran dicatat lokal & akan dikirim saat online.', 'info');
      }
    } catch (err) {
      queueOfflineAction('saveExpense', newExp);
      showToast('Koneksi terganggu, pengeluaran masuk antrean sinkronisasi.', 'info');
    }

    setExpenseFormOpen(false);
    setExpenseFormData({ description: '', amount: '' });
  };

  const exportReportToExcel = () => {
    if (filteredReportTransactions.length === 0) {
      showToast('Tidak ada data laporan untuk diexport!', 'error');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,ID Transaksi,Tanggal,Kasir,Metode Pembayaran,Total,Item Terjual\r\n";
    
    filteredReportTransactions.forEach(t => {
      const itemsStr = (t.items || []).map(i => `${i.name} (x${i.qty})${i.notes ? ` [Catatan: ${i.notes}]` : ''}`).join('; ');
      const row = [t.id, formatDate(t.date), `"${t.cashier}"`, t.paymentMethod, t.total, `"${itemsStr}"`];
      csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Keuangan_${reportStartDate || 'ALL'}_to_${reportEndDate || 'ALL'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan berhasil diexport ke CSV.', 'success');
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => {
      const matchCat = selectedCategory === 'ALL' || p.categoryId === Number(selectedCategory);
      const prodName = String(p.name).toLowerCase();
      const matchSearch = prodName.includes(q);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const filteredHistory = useMemo(() => {
    const q = historySearch.toLowerCase().trim();
    return transactions.filter(t => {
      const trxId = String(t.id).toLowerCase();
      const cashierName = String(t.cashier).toLowerCase();
      return trxId.includes(q) || cashierName.includes(q);
    });
  }, [transactions, historySearch]);

  const filteredReportTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = (t.date || '').slice(0, 10);
      const matchStart = reportStartDate ? tDate >= reportStartDate : true;
      const matchEnd = reportEndDate ? tDate <= reportEndDate : true;
      const matchMethod = reportPaymentMethod === 'ALL' || t.paymentMethod === reportPaymentMethod;
      const q = reportSearch.toLowerCase().trim();
      const matchSearch = !q || String(t.id).toLowerCase().includes(q) || String(t.cashier).toLowerCase().includes(q);
      return matchStart && matchEnd && matchMethod && matchSearch;
    });
  }, [transactions, reportStartDate, reportEndDate, reportPaymentMethod, reportSearch]);

  const filteredReportRevenue = useMemo(() => {
    return filteredReportTransactions.reduce((s, t) => s + (t.total || 0), 0);
  }, [filteredReportTransactions]);

  const totalCostOfGoods = useMemo(() => {
    return filteredReportTransactions.reduce((sum, t) => {
      const itemsHpp = (t.items || []).reduce((itemSum, i) => itemSum + ((i.costPrice || 0) * i.qty), 0);
      return sum + itemsHpp;
    }, 0);
  }, [filteredReportTransactions]);

  const grossProfit = filteredReportRevenue - totalCostOfGoods;
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + (e.amount || 0), 0), [expenses]);
  const netProfit = grossProfit - totalExpenses;

  const todayStr = new Date().toISOString().slice(0, 10);

  const todayTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      const trxDate = String(t.date).slice(0, 10);
      return trxDate === todayStr;
    });
  }, [transactions, todayStr]);

  const todayRevenue = useMemo(() => {
    return todayTransactions.reduce((s, t) => s + (Number(t.total) || 0), 0);
  }, [todayTransactions]);

  const lowStockProducts = useMemo(() => products.filter(p => p.stock < 10), [products]);

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      
      const dayTotal = transactions
        .filter(t => {
          if (!t.date) return false;
          return String(t.date).slice(0, 10) === dateStr;
        })
        .reduce((sum, t) => sum + (Number(t.total) || 0), 0);
        
      days.push({ label, total: dayTotal });
    }
    return days;
  }, [transactions]);

  const maxChartValue = Math.max(...chartData.map(d => d.total), 100000);

  const allNavigationItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['admin'] },
    { id: 'pos', label: 'Kasir / POS', icon: 'pos', roles: ['admin', 'kasir'] },
    { id: 'shift', label: 'Shift & Kasir', icon: 'cashDrawer', roles: ['admin', 'kasir'] },
    { id: 'history', label: 'Riwayat', icon: 'history', roles: ['admin', 'kasir'] },
    { id: 'products', label: 'Produk', icon: 'product', roles: ['admin'] },
    { id: 'expenses', label: 'Pengeluaran', icon: 'expense', roles: ['admin'] },
    { id: 'reports', label: 'Laporan & Laba Rugi', icon: 'report', roles: ['admin'] },
    { id: 'settings', label: 'Pengaturan', icon: 'settings', roles: ['admin'] },
  ].filter(item => item.roles.includes(currentUser?.role)), [currentUser?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium tracking-wide text-stone-300">Memuat seluruh data dari Google Sheets...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4 relative">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-white text-xs font-semibold flex items-center gap-2 transition-all transform duration-300 ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
            <span>{toast.message}</span>
          </div>
        )}
        <div className="bg-stone-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-stone-800 transition-all duration-300">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white tracking-wider uppercase">{settings.storeName}</h1>
            <p className="text-sm text-stone-400 mt-1">POS & System Management Login</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-300 uppercase">Username</label>
              <input
                type="text"
                placeholder="Username..."
                required
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full mt-1 px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 placeholder-stone-500 focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm transition"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-300 uppercase">Password</label>
              <input
                type="password"
                placeholder="Password..."
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full mt-1 px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 placeholder-stone-500 focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm transition"
              />
            </div>
            <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg transition duration-200 mt-2 text-sm">
              Masuk Aplikasi
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-stone-900 text-stone-100 overflow-hidden font-sans relative selection:bg-amber-500 selection:text-white">
      
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-white text-xs font-semibold flex items-center gap-2 transition-all transform duration-300 animate-bounce ${toast.type === 'error' ? 'bg-red-600' : toast.type === 'info' ? 'bg-stone-800 border border-stone-700' : 'bg-emerald-600'}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER MOBILE */}
      <header className="md:hidden bg-stone-950 text-white p-3 flex justify-between items-center border-b border-stone-800 flex-shrink-0 z-30 print:hidden">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-400 transition"
            title="Buka Menu"
          >
            <Icon name="menu" className="w-5 h-5" />
          </button>
          <div className="overflow-hidden">
            <h1 className="text-sm font-extrabold tracking-wider text-amber-400 uppercase truncate max-w-[150px]">{settings.storeName}</h1>
            <p className="text-[10px] text-stone-400 capitalize">{currentUser.role} • {currentUser.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { loadSheetData(true); showToast('Menyinkronkan data...', 'info'); }} 
            title="Sinkronkan Data Manual"
            className={`p-2 rounded-lg bg-stone-900 hover:bg-amber-700 transition ${isSyncing ? 'animate-spin text-amber-400' : 'text-stone-300'}`}
          >
            <Icon name="sync" className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 bg-stone-900 hover:bg-red-700 text-stone-300 hover:text-white rounded-lg transition"
            title="Keluar"
          >
            <Icon name="logout" className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MOBILE SLIDE-OVER DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-start">
          <div className="bg-stone-950 w-72 h-full flex flex-col justify-between shadow-2xl border-r border-stone-800 animate-slideRight">
            <div>
              <div className="p-5 border-b border-stone-800 flex justify-between items-center">
                <div className="overflow-hidden">
                  <h1 className="text-base font-extrabold tracking-wider text-amber-400 uppercase truncate">{settings.storeName}</h1>
                  <p className="text-[10px] text-stone-400 mt-0.5">Google Sheets Terhubung</p>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-stone-400 hover:text-white font-bold text-xl"
                >
                  &times;
                </button>
              </div>
              <nav className="p-4 space-y-1.5">
                {allNavigationItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm ${
                      activeTab === item.id ? 'bg-amber-600 text-white shadow-md' : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                    }`}
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-4 border-t border-stone-800 space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  <Icon name="user" className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-stone-100 truncate">{currentUser.name}</p>
                  <p className="text-xs text-amber-400 capitalize">{currentUser.role}</p>
                </div>
              </div>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLocalReset();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-950/60 hover:bg-amber-900 text-amber-300 rounded-xl text-xs font-semibold transition duration-200 border border-amber-900/50"
                >
                  <Icon name="reset" className="w-4 h-4" /> Reset Cache Lokal
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-900 hover:bg-red-700 text-stone-300 hover:text-white rounded-xl text-xs font-semibold transition duration-200 border border-stone-800"
              >
                <Icon name="logout" className="w-4 h-4" /> Keluar Sesi
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* DESKTOP ASIDE SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-stone-950 text-stone-100 flex-shrink-0 flex-col justify-between shadow-xl print:hidden border-r border-stone-800/80">
        <div>
          <div className="p-5 text-center border-b border-stone-800 flex justify-between items-center">
            <div className="text-left overflow-hidden">
              <h1 className="text-base font-extrabold tracking-wider text-amber-400 uppercase truncate">{settings.storeName}</h1>
              <p className="text-[10px] text-stone-400 mt-0.5">Google Sheets Terhubung</p>
            </div>
            <button 
              onClick={() => { loadSheetData(true); showToast('Menyinkronkan data...', 'info'); }} 
              title="Sinkronkan Data Manual"
              className={`p-2 rounded-xl bg-stone-900 hover:bg-amber-700 transition flex-shrink-0 ${isSyncing ? 'animate-spin text-amber-400' : 'text-stone-300'}`}
            >
              <Icon name="sync" className="w-4 h-4" />
            </button>
          </div>
          <nav className="p-4 space-y-1.5">
            {allNavigationItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm ${
                  activeTab === item.id ? 'bg-amber-600 text-white shadow-md' : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                }`}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-stone-800 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              <Icon name="user" className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-stone-100 truncate">{currentUser.name}</p>
              <p className="text-xs text-amber-400 capitalize">{currentUser.role}</p>
            </div>
          </div>  

          {currentUser.role === 'admin' && (
            <button
              onClick={handleLocalReset}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-950/60 hover:bg-amber-900 text-amber-300 rounded-xl text-xs font-semibold transition duration-200 border border-amber-900/50"
              title="Bersihkan Cache Lokal & Muat Ulang"
            >
              <Icon name="reset" className="w-4 h-4" /> Reset Cache Lokal
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-900 hover:bg-red-700 text-stone-300 hover:text-white rounded-xl text-xs font-semibold transition duration-200 border border-stone-800"
          >
            <Icon name="logout" className="w-4 h-4" /> Keluar Sesi
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden pb-20 md:pb-0 print:overflow-visible print:pb-0 relative bg-stone-900">
        
        {activeTab === 'dashboard' && currentUser.role === 'admin' && (
          <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6 print:hidden">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Dashboard & Grafik Penjualan</h2>
                <p className="text-xs text-stone-400 mt-0.5">Ringkasan performa dan tren omset 7 hari terakhir</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-stone-800 p-4 md:p-5 rounded-2xl border border-stone-700 shadow-sm hover:border-stone-600 transition-all">
                <span className="text-[10px] md:text-xs font-semibold text-stone-400 uppercase tracking-wide">Omset Hari Ini</span>
                <p className="text-lg md:text-2xl font-bold text-emerald-400 mt-1">{formatRupiah(todayRevenue)}</p>
              </div>
              <div className="bg-stone-800 p-4 md:p-5 rounded-2xl border border-stone-700 shadow-sm hover:border-stone-600 transition-all">
                <span className="text-[10px] md:text-xs font-semibold text-stone-400 uppercase tracking-wide">Transaksi Hari Ini</span>
                <p className="text-lg md:text-2xl font-bold text-amber-400 mt-1">{todayTransactions.length}</p>
              </div>
              <div className="bg-stone-800 p-4 md:p-5 rounded-2xl border border-stone-700 shadow-sm hover:border-stone-600 transition-all">
                <span className="text-[10px] md:text-xs font-semibold text-stone-400 uppercase tracking-wide">Total Produk</span>
                <p className="text-lg md:text-2xl font-bold text-stone-100 mt-1">{products.length}</p>
              </div>
              <div className="bg-stone-800 p-4 md:p-5 rounded-2xl border border-stone-700 shadow-sm hover:border-stone-600 transition-all">
                <span className="text-[10px] md:text-xs font-semibold text-stone-400 uppercase tracking-wide">Stok Menipis (&lt; 10)</span>
                <p className="text-lg md:text-2xl font-bold text-red-400 mt-1">{lowStockProducts.length}</p>
              </div>
            </div>

            <div className="bg-stone-800 rounded-2xl shadow-sm border border-stone-700 p-5">
              <h3 className="font-bold text-white text-sm mb-4">Grafik Tren Omset (7 Hari Terakhir)</h3>
              <div className="h-48 flex items-end gap-2 pt-6 px-2">
                {chartData.map((d, idx) => {
                  const heightPercent = Math.max(Math.round((d.total / maxChartValue) * 100), 8);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      <div className="absolute -top-8 bg-stone-900 border border-stone-700 text-amber-400 text-[10px] font-bold px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                        {formatRupiah(d.total)}
                      </div>
                      <div 
                        style={{ height: `${heightPercent}%` }} 
                        className="w-full bg-amber-600 hover:bg-amber-500 rounded-t-lg transition-all duration-300"
                      ></div>
                      <span className="text-[10px] text-stone-400 mt-2 text-center truncate w-full">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-stone-800 rounded-2xl shadow-sm border border-stone-700 p-5">
                <div className="flex items-center gap-2 mb-4 text-red-400 font-bold text-sm">
                  <Icon name="alert" /> Peringatan Stok Menipis
                </div>
                {lowStockProducts.length === 0 ? (
                  <p className="text-sm text-stone-400 py-8 text-center">Seluruh stok produk aman dan mencukupi.</p>
                ) : (
                  <div className="divide-y divide-stone-700 text-sm max-h-60 overflow-y-auto">
                    {lowStockProducts.map(p => (
                      <div key={p.id} className="py-2.5 flex justify-between items-center">
                        <span className="font-medium text-stone-200">{p.name}</span>
                        <span className="font-bold text-red-400 bg-red-950/60 border border-red-900/50 px-3 py-1 rounded-full text-xs">Sisa: {p.stock}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-stone-800 rounded-2xl shadow-sm border border-stone-700 p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white text-sm">Transaksi Terbaru</h3>
                  <button onClick={() => setActiveTab('history')} className="text-xs text-amber-400 font-bold hover:underline">Semua &rarr;</button>
                </div>
                {transactions.length === 0 ? (
                  <p className="text-sm text-stone-400 py-8 text-center">Belum ada transaksi tercatat.</p>
                ) : (
                  <div className="divide-y divide-stone-700 text-sm max-h-60 overflow-y-auto">
                    {transactions.slice(0, 5).map(t => (
                      <div key={t.id} className="py-2.5 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-stone-200">{t.id}</p>
                          <p className="text-xs text-stone-400">{formatDate(t.date)} • {t.cashier}</p>
                        </div>
                        <span className="font-bold text-emerald-400">{formatRupiah(t.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden print:hidden relative">
            <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col pb-24 md:pb-6">
              
              {!currentShift && (
                <div className="bg-amber-950/40 border border-amber-900/60 p-4 rounded-2xl mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-600 text-white rounded-xl">
                      <Icon name="cashDrawer" className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-300">Shift Belum Dibuka</h4>
                      <p className="text-xs text-stone-300">Harap buka shift kasir terlebih dahulu sebelum melayani transaksi.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('shift')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow flex-shrink-0"
                  >
                    Buka Shift
                  </button>
                </div>
              )}

              <div className="bg-stone-800 p-3 rounded-2xl border border-stone-700 shadow-sm mb-4 flex items-center gap-3">
                <div className="p-2 bg-amber-950/50 text-amber-400 border border-amber-900/40 rounded-xl flex-shrink-0">
                  <Icon name="barcode" className="w-5 h-5" />
                </div>
                <form onSubmit={handleBarcodeSubmit} className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Scan Barcode atau Ketik ID Produk lalu Enter..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition"
                  />
                  <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow flex-shrink-0">
                    Tambah
                  </button>
                </form>
              </div>

              <div className="flex flex-col gap-3 mb-4 md:mb-6">
                <input
                  type="text"
                  placeholder="Cari produk berdasarkan nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition"
                />
                
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === cat.id 
                          ? 'bg-amber-600 text-white shadow-md' 
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 text-stone-400 bg-stone-800 rounded-2xl border border-stone-700">
                  <p className="text-sm font-medium">Produk tidak ditemukan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-stone-800 p-3.5 md:p-4 rounded-2xl border border-stone-700 hover:border-amber-500 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="font-bold text-stone-100 text-xs md:text-sm leading-tight group-hover:text-amber-400 transition-colors">{product.name}</h3>
                          <span className="text-[9px] font-mono text-stone-400 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-700 flex-shrink-0">{product.id}</span>
                        </div>
                        <p className="text-[11px] md:text-xs text-stone-400 mt-1">Stok: <span className={product.stock < 5 ? 'text-red-400 font-bold' : ''}>{product.stock}</span></p>
                      </div>
                      <div className="mt-3 md:mt-4 flex justify-between items-center">
                        <span className="font-bold text-amber-400 text-xs md:text-sm">{formatRupiah(product.sellPrice)}</span>
                        <div className="p-1.5 bg-stone-900 text-amber-400 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors border border-stone-700">
                          <Icon name="plus" className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden md:flex w-80 lg:w-96 bg-stone-800 border-l border-stone-700 flex-col flex-shrink-0 shadow-sm">
              <div className="p-4 border-b border-stone-700 font-bold text-base text-stone-100 flex justify-between items-center">
                <span>Pesanan Saat Ini</span>
                <span className="text-xs bg-amber-950/60 border border-amber-900/50 text-amber-400 px-2.5 py-1 rounded-full font-semibold">{cartItemCount} item</span>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-16 text-stone-400 text-sm">Belum ada menu dipilih</div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="bg-stone-900/80 p-3 rounded-xl border border-stone-700 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-sm text-stone-100">{item.name}</h4>
                          <span className="text-xs text-stone-400">{formatRupiah(item.sellPrice)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => updateCartQty(item.id, -1)} className="p-1 bg-stone-800 rounded-lg border border-stone-700 text-stone-200 hover:bg-stone-700 transition">
                            <Icon name="minus" className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold w-6 text-center text-stone-100">{item.qty}</span>
                          <button onClick={() => updateCartQty(item.id, 1)} className="p-1 bg-stone-800 rounded-lg border border-stone-700 text-stone-200 hover:bg-stone-700 transition">
                            <Icon name="plus" className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Catatan (mis: Kurang manis)..."
                        value={item.notes || ''}
                        onChange={(e) => updateCartItemNotes(item.id, e.target.value)}
                        className="w-full text-xs px-3 py-1.5 border border-stone-700 rounded-lg bg-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-100 placeholder-stone-500 transition"
                      />
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-stone-700 bg-stone-800/80 space-y-3">
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-stone-300">Total:</span>
                  <span className="text-amber-400 text-xl font-bold">{formatRupiah(cartTotal)}</span>
                </div>
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  disabled={cart.length === 0}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-700 disabled:text-stone-500 text-white font-bold rounded-xl shadow-md transition duration-200 text-sm"
                >
                  Bayar Sekarang
                </button>
              </div>
            </div>

            {cart.length > 0 && (
              <div className="md:hidden fixed bottom-16 left-0 right-0 bg-stone-950 text-white p-3 px-4 flex justify-between items-center shadow-2xl border-t border-stone-800 z-30">
                <div>
                  <p className="text-xs text-amber-400 font-semibold">{cartItemCount} Item Dipilih</p>
                  <p className="text-base font-bold">{formatRupiah(cartTotal)}</p>
                </div>
                <button
                  onClick={() => setMobileCartOpen(true)}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                >
                  Lihat Keranjang
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'shift' && (
          <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6 print:hidden">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">Manajemen Shift & Tutup Kasir</h2>
              <p className="text-xs text-stone-400 mt-0.5">Pencatatan modal awal kasir dan rekapitulasi uang kas saat tutup shift</p>
            </div>

            {!currentShift ? (
              <div className="bg-stone-800 p-6 md:p-8 rounded-2xl border border-stone-700 max-w-xl shadow-sm space-y-5">
                <div className="flex items-center gap-3 text-amber-400">
                  <div className="p-3 bg-amber-950/60 rounded-xl border border-amber-900/50">
                    <Icon name="cashDrawer" className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Belum Ada Shift Aktif</h3>
                    <p className="text-xs text-stone-400">Buka shift baru dengan memasukkan modal awal di laci kasir (cash drawer).</p>
                  </div>
                </div>

                <form onSubmit={handleOpenShift} className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-stone-300 uppercase">Modal Awal Kasir (Float Cash)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 500000"
                      required
                      value={initialCashInput}
                      onChange={(e) => setInitialCashInput(e.target.value)}
                      className="w-full mt-1.5 px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition text-sm"
                  >
                    Buka Shift Sekarang
                  </button>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-stone-800 p-6 rounded-2xl border border-stone-700 space-y-5 shadow-sm">
                  <div className="flex justify-between items-center border-b border-stone-700 pb-3">
                    <h3 className="font-bold text-white text-base">Shift Aktif</h3>
                    <span className="px-3 py-1 bg-emerald-950/60 border border-emerald-900/50 text-emerald-400 rounded-full text-xs font-semibold animate-pulse">BERJALAN</span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Kasir:</span>
                      <span className="font-bold text-stone-100">{currentShift.cashier || currentShift.kasir}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Waktu Mulai:</span>
                      <span className="font-medium text-stone-200">{formatDate(currentShift.startTime || currentShift.waktu_buka)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Modal Awal:</span>
                      <span className="font-bold text-amber-400">{formatRupiah(currentShift.initialCash || currentShift.modal_awal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Penjualan Tunai:</span>
                      <span className="font-bold text-emerald-400">{formatRupiah(shiftCashSales)}</span>
                    </div>
                    <div className="border-t border-stone-700 pt-3 flex justify-between text-base font-bold">
                      <span className="text-stone-300">Estimasi di Laci:</span>
                      <span className="text-amber-400">{formatRupiah(expectedCashInDrawer)}</span>
                    </div>
                  </div>

                  <div className="border-t border-stone-700 pt-4 space-y-3">
                    <h4 className="font-bold text-stone-200 text-xs uppercase tracking-wide">Tutup Shift & Rekap Kas</h4>
                    <form onSubmit={handleCloseShift} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-stone-400 uppercase">Uang Kas Fisik Aktual di Laci</label>
                        <input
                          type="number"
                          placeholder="Masukkan total uang kas fisik..."
                          required
                          value={actualCashInput}
                          onChange={(e) => setActualCashInput(e.target.value)}
                          className="w-full mt-1 px-4 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                        />
                      </div>
                      {actualCashInput !== '' && (
                        <div className="p-3 bg-stone-900 rounded-xl border border-stone-700 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-stone-400">Selisih (Variance):</span>
                            <span className={`font-bold ${parseFloat(actualCashInput) - expectedCashInDrawer >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {formatRupiah(parseFloat(actualCashInput) - expectedCashInDrawer)}
                              {parseFloat(actualCashInput) - expectedCashInDrawer > 0 ? ' (Lebih)' : parseFloat(actualCashInput) - expectedCashInDrawer < 0 ? ' (Kurang)' : ' (Pas)'}
                            </span>
                          </div>
                        </div>
                      )}
                      <button
                        type="submit"
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition text-sm"
                      >
                        Tutup Shift & Rekap Kas
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-stone-800 rounded-2xl border border-stone-700 p-5 space-y-4 shadow-sm">
                  <h3 className="font-bold text-white text-base">Transaksi Selama Shift Ini ({shiftTransactions.length})</h3>
                  <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead className="bg-stone-900/80 text-stone-300 text-xs font-semibold sticky top-0">
                        <tr>
                          <th className="p-3">ID TRX</th>
                          <th className="p-3">Waktu</th>
                          <th className="p-3">Metode</th>
                          <th className="p-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-700 text-xs">
                        {shiftTransactions.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="p-8 text-center text-stone-400">Belum ada transaksi pada shift ini.</td>
                          </tr>
                        ) : (
                          shiftTransactions.map(t => (
                            <tr key={t.id} className="hover:bg-stone-700/50 transition">
                              <td className="p-3 font-mono font-bold text-amber-400">{t.id}</td>
                              <td className="p-3 text-stone-300">{formatDate(t.date)}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.paymentMethod === 'Tunai' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/50' : 'bg-purple-950/60 text-purple-300 border border-purple-900/50'}`}>
                                  {t.paymentMethod}
                                </span>
                              </td>
                              <td className="p-3 text-right font-bold text-emerald-400">{formatRupiah(t.total)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {shiftHistory.length > 0 && (
              <div className="bg-stone-800 rounded-2xl border border-stone-700 p-5 space-y-4 shadow-sm mt-6">
                <h3 className="font-bold text-white text-base">Riwayat Rekapitulasi Shift Sebelumnya</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="bg-stone-900/80 text-stone-300 text-xs font-semibold">
                      <tr>
                        <th className="p-3">ID Shift</th>
                        <th className="p-3">Kasir</th>
                        <th className="p-3">Waktu Tutup</th>
                        <th className="p-3">Modal Awal</th>
                        <th className="p-3">Kas Sistem</th>
                        <th className="p-3">Kas Fisik</th>
                        <th className="p-3 text-right">Selisih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-700 text-xs">
                      {shiftHistory.map((s, index) => {
                        const modalAwal = Number(s.modalAwal || s.initialCash || s.modal_awal) || 0;
                        const totalTunai = Number(s.totalTunai || s.total_tunai) || 0;
                        const kasSistem = modalAwal + totalTunai;
                        const kasFisik = Number(s.uangAktual || s.actualCash || s.uang_aktual) || 0;
                        const selisih = s.selisih !== undefined && s.selisih !== null 
                          ? Number(s.selisih || s.variance) 
                          : (kasFisik - kasSistem);
                        const waktuTutup = s.waktuTutup || s.endTime || s.waktu_tutup;

                        return (
                          <tr key={s.idShift || s.id_shift || s.id || index} className="hover:bg-stone-700/50 transition-colors">
                            <td className="p-3 font-mono font-bold text-amber-400">{s.idShift || s.id_shift || s.id}</td>
                            <td className="p-3 font-medium text-stone-100">{s.kasir || s.cashier}</td>
                            <td className="p-3 text-stone-300">{formatDate(waktuTutup)}</td>
                            <td className="p-3 text-stone-300">{formatRupiah(modalAwal)}</td>
                            <td className="p-3 text-stone-300">{formatRupiah(kasSistem)}</td>
                            <td className="p-3 text-stone-300">{formatRupiah(kasFisik)}</td>
                            <td className={`p-3 text-right font-bold ${selisih >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {formatRupiah(selisih)} {selisih > 0 ? '(Lebih)' : selisih < 0 ? '(Kurang)' : '(Pas)'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4 md:space-y-6 print:hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-xl md:text-2xl font-bold text-white">Riwayat Transaksi</h2>
              <input
                type="text"
                placeholder="Cari ID Transaksi atau Kasir..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full sm:w-72 px-4 py-2.5 border border-stone-700 rounded-xl bg-stone-800 text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition"
              />
            </div>

            <div className="bg-stone-800 rounded-2xl shadow-sm border border-stone-700 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-stone-900/80 text-stone-300 text-xs md:text-sm font-semibold">
                  <tr>
                    <th className="p-3 md:p-4">ID TRX</th>
                    <th className="p-3 md:p-4">Tanggal</th>
                    <th className="p-3 md:p-4">Kasir</th>
                    <th className="p-3 md:p-4">Metode</th>
                    <th className="p-3 md:p-4">Total</th>
                    <th className="p-3 md:p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700 text-xs md:text-sm">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-stone-400">Tidak ada riwayat transaksi ditemukan.</td>
                    </tr>
                  ) : (
                    filteredHistory.map(t => (
                      <tr key={t.id} className="hover:bg-stone-700/50 transition-colors">
                        <td className="p-3 md:p-4 font-mono font-bold text-amber-400">{t.id}</td>
                        <td className="p-3 md:p-4 text-stone-300">{formatDate(t.date)}</td>
                        <td className="p-3 md:p-4 text-stone-200">{t.cashier}</td>
                        <td className="p-3 md:p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${t.paymentMethod === 'QRIS' || t.paymentMethod === 'E-Wallet' ? 'bg-purple-950/60 border border-purple-900/50 text-purple-300' : 'bg-emerald-950/60 border border-emerald-900/50 text-emerald-300'}`}>
                            {t.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 md:p-4 font-bold text-emerald-400">{formatRupiah(t.total)}</td>
                        <td className="p-3 md:p-4 text-center">
                          <button
                            onClick={() => { 
                              let itemsData = t.items;

                              if (typeof itemsData === 'string') {
                                try {
                                  itemsData = JSON.parse(itemsData);
                                } catch (e) {
                                  itemsData = [];
                                }
                              }

                              if (Array.isArray(itemsData)) {
                                itemsData = itemsData.map(item => {
                                  if (typeof item === 'string') {
                                    try { return JSON.parse(item); } catch (e) { return item; }
                                  }
                                  return item;
                                });
                              }

                              setLastTransaction({ ...t, items: itemsData || [] }); 
                              setReceiptModalOpen(true); 
                            }}
                            className="px-3 py-1.5 bg-amber-950/60 border border-amber-900/50 text-amber-300 rounded-xl hover:bg-amber-600 hover:text-white font-semibold text-xs transition shadow-sm"
                          >
                            Cetak Struk
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && currentUser.role === 'admin' && (
          <div className="p-4 md:p-6 overflow-y-auto flex-1 print:hidden">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Kelola Produk</h2>
                <p className="text-xs text-stone-400 mt-0.5">Tambah, ubah, atau hapus inventaris kedai</p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductFormData({ name: '', categoryId: 1, costPrice: 0, sellPrice: 0, stock: 0 });
                  setProductFormOpen(true);
                }}
                className="flex items-center gap-1.5 bg-amber-600 text-white px-3.5 md:px-4 py-2 md:py-2.5 rounded-xl font-semibold text-xs md:text-sm hover:bg-amber-700 shadow transition"
              >
                <Icon name="plus" className="w-4 h-4" /> Tambah Produk
              </button>
            </div>

            <div className="bg-stone-800 rounded-2xl shadow-sm border border-stone-700 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-stone-900/80 text-stone-300 text-xs md:text-sm font-semibold">
                  <tr>
                    <th className="p-3 md:p-4">ID / Barcode</th>
                    <th className="p-3 md:p-4">Nama Produk</th>
                    <th className="p-3 md:p-4">Kategori</th>
                    <th className="p-3 md:p-4">Stok</th>
                    <th className="p-3 md:p-4">Harga Modal</th>
                    <th className="p-3 md:p-4">Harga Jual</th>
                    <th className="p-3 md:p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700 text-xs md:text-sm">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-stone-400">Belum ada produk terdaftar.</td>
                    </tr>
                  ) : (
                    products.map(p => (
                      <tr key={p.id} className="hover:bg-stone-700/50 transition-colors">
                        <td className="p-3 md:p-4 font-mono text-xs text-stone-400">{p.id}</td>
                        <td className="p-3 md:p-4 font-semibold text-stone-100">{p.name}</td>
                        <td className="p-3 md:p-4 text-stone-300">{categories.find(c => c.id === Number(p.categoryId))?.name || 'Umum'}</td>
                        <td className="p-3 md:p-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${p.stock < 10 ? 'bg-red-950/60 border border-red-900/50 text-red-400' : 'text-stone-300'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="p-3 md:p-4 text-stone-300">{formatRupiah(p.costPrice)}</td>
                        <td className="p-3 md:p-4 font-bold text-amber-400">{formatRupiah(p.sellPrice)}</td>
                        <td className="p-3 md:p-4 flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setProductFormData(p);
                              setProductFormOpen(true);
                            }}
                            className="p-1.5 text-blue-400 hover:bg-blue-950/60 rounded-lg transition"
                            title="Edit"
                          >
                            <Icon name="edit" className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p.id)} 
                            className="p-1.5 text-red-400 hover:bg-red-950/60 rounded-lg transition"
                            title="Hapus"
                          >
                            <Icon name="trash" className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && currentUser.role === 'admin' && (
          <div className="p-4 md:p-6 overflow-y-auto flex-1 print:hidden">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Catatan Pengeluaran</h2>
                <p className="text-xs text-stone-400 mt-0.5">Kelola pengeluaran operasional kedai</p>
              </div>
              <button
                onClick={() => setExpenseFormOpen(true)}
                className="flex items-center gap-1.5 bg-amber-600 text-white px-3.5 md:px-4 py-2 md:py-2.5 rounded-xl font-semibold text-xs md:text-sm hover:bg-amber-700 shadow transition"
              >
                <Icon name="plus" className="w-4 h-4" /> Catat Pengeluaran
              </button>
            </div>

            <div className="bg-stone-800 rounded-2xl shadow-sm border border-stone-700 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="bg-stone-900/80 text-stone-300 text-xs md:text-sm font-semibold">
                  <tr>
                    <th className="p-3 md:p-4">Tanggal</th>
                    <th className="p-3 md:p-4">Keterangan</th>
                    <th className="p-3 md:p-4 text-right">Jumlah (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700 text-xs">
                  {expenses && expenses.length > 0 ? (
                    expenses.map((exp, index) => {
                      const keteranganExp = exp.kategori || exp.keterangan || exp.description || "Pengeluaran";
                      const nominalExp = Number(exp.nominal || exp.amount) || 0;
                      const tanggalExp = exp.tanggal || exp.date;

                      return (
                        <tr key={exp.id || index} className="hover:bg-stone-700/50 transition-colors">
                          <td className="p-3 text-stone-300">{formatDate(tanggalExp)}</td>
                          <td className="p-3 text-stone-100 font-medium">{keteranganExp}</td>
                          <td className="p-3 text-red-400 font-bold text-right">{formatRupiah(nominalExp)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className="p-4 text-center text-stone-500">
                        Belum ada catatan pengeluaran
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && currentUser.role === 'admin' && (
          <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6 print:hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Laporan Keuangan & Laba Rugi Otomatis</h2>
                <p className="text-xs text-stone-400 mt-0.5">Analisis omset, HPP, laba kotor, laba bersih, dan rincian transaksi</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={exportReportToExcel}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm shadow transition"
                >
                  <Icon name="download" className="w-4 h-4" /> Ekspor (.csv)
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-stone-700 hover:bg-stone-600 text-white px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm shadow transition"
                >
                  <Icon name="print" className="w-4 h-4" /> Cetak / PDF
                </button>
              </div>
            </div>
            
            <div className="bg-stone-800 p-4 md:p-5 rounded-2xl border border-stone-700 shadow-sm space-y-4">
              <h3 className="font-bold text-stone-300 text-xs uppercase tracking-wider">Filter Laporan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Dari Tanggal</label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2 border border-stone-700 rounded-xl text-sm bg-stone-900 text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2 border border-stone-700 rounded-xl text-sm bg-stone-900 text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Metode Pembayaran</label>
                  <select
                    value={reportPaymentMethod}
                    onChange={(e) => setReportPaymentMethod(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2 border border-stone-700 rounded-xl text-sm bg-stone-900 text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                  >
                    <option value="ALL">Semua Metode</option>
                    <option value="Tunai">Tunai</option>
                    <option value="QRIS">QRIS / Non-Tunai</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Pencarian</label>
                  <input
                    type="text"
                    placeholder="ID TRX / Kasir..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2 border border-stone-700 rounded-xl text-sm bg-stone-900 text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-stone-800 p-5 rounded-2xl border border-stone-700 shadow-sm">
                <span className="text-xs font-semibold text-stone-400 uppercase">Total Omset</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">{formatRupiah(filteredReportRevenue)}</p>
              </div>
              <div className="bg-stone-800 p-5 rounded-2xl border border-stone-700 shadow-sm">
                <span className="text-xs font-semibold text-stone-400 uppercase">Estimasi HPP</span>
                <p className="text-xl font-bold text-red-400 mt-1">{formatRupiah(totalCostOfGoods)}</p>
              </div>
              <div className="bg-stone-800 p-5 rounded-2xl border border-stone-700 shadow-sm">
                <span className="text-xs font-semibold text-stone-400 uppercase">Laba Kotor</span>
                <p className="text-xl font-bold text-amber-400 mt-1">{formatRupiah(grossProfit)}</p>
              </div>
              <div className="bg-stone-800 p-5 rounded-2xl border border-stone-700 shadow-sm">
                <span className="text-xs font-semibold text-stone-400 uppercase">Laba Bersih (Net)</span>
                <p className="text-xl font-bold text-blue-400 mt-1">{formatRupiah(netProfit)}</p>
              </div>
            </div>

            <div className="bg-stone-800 rounded-2xl shadow-sm border border-stone-700 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-stone-900/80 text-stone-300 text-xs font-semibold">
                  <tr>
                    <th className="p-4">ID TRX</th>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Kasir</th>
                    <th className="p-4">Metode</th>
                    <th className="p-4">Rincian Item</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-700 text-xs">
                  {filteredReportTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-stone-400">Tidak ada data transaksi pada rentang filter</td>
                    </tr>
                  ) : (
                    filteredReportTransactions.map(t => (
                      <tr key={t.id} className="hover:bg-stone-700/50 transition">
                        <td className="p-4 font-mono font-bold text-amber-400">{t.id}</td>
                        <td className="p-4 text-stone-300">{formatDate(t.date)}</td>
                        <td className="p-4 font-medium text-stone-100">{t.cashier}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.paymentMethod === 'Tunai' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/50' : 'bg-purple-950/60 text-purple-300 border border-purple-900/50'}`}>
                            {t.paymentMethod}
                          </span>
                        </td>
                        <td className="p-4 text-stone-300">
                          {(t.items || []).map((i, idx) => (
                            <div key={idx}>• {i.name} (x{i.qty}) {i.notes ? `[${i.notes}]` : ''}</div>
                          ))}
                        </td>
                        <td className="p-4 text-right font-bold text-emerald-400">{formatRupiah(t.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <Pengaturan 
            settings={settings} 
            onSaveSettings={async (newSettings) => {
              setSettings(newSettings);
              localStorage.setItem('pos_settings', JSON.stringify(newSettings));

              try {
                if (navigator.onLine) {
                  await saveSettingsToSheet(newSettings);
                  showToast('Pengaturan toko berhasil diperbarui & disinkronkan!', 'success');
                } else {
                  queueOfflineAction('saveSettings', newSettings);
                  showToast('Offline: Pengaturan disimpan lokal & akan disinkronkan saat online.', 'info');
                }
              } catch (err) {
                queueOfflineAction('saveSettings', newSettings);
                showToast('Koneksi terganggu, pengaturan masuk antrean sinkronisasi.', 'info');
              }
            }} 
          />
        )}

      </main>

      {/* PAYMENT MODAL */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-800 space-y-5 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3">
              <h3 className="font-bold text-white text-lg">Konfirmasi Pembayaran</h3>
              <button onClick={() => setPaymentModalOpen(false)} className="text-stone-400 hover:text-white font-bold text-xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 text-center space-y-1">
                <span className="text-xs text-stone-400 uppercase tracking-wider">Total Tagihan</span>
                <p className="text-2xl font-extrabold text-amber-400">{formatRupiah(cartTotal)}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 uppercase">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {['Tunai', 'QRIS'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2.5 rounded-xl font-semibold text-xs transition border ${paymentMethod === m ? 'bg-amber-600 border-amber-500 text-white shadow-md' : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'Tunai' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 uppercase">Jumlah Uang Diterima (Rp)</label>
                  <input
                    type="number"
                    placeholder="Masukkan nominal uang..."
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                  {parseFloat(payAmount) >= cartTotal && (
                    <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex justify-between items-center text-xs">
                      <span className="text-stone-400">Kembalian:</span>
                      <span className="font-bold text-emerald-400 text-sm">{formatRupiah(parseFloat(payAmount) - cartTotal)}</span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={processPayment}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition text-sm mt-2"
              >
                Selesaikan Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {receiptModalOpen && lastTransaction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-800 space-y-5">
            
            <div id="receipt-content" className="receipt-container bg-white text-stone-900 p-5 rounded-2xl font-mono text-xs space-y-3 shadow-inner">
              <div className="text-center space-y-0.5 border-b border-dashed border-stone-300 pb-3">
                <h4 className="font-bold text-sm uppercase">{settings.storeName}</h4>
                <p className="text-[10px] text-stone-600">{settings.address}</p>
                <p className="text-[10px] text-stone-600">Telp: {settings.phone}</p>
              </div>

              <div className="space-y-0.5 border-b border-dashed border-stone-300 pb-3">
                <div className="flex justify-between">
                  <span>ID: {lastTransaction.id}</span>
                  <span>{formatDate(lastTransaction.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir: {lastTransaction.cashier}</span>
                  <span>{lastTransaction.paymentMethod}</span>
                </div>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-stone-300 pb-3">
                {(() => {
                  let rawItems = lastTransaction?.items;

                  if (typeof rawItems === 'string') {
                    try {
                      rawItems = JSON.parse(rawItems);
                    } catch (e) {
                      rawItems = [];
                    }
                  }

                  if (!Array.isArray(rawItems) || rawItems.length === 0) {
                    return <div className="text-stone-400 italic text-[10px] text-center py-2">Rincian item tidak tersedia</div>;
                  }

                  return rawItems.map((rawItem, idx) => {
                    let item = rawItem;

                    if (typeof item === 'string') {
                      try {
                        item = JSON.parse(item);
                      } catch (e) {
                        item = {};
                      }
                    }

                    const namaProduk = item.name || item.nama_produk || item.nama || item.productName || 'Produk';
                    const jumlah = Number(item.qty || item.jumlah || item.quantity || 1);
                    const harga = Number(item.price || item.harga_jual || item.harga || item.sellPrice || 0);
                    const subtotal = Number(item.subtotal || (jumlah * harga));
                    const catatan = item.notes || item.catatan || '';

                    return (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between">
                          <span className="font-bold">{namaProduk}</span>
                          <span>{formatRupiah(subtotal)}</span>
                        </div>
                        <div className="text-[10px] text-stone-500 pl-2">
                          {jumlah} x {formatRupiah(harga)} {catatan ? `[${catatan}]` : ''}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="space-y-1 pt-1 font-bold">
                <div className="flex justify-between">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(lastTransaction.total)}</span>
                </div>
                {lastTransaction.paymentMethod === 'Tunai' && (
                  <>
                    <div className="flex justify-between text-stone-600 text-[11px]">
                      <span>BAYAR:</span>
                      <span>{formatRupiah(lastTransaction.payment)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 text-[11px]">
                      <span>KEMBALI:</span>
                      <span>{formatRupiah(lastTransaction.change)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center text-[10px] text-stone-500 pt-3 border-t border-dashed border-stone-300">
                <p>{settings.receiptFooter}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setReceiptModalOpen(false);
                  showToast('Struk berhasil dicetak.', 'success');
                }}
                className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl text-xs transition"
              >
                Tutup
              </button>
              <button
                onClick={() => {}}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
              >
                <Icon name="bluetooth" className="w-4 h-4" /> Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT FORM MODAL */}
      {productFormOpen && currentUser.role === 'admin' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-800 space-y-4">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3">
              <h3 className="font-bold text-white text-base">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
              <button onClick={() => setProductFormOpen(false)} className="text-stone-400 hover:text-white font-bold text-xl">&times;</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={productFormData.name}
                  onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase">Kategori</label>
                <select
                  value={productFormData.categoryId}
                  onChange={(e) => setProductFormData({ ...productFormData, categoryId: Number(e.target.value) })}
                  className="w-full mt-1 px-3.5 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                >
                  {categories.filter(c => c.id !== 'ALL').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Stok</label>
                  <input
                    type="number"
                    required
                    value={productFormData.stock}
                    onChange={(e) => setProductFormData({ ...productFormData, stock: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Harga Modal</label>
                  <input
                    type="number"
                    required
                    value={productFormData.costPrice}
                    onChange={(e) => setProductFormData({ ...productFormData, costPrice: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase">Harga Jual</label>
                <input
                  type="number"
                  required
                  value={productFormData.sellPrice}
                  onChange={(e) => setProductFormData({ ...productFormData, sellPrice: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow transition mt-2">
                Simpan Produk
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EXPENSE FORM MODAL */}
      {expenseFormOpen && currentUser.role === 'admin' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-800 space-y-4">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3">
              <h3 className="font-bold text-white text-base">Catat Pengeluaran</h3>
              <button onClick={() => setExpenseFormOpen(false)} className="text-stone-400 hover:text-white font-bold text-xl">&times;</button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase">Keterangan Pengeluaran</label>
                <input
                  type="text"
                  placeholder="Contoh: Beli Es Batu / Gas..."
                  required
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase">Jumlah Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 25000..."
                  required
                  value={expenseFormData.amount}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow transition mt-2">
                Simpan Pengeluaran
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE CART MODAL */}
      {mobileCartOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-stone-900 rounded-t-3xl p-5 max-h-[80vh] flex flex-col shadow-2xl border-t border-stone-800 animate-slideUp">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3 mb-3">
              <h3 className="font-bold text-white text-base">Keranjang Pesanan ({cartItemCount})</h3>
              <button onClick={() => setMobileCartOpen(false)} className="text-stone-400 hover:text-white font-bold text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {cart.length === 0 ? (
                <p className="text-center py-8 text-stone-400 text-sm">Keranjang kosong</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="bg-stone-800 p-3 rounded-xl border border-stone-700 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm text-stone-100">{item.name}</h4>
                        <span className="text-xs text-stone-400">{formatRupiah(item.sellPrice)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateCartQty(item.id, -1)} className="p-1 bg-stone-900 rounded-lg border border-stone-700 text-stone-200">
                          <Icon name="minus" className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center text-stone-100">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.id, 1)} className="p-1 bg-stone-900 rounded-lg border border-stone-700 text-stone-200">
                          <Icon name="plus" className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Catatan..."
                      value={item.notes || ''}
                      onChange={(e) => updateCartItemNotes(item.id, e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border border-stone-700 rounded-lg bg-stone-900 text-stone-100 placeholder-stone-500 focus:outline-none"
                    />
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-stone-800 pt-3 mt-3 space-y-3">
              <div className="flex justify-between text-base font-semibold">
                <span className="text-stone-300">Total:</span>
                <span className="text-amber-400 text-xl font-bold">{formatRupiah(cartTotal)}</span>
              </div>
              <button
                onClick={() => { setMobileCartOpen(false); setPaymentModalOpen(true); }}
                disabled={cart.length === 0}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-800 disabled:text-stone-600 text-white font-bold rounded-xl shadow transition text-sm"
              >
                Bayar Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}