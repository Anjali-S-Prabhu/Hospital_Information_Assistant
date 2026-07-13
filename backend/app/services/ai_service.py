from typing import Dict
# pyrefly: ignore [missing-import]
from fastapi import HTTPException, status
from app.core.config import settings

# Global dictionary store to persist chat sessions in memory.
session_history_store: Dict[str, list] = {}


def _get_groq_client():
    """
    Creates a Groq client if the API key is configured.
    Returns None if the key is missing or empty.
    """
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY in (
        "",
        "your_groq_api_key_here",
    ):
        return None

    try:
        # pyrefly: ignore [missing-import]
        from groq import Groq
        return Groq(api_key=settings.GROQ_API_KEY)
    except Exception:
        return None


def generate_mock_reply(message: str) -> str:
    """Generates keyword-based mock replies for demonstration when Groq is not configured."""
    msg_lower = message.lower().strip()
    # Clean up non-alphanumeric characters for word matching
    import re
    words = set(re.findall(r'\b\w+\b', msg_lower))
    
    if any(w in words for w in ["hello", "hi", "hey", "greet", "greetings"]):
        return (
            "Hello! I am the Hospital AI Assistant. How can I help you today?\n\n"
            "*(Note: I am running in Demo Mode because a valid GROQ_API_KEY is not configured in backend/.env)*"
        )
    
    if any(w in words for w in ["appointment", "appointments", "schedule", "book"]):
        return (
            "To manage appointments, you can navigate to the **Appointments** page in the sidebar. "
            "There you can schedule new appointments, update their status (e.g. Scheduled, Completed, Cancelled), "
            "and assign doctors.\n\n"
            "*(Note: Running in Demo Mode)*"
        )
        
    if any(w in words for w in ["patient", "patients", "record", "records"]):
        return (
            "You can manage patients using the **Patients** page. "
            "You can add new patients (specifying first name, last name, DOB, medical history, etc.) "
            "and view existing patient records.\n\n"
            "*(Note: Running in Demo Mode)*"
        )
        
    if any(w in words for w in ["rag", "search", "semantic"]):
        return (
            "The RAG (Retrieval-Augmented Generation) page allows you to index the clinical database "
            "and perform semantic searches. In Demo Mode, you can embed records into an in-memory "
            "Qdrant database and query them. Note that asking natural language questions through RAG "
            "requires a valid GROQ_API_KEY.\n\n"
            "*(Note: Running in Demo Mode)*"
        )

    if "help" in words:
        return (
            "I can assist you with:\n"
            "1. Information on scheduling and viewing **Appointments**\n"
            "2. Accessing and managing **Patient** records\n"
            "3. Explaining how to use the **RAG** semantic search\n"
            "4. Finding out what fields are needed in the `.env` configuration.\n\n"
            "*(Note: Running in Demo Mode)*"
        )

    return (
        f"I received your message: '{message}'.\n\n"
        "I am currently operating in **Demo Mode** because no valid `GROQ_API_KEY` was found in `backend/.env`.\n\n"
        "To get live AI responses from Llama 3 on Groq, please:\n"
        "1. Create a free API key at [Groq Console](https://console.groq.com/)\n"
        "2. Add it to `backend/.env` as: `GROQ_API_KEY=gsk_your_actual_key`\n"
        "3. Restart the backend FastAPI server."
    )


def generate_ai_reply(session_id: str, message: str) -> str:
    """
    Generates an AI response for the given session and message.
    Supports a mock fallback if Groq API key is not configured.
    """

    if not session_id or not session_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session ID cannot be empty",
        )

    if not message or not message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty",
        )

    # Create history if it doesn't exist
    if session_id not in session_history_store:
        session_history_store[session_id] = []

    history = session_history_store[session_id]

    client = _get_groq_client()

    if client is None:
        reply = generate_mock_reply(message)
        history.append(
            {
                "role": "user",
                "content": message,
            }
        )
        history.append(
            {
                "role": "assistant",
                "content": reply,
            }
        )
        return reply

    messages = [
        {
            "role": "system",
            "content": (
                "You are a professional AI Assistant for the Hospital Information Assistant system. "
                "Help hospital staff and doctors with clinical appointments, patient data, "
                "medical queries, and hospital workflows. "
                "Be concise, professional, and helpful."
            ),
        }
    ]

    # Add previous conversation
    messages.extend(history[-20:])

    # Add current user message
    messages.append(
        {
            "role": "user",
            "content": message,
        }
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )

        reply = response.choices[0].message.content

        history.append(
            {
                "role": "user",
                "content": message,
            }
        )

        history.append(
            {
                "role": "assistant",
                "content": reply,
            }
        )

        return reply

    except Exception as e:
        import traceback

        print("\n========== GROQ ERROR ==========")
        traceback.print_exc()
        print("================================")
        print("Actual Error:", str(e))
        
        # Return a cleaner API error to client
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Groq API Error: {str(e)}. Please verify your GROQ_API_KEY in backend/.env."
        )
