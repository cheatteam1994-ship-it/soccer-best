from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import os
import json

app = Flask(__name__)
CORS(app)

# --- GOOGLE SHEETS ---
creds_json = os.environ.get("GOOGLE_CREDENTIALS")
if not creds_json:
    raise ValueError("Variabile d'ambiente GOOGLE_CREDENTIALS non trovata!")

creds_dict = json.loads(creds_json)

scope = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive"
]

creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
client = gspread.authorize(creds)

sheet = client.open("SoccerBets").sheet1

# --- PARTITE ---
matches = [
    {"id": 1, "home": "Bayer Munich", "away": "Chelsea", "time": "Today 21:00"},
    {"id": 2, "home": "PSG", "away": "Atalanta", "time": "Today 21:00"},
    {"id": 3, "home": "Ajax", "away": "Inter", "time": "Today 21:00"},
    {"id": 4, "home": "Liverpool", "away": "Atlético Madrid", "time": "Today 21:00"},
]

def get_client_ip():
    if request.headers.get("X-Forwarded-For"):
        return request.headers.get("X-Forwarded-For").split(",")[0]
    return request.remote_addr

def mask_wallet(wallet):
    return "****" + wallet[-4:] if len(wallet) > 4 else wallet

def mask_ip(ip):
    parts = ip.split(".")
    if len(parts) == 4:
        return "xxx.xxx." + parts[2] + "." + parts[3]
    return ip

@app.route('/')
def index():
    return render_template("index.html", matches=matches)

@app.route('/submit', methods=['POST'])
def submit():
    try:
        data = request.json
        match_id = int(data.get("match_id"))
        home_goals = data.get("home_goals")
        away_goals = data.get("away_goals")
        wallet = data.get("wallet")
        ip = get_client_ip()

        if home_goals is None or away_goals is None or not wallet:
            return jsonify({"status": "error", "message": "Missing data"}), 400

        try:
            home_goals = int(home_goals)
            away_goals = int(away_goals)
            if home_goals < 0 or away_goals < 0:
                raise ValueError
        except:
            return jsonify({"status": "error", "message": "I gol devono essere numeri >= 0"}), 400

        match = next((m for m in matches if m["id"] == match_id), None)
        if not match:
            return jsonify({"status": "error", "message": "Partita non trovata"}), 400

        records = sheet.get_all_records(empty2zero=False)
        for r in records:
            if str(r.get("Partita", "")) == str(match_id) and r.get("IP") == ip:
                return jsonify({"status": "error", "message": "You've already bet on this match."}), 400

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        result = f"{home_goals}-{away_goals}"
        match_name = f"{match['home']} vs {match['away']}"

        # Scrive tutto nel Google Sheet
        sheet.insert_row([match_id, match_name, result, wallet, ip, timestamp], index=2)

        return jsonify({"status": "success", "message": "Bet Sent!"})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Errore server: {str(e)}"}), 500

@app.route('/log')
def log():
    try:
        records = sheet.get_all_records(empty2zero=False)
        for r in records:
            r["Wallet"] = mask_wallet(r.get("Wallet", ""))
            r["IP"] = mask_ip(r.get("IP", ""))
        return jsonify(records)
    except Exception as e:
        return jsonify({"status": "error", "message": f"Errore server: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))


