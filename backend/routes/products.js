const router = require('express').Router();
const db = require('../db');
const { auth, adminOnly } = require('../middleware');

router.get('/', (req, res) => {
  const { category, search } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (search) { sql += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(product);
});

router.post('/', auth, adminOnly, (req, res) => {
  const { name, description, price, image, category, stock } = req.body;
  const result = db.prepare('INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)').run(name, description, price, image, category, stock || 0);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id', auth, adminOnly, (req, res) => {
  const { name, description, price, image, category, stock } = req.body;
  db.prepare('UPDATE products SET name=?, description=?, price=?, image=?, category=?, stock=? WHERE id=?').run(name, description, price, image, category, stock, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
