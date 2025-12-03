// membros.js

async function carregarContagem() {
    const resp = await fetch(`/api/membros/contagem`);
    const data = await resp.json();


    document.getElementById("total").innerText = data.total;
    formatarCampo("batizado", data.batizado);
    formatarCampo("foto", data.foto);
    formatarCampo("carteirinha", data.carteirinha);
}
function formatarCampo(id, valor) {
    // Separa os números antes e depois da barra
    const [primeiro, segundo] = valor.split("/");

    // Monta o HTML com cores
    document.getElementById(id).innerHTML = `
        <span style="color: green; font-weight: bold;">${primeiro}</span>
        /
        <span style="color: red; font-weight: bold;">${segundo}</span>
    `;
}

async function carregarMembrosTudo() {
    await Promise.all([

        carregarContagem(),
    ]);
}

// carregar padrão (todo ano) quando a página inicializar
window.addEventListener("DOMContentLoaded", () => {
    carregarMembrosTudo();
});
