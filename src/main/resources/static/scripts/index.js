
async function carregarGraficoMes(inicio, fim, ano) {
    const resp = await fetch(`/api/sheets/por-mes?inicio=${inicio}&fim=${fim}&ano=${ano}`);
    const data = await resp.json();

    const labels = data.map(item => item.mes);
    const valores = data.map(item => item.total);

    const ctx = document.getElementById("graficoMes").getContext("2d");

    // Destruir gráfico anterior se existir
    if (graficoMesAtual) {
        graficoMesAtual.destroy();
        graficoMesAtual = null;
    }

    graficoMesAtual = new Chart(ctx, {
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


    async function carregarContagem(inicio, fim, ano) {
        const resp = await fetch(`/api/sheets/contagem?inicio=${inicio}&fim=${fim}&ano=${ano}`);
        const total = await resp.text();

        document.getElementById("contador").innerText = total;
    }


    async function getTotal(chave, index, inicio, fim, ano) {
        const resp = await fetch(`/api/sheets/get-total?chave=${chave}&index=${index}&inicio=${inicio}&fim=${fim}&ano=${ano}`);
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



// Variável para armazenar a instância do gráfico
let graficoMesAtual = null;

// Função para recarregar dados quando o ano mudar
function recarregarDadosVisitantes() {
    const inicioInput = document.getElementById("dataInicio").value;
    const fimInput = document.getElementById("dataFim").value;
    const ano = parseInt(document.getElementById("filtroAno").value || "2026", 10);

    if (!inicioInput || !fimInput) {
        return;
    }

    // Atualizar título do header
    const headerTitle = document.querySelector(".header-titulo");
    if (headerTitle) {
        headerTitle.textContent = `VISITANTES ${ano}`;
    }

    // Converter para formato dd/MM/yyyy esperado pelo backend
    const inicio = formatarData(inicioInput);
    const fim = formatarData(fimInput);

    carregarTodosOsCards(inicio, fim, ano);
}

// Função para converter YYYY-MM-DD (HTML date) para dd/MM/yyyy
function formatarData(dataHtml) {
    const [ano, mes, dia] = dataHtml.split("-");
    return `${dia}/${mes}/${ano}`;
}

function carregarTodosOsCards(inicio, fim, ano) {
        carregarContagem(inicio, fim, ano);
        getTotal("culto", 3, inicio, fim, ano);
        getTotal("representante", 4, inicio, fim, ano);
        getTotal("classe", 5, inicio, fim, ano);
        carregarGraficoMes(inicio, fim, ano);
}



    window.onload = () => {
        const ano = parseInt(document.getElementById("filtroAno").value || "2026", 10);
        const anoStr = ano.toString();
        // Atualizar título inicial
        const headerTitle = document.querySelector(".header-titulo");
        if (headerTitle) {
            headerTitle.textContent = `VISITANTES ${ano}`;
        }
        
        // Adicionar event listeners
        document.getElementById("btnFiltrar").addEventListener("click", () => {
            const inicioInput = document.getElementById("dataInicio").value;
            const fimInput = document.getElementById("dataFim").value;

            if (!inicioInput || !fimInput) {
                alert("Selecione as duas datas!");
                return;
            }

            recarregarDadosVisitantes();
        });

        // Atualizar título e recarregar dados quando o ano mudar
        document.getElementById("filtroAno").addEventListener("change", () => {
            const anoSelecionado = parseInt(document.getElementById("filtroAno").value || "2026", 10);
            const headerTitle = document.querySelector(".header-titulo");
            if (headerTitle) {
                headerTitle.textContent = `VISITANTES ${anoSelecionado}`;
            }
            // Atualizar datas padrão baseadas no ano
            document.getElementById("dataInicio").value = `${anoSelecionado}-01-01`;
            document.getElementById("dataFim").value = `${anoSelecionado}-12-31`;
            // Recarregar dados automaticamente
            recarregarDadosVisitantes();
        });
        
        carregarTodosOsCards(`01/01/${anoStr}`, `31/12/${anoStr}`, ano);
    };
