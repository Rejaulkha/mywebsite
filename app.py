import os
import psycopg
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


def get_db():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError("DATABASE_URL is not configured")

    return psycopg.connect(database_url)


def init_db():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        return

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        conn.commit()


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/api/contact", methods=["POST"])
def contact_api():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    message = data.get("message", "").strip()

    if not name or not email or not message:
        return jsonify({
            "success": False,
            "message": "Please fill in all fields."
        }), 400

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO messages (name, email, message)
                    VALUES (%s, %s, %s)
                    """,
                    (name, email, message)
                )
            conn.commit()

        return jsonify({
            "success": True,
            "message": "Message sent successfully! ✅"
        })

    except Exception as e:
        print("Database error:", e)

        return jsonify({
            "success": False,
            "message": "Unable to save message. Please try again."
        }), 500


@app.route("/contact", methods=["POST"])
def contact():
    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()
    message = request.form.get("message", "").strip()

    if not name or not email or not message:
        return "Please fill in all fields.", 400

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO messages (name, email, message)
                    VALUES (%s, %s, %s)
                    """,
                    (name, email, message)
                )
            conn.commit()

        return "Message sent successfully! ✅"

    except Exception as e:
        print("Database error:", e)
        return "Unable to save message.", 500


@app.route("/<path:filename>")
def files(filename):
    return send_from_directory(".", filename)


try:
    init_db()
except Exception as e:
    print("Database initialization error:", e)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
