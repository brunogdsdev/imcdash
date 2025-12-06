// membros.js

let dadosNomes = {}; // Armazena os dados de nomes recebidos da API

async function carregarContagem() {
    try {
        console.log("Carregando contagem...");
        const resp = await fetch(`/api/membros/contagem`);

        if (!resp.ok) {
            throw new Error(`HTTP error! status: ${resp.status}`);
        }

        const data = await resp.json();
        console.log("Dados recebidos:", data);

        // Armazena os dados de nomes
        dadosNomes = data.nomes || {};

        document.getElementById("total").innerText = data.total;
        formatarCampo("batizado", data.batizado, "batizados", "nao-batizados");
        formatarCampo("foto", data.foto, "foto", "sem-foto");
        formatarCampo("carteirinha", data.carteirinha, "carteirinha", "sem-carteirinha");
    } catch (error) {
        console.error("Erro ao carregar contagem:", error);
        document.getElementById("total").innerText = "Erro";
        document.getElementById("batizado").innerText = "Erro";
        document.getElementById("foto").innerText = "Erro";
        document.getElementById("carteirinha").innerText = "Erro";
    }
}

function formatarCampo(id, valor, chaveVerde, chaveVermelho) {
    // Separa os números antes e depois da barra
    const [primeiro, segundo] = valor.split("/");

    // Monta o HTML com cores e torna clicável
    document.getElementById(id).innerHTML = `
        <span class="numero-clicavel" style="color: green; font-weight: bold; cursor: pointer;" 
              data-chave="${chaveVerde}">${primeiro}</span>
        /
        <span class="numero-clicavel" style="color: red; font-weight: bold; cursor: pointer;" 
              data-chave="${chaveVermelho}">${segundo}</span>
    `;
}

function mostrarListaNomes(chave, titulo) {
    const nomes = dadosNomes[chave] || [];
    const modal = document.getElementById("modalLista");
    const modalTitulo = document.getElementById("modalTitulo");
    const modalListaNomes = document.getElementById("modalListaNomes");

    modalTitulo.textContent = titulo;
    modalListaNomes.innerHTML = "";

    if (nomes.length === 0) {
        modalListaNomes.innerHTML = "<li style='text-align: center; color: #999;'>Nenhum membro encontrado</li>";
    } else {
        nomes.forEach(nome => {
            const li = document.createElement("li");
            li.textContent = nome;
            modalListaNomes.appendChild(li);
        });
    }

    modal.style.display = "block";
}

function fecharModal() {
    document.getElementById("modalLista").style.display = "none";
}

async function carregarMembrosTudo() {
    await Promise.all([
        carregarContagem(),
    ]);
}

// carregar padrão (todo ano) quando a página inicializar
window.addEventListener("DOMContentLoaded", () => {
    carregarMembrosTudo();

    // Adiciona event listeners para os números clicáveis
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("numero-clicavel")) {
            const chave = e.target.getAttribute("data-chave");
            let titulo = "";

            // Define o título baseado na chave
            switch(chave) {
                case "batizados":
                    titulo = "Membros Batizados";
                    break;
                case "nao-batizados":
                    titulo = "Membros Não Batizados";
                    break;
                case "carteirinha":
                    titulo = "Membros com Carteirinha";
                    break;
                case "sem-carteirinha":
                    titulo = "Membros sem Carteirinha";
                    break;
                case "foto":
                    titulo = "Membros com Foto";
                    break;
                case "sem-foto":
                    titulo = "Membros sem Foto";
                    break;
                default:
                    titulo = "Lista de Membros";
            }

            mostrarListaNomes(chave, titulo);
        }
    });

    // Fechar modal ao clicar no X
    document.querySelector(".modal-lista-close").addEventListener("click", fecharModal);

    // Fechar modal ao clicar fora dele
    document.getElementById("modalLista").addEventListener("click", (e) => {
        if (e.target.id === "modalLista") {
            fecharModal();
        }
    });
});
