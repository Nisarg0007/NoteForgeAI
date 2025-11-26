import os
import tempfile
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
from utils.summarizer import generate_summary
from utils.pdf_reader import extract_text_from_pdf

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = tempfile.gettempdir()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/summarize", methods=["POST"])
def api_summarize():
    text = request.form.get("user_text", "").strip()
    summary_type = request.form.get("summary_type", "medium")

    # PDF upload
    if "pdf_file" in request.files:
        file = request.files["pdf_file"]
        if file and file.filename:
            filename = secure_filename(file.filename)
            path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(path)
            text = extract_text_from_pdf(path)

    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        summary = generate_summary(text, summary_type)
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/download", methods=["POST"])
def download():
    content = request.form.get("summary-content", "")
    temp_path = os.path.join(tempfile.gettempdir(), "summary.txt")
    with open(temp_path, "w", encoding="utf-8") as f:
        f.write(content)
    return send_file(temp_path, as_attachment=True, download_name="summary.txt")


if __name__ == "__main__":
    app.run(debug=True)
