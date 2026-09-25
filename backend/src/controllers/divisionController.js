const { db, collection, getDocs, doc, setDoc, updateDoc, deleteDoc } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const { getLocalDateTime } = require('../utils/time');

exports.getAll = async (req, res) => {
  try {
    const divisionsRef = collection(db, 'divisions');
    const querySnapshot = await getDocs(divisionsRef);
    
    const divisions = [];
    querySnapshot.forEach((doc) => {
      divisions.push(doc.data());
    });
    
    // Sort by name if desired, or let frontend handle it
    divisions.sort((a, b) => a.name.localeCompare(b.name));
    
    res.json(divisions);
  } catch (err) {
    console.error('Get divisions error:', err);
    res.status(500).json({ error: 'Gagal mengambil data divisi.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nama divisi wajib diisi.' });
    }
    
    const id = uuidv4();
    const newDivision = {
      id,
      name: name.trim(),
      created_at: getLocalDateTime()
    };
    
    await setDoc(doc(db, 'divisions', id), newDivision);
    
    res.status(201).json({ message: 'Divisi berhasil ditambahkan.', division: newDivision });
  } catch (err) {
    console.error('Create division error:', err);
    res.status(500).json({ error: 'Gagal menambahkan divisi.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nama divisi wajib diisi.' });
    }
    
    const divRef = doc(db, 'divisions', id);
    await updateDoc(divRef, { name: name.trim() });
    
    res.json({ message: 'Divisi berhasil diupdate.' });
  } catch (err) {
    console.error('Update division error:', err);
    res.status(500).json({ error: 'Gagal mengubah divisi.' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    const divRef = doc(db, 'divisions', id);
    await deleteDoc(divRef);
    
    res.json({ message: 'Divisi berhasil dihapus.' });
  } catch (err) {
    console.error('Delete division error:', err);
    res.status(500).json({ error: 'Gagal menghapus divisi.' });
  }
};
