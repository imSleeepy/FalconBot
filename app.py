from flask import Flask, jsonify, request
from flask_cors import CORS
from docx import Document
import google.generativeai as genai
import os

app = Flask(__name__)
CORS(app)

# Configure the API key for Google Generative AI
api_key = 'AIzaSyCLfdfN3ZVwIznQ8Xd_d2Zl7FqY5rQF2Dk'  # Replace with your API key
genai.configure(api_key=api_key)

# Create the model
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
)

# Load and extract text from the DOCX file inside the assets folder
docx_path = os.path.join(os.path.dirname(__file__), 'assets', 'adumanual.docx')
doc = Document(docx_path)
context = ""
for paragraph in doc.paragraphs:
    context += paragraph.text + "\n"

# Function to send a message and receive a response
def send_message(message_text, context=""):
    # Add a rule before the user's message
    rule = "From now on, always base your answers on the document that was sent to you."
    combined_message = f"{context}\n\n{rule}\n\nUser: {message_text}"

    # Prepare message payload
    message_payload = {
        "text": combined_message
    }

    chat_session = model.start_chat()
    response = chat_session.send_message(message_payload)
    return response.text

@app.route('/get_text', methods=['POST'])
def get_text():
    user_input = request.json.get('message', '')
    bot_response = send_message(user_input, context)
    return jsonify(botResponse=bot_response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
