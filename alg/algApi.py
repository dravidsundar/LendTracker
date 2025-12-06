from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
from alg import LendModelV3  

app = Flask(__name__)
CORS(app)  # <--- This enables CORS for all routes

@app.route("/")
def home():
    return jsonify({"message": "Lend Model API is live!"})

@app.route("/run-model", methods=["POST"])
def run_model():
    data = request.json
    investment = data.get("investmentAmount", 50000)
    years = data.get("years", 2)

    model = LendModelV3(investment, years)
    result = model.startModelV3()

    return result

if __name__ == "__main__":
    app.run(debug=True)
