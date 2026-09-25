import React, { useState, useEffect } from 'react';
import { Building, Plus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { divisionAPI } from '../services/api';

export const AdminDivisionsPage = () => {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form add
  const [newDivision, setNewDivision] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  
  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchDivisions();
  }, []);

  const fetchDivisions = async () => {
    setLoading(true);
    try {
      const data = await divisionAPI.getAll();
      setDivisions(data);
    } catch (err) {
      console.error('Fetch divisions error:', err);
      setError('Gagal memuat data divisi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newDivision.trim()) return;
    setAddLoading(true);
    try {
      await divisionAPI.create(newDivision);
      setNewDivision('');
      fetchDivisions();
    } catch (err) {
      console.error('Add division error:', err);
      setError('Gagal menambahkan divisi.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus divisi ini?')) return;
    try {
      await divisionAPI.delete(id);
      fetchDivisions();
    } catch (err) {
      console.error('Delete division error:', err);
      setError('Gagal menghapus divisi.');
    }
  };

  const startEdit = (div) => {
    setEditingId(div.id);
    setEditName(div.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return;
    try {
      await divisionAPI.update(id, editName);
      cancelEdit();
      fetchDivisions();
    } catch (err) {
      console.error('Update division error:', err);
      setError('Gagal memperbarui divisi.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black shadow-md shadow-blue-500/30">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Manajemen Divisi</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Atur daftar divisi untuk form registrasi dan laporan.</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 mb-6">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdd} className="flex gap-3 mb-8">
          <input
            type="text"
            value={newDivision}
            onChange={(e) => setNewDivision(e.target.value)}
            placeholder="Nama Divisi Baru"
            className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            disabled={addLoading || !newDivision.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-4 w-4" /> Tambah
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-bold w-full">Nama Divisi</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900/50">
              {loading ? (
                <tr>
                  <td colSpan="2" className="px-6 py-8 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : divisions.length === 0 ? (
                <tr>
                  <td colSpan="2" className="px-6 py-8 text-center text-gray-500">Belum ada data divisi.</td>
                </tr>
              ) : (
                divisions.map((div) => (
                  <tr key={div.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors">
                    <td className="px-6 py-4">
                      {editingId === div.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{div.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === div.id ? (
                          <>
                            <button onClick={() => saveEdit(div.id)} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400">
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(div)} className="p-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(div.id)} className="p-1.5 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDivisionsPage;
