// presenca.js
let chartPresenca = null;
let dadosRankingOriginal = [];
let dadosHistoricoOriginal = [];
let inicializado = false;

function getRangeParams() {
    const s = parseInt(document.getElementById("startMonth").value || "1", 10);
    const e = parseInt(document.getElementById("endMonth").value || "12", 10);
    return { start: Math.min(s,e), end: Math.max(s,e) };
}

async function carregarPresencaTudo() {
    const { start, end } = getRangeParams();
    
    // Resetar filtros quando recarregar dados
    const filtroNome = document.getElementById("filtro-nome-ranking");
    const filtroData = document.getElementById("filtro-data-historico");
    if (filtroNome) filtroNome.value = "";
    if (filtroData) filtroData.value = "";

    await Promise.all([

        carregarTabelaPresencaMensal(start, end),
        carregarRanking(start, end),
        carregarGraficoMensal(start, end),
        carregarHistorico(start, end)
    ]);
    
    // Garantir que os listeners estejam anexados após recarregar
    anexarListenersFiltros();
}


async function carregarRanking(start, end) {
    const filtroInput = document.getElementById("filtro-nome-ranking");
    const filtroNome = filtroInput ? filtroInput.value.trim() : "";
    
    // Construir URL com filtro
    let url = `/api/presenca/ranking?start=${start}&end=${end}`;
    if (filtroNome) {
        url += `&nome=${encodeURIComponent(filtroNome)}`;
    }
    
    const resp = await fetch(url);
    const arr = await resp.json();
    dadosRankingOriginal = arr || [];
    
    const tbody = document.getElementById("ranking-presenca");
    if (!tbody) {
        console.error("Tabela ranking não encontrada");
        return;
    }
    
    tbody.innerHTML = "";
    
    dadosRankingOriginal.forEach((item, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${idx+1}. ${item.nome}</td><td>${item.total}</td>`;
        tbody.appendChild(tr);
    });
}

function aplicarFiltroRanking() {
    const { start, end } = getRangeParams();
    carregarRanking(start, end);
}
async function carregarHistorico(start, end) {
    const filtroInput = document.getElementById("filtro-data-historico");
    const filtroData = filtroInput ? filtroInput.value.trim() : "";
    
    // Construir URL com filtro
    let url = `/api/history/get-history?start=${start}&end=${end}`;
    if (filtroData) {
        url += `&data=${encodeURIComponent(filtroData)}`;
    }
    
    const resp = await fetch(url);
    const arr = await resp.json();
    dadosHistoricoOriginal = arr || [];
    
    const tbody = document.getElementById("tabela-historico");
    if (!tbody) {
        console.error("Tabela histórico não encontrada");
        return;
    }
    
    tbody.innerHTML = "";
    
    dadosHistoricoOriginal.forEach((item, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${item[0]}</td><td>${item[1]}</td><td>${item[3]}</td><td>${item[2]}</td>`;
        tbody.appendChild(tr);
    });
}

function aplicarFiltroHistorico() {
    const { start, end } = getRangeParams();
    carregarHistorico(start, end);
}


async function carregarTabelaPresencaMensal(inicio, fim) {
    try {
        const url = `/api/presenca/mensal?inicio=${inicio}&fim=${fim}`;

        console.log("Buscando:", url);

        const response = await fetch(url);

        if (!response.ok) {
            console.error("Erro no fetch:", response.status);
            return;
        }

        const dados = await response.json();

        console.log("Retorno do backend:", dados);

        montarTabelaPresencaMensal(dados);

    } catch (e) {
        console.error("Erro carregarTabelaPresencaMensal:", e);
    }
}

function montarTabelaPresencaMensal(dados) {
    const head = document.getElementById("tabela-presenca-mensal-head");
    const body = document.getElementById("tabela-presenca-mensal-body");

    head.innerHTML = "";
    body.innerHTML = "";

    if (!dados || dados.length === 0) {
        head.innerHTML = "<tr><th>Mês</th><th>Total</th></tr>";
        body.innerHTML = "<tr><td colspan='2'>Nenhum dado</td></tr>";
        return;
    }

    const classes = Object.keys(dados[0].classes);

    let headHTML = "<tr><th>Mês</th><th>Total</th>";
    classes.forEach(c => headHTML += `<th>${c}</th>`);
    headHTML += "</tr>";
    head.innerHTML = headHTML;

    dados.forEach(item => {
        let row = `<tr>
            <td>${item.mes}</td>
            <td><b>${item.total}</b></td>
        `;

        classes.forEach(c => {
            row += `<td>${item.classes[c] || 0}</td>`;
        });

        row += "</tr>";
        body.innerHTML += row;
    });
}


async function carregarGraficoMensal(start, end) {
    const resp = await fetch(`/api/presenca/mensal?start=${start}&end=${end}`);
    const arr = await resp.json();
    const labels = arr.map(i => i.mes);
    const valores = arr.map(i => i.total);

    const ctx = document.getElementById("graficoPresencaMes").getContext("2d");

    // se já existe, atualiza
    if (chartPresenca) {
        chartPresenca.data.labels = labels;
        chartPresenca.data.datasets[0].data = valores;
        chartPresenca.update();
        return;
    }

    chartPresenca = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Presenças',
                data: valores,
                fill: false,
                borderColor: '#2c7be5',
                backgroundColor: '#2c7be5',
                tension: 0.2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: '#000',
                    font: { weight: 'bold' },
                    formatter: v => v
                }
            }
        },
        plugins: [ChartDataLabels] // só se você carregou o plugin
    });
}

// Função para anexar listeners dos filtros
function anexarListenersFiltros() {
    // Adicionar listeners para os filtros
    const filtroNomeRanking = document.getElementById("filtro-nome-ranking");
    if (filtroNomeRanking) {
        // Remover listener anterior se existir (para evitar duplicatas)
        const handlerRanking = () => aplicarFiltroRanking();
        filtroNomeRanking.removeEventListener("input", handlerRanking);
        filtroNomeRanking.addEventListener("input", handlerRanking);
        console.log("Listener de filtro de nome adicionado");
    } else {
        console.error("Campo de filtro de nome não encontrado");
    }
    
    const filtroDataHistorico = document.getElementById("filtro-data-historico");
    if (filtroDataHistorico) {
        // Remover listener anterior se existir (para evitar duplicatas)
        const handlerHistorico = () => aplicarFiltroHistorico();
        filtroDataHistorico.removeEventListener("change", handlerHistorico);
        filtroDataHistorico.addEventListener("change", handlerHistorico);
        console.log("Listener de filtro de data adicionado");
    } else {
        console.error("Campo de filtro de data não encontrado");
    }
}

// Função para inicializar tudo
function inicializar() {
    // Evitar inicialização múltipla
    if (inicializado) return;
    inicializado = true;
    
    // defaults: start=1 end=12
    const startMonth = document.getElementById("startMonth");
    const endMonth = document.getElementById("endMonth");
    if (startMonth) startMonth.value = "1";
    if (endMonth) endMonth.value = "12";
    
    // Evento do botão aplicar filtro
    const aplicarFiltroBtn = document.getElementById("aplicarFiltro");
    if (aplicarFiltroBtn) {
        aplicarFiltroBtn.addEventListener("click", () => {
            carregarPresencaTudo();
        });
    }
    
    // Anexar listeners dos filtros
    anexarListenersFiltros();
    
    // Carregar dados iniciais
    carregarPresencaTudo();
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
} else {
    // DOM já está carregado - usar setTimeout para garantir que todos os elementos estejam prontos
    setTimeout(inicializar, 100);
}
