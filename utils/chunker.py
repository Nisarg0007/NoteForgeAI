def chunk_text(text, max_chars=3000):
    words = text.split()
    chunks = []
    current = ""

    for w in words:
        if len(current) + len(w) + 1 > max_chars:
            chunks.append(current.strip())
            current = w
        else:
            current += " " + w

    if current.strip():
        chunks.append(current.strip())

    return chunks
