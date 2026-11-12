
import os
from dotenv import load_dotenv
import base64
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


if __name__ == "__main__":
    audio = sarvam_tts("Hello! Welcome to Sarvam AI.")
    with open("output.mp3", "wb") as f:
        f.write(audio)
