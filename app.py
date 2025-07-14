from flask import Flask, render_template, url_for, request
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///test.db"
db = SQLAlchemy(app)

class GameLog(db.Model):
    round = db.Column(db.Integer, primary_key=True, )
    selected = db.Column(db.String(15), nullable=False)
    value = db.Column(db.Integer)
    deltaTime = db.Column(db.Float)

@app.route("/", methods=["POST", "GET"])
def index():
    if request.method == "POST":
        pass
    else:
        return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)