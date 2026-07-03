const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./futebol.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS jogadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS jogos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    horario TEXT NOT NULL,
    local TEXT,
    ativo INTEGER DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
)
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS presencas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jogo_id INTEGER NOT NULL,
      jogador_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(jogo_id, jogador_id),
      FOREIGN KEY (jogo_id) REFERENCES jogos(id),
      FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
    )
  `);
});

module.exports = db;