from flask import Flask, render_template, url_for, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import uuid
import datetime

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
db = SQLAlchemy(app)

class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True, unique=True)
    uuid = db.Column(db.String(36), nullable=False, unique=True)
    finished = db.Column(db.Boolean, default=False, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    rounds = db.relationship("Round", backref="parent_game", lazy=True)

class Round(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.Integer, nullable=False)
    selected = db.Column(db.String(length=15), nullable=False)
    value = db.Column(db.Integer, nullable=False)
    deltaTime = db.Column(db.Float, nullable=False)
    game = db.Column(db.Integer, db.ForeignKey("game.id"), nullable=False)

with app.app_context():
    db.create_all()

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")
        
@app.route("/start_game", methods=["GET"])
def start_game():
    new_uuid = uuid.uuid4().hex
    while True:
        matching_uuids = Game.query.filter_by(uuid=new_uuid).all()
        if len(matching_uuids) > 0:
            new_uuid = uuid.uuid4().hex
        else:
            break
    
    try:
        new_game = Game(uuid=new_uuid)
        db.session.add(new_game)
        db.session.commit()
        return jsonify(uuid=new_uuid)
    except:
        return "There was an issue starting the game"

if __name__ == "__main__":
    app.run(debug=True)