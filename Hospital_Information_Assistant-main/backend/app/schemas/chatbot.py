from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    """
    Pydantic schema representing the incoming chatbot query request.
    """
    session_id: str = Field(
        ..., 
        description="A unique string identifying the chat session (e.g., UUID or user ID)."
    )
    message: str = Field(
        ..., 
        min_length=1, 
        description="The message text query to send to the AI chatbot."
    )

class ChatResponse(BaseModel):
    """
    Pydantic schema representing the chatbot's structured JSON response.
    """
    session_id: str = Field(
        ..., 
        description="The chat session identifier matching the request."
    )
    reply: str = Field(
        ..., 
        description="The AI-generated response text message."
    )
