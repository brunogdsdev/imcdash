
async function carregarGraficoMes(inicio, fim, ano) {
    try {
        const resp = await fetch(`/api/sheets/por-mes?inicio=${inicio}&fim=${fim}&ano=${ano}`);
        if (!resp.ok) {
            console.error("Erro ao buscar dados do gráfico:", resp.status);
            return;
        }
        
        const data = await resp.json();
        
        if (!data || data.length === 0) {
            console.warn("Nenhum dado retornado para o gráfico");
            return;
        }

        const labels = data.map(item => item.mes);
        const valores = data.map(item => item.total);

        const canvas = document.getElementById("graficoMes");
        if (!canvas) {
            console.error("Canvas 'graficoMes' não encontrado");
            return;
        }

        // Verificar se Chart.js está carregado
        if (typeof Chart === 'undefined') {
            console.error("Chart.js não está carregado");
            return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            console.error("Não foi possível obter o contexto 2D");
            return;
        }

        // Destruir gráfico anterior se existir
        if (graficoMesAtual) {
            graficoMesAtual.destroy();
            graficoMesAtual = null;
        }

        // Aguardar um pouco para garantir que o canvas está pronto
        await new Promise(resolve => setTimeout(resolve, 100));

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
            plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : [],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    ...(typeof ChartDataLabels !== 'undefined' ? {
                        datalabels: {
                            color: "#555",
                            anchor: "end",
                            align: "top",
                            font: {
                                weight: "bold",
                                size: 12
                            },
                            formatter: (value) => value
                        }
                    } : {}),
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }

        });
    } catch (error) {
        console.error("Erro ao carregar gráfico:", error);
    }
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

async function carregarTodosOsCards(inicio, fim, ano) {
    try {
        await Promise.all([
            carregarContagem(inicio, fim, ano),
            getTotal("culto", 3, inicio, fim, ano),
            getTotal("representante", 4, inicio, fim, ano),
            getTotal("classe", 5, inicio, fim, ano)
        ]);
        // Carregar gráfico por último para garantir que Chart.js está pronto
        await carregarGraficoMes(inicio, fim, ano);
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}



    // Função de inicialização
    function inicializarVisitantes() {
        const ano = parseInt(document.getElementById("filtroAno")?.value || "2026", 10);
        const anoStr = ano.toString();
        
        // Atualizar título inicial
        const headerTitle = document.querySelector(".header-titulo");
        if (headerTitle) {
            headerTitle.textContent = `VISITANTES ${ano}`;
        }
        
        // Adicionar event listeners (usando onclick para evitar duplicatas)
        const btnFiltrar = document.getElementById("btnFiltrar");
        if (btnFiltrar && !btnFiltrar.onclick) {
            btnFiltrar.onclick = () => {
                const inicioInput = document.getElementById("dataInicio").value;
                const fimInput = document.getElementById("dataFim").value;

                if (!inicioInput || !fimInput) {
                    alert("Selecione as duas datas!");
                    return;
                }

                recarregarDadosVisitantes();
            };
        }

        // Atualizar título e recarregar dados quando o ano mudar
        const filtroAno = document.getElementById("filtroAno");
        if (filtroAno && !filtroAno.onchange) {
            filtroAno.onchange = () => {
                const anoSelecionado = parseInt(filtroAno.value || "2026", 10);
                const headerTitle = document.querySelector(".header-titulo");
                if (headerTitle) {
                    headerTitle.textContent = `VISITANTES ${anoSelecionado}`;
                }
                // Atualizar datas padrão baseadas no ano
                document.getElementById("dataInicio").value = `${anoSelecionado}-01-01`;
                document.getElementById("dataFim").value = `${anoSelecionado}-12-31`;
                // Recarregar dados automaticamente
                recarregarDadosVisitantes();
            };
        }
        
        // Carregar dados iniciais automaticamente
        console.log("Carregando dados iniciais para o ano", ano);
        carregarTodosOsCards(`01/01/${anoStr}`, `31/12/${anoStr}`, ano);
    }

    // Aguardar tudo estar pronto
    window.addEventListener('load', () => {
        // Aguardar um pouco para garantir que Chart.js está carregado
        setTimeout(() => {
            inicializarVisitantes();
        }, 200);
    });
