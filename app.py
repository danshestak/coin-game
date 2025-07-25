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
import reader


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
    timestamp = db.Column(db.DateTime(timezone=True))
    rounds = db.relationship("Round", backref="parent_game", lazy=True)

    def get_current_round_number(self):
        return len(self.rounds)+1

class Round(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    selected = db.Column(db.String(length=15), nullable=False)
    value = db.Column(db.Integer, nullable=False)
    deltatime = db.Column(db.Float, nullable=False)
    game = db.Column(db.Integer, db.ForeignKey("game.id"), nullable=False)

with app.app_context():
    db.create_all()


# ---- FORMS ----
class RoundDataForm(FlaskForm):
    selected = StringField("selected", validators=[DataRequired(), Length(max=12)])
    value = IntegerField("value", validators=[DataRequired()])
    deltatime = FloatField("deltatime", validators=[DataRequired(), NumberRange(min=0)])


# ---- ROUTES ----
@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/start_game", methods=["GET"])
def start_game():
    new_uuid = uuid.uuid4().hex
    while Game.query.filter_by(uuid=new_uuid).count() > 0:
        new_uuid = uuid.uuid4().hex
    
    new_csv = random.choice(reader.get_csv_names())
    
    try:
        new_game = Game(uuid=new_uuid, csv=new_csv, timestamp=datetime.datetime.now(datetime.timezone.utc))
        db.session.add(new_game)
        db.session.commit()
        return jsonify(uuid=new_uuid, rounds=reader.get_rounds_quantity(new_csv))
    except:
        db.session.rollback()
        return jsonify(message="There was an issue starting the game"), 500

@app.route("/round_data/<string:url_uuid>", methods=["GET", "POST"])
def round_data(url_uuid):
    url_game:Game = Game.query.filter_by(uuid=url_uuid).first()
    if url_game == None:
        return jsonify(message="There was an error managing round data"), 400

    url_datetime:datetime.datetime = url_game.timestamp.replace(tzinfo=datetime.timezone.utc)
    timedelta = datetime.datetime.now(datetime.timezone.utc) - url_datetime
    if timedelta > datetime.timedelta(hours=2) or url_game.finished:
        return jsonify(message="There was an error managing round data"), 400
        
    if request.method == "GET":
        round_number = url_game.get_current_round_number()
        csv_name = url_game.csv
        
        return jsonify(
            p1move = reader.get_value(csv_name, "p1move", round_number),
            p1surrendered = reader.get_value(csv_name, "p1surrendered", round_number),
            p2move = reader.get_value(csv_name, "p2move", round_number),
            p2surrendered = reader.get_value(csv_name, "p2surrendered", round_number)
        )
    elif request.method == "POST":
        form = RoundDataForm()
        current_round = url_game.get_current_round_number()
        final_round = reader.get_rounds_quantity(url_game.csv)

        if form.validate_on_submit() and current_round <= final_round:
            try:
                new_round = Round(
                    selected=form.selected.data, 
                    value=form.value.data, 
                    deltatime=form.deltatime.data,
                    game=url_game.id
                )
                db.session.add(new_round)

                if current_round == final_round:
                    url_game.finished = True

                db.session.commit()

                return jsonify(message="Successfully posted round data"), 200
            except:
                db.session.rollback()
        return jsonify(message="There was an error posting round data"), 400


# ---- MAIN ----
if __name__ == "__main__":
    app.run(debug=True)