
async function carregarGraficoMes(inicio, fim, ano) {
    try {
        console.log("Carregando gráfico com parâmetros:", { inicio, fim, ano });
        const resp = await fetch(`/api/sheets/por-mes?inicio=${inicio}&fim=${fim}&ano=${ano}`);
        if (!resp.ok) {
            console.error("Erro ao buscar dados do gráfico:", resp.status);
            return;
        }

        let data = await resp.json();
        console.log("Dados recebidos do gráfico:", data);

        if (!data || data.length === 0) {
            console.warn("Nenhum dado retornado para o gráfico");
            // Criar gráfico vazio mesmo assim
            data = [];
        }

        const labels = data.length > 0 ? data.map(item => item.mes) : [];
        const valores = data.length > 0 ? data.map(item => item.total) : [];

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

        console.log("Criando gráfico com labels:", labels, "e valores:", valores);

        graficoMesAtual = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels.length > 0 ? labels : ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
                datasets: [{
                    label: "Visitas por mês",
                    data: valores.length > 0 ? valores : [],
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

        console.log("Gráfico criado com sucesso!");
    } catch (error) {
        console.error("Erro ao carregar gráfico:", error);
        console.error("Stack trace:", error.stack);
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
    console.log("Inicializando visitantes...");
    const ano = parseInt(document.getElementById("filtroAno")?.value || "2026", 10);
    const anoStr = ano.toString();

    // Atualizar título inicial
    const headerTitle = document.querySelector(".header-titulo");
    if (headerTitle) {
        headerTitle.textContent = `VISITANTES ${ano}`;
    }

    // Adicionar event listeners
    const btnFiltrar = document.getElementById("btnFiltrar");
    if (btnFiltrar) {
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
    if (filtroAno) {
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

// Função para aguardar Chart.js e inicializar
let tentativasChart = 0;
const maxTentativasChart = 50; // 5 segundos máximo

function aguardarEInicializar() {
    tentativasChart++;
    console.log(`Verificando Chart.js (tentativa ${tentativasChart}/${maxTentativasChart})...`);

    if (typeof Chart !== 'undefined') {
        console.log("Chart.js disponível, inicializando...");
        setTimeout(() => inicializarVisitantes(), 100);
    } else if (tentativasChart < maxTentativasChart) {
        setTimeout(aguardarEInicializar, 100);
    } else {
        console.warn("Chart.js não carregou após timeout, inicializando mesmo assim...");
        inicializarVisitantes();
    }
}

// Executar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM carregado, iniciando verificação...");
        aguardarEInicializar();
    });
} else {
    // DOM já está pronto
    console.log("DOM já pronto, iniciando verificação...");
    aguardarEInicializar();
}
