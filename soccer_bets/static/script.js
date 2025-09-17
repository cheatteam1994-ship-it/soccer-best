// Funzione per caricare il log
async function loadLog() {
    try {
        const res = await fetch("/log");
        const data = await res.json();
        const logContainer = document.getElementById("log");
        logContainer.innerHTML = "";

        if (Array.isArray(data) && data.length > 0) {
            data.forEach(row => {
                const div = document.createElement("div");
                div.className = "p-2 border-b";
                div.textContent =
                    `${row["Squadre"]} | Risultato: ${row["Risultato"]} | Wallet: ${row["Wallet"]} | IP: ${row["IP"]} | ${row["Timestamp"]}`;
                logContainer.appendChild(div);
            });
        } else {
            logContainer.innerHTML = "<p>Nessuna scommessa ancora.</p>";
        }
    } catch (err) {
        console.error("Errore nel caricamento del log:", err);
    }
}

// Funzione per inviare la scommessa
async function submitBet(matchId) {
    const homeInput = document.getElementById(`home-${matchId}`);
    const awayInput = document.getElementById(`away-${matchId}`);
    const walletInput = document.getElementById("wallet");

    const homeGoals = homeInput.value;
    const awayGoals = awayInput.value;
    const wallet = walletInput.value;

    try {
        const res = await fetch("/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                match_id: matchId,
                home_goals: homeGoals,
                away_goals: awayGoals,
                wallet: wallet
            })
        });

        const data = await res.json();

        if (data.status === "success") {
            alert("✅ " + data.message);
            homeInput.value = "";
            awayInput.value = "";
            loadLog();
        } else {
            alert("⚠️ " + data.message);
        }
    } catch (err) {
        console.error("Errore nell'invio:", err);
        alert("❌ Errore di connessione al server");
    }
}

// Aggiunge eventi ai pulsanti
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".bet-button").forEach(btn => {
        btn.addEventListener("click", () => {
            const matchId = btn.dataset.matchId;
            submitBet(matchId);
        });
    });

    loadLog();
});
