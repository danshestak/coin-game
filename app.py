from flask import Flask, render_template, url_for, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from flask_wtf.csrf import CSRFProtect
from wtforms import StringField, IntegerField, FloatField
from wtforms.validators import DataRequired, NumberRange, Length
import uuid
import datetime
import os
import random


# ---- CONFIG ----
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config['SECRET_KEY'] = os.environ.get("SECRET_KEY")
CSRFProtect(app)


# ---- DATABASE ----
db = SQLAlchemy(app)

class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True, unique=True)
    uuid = db.Column(db.String(32), nullable=False, unique=True)
    csv = db.Column(db.String(12), nullable=False)
    finished = db.Column(db.Boolean, default=False, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    rounds = db.relationship("Round", backref="parent_game", lazy=True)

class Round(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.Integer, nullable=False, unique=True)
    selected = db.Column(db.String(length=15), nullable=False)
    value = db.Column(db.Integer, nullable=False)
    deltaTime = db.Column(db.Float, nullable=False)
    game = db.Column(db.Integer, db.ForeignKey("game.id"), nullable=False)

with app.app_context():
    db.create_all()


# ---- FORMS ----
class RoundDataForm(FlaskForm):
    number = IntegerField("number", validators=[DataRequired(), NumberRange(min=1, max=50)])
    selected = StringField("selected", validators=[DataRequired(), Length(max=12)])
    value = IntegerField("value", validators=[DataRequired()])
    deltaTime = FloatField("deltaTime", validators=[DataRequired(), NumberRange(min=0)])


# ---- ROUTES ----
@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/start_game", methods=["GET"])
def start_game():
    new_uuid = uuid.uuid4().hex
    while Game.query.filter_by(uuid=new_uuid).count() > 0:
        new_uuid = uuid.uuid4().hex
    
    new_csv = random.choice(os.listdir("csv"))

    try:
        new_game = Game(uuid=new_uuid, csv=new_csv)
        db.session.add(new_game)
        db.session.commit()
        return jsonify(uuid=new_uuid)
    except:
        return "There was an issue starting the game", 500

@app.route("/round_data/<string:url_uuid>", methods=["GET", "POST"])
def round_data(url_uuid):
    url_game = Game.query.filter_by(uuid=url_uuid).first()
    if url_game == None:
        return "There was an error managing round data", 400
    
    if request.method == "GET":
        pass
    elif request.method == "POST":
        form = RoundDataForm()
        if form.validate_on_submit():
            try:
                new_round = Round(
                    number=form.number.data, 
                    selected=form.selected.data, 
                    value=form.value.data, 
                    deltaTime=form.deltaTime.data,
                    game=url_game.id
                )
                db.session.add(new_round)
                db.session.commit()

                return "Successfully posted round data", 200
            except:
                pass
        return "There was an error posting round data", 400
        
    
    

# ---- MAIN ----
if __name__ == "__main__":
    app.run(debug=True)