// presenca.js
let chartPresenca = null;

function getRangeParams() {
    const s = parseInt(document.getElementById("startMonth").value || "1", 10);
    const e = parseInt(document.getElementById("endMonth").value || "12", 10);
    return { start: Math.min(s,e), end: Math.max(s,e) };
}

async function carregarPresencaTudo() {
    const { start, end } = getRangeParams();

    await Promise.all([

        carregarTabelaPresencaMensal(start, end),
        carregarRanking(start, end),
        carregarGraficoMensal(start, end),
        carregarHistorico(start, end)
    ]);
}


async function carregarRanking(start, end) {
    const resp = await fetch(`/api/presenca/ranking?start=${start}&end=${end}`);
    const arr = await resp.json();
    const tbody = document.getElementById("ranking-presenca");
    if (!tbody) return;
    tbody.innerHTML = "";
    arr.forEach((item, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${idx+1}. ${item.nome}</td><td>${item.total}</td>`;
        tbody.appendChild(tr);
    });
}
async function carregarHistorico(start, end) {
    const resp = await fetch(`/api/history/get-history?start=${start}&end=${end}`);
    const arr = await resp.json();
    const tbody = document.getElementById("tabela-historico");

    if (!tbody) return;
    tbody.innerHTML = "";
    arr.forEach((item, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${item[0]}</td><td>${item[1]}</td><td>${item[3]}</td><td>${item[2]}</td>`;
        tbody.appendChild(tr);
    });
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

// evento do botão
document.getElementById("aplicarFiltro").addEventListener("click", () => {
    carregarPresencaTudo();
});

// carregar padrão (todo ano) quando a página inicializar
window.addEventListener("DOMContentLoaded", () => {
    // defaults: start=1 end=12
    document.getElementById("startMonth").value = "1";
    document.getElementById("endMonth").value = "12";
    carregarPresencaTudo();
});
