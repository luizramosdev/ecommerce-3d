const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, 'data');
const fs = require('fs');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(path.join(dbDir, 'ecommerce.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image TEXT,
    category TEXT,
    stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// Seed products if empty
const count = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
if (count === 0) {
  const insert = db.prepare('INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)');
  const products = [
    ['Dragon Warrior', 'Action figure de dragão guerreiro impresso em 3D com detalhes premium', 189.90, 'https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?w=600', 'Action Figures', 15],
    ['Samurai Legend', 'Miniatura de samurai com armadura detalhada em resina', 249.90, 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=600', 'Action Figures', 10],
    ['Mecha Robot X', 'Robô mecha articulado com acabamento metálico', 329.90, 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600', 'Action Figures', 8],
    ['Fantasy Castle', 'Castelo medieval para cenários de RPG', 459.90, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600', 'Cenários', 5],
    ['Space Marine', 'Soldado espacial com armas customizáveis', 199.90, 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600', 'Action Figures', 20],
    ['Elven Archer', 'Arqueira élfica com arco e flechas detalhados', 179.90, 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600', 'Miniaturas', 12],
    ['Cyberpunk City Block', 'Bloco urbano cyberpunk para dioramas', 389.90, 'https://images.unsplash.com/photo-1480044965905-02098d419e96?w=600', 'Cenários', 6],
    ['Phoenix Rising', 'Fênix em chamas com base iluminada LED', 549.90, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600', 'Colecionáveis', 3],
  ];
  const insertMany = db.transaction((items) => {
    for (const p of items) insert.run(...p);
  });
  insertMany(products);
}

// Seed admin user
const admin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@3dstore.com');
if (!admin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin', 'admin@3dstore.com', hash, 'admin');
}

module.exports = db;
