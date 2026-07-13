# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, status
from app.schemas.chatbot import ChatRequest, ChatResponse
from app.services.ai_service import generate_ai_reply
from app.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(
    prefix="/chat",
    tags=["AI Chatbot"]
)

@router.post(
    "", 
    response_model=ChatResponse, 
    status_code=status.HTTP_200_OK,
    summary="Interact with the Hospital AI Chatbot",
    description="Sends a text message query to the AI assistant. Conversation history is automatically loaded "
                "and persisted using the unique session_id query parameter."
)
def chat_with_ai(
    payload: ChatRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Why it is written:
    To provide a public API route mapping to the AI engine, allowing doctors 
    and staff members to consult the chatbot assistant securely.

    What it does:
    Authenticates the request, triggers the ai_service to load history, queries 
    Groq via LangChain, and returns the response message.

    Inputs:
    - payload (ChatRequest): The chat request parameters (session_id, message).
    - current_user (User): The authenticated active staff member.

    Outputs:
    - ChatResponse: The chat reply structured response containing the session_id and AI output text.
    """
    reply = generate_ai_reply(
        session_id=payload.session_id, 
        message=payload.message
    )
    return {
        "session_id": payload.session_id,
        "reply": reply
    }
