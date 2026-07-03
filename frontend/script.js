const API_URL = "http://localhost:3000";

let jogoAtual = null;
let jogadores = [];
let jogadorAtual = JSON.parse(localStorage.getItem("jogadorAtual")) || null;

const telaLogin = document.getElementById("telaLogin");
const painelJogador = document.getElementById("painelJogador");
const selectJogador = document.getElementById("selectJogador");
const btnEntrar = document.getElementById("btnEntrar");
const btnTrocarJogador = document.getElementById("btnTrocarJogador");
const mensagemJogador = document.getElementById("mensagemJogador");

const listaConfirmados = document.getElementById("listaConfirmados");
const listaNaoVao = document.getElementById("listaNaoVao");
const listaPendentes = document.getElementById("listaPendentes");

const totalConfirmados = document.getElementById("totalConfirmados");
const totalNaoVao = document.getElementById("totalNaoVao");
const totalPendentes = document.getElementById("totalPendentes");

const btnVou = document.querySelector(".btn-vou");
const btnNao = document.querySelector(".btn-nao");

const campoData = document.querySelector(".info p:nth-child(1)");
const campoHorario = document.querySelector(".info p:nth-child(2)");
const campoLocal = document.querySelector(".info p:nth-child(3)");

async function carregarDados() {
  try {
    const resposta = await fetch(`${API_URL}/jogos/ativo/presencas`);

    if (!resposta.ok) {
      alert("Erro ao carregar dados do jogo.");
      return;
    }

    const dados = await resposta.json();
    console.log(dados);

    jogoAtual = dados.jogo;
    jogadores = dados.jogadores;

    atualizarInfoJogo();
    carregarSelectJogadores();
    validarJogadorSalvo();
    mostrarTelaCorreta();
    atualizarTela();

  } catch (erro) {
    console.error(erro);
    alert("Não foi possível conectar ao backend.");
  }
}

function atualizarInfoJogo() {
  if (!jogoAtual) return;

  campoData.innerHTML = `<strong>📅 Data:</strong> ${jogoAtual.data}`;
  campoHorario.innerHTML = `<strong>🕘 Horário:</strong> ${jogoAtual.horario}`;
  campoLocal.innerHTML = `<strong>📍 Local:</strong> ${jogoAtual.local}`;
}

function carregarSelectJogadores() {
  selectJogador.innerHTML = `<option value="">Selecione seu nome</option>`;

  jogadores.forEach((jogador) => {
    const option = document.createElement("option");
    option.value = jogador.id;
    option.textContent = jogador.nome;
    selectJogador.appendChild(option);
  });
}

function validarJogadorSalvo() {
  if (!jogadorAtual) return;

  const existe = jogadores.find((jogador) => jogador.id === jogadorAtual.id);

  if (!existe) {
    localStorage.removeItem("jogadorAtual");
    jogadorAtual = null;
  }
}

function mostrarTelaCorreta() {
  if (jogadorAtual) {
    telaLogin.classList.add("oculto");
    painelJogador.classList.remove("oculto");
    mensagemJogador.textContent = `Olá, ${jogadorAtual.nome} 👋`;
  } else {
    telaLogin.classList.remove("oculto");
    painelJogador.classList.add("oculto");
  }
}

function atualizarTela() {
  listaConfirmados.innerHTML = "";
  listaNaoVao.innerHTML = "";
  listaPendentes.innerHTML = "";

  const confirmados = jogadores.filter((jogador) => jogador.status === "confirmado");
  const naoVao = jogadores.filter((jogador) => jogador.status === "nao_vai");
  const pendentes = jogadores.filter((jogador) => jogador.status === "pendente");

  confirmados.forEach((jogador) => {
    listaConfirmados.innerHTML += `<li>✅ ${jogador.nome}</li>`;
  });

  naoVao.forEach((jogador) => {
    listaNaoVao.innerHTML += `<li>❌ ${jogador.nome}</li>`;
  });

  pendentes.forEach((jogador) => {
    listaPendentes.innerHTML += `<li>⬜ ${jogador.nome}</li>`;
  });

  totalConfirmados.textContent = confirmados.length;
  totalNaoVao.textContent = naoVao.length;
  totalPendentes.textContent = pendentes.length;
}

async function atualizarStatus(status) {
  if (!jogadorAtual) {
    alert("Escolha seu nome primeiro.");
    return;
  }

  try {
    await fetch(`${API_URL}/presencas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jogo_id: jogoAtual.id,
        jogador_id: jogadorAtual.id,
        status
      })
    });

    await carregarDados();

  } catch (erro) {
    console.error(erro);
    alert("Erro ao atualizar presença.");
  }
}

btnEntrar.addEventListener("click", () => {
  const idEscolhido = Number(selectJogador.value);

  if (!idEscolhido) {
    alert("Selecione seu nome.");
    return;
  }

  jogadorAtual = jogadores.find((jogador) => jogador.id === idEscolhido);

  localStorage.setItem("jogadorAtual", JSON.stringify(jogadorAtual));

  mostrarTelaCorreta();
});

btnTrocarJogador.addEventListener("click", () => {
  localStorage.removeItem("jogadorAtual");
  jogadorAtual = null;
  mostrarTelaCorreta();
});

btnVou.addEventListener("click", () => {
  atualizarStatus("confirmado");
});

btnNao.addEventListener("click", () => {
  atualizarStatus("nao_vai");
});

carregarDados();

setInterval(carregarDados, 5000);