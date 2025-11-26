import os
from groq import Groq
from dotenv import load_dotenv
from utils.chunker import chunk_text

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def summarize_chunk(text, mode):
    if mode == "short":
        instruction = "Summarize the following text in 3–5 bullet points."
    elif mode == "medium":
        instruction = "Write a concise paragraph summary."
    elif mode == "long":
        instruction = "Write a detailed multi-paragraph summary."
    else:
        instruction = "Summarize clearly."

    prompt = f"{instruction}\n\nText:\n{text}"

    resp = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role":"system","content":"You are an expert summarizer."},
            {"role":"user","content":prompt}
        ]
    )
    return resp.choices[0].message.content


def generate_summary(text, mode):
    chunks = chunk_text(text, max_chars=3200)
    parts = []

    for c in chunks:
        parts.append(summarize_chunk(c, mode))

    final_prompt = (
        "Combine the following chunk summaries into one clean, cohesive final summary:\n\n"
        + "\n\n---\n\n".join(parts)
    )

    resp = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role":"system","content":"You produce polished summaries."},
            {"role":"user","content":final_prompt}
        ]
    )

    return resp.choices[0].message.content
