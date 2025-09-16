from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import os
import json

app = Flask(__name__)
CORS(app)

# --- GOOGLE SHEETS (legge dalle variabili d'ambiente) ---
creds_json = os.environ.get("GOOGLE_CREDENTIALS")
if not creds_json:
    raise ValueError("Variabile d'ambiente GOOGLE_CREDENTIALS non trovata!")

creds_dict = json.loads(creds_json)

scope = ["https://spreadsheets.google.com/feeds",
         "https://www.googleapis.com/auth/spreadsheets",
         "https://www.googleapis.com/auth/drive.file",
         "https://www.googleapis.com/auth/drive"]

creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
client = gspread.authorize(creds)
sheet = client.open("SoccerBets").sheet1

# --- PARTITE ---
matches = [
    {"id": 1, "home": "Juventus", "away": "Borussia Dortmund", "time": "Oggi 21:00"},
    {"id": 2, "home": "Benfica", "away": "Qarabağ", "time": "Oggi 21:00"},
    {"id": 3, "home": "Tottenham", "away": "Villarreal", "time": "Oggi 21:00"},
    {"id": 4, "home": "Real Madrid", "away": "Olympique Marsiglia", "time": "Oggi 21:00"},
]

@app.route('/')
def index():
    return render_template("index.html", matches=matches)

@app.route('/submit', methods=['POST'])
def submit():
    data = request.json
    match_id = int(data.get("match_id"))
    home_goals = data.get("home_goals")
    away_goals = data.get("away_goals")
    wallet = data.get("wallet")
    ip = request.remote_addr

    # Validazione numeri >= 0
    if home_goals is None or away_goals is None or wallet is None:
        return jsonify({"status":"error", "message":"Dati mancanti"}), 400
    try:
        home_goals = int(home_goals)
        away_goals = int(away_goals)
        if home_goals < 0 or away_goals < 0:
            raise ValueError
    except:
        return jsonify({"status":"error", "message":"I gol devono essere numeri >= 0"}), 400

    # Controllo IP
    records = sheet.get_all_records()
    for r in records:
        if int(r['Partita']) == match_id and r['IP'] == ip:
            return jsonify({"status":"error", "message":"Hai già scommesso su questa partita"}), 400

    # Salvataggio
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    result = f"{home_goals}-{away_goals}"
    sheet.append_row([match_id, result, wallet, ip, timestamp])

    return jsonify({"status":"success", "message":"Scommessa inviata!"})

@app.route('/log')
def log():
    records = sheet.get_all_records()
    return jsonify(records)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
