async function fetchLog() {
    const res = await fetch('/log');
    const data = await res.json();
    const logDiv = document.getElementById('log');
    logDiv.innerHTML = '';
    data.forEach(r => {
        logDiv.innerHTML += `<div>Partita ${r.Partita} | ${r.Risultato} | Wallet: ${r.Wallet} | IP: ${r.IP} | ${r.Timestamp}</div>`;
    });
}

document.querySelectorAll('.submit-btn').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
        const matchId = btn.dataset.match;
        const home = document.querySelector(`.result-home[data-match='${matchId}']`).value;
        const away = document.querySelector(`.result-away[data-match='${matchId}']`).value;
        const walletInput = document.querySelector(`.wallet[data-match='${matchId}']`);

        const payload = {
            match_id: matchId,
            home_goals: home,
            away_goals: away,
            wallet: walletInput.value
        };

        const res = await fetch('/submit', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        alert(data.message || 'Errore!');
        fetchLog();
    });
});

// Aggiorna log ogni 3 secondi
setInterval(fetchLog, 3000);
fetchLog();
