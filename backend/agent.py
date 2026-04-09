import logging
import os
import asyncio
from dotenv import load_dotenv

from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import openai, silero

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
logger = logging.getLogger("voice-agent")

# Load knowledge base from file
_kb_path = os.path.join(os.path.dirname(__file__), "knowledge_base.txt")
try:
    with open(_kb_path, "r") as f:
        KNOWLEDGE_BASE = f.read()
except FileNotFoundError:
    KNOWLEDGE_BASE = "No knowledge base loaded."
    logger.warning("knowledge_base.txt not found — running without KB content.")

SYSTEM_PROMPT = f"""You are a friendly and knowledgeable Product Support Assistant. Your job is to answer questions about our products and services accurately and concisely.

Use the knowledge base below to answer questions. If the answer is not in the knowledge base, say you don't have that information and offer to connect them with a human agent.

KNOWLEDGE BASE:
{KNOWLEDGE_BASE}

CRITICAL: Keep every response to 1-2 short sentences maximum. Be warm, direct, and conversational. Never give long explanations unless the user explicitly asks for more detail.
"""

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    agent = Agent(
        instructions=SYSTEM_PROMPT,
        chat_ctx=llm.ChatContext(),
        stt=openai.STT(),
        vad=silero.VAD.load(),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=openai.TTS(),
        allow_interruptions=True,
    )

    session = AgentSession()
    await session.start(agent, room=ctx.room)

    await asyncio.sleep(1)
    await session.say("Hi! I'm your product support assistant. What can I help you with today?", allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
