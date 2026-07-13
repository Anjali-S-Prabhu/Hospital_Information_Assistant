from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class RagSearchRequest(BaseModel):
    """
    Pydantic schema representing raw vector search parameters.
    """
    query: str = Field(..., min_length=1, description="The query string to match semantically.")
    limit: int = Field(default=3, ge=1, le=20, description="The maximum number of semantic matches to return.")

class RagSearchResultItem(BaseModel):
    """
    Schema for a single semantic search hit.
    """
    id: int = Field(..., description="The unique integer point ID from Qdrant.")
    score: float = Field(..., description="The cosine similarity match score (between 0.0 and 1.0).")
    payload: Dict[str, Any] = Field(..., description="The metadata payload containing the reference text.")

class RagSearchResponse(BaseModel):
    """
    Schema wrapping the array of search results.
    """
    query: str
    results: List[RagSearchResultItem]

class RagAskRequest(BaseModel):
    """
    Pydantic schema representing parameters for the Retrieval-Augmented Generation question endpoint.
    """
    question: str = Field(..., min_length=1, description="The natural language question to ask the clinical records RAG pipeline.")
    limit: int = Field(default=4, ge=1, le=10, description="The number of reference context records to retrieve from vector store.")

class RagAskResponse(BaseModel):
    """
    Pydantic schema representing the final AI-generated response from the RAG query pipeline.
    """
    question: str = Field(..., description="The original question query.")
    answer: str = Field(..., description="The AI-generated answer based strictly on retrieved context.")
    references: List[str] = Field(..., description="The text chunks of referenced hospital documents used by the LLM.")

class RagEmbedResponse(BaseModel):
    """
    Schema summarizing the results of embedding PostgreSQL records.
    """
    message: str = Field(..., description="Success message.")
    patients_embedded: Optional[int] = Field(0, description="Number of patient profiles processed.")
    appointments_embedded: Optional[int] = Field(0, description="Number of appointment records processed.")
    total_points: Optional[int] = Field(0, description="Total points written to Qdrant.")
