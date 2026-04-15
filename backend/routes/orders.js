const router = require('express').Router();
const db = require('../db');
const { auth } = require('../middleware');

router.post('/', auth, (req, res) => {
  const { items } = req.body; // [{ productId, quantity }]
  if (!items?.length) return res.status(400).json({ error: 'Carrinho vazio' });

  const createOrder = db.transaction(() => {
    let total = 0;
    const validated = items.map(({ productId, quantity }) => {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
      if (!product) throw new Error(`Produto ${productId} não encontrado`);
      if (product.stock < quantity) throw new Error(`Estoque insuficiente: ${product.name}`);
      total += product.price * quantity;
      return { product, quantity };
    });

    const order = db.prepare('INSERT INTO orders (user_id, total) VALUES (?, ?)').run(req.user.id, total);
    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const { product, quantity } of validated) {
      insertItem.run(order.lastInsertRowid, product.id, quantity, product.price);
      updateStock.run(quantity, product.id);
    }
    return { orderId: order.lastInsertRowid, total };
  });

  try {
    const result = createOrder();
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/', auth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  for (const order of orders) {
    order.items = db.prepare(`
      SELECT oi.*, p.name, p.image FROM order_items oi
      JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?
    `).all(order.id);
  }
  res.json(orders);
});

module.exports = router;
