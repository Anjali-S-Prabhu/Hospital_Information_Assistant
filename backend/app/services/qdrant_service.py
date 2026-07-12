import logging
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

# Check if Qdrant is configured
def _is_qdrant_configured() -> bool:
    """Returns True if Qdrant URL and API key are set. Overridden for local memory."""
    return True

# Initialize clients lazily
qdrant_client = None
embedding_model = None

COLLECTION_NAME = "hospital_records"
EMBEDDING_DIMENSION = 384


def _get_qdrant_client():
    """Gets or initializes the Qdrant client. Returns None if not configured."""
    global qdrant_client
    if not _is_qdrant_configured():
        return None
    if qdrant_client is None:
        try:
            from qdrant_client import QdrantClient
            # Use in-memory Qdrant for local development and testing
            qdrant_client = QdrantClient(location=":memory:")
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {e}")
            return None
    return qdrant_client


def _get_embedding_model():
    """Gets or initializes the FastEmbed model. Returns None if unavailable."""
    global embedding_model
    if embedding_model is None:
        try:
            from fastembed import TextEmbedding
            embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
    return embedding_model


def _require_qdrant():
    """Raises a friendly HTTP error if Qdrant is not configured."""
    if not _is_qdrant_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Qdrant vector database is not configured. Please add QDRANT_URL and QDRANT_API_KEY to the backend .env file to use RAG features."
        )
    client = _get_qdrant_client()
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not connect to Qdrant. Check your QDRANT_URL and QDRANT_API_KEY."
        )
    return client


def ensure_collection_exists() -> bool:
    """
    Ensures the Qdrant collection exists, creating it if needed.

    Outputs:
    - bool: True if collection is ready, False on failure.
    """
    client = _get_qdrant_client()
    if client is None:
        return False

    try:
        from qdrant_client.models import Distance, VectorParams
        collections = client.get_collections().collections
        exists = any(c.name == COLLECTION_NAME for c in collections)
        if not exists:
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=EMBEDDING_DIMENSION, distance=Distance.COSINE)
            )
        return True
    except Exception as e:
        logger.error(f"Error checking Qdrant collection: {e}")
        return False


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generates 384-dimensional embedding vectors for given texts.

    Inputs:
    - texts (List[str]): Text strings to embed.

    Outputs:
    - List[List[float]]: List of embedding vectors.
    """
    model = _get_embedding_model()
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding model is unavailable."
        )
    embeddings_generator = model.embed(texts)
    return [list(vec) for vec in embeddings_generator]


def upsert_records(points_data: List[Dict[str, Any]]) -> None:
    """
    Upserts text + metadata records into Qdrant.

    Inputs:
    - points_data: List of dicts with 'id', 'text', and 'metadata'.
    """
    client = _require_qdrant()
    if not ensure_collection_exists():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Qdrant collection setup failed."
        )

    from qdrant_client.models import PointStruct
    texts = [item["text"] for item in points_data]
    vectors = generate_embeddings(texts)

    points = []
    for idx, item in enumerate(points_data):
        payload = item.get("metadata", {}).copy()
        payload["text"] = item["text"]
        points.append(PointStruct(id=item["id"], vector=vectors[idx], payload=payload))

    client.upsert(collection_name=COLLECTION_NAME, points=points)


def search_similar_records(query: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Performs semantic similarity search in Qdrant.

    Inputs:
    - query (str): The search query text.
    - limit (int): Max results to return.

    Outputs:
    - List[Dict]: Matching payloads with similarity scores.
    """
    client = _require_qdrant()
    if not ensure_collection_exists():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Qdrant collection unavailable."
        )

    query_vector = generate_embeddings([query])[0]
    response = client.query_points(collection_name=COLLECTION_NAME, query=query_vector, limit=limit)
    results = response.points

    return [{"id": hit.id, "score": hit.score, "payload": hit.payload} for hit in results]


def delete_all_points() -> None:
    """Wipes all vector records from the Qdrant collection."""
    client = _require_qdrant()
    try:
        client.delete_collection(collection_name=COLLECTION_NAME)
        ensure_collection_exists()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete Qdrant points: {str(e)}"
        )
