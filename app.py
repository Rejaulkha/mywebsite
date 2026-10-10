import os
from openai import OpenAI

from werkzeug.security import check_password_hash
import psycopg

from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS


app = Flask(__name__)

app.secret_key = os.getenv(
    "SECRET_KEY",
    "change-this-secret-in-render"
)

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "None"

CORS(
    app,
    supports_credentials=True,
    origins=["https://rejaulkha.github.io"]
)


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

            cur.execute("""
                CREATE TABLE IF NOT EXISTS admins (
                    id SERIAL PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL
                )
            """)

        conn.commit()


@app.route("/api/admin/login", methods=["POST"])
def admin_login():

    data = request.get_json(silent=True) or {}

    username = data.get("username", "").strip()
    password = data.get("password", "")

    admin_username = os.getenv("ADMIN_USERNAME")
    admin_password_hash = os.getenv("ADMIN_PASSWORD_HASH")

    if not admin_username or not admin_password_hash:
        return jsonify({
            "success": False,
            "message": "Admin login is not configured."
        }), 500

    if username != admin_username or not check_password_hash(
        admin_password_hash,
        password
    ):
        return jsonify({
            "success": False,
            "message": "Invalid username or password."
        }), 401

    session["admin_logged_in"] = True

    return jsonify({
        "success": True,
        "message": "Admin login successful! ✅"
    })


@app.route("/api/admin/me", methods=["GET"])
def admin_me():

    if not session.get("admin_logged_in"):
        return jsonify({
            "success": False,
            "logged_in": False
        }), 401

    return jsonify({
        "success": True,
        "logged_in": True,
        "username": os.getenv("ADMIN_USERNAME")
    })


@app.route("/api/admin/messages", methods=["GET"])
def admin_messages():

    if not session.get("admin_logged_in"):
        return jsonify({
            "success": False,
            "message": "Unauthorized"
        }), 401

    try:

        with get_db() as conn:
            with conn.cursor() as cur:

                cur.execute("""
                    SELECT id, name, email, message, created_at
                    FROM messages
                    ORDER BY created_at DESC
                """)

                rows = cur.fetchall()

        messages = []

        for row in rows:

            messages.append({
                "id": row[0],
                "name": row[1],
                "email": row[2],
                "message": row[3],
                "created_at": row[4].isoformat()
            })

        return jsonify({
            "success": True,
            "messages": messages
        })

    except Exception as e:

        print("Messages database error:", e)

        return jsonify({
            "success": False,
            "message": "Unable to load messages."
        }), 500


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
                    INSERT INTO messages
                    (name, email, message)
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
                    INSERT INTO messages
                    (name, email, message)
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


@app.route("/api/assistant", methods=["POST"])
def assistant_api():
    from flask import jsonify, request

    api_key = os.environ.get("OPENAI_API_KEY")

    if not api_key:
        return jsonify({
            "success": False,
            "message": "AI service is not configured yet."
        }), 503

    data = request.get_json(silent=True) or {}
    question = str(data.get("message", "")).strip()

    if not question:
        return jsonify({
            "success": False,
            "message": "Please enter a question."
        }), 400

    if len(question) > 2000:
        return jsonify({
            "success": False,
            "message": "Your message is too long."
        }), 400

    try:
        client = OpenAI(api_key=api_key)

        response = client.responses.create(
            model="gpt-4.1-mini",
            instructions=(
                "You are Rejaul Assistant on a professional digital "
                "services website. Answer helpfully and concisely. "
                "Reply in Bengali when the user speaks Bengali, and "
                "in English when the user speaks English. Never claim "
                "that a contact message was sent unless it really was."
            ),
            input=question
        )

        answer = response.output_text

        return jsonify({
            "success": True,
            "answer": answer
        })

    except Exception:
        app.logger.exception("AI assistant request failed")
        return jsonify({
            "success": False,
            "message": "AI service is temporarily unavailable."
        }), 502
        
if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
