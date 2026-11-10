"""Secure backend for Chapter 04 — AI Go Tutor.

The browser never receives the API key. When no key is configured, the same
endpoint remains usable in a small deterministic demo mode.
"""

from __future__ import annotations

import os
from typing import Literal

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


load_dotenv()

app = FastAPI(title="GO BEGINNING — AI Go Tutor", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=r"^https?://(127\.0\.0\.1|localhost)(:\d+)?$",
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

API_KEY = os.getenv("LLM_API_KEY", "").strip()
BASE_URL = os.getenv("LLM_BASE_URL", "").strip().rstrip("/")
MODEL = os.getenv("LLM_MODEL", "").strip()

SYSTEM_PROMPT = """You are AI Go Tutor, a patient assistant for absolute beginners learning the board game Go.
Answer in the same language as the learner. Prefer a direct explanation followed by one small example or practice tip.
Keep answers under 180 words unless the learner asks for more detail. Explain terms such as liberty, group, capture,
ko, territory, komi, and pass before relying on them. Do not pretend to see a board position unless it was described.
When rules vary by ruleset, say so. If uncertain, say what information is missing. Do not answer unrelated requests;
gently guide the learner back to Go."""


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1600)


class ChatRequest(BaseModel):
    messages: list[Message] = Field(min_length=1, max_length=12)


def detect_intent(text: str) -> str:
    normalized = text.lower()
    signals = [
        ("liberties", ("liberty", "liberties", "breath", "气", "没气")),
        ("capture", ("capture", "captured", "surround", "吃", "提子", "被吃", "包围")),
        ("scoring", ("score", "territory", "win", "komi", "胜负", "计分", "领地", "贴目")),
        ("rules", ("illegal", "legal", "suicide", "ko", "不能落子", "不合法", "禁入点", "自杀", "劫")),
        ("practice", ("practice", "improve", "strategy", "beginner", "练习", "提高", "策略", "入门")),
        ("board", ("board", "intersection", "star point", "棋盘", "交叉点", "星位", "落子")),
    ]
    for intent, terms in signals:
        if any(term in normalized for term in terms):
            return intent
    return "fallback"


def demo_reply(question: str) -> tuple[str, dict[str, str] | None]:
    chinese = any("\u3400" <= character <= "\u9fff" for character in question)
    intent = detect_intent(question)
    replies = {
        "liberties": (
            "A liberty is an empty intersection directly beside a stone or connected group. Diagonal points do not count. A group with no liberties is captured.",
            "“气”是棋子或相连棋块上、下、左、右相邻的空交叉点，斜线方向不算气。没有气的棋块会被提走。",
        ),
        "capture": (
            "A stone is captured when the opponent occupies every one of its liberties. Count the target group’s liberties and look for the move that removes the final one.",
            "当对手占据一颗棋或一整块棋的所有气时，这块棋会被提走。先数清目标的气，再寻找堵住最后一口气的位置。",
        ),
        "scoring": (
            "A game usually ends after both players pass. The exact count varies by ruleset, but controlled territory, living stones, captures, and komi determine the adjusted result.",
            "棋局通常在双方连续停一手后结束。不同规则的计算方法略有差异，但领地、存活棋子、提子和贴目会共同决定结果。",
        ),
        "rules": (
            "A move may be illegal because the point is occupied, it creates a forbidden self-capture, or it immediately repeats the previous position under the ko rule.",
            "不能落子的常见原因是该点已被占用、落子后形成被禁止的自杀棋，或违反劫争中不能立即还原上一局面的规则。",
        ),
        "practice": (
            "Start on 9 × 9 and review every game. After each move, identify the weakest group and count its liberties before planning your next move.",
            "建议从9路棋盘开始并在每局后复盘。每下一步先找出最弱的棋块，再数清它的气，然后决定下一步。",
        ),
        "board": (
            "Go stones are placed on intersections, not inside squares. Beginners can start on 9 × 9 before moving to the standard 19 × 19 board.",
            "围棋棋子放在线与线的交叉点上，而不是格子里。初学者可以先使用9路棋盘，再逐步过渡到标准19路棋盘。",
        ),
        "fallback": (
            "I am running in demo mode and could not confidently match that question. Try asking about the board, liberties, capturing, rules, scoring, or beginner practice.",
            "我现在运行在演示模式，暂时无法准确理解这个问题。你可以询问棋盘、气、提子、规则、计分或初学者练习。",
        ),
    }
    routes = {
        "board": {"href": "chapter1.html", "label": "OPEN CHAPTER 01"},
        "liberties": {"href": "chapter2.html#liberty-board", "label": "EXPLORE LIBERTIES"},
        "capture": {"href": "chapter2.html#capture-board", "label": "PRACTICE CAPTURING"},
        "rules": {"href": "chapter3.html#play-board", "label": "OPEN PRACTICE BOARD"},
        "scoring": {"href": "chapter3.html#outcome-title", "label": "READ VICTORY RULES"},
        "practice": {"href": "chapter3.html#play-board", "label": "START PRACTICING"},
    }
    english, chinese_reply = replies[intent]
    return (chinese_reply if chinese else english), routes.get(intent)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "mode": "live" if API_KEY and BASE_URL and MODEL else "demo"}


@app.post("/api/chat")
async def chat(request: ChatRequest) -> dict[str, object]:
    latest_question = next(
        (message.content for message in reversed(request.messages) if message.role == "user"),
        "",
    )
    if not latest_question:
        raise HTTPException(status_code=400, detail="A user question is required.")

    if not (API_KEY and BASE_URL and MODEL):
        reply, lesson = demo_reply(latest_question)
        return {"reply": reply, "lesson": lesson, "mode": "demo"}

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            *[{"role": message.role, "content": message.content} for message in request.messages],
        ],
        "temperature": 0.35,
        "max_tokens": 420,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        response.raise_for_status()
        data = response.json()
        reply = data["choices"][0]["message"]["content"].strip()
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as error:
        raise HTTPException(status_code=502, detail="The language model service did not return a valid answer.") from error

    intent = detect_intent(latest_question)
    lesson_routes = {
        "board": {"href": "chapter1.html", "label": "OPEN CHAPTER 01"},
        "liberties": {"href": "chapter2.html#liberty-board", "label": "EXPLORE LIBERTIES"},
        "capture": {"href": "chapter2.html#capture-board", "label": "PRACTICE CAPTURING"},
        "rules": {"href": "chapter3.html#play-board", "label": "OPEN PRACTICE BOARD"},
        "scoring": {"href": "chapter3.html#outcome-title", "label": "READ VICTORY RULES"},
        "practice": {"href": "chapter3.html#play-board", "label": "START PRACTICING"},
    }
    return {"reply": reply, "lesson": lesson_routes.get(intent), "mode": "live"}

