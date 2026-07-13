from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.rag import RagSearchRequest, RagSearchResponse, RagAskRequest, RagAskResponse, RagEmbedResponse
from app.services import rag_service, qdrant_service
from app.dependencies import get_current_active_user, RoleChecker
from app.models.user import User

router = APIRouter(
    prefix="/rag",
    tags=["RAG Engine"]
)

@router.post(
    "/embed", 
    response_model=RagEmbedResponse, 
    status_code=status.HTTP_200_OK,
    summary="Embed all PostgreSQL records into Qdrant",
    description="Loads all patients and appointments from PostgreSQL, serializes them, "
                "generates embeddings, and upserts them to the Qdrant Cloud collection."
)
def embed_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Why it is written:
    To provide a manual sync endpoint to update the vector store with current DB values.

    What it does:
    Instructs the RAG service to process database records and index them in Qdrant.

    Inputs:
    - db (Session): Database session.
    - current_user (User): Authenticated user.

    Outputs:
    - RagEmbedResponse: Counts of embedded patient and appointment objects.
    """
    result = rag_service.embed_database_records(db)
    return result

@router.post(
    "/search", 
    response_model=RagSearchResponse, 
    status_code=status.HTTP_200_OK,
    summary="Perform semantic vector search in Qdrant",
    description="Vectorizes the query string and retrieves similar records directly from Qdrant."
)
def semantic_search(
    payload: RagSearchRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Why it is written:
    To expose semantic search matches of medical contexts/profiles for staff review.

    What it does:
    Takes query, runs similarity search, and formats the matching points.

    Inputs:
    - payload (RagSearchRequest): Search text and match limit.

    Outputs:
    - RagSearchResponse: List of matching records and similarity scores.
    """
    hits = rag_service.perform_semantic_search(payload.query, payload.limit)
    return {
        "query": payload.query,
        "results": hits
    }

@router.post(
    "/ask", 
    response_model=RagAskResponse, 
    status_code=status.HTTP_200_OK,
    summary="Ask a question using Retrieval-Augmented Generation",
    description="Vectorizes the question, searches for relevant context in Qdrant, "
                "submits the context to the Groq LLM, and returns the formulated answer."
)
def ask_question(
    payload: RagAskRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Why it is written:
    To let staff query clinical records in natural language, relying strictly on 
    verified facts from the DB.

    What it does:
    Executes the RAG pipeline and returns the AI reply alongside reference context blocks.

    Inputs:
    - payload (RagAskRequest): User question and limits.

    Outputs:
    - RagAskResponse: Formatted answer and references list.
    """
    result = rag_service.ask_rag_question(payload.question, payload.limit)
    return {
        "question": payload.question,
        "answer": result["answer"],
        "references": result["references"]
    }

@router.delete(
    "/delete-all", 
    status_code=status.HTTP_200_OK,
    summary="Clear all vector points from Qdrant",
    description="Wipes the vector collection. Restrictive access to Admins only."
)
def delete_all(
    current_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Why it is written:
    To allow administrators to wipe and reset the vector store index.

    What it does:
    Reinitializes the vector collection. Enforces admin-only role.

    Inputs:
    - current_user (User): Administrator user session.

    Outputs:
    - dict: Success status message.
    """
    qdrant_service.delete_all_points()
    return {"message": "Successfully wiped all vector indexing points."}
