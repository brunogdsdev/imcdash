
async function carregarGraficoMes(inicio, fim) {
    const resp = await fetch(`/api/sheets/por-mes?inicio=${inicio}&fim=${fim}`);
    const data = await resp.json();

    const labels = data.map(item => item.mes);
    const valores = data.map(item => item.total);

    const ctx = document.getElementById("graficoMes").getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Visitas por mês",
                data: valores,
                borderWidth: 3,
                tension: 0.2,
                pointRadius: 5,
                pointBackgroundColor: "#2c7be5",
                borderColor: "#2c7be5",
                fill: true,
                backgroundColor: "rgba(44,123,229, .7)"

            }]
        },
        plugins: [ChartDataLabels],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    color: "#555",           // cor do número
                    anchor: "end",           // posição
                    align: "top",            // fica acima do ponto
                    font: {
                        weight: "bold",
                        size: 12
                    },
                    formatter: (value) => value
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }

    });
}


    async function carregarContagem(inicio, fim) {
        const resp = await fetch(`/api/sheets/contagem?inicio=${inicio}&fim=${fim}`);
        const total = await resp.text();

        document.getElementById("contador").innerText = total;
    }


    async function getTotal(chave, index, inicio, fim) {
        const resp = await fetch(`/api/sheets/get-total?chave=${chave}&index=${index}&inicio=${inicio}&fim=${fim}`);
        const lista = await resp.json();

        const tbody = document.getElementById(`tabela-body-${chave}`);
        const totalItens = document.getElementById(`total-itens-${chave}`);

        tbody.innerHTML = "";

        lista.forEach((item, index) => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${index + 1}.</td>
                <td>${item[chave]}</td>
                <td>${item.total}</td>
            `;

            tbody.appendChild(tr);
        });

            totalItens.textContent = `${lista.length} itens encontrados`;

    }



document.getElementById("btnFiltrar").addEventListener("click", () => {
    const inicioInput = document.getElementById("dataInicio").value;
    const fimInput = document.getElementById("dataFim").value;

    if (!inicioInput || !fimInput) {
        alert("Selecione as duas datas!");
        return;
    }

    // Converter para formato dd/MM/yyyy esperado pelo backend
    const inicio = formatarData(inicioInput);
    const fim = formatarData(fimInput);

    carregarTodosOsCards(inicio, fim);
});

// Função para converter YYYY-MM-DD (HTML date) para dd/MM/yyyy
function formatarData(dataHtml) {
    const [ano, mes, dia] = dataHtml.split("-");
    return `${dia}/${mes}/${ano}`;
}

function carregarTodosOsCards(inicio, fim) {
        carregarContagem(inicio, fim);
        getTotal("culto", 3, inicio, fim);
        getTotal("representante", 4, inicio, fim);
        getTotal("classe", 5, inicio, fim);
        carregarGraficoMes(inicio, fim);
}



    window.onload = () => {
        carregarTodosOsCards("01/01/2025", "31/12/2025");
    };
