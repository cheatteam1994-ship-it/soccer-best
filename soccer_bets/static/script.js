// Funzione per inviare la scommessa
async function submitBet(matchId) {
    const homeInput = document.getElementById(`home-${matchId}`);
    const awayInput = document.getElementById(`away-${matchId}`);
    const walletInput = document.getElementById("wallet");

    const homeGoals = homeInput.value;
    const awayGoals = awayInput.value;
    const wallet = walletInput.value;

    if (!wallet || homeGoals === "" || awayGoals === "") {
        alert("Fill out the fields!");
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
            alert(data.message); // Mostra "Best Sent!"
            homeInput.value = "";
            awayInput.value = "";
            loadLog(); // Aggiorna subito il log
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error("Errore nell'invio:", err);
        alert("Errore di connessione al server");
    }
}

// Funzione per caricare il log dal server
async function loadLog() {
    const logContainer = document.getElementById("log-container");
    if (!logContainer) return;

    try {
        const res = await fetch("/log");
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            logContainer.innerHTML = "<p>No bets yet.</p>";
            return;
        }

        // Mostra il log nel formato corretto
        logContainer.innerHTML = data
            .map(entry => {
                return `<p>Match: ${entry.Squadre} | Score: ${entry.Risultato} | Wallet: ${entry.Wallet} | IP: ${entry.IP} | ${entry.Timestamp}</p>`;
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

    loadLog(); // Carica log all'apertura
    setInterval(loadLog, 10000); // Aggiorna log ogni 10 secondi
});



