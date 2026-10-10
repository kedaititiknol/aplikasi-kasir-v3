const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwKZ6hPXRPFbXARKGtKtiTBjnqVdqzs2b7a7qW3E-eD_9-Z9S94e76WqrM8MrO1Wven/exec';

// =================================================================
// 1. DATA MASTER (PRODUK, EXPENSE, TRANSAKSI)
// =================================================================

// Ambil semua data awal saat aplikasi dimuat
export const fetchAllData = async () => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_URL')) return null;
  try {
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Gagal mengambil data dari Google Sheets:', error);
    return null;
  }
};

// Simpan / Edit Produk
export const saveProductToSheet = async (product) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_URL')) return;
  try {
    const payload = {
      action: 'saveProduct',
      id: product.id,
      nama_produk: product.name,
      name: product.name,
      harga_beli: Number(product.costPrice || 0),
      costPrice: Number(product.costPrice || 0),
      harga_jual: Number(product.sellPrice || 0),
      sellPrice: Number(product.sellPrice || 0),
      stok: Number(product.stock || 0),
      stock: Number(product.stock || 0),
      kategori: Number(product.categoryId || 1),
      categoryId: Number(product.categoryId || 1)
    };

    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Gagal menyimpan produk ke Sheet:', err);
  }
};

// Hapus Produk
export const deleteProductFromSheet = async (id) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_URL')) return;
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'deleteProduct', id })
    });
  } catch (err) {
    console.error('Gagal menghapus produk dari Sheet:', err);
  }
};

// Catat Pengeluaran
export const saveExpenseToSheet = async (expense) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_URL')) return;
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveExpense',
        id: expense.id,
        tanggal: expense.date,
        date: expense.date,
        keterangan: expense.description,
        description: expense.description,
        nominal: expense.amount,
        amount: expense.amount
      })
    });
  } catch (err) {
    console.error('Gagal menyimpan pengeluaran ke Sheet:', err);
  }
};

// Kirim Transaksi Penjualan (Telah diperbarui untuk menyertakan id_shift)
export const sendTransaction = async (transaction) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_URL')) return;
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'sendTransaction',
        id_transaksi: transaction.id,
        id: transaction.id,
        tanggal: transaction.date,
        date: transaction.date,
        total: transaction.total,
        metode_bayar: transaction.paymentMethod,
        paymentMethod: transaction.paymentMethod,
        kasir: transaction.cashier,
        cashier: transaction.cashier,
        payment: transaction.payment,
        change: transaction.change,
        items: transaction.items,
        id_shift: transaction.shiftId || transaction.id_shift || "" // Menghubungkan transaksi ke ID Shift aktif
      })
    });
  } catch (err) {
    console.error('Gagal menyimpan transaksi ke Sheet:', err);
  }
};

// =================================================================
// 2. MANAJEMEN SHIFT & KASIR (2-WAY SYNC)
// =================================================================

// Cek apakah ada shift aktif saat kasir login / aplikasi dibuka
export const checkActiveShift = async (namaKasir) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_URL')) return null;
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getActiveShift&kasir=${encodeURIComponent(namaKasir || '')}`);
    const data = await res.json();
    return data.activeShift || null; 
  } catch (error) {
    console.error("Gagal mengecek shift aktif:", error);
    return null;
  }
};

// Kirim perintah Buka Shift
export const openShift = async (shiftData) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_URL')) return null;
  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: "openShift", ...shiftData }),
    });
    return await res.json();
  } catch (error) {
    console.error("Gagal membuka shift:", error);
    return { status: "error", message: error.toString() };
  }
};

// Kirim perintah Tutup Shift
export const closeShift = async (summaryData) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_URL')) return null;
  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: "closeShift", ...summaryData }),
    });
    return await res.json();
  } catch (error) {
    console.error("Gagal menutup shift:", error);
    return { status: "error", message: error.toString() };
  }
};

// =================================================================
// 3. PENGATURAN TOKO (SETTINGS SYNC)
// =================================================================

// Ambil Pengaturan dari Google Sheets
export const fetchSettingsFromSheet = async () => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_URL')) return null;
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getSettings`);
    const data = await res.json();
    return data.status === 'success' ? data.data : null;
  } catch (error) {
    console.error("Gagal mengambil pengaturan dari Sheet:", error);
    return null;
  }
};

// Simpan Pengaturan ke Google Sheets
export const saveSettingsToSheet = async (settingsData) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_URL')) return null;
  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: "saveSettings", settings: settingsData }),
    });
    return await res.json();
  } catch (error) {
    console.error("Gagal menyimpan pengaturan ke Sheet:", error);
    return { status: "error", message: error.toString() };
  }
};