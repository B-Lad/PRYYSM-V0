import httpx
from app.core.config import settings

async def generate_ai_response(prompt: str) -> str:
    if not settings.OPENAI_API_KEY:
        return "[MOCK] AI API key not set. Connect to OpenAI/Azure in config."
    
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            json={"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": prompt}]}
        )
        if res.status_code == 200:
            return res.json()["choices"][0]["message"]["content"]
    return "AI generation failed."