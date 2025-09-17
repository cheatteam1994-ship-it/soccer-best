// Funzione per inviare scommessa
async function submitBet(matchId) {
    const homeInput = document.getElementById(`home-${matchId}`);
    const awayInput = document.getElementById(`away-${matchId}`);
    const walletInput = document.getElementById("wallet");

    const homeGoals = homeInput.value;
    const awayGoals = awayInput.value;
    const wallet = walletInput.value;

    if (!wallet || homeGoals === "" || awayGoals === "") {
        alert("Compila tutti i campi!");
        return;
    }

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
            homeInput.value = "";
            awayInput.value = "";
            loadLog();
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error("Errore nell'invio:", err);
        alert("Errore di connessione al server");
    }
}

// Funzione per caricare il log
async function loadLog() {
    const logContainer = document.getElementById("log-container");
    if (!logContainer) return;

    try {
        const res = await fetch("/log");
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            logContainer.innerHTML = "<p>Nessuna scommessa ancora.</p>";
            return;
        }

        logContainer.innerHTML = data
            .map(entry => {
                return `<p>Partita: ${entry.Squadre} | Risultato: ${entry.Risultato} | Wallet: ${entry.Wallet} | IP: ${entry.IP} | ${entry.Timestamp}</p>`;
            })
            .join("");
    } catch (err) {
        console.error("Errore caricamento log:", err);
        logContainer.innerHTML = "Errore nel caricamento del log.";
    }
}

// Eventi
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".bet-button").forEach(btn => {
        btn.addEventListener("click", () => submitBet(btn.dataset.matchId));
    });

    loadLog();
    setInterval(loadLog, 10000); // Aggiorna log ogni 10 secondi
});
