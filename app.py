#importing required libraries

from flask import Flask, request, render_template
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn import metrics 
import warnings
import pickle
warnings.filterwarnings('ignore')
from feature import FeatureExtraction
file = open("model.pkl","rb")
gbc = pickle.load(file)
file.close()
app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes and origins
# Your existing routes here ...
@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        url = request.form["url"]
        obj = FeatureExtraction(url)
        x = np.array(obj.getFeaturesList()).reshape(1,30)  
        y_pred =gbc.predict(x)[0]
        #1 is safe       
        #-1 is unsafe
        y_pro_phishing = gbc.predict_proba(x)[0,0]
        y_pro_non_phishing = gbc.predict_proba(x)[0,1]
        # if(y_pred ==1 ):
        pred = "It is {0:.2f} % safe to go ".format(y_pro_phishing*100)
        return render_template('index.html',xx =round(y_pro_non_phishing,2),url=url )
    return render_template("index.html", xx =-1)
from flask import jsonify
@app.route("/api/check_url", methods=["POST"])
def check_url():
    data = request.get_json()
    url = data.get("url", "")
    if not url:
        return jsonify({"error": "URL is required"}), 400
    obj = FeatureExtraction(url)
    x = np.array(obj.getFeaturesList()).reshape(1, 30)
    y_pred = gbc.predict(x)[0]
    y_pro_phishing = gbc.predict_proba(x)[0, 0]
    y_pro_non_phishing = gbc.predict_proba(x)[0, 1]
    return jsonify({
        "url": url,
        "prediction": int(y_pred),  # 1 safe, -1 phishing
        "probability_safe": round(float(y_pro_non_phishing), 2),
        "probability_phishing": round(float(y_pro_phishing), 2)
    })
if __name__ == "__main__":
    app.run(debug=True)