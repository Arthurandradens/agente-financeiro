const Database = require('better-sqlite3');
const db = new Database('./data/app.db');

// Testar query simples
const result = db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM transactions WHERE tipo = ? AND is_internal_transfer = 0 AND (subcategory_id <> 603 or subcategory_id is null) AND categoria = ?').get('credito', 'Investimentos');
console.log('Soma de entradas com categoria Investimentos:', result.total);

// Testar query com filtro de categoria usando IN
const result2 = db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM transactions WHERE tipo = ? AND is_internal_transfer = 0 AND (subcategory_id <> 603 or subcategory_id is null) AND categoria IN (?)').get('credito', 'Investimentos');
console.log('Soma de entradas com categoria IN Investimentos:', result2.total);

db.close();
