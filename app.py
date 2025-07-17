from flask import Flask, render_template, url_for, request
from flask_sqlalchemy import SQLAlchemy
import uuid
import datetime

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
db = SQLAlchemy(app)

class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), nullable=False)
    finished = db.Column(db.Boolean, default=False, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    rounds = db.relationship("Round", backref="game", lazy=True)

class Round(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.Integer, nullable=False)
    selected = db.Column(db.String(length=15), nullable=False)
    value = db.Column(db.Integer, nullable=False)
    deltaTime = db.Column(db.Float, nullable=False)
    game = db.Column(db.Integer, db.ForeignKey("game.id"), nullable=False)

with app.app_context():
    db.create_all()

@app.route("/", methods=["POST", "GET"])
def index():
    if request.method == "POST":
        pass
    else:
        return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)