const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

function proximoSabado() {
  const hoje = new Date();
  const data = new Date(hoje);

  const diaSemana = data.getDay();
  let diasAteSabado = 6 - diaSemana;

  if (diasAteSabado <= 0) {
    diasAteSabado += 7;
  }

  data.setDate(data.getDate() + diasAteSabado);

  return data.toLocaleDateString("pt-BR");
}

function criarProximoJogoAutomatico(callback) {
  db.get("SELECT * FROM jogos WHERE ativo = 1 ORDER BY id DESC LIMIT 1", [], (erro, jogo) => {
    if (erro) return callback(erro);

    if (!jogo) {
      return db.run(
        "INSERT INTO jogos (data, horario, local, ativo) VALUES (?, ?, ?, 1)",
        [proximoSabado(), "09:00", "12"],
        callback
      );
    }

    const hoje = new Date();
    const partes = jogo.data.split("/");
    const dataJogo = new Date(hoje.getFullYear(), partes[1] - 1, partes[0]);

    if (hoje > dataJogo && hoje.getDay() === 0) {
      db.run("UPDATE jogos SET ativo = 0 WHERE id = ?", [jogo.id], (erro) => {
        if (erro) return callback(erro);

        db.run(
          "INSERT INTO jogos (data, horario, local, ativo) VALUES (?, ?, ?, 1)",
          [proximoSabado(), jogo.horario, jogo.local, 1],
          callback
        );
      });
    } else {
      callback(null);
    }
  });
}

app.get("/", (req, res) => {
  res.send("Backend Futebol Futsal rodando 🖤⚽");
});

app.post("/seed", (req, res) => {
  const jogadores = [
    "Alex", "Alexandre", "Claudinho", "Diogo", "Felipe Ventura",
    "Guilherme", "Homero", "Mateus Costa", "Murilo", "Pavan",
    "Pavanzinho", "Regis", "Ricardo", "Richard", "Roberto",
    "Rômulo", "Thiago Cavadinha", "Valmir", "Victor", "Vinícius",
    "Vinícius Martin", "Lucas Fernandes", "Guilherme Tristão", "Diogo Ducca"
  ];

  const stmt = db.prepare("INSERT OR IGNORE INTO jogadores (nome) VALUES (?)");

  jogadores.forEach((nome) => {
    stmt.run(nome);
  });

  stmt.finalize();

  res.json({ mensagem: "Jogadores cadastrados com sucesso!" });
});

app.get("/jogadores", (req, res) => {
  db.all("SELECT * FROM jogadores ORDER BY nome", [], (erro, jogadores) => {
    if (erro) {
      return res.status(500).json({ erro: "Erro ao buscar jogadores" });
    }

    res.json(jogadores);
  });
});

app.post("/jogos", (req, res) => {
  const { data, horario, local } = req.body;

  if (!data || !horario) {
    return res.status(400).json({ erro: "Data e horário são obrigatórios" });
  }

  db.run("UPDATE jogos SET ativo = 0");

  db.run(
    "INSERT INTO jogos (data, horario, local, ativo) VALUES (?, ?, ?, 1)",
    [data, horario, local || "A definir"],
    function (erro) {
      if (erro) {
        return res.status(500).json({ erro: "Erro ao criar jogo" });
      }

      res.status(201).json({
        id: this.lastID,
        data,
        horario,
        local: local || "A definir",
        ativo: 1
      });
    }
  );
});

app.get("/jogos/ativo", (req, res) => {
  criarProximoJogoAutomatico((erro) => {
    if (erro) {
      return res.status(500).json({ erro: "Erro ao verificar jogo automático" });
    }

    db.get("SELECT * FROM jogos WHERE ativo = 1 ORDER BY id DESC LIMIT 1", [], (erro, jogo) => {
      if (erro) {
        return res.status(500).json({ erro: "Erro ao buscar jogo ativo" });
      }

      if (!jogo) {
        return res.status(404).json({ erro: "Nenhum jogo ativo encontrado" });
      }

      res.json(jogo);
    });
  });
});

app.post("/presencas", (req, res) => {
  const { jogo_id, jogador_id, status } = req.body;

  const statusPermitidos = ["confirmado", "nao_vai"];

  if (!jogo_id || !jogador_id || !statusPermitidos.includes(status)) {
    return res.status(400).json({ erro: "Dados inválidos" });
  }

  db.run(
    `
    INSERT INTO presencas (jogo_id, jogador_id, status)
    VALUES (?, ?, ?)
    ON CONFLICT(jogo_id, jogador_id)
    DO UPDATE SET status = excluded.status
    `,
    [jogo_id, jogador_id, status],
    function (erro) {
      if (erro) {
        return res.status(500).json({ erro: "Erro ao salvar presença" });
      }

      res.json({ mensagem: "Presença atualizada com sucesso!" });
    }
  );
});

app.get("/jogos/ativo/presencas", (req, res) => {
  criarProximoJogoAutomatico((erro) => {
    if (erro) {
      return res.status(500).json({ erro: "Erro ao verificar jogo automático" });
    }

    db.get("SELECT * FROM jogos WHERE ativo = 1 ORDER BY id DESC LIMIT 1", [], (erro, jogo) => {
      if (erro || !jogo) {
        return res.status(404).json({ erro: "Nenhum jogo ativo encontrado" });
      }

      db.all("SELECT * FROM jogadores ORDER BY nome", [], (erro, jogadores) => {
        if (erro) {
          return res.status(500).json({ erro: "Erro ao buscar jogadores" });
        }

        db.all(
          "SELECT * FROM presencas WHERE jogo_id = ?",
          [jogo.id],
          (erro, presencas) => {
            if (erro) {
              return res.status(500).json({ erro: "Erro ao buscar presenças" });
            }

            const resultado = jogadores.map((jogador) => {
              const presenca = presencas.find((p) => p.jogador_id === jogador.id);

              return {
                id: jogador.id,
                nome: jogador.nome,
                status: presenca ? presenca.status : "pendente"
              };
            });

            res.json({
              jogo,
              jogadores: resultado
            });
          }
        );
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});