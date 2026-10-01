from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/contact", methods=["POST"])
def contact():
    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()
    message = request.form.get("message", "").strip()

    if not name or not email or not message:
        return """
        <h1>Missing Information ❌</h1>
        <p>Please fill in all fields.</p>
        <a href="/contact.html">Back to Contact</a>
        """, 400

    print("\n--- New Contact Message ---")
    print("Name:", name)
    print("Email:", email)
    print("Message:", message)
    print("---------------------------\n")

    return """
    <h1>Message Sent Successfully! ✅</h1>
    <p>Thank you for contacting us.</p>
    <a href="/contact.html">Back to Contact</a>
    """


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

    print("\n--- New Contact Message ---")
    print("Name:", name)
    print("Email:", email)
    print("Message:", message)
    print("---------------------------\n")

    return jsonify({
        "success": True,
        "message": "Message sent successfully! ✅"
    })


@app.route("/<path:filename>")
def files(filename):
    return send_from_directory(".", filename)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
