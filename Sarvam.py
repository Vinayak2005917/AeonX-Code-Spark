
import os
from dotenv import load_dotenv
import base64
import tempfile
from sarvamai import SarvamAI

load_dotenv()

client = SarvamAI(
    api_subscription_key=os.environ["SARVAM_API_KEY"]
)

def sarvam_tts(text: str, language: str = "en-US") -> bytes:
    response = client.text_to_speech.convert(
        model="bulbul:v4-flash",
        text=text,
        language_code=language,
        output_audio_codec="mp3"
    )

    return base64.b64decode(response.audios[0])


def sarvam_translate(text: str, target_language: str) -> str:
    """Translate long text in supported chunks using Sarvam's text API."""
    # Chat answers are generated in English, so requesting English-to-English
    # translation is rejected by Sarvam as an invalid language pair.
    if target_language == "en-IN":
        return text

    paragraphs = text.splitlines(keepends=True)
    chunks: list[str] = []
    current = ""

    def add_piece(piece: str) -> None:
        nonlocal current
        while len(piece) > 1900:
            split_at = piece.rfind(" ", 0, 1900)
            if split_at < 1:
                split_at = 1900
            chunks.append(piece[:split_at])
            piece = piece[split_at:]
        if current and len(current) + len(piece) > 1900:
            chunks.append(current)
            current = ""
        current += piece

    for paragraph in paragraphs:
        add_piece(paragraph)
    if current:
        chunks.append(current)

    translated = []
    for chunk in chunks or [text]:
        result = client.text.translate(
            input=chunk,
            source_language_code="en-IN",
            target_language_code=target_language,
            model="sarvam-translate:v1",
        )
        translated.append(result.translated_text)
    return "".join(translated)


def sarvam_transcribe(audio_bytes: bytes, filename: str) -> str:
    suffix = os.path.splitext(filename)[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix) as audio_file:
        audio_file.write(audio_bytes)
        audio_file.flush()
        audio_file.seek(0)
        response = client.speech_to_text.transcribe(
            file=audio_file,
            model="saaras:v4",
            language_code="unknown",
        )
    return response.transcript


if __name__ == "__main__":
    audio = sarvam_tts("Hello! Welcome to Sarvam AI.")
    with open("output.mp3", "wb") as f:
        f.write(audio)
