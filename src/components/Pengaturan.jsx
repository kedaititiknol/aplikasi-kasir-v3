import React, { useState, useEffect } from 'react';
import { fetchSettingsFromSheet, saveSettingsToSheet } from '../services/api';

export default function Pengaturan() {
  const defaultSettings = {
    storeName: 'KEDAI TITIK NOL',
  address: 'Jl. Blok Gantar, RT/RW 01/01, Desa Gantar',
  phone: '0823-1598-9130',
  receiptFooter: 'Terima Kasih Atas Kunjungan Anda!'
  };

  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Fungsi untuk menarik data terbaru dari Google Sheets
  const loadDataFromSheet = async () => {
    setFetching(true);
    try {
      const data = await fetchSettingsFromSheet();
      if (data) {
        setSettings(data);
        localStorage.setItem('pos_settings', JSON.stringify(data));
        alert('Data berhasil disinkronkan dari Google Sheets!');
      } else {
        alert('Gagal mengambil data dari Google Sheets.');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat memuat data.');
    } finally {
      setFetching(false);
    }
  };

  // Ambil data otomatis saat pertama kali halaman dibuka
  useEffect(() => {
    loadDataFromSheet();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  // Simpan dan sinkronkan ke Google Sheets & LocalStorage
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem('pos_settings', JSON.stringify(settings));
      const result = await saveSettingsToSheet(settings);
      
      if (result && result.status === 'success') {
        alert('Pengaturan berhasil disinkronkan ke Google Sheets!');
      } else {
        alert('Berhasil disimpan secara lokal, tetapi gagal sinkron ke Google Sheets.');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menyinkronkan pengaturan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Informasi Outlet</h2>
        <button 
          type="button"
          onClick={loadDataFromSheet}
          disabled={fetching}
          className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition font-medium"
        >
          {fetching ? 'Memuat...' : '🔄 Ambil dari Sheet'}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Nama Toko</label>
          <input 
            type="text" 
            name="storeName" 
            value={settings.storeName} 
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white" 
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Nomor Telepon / WhatsApp</label>
          <input 
            type="text" 
            name="phone" 
            value={settings.phone} 
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white" 
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Alamat Toko</label>
          <textarea 
            name="address" 
            value={settings.address} 
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white" 
            rows="3"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Pesan Footer Struk</label>
          <input 
            type="text" 
            name="receiptFooter" 
            value={settings.receiptFooter} 
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded transition"
        >
          {loading ? 'Menyimpan...' : 'Simpan & Sinkronkan'}
        </button>
      </form>
    </div>
  );
}