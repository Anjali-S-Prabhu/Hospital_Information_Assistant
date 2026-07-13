from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Dict, Any
from app.core.config import settings
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.services import qdrant_service


def _get_groq_client():
    """Creates a Groq client if the API key is configured."""
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY in ("", "your_groq_api_key_here"):
        return None
    try:
        from groq import Groq
        return Groq(api_key=settings.GROQ_API_KEY)
    except Exception:
        return None


def embed_database_records(db: Session) -> Dict[str, Any]:
    """
    Fetches patient and appointment records from the database,
    converts them to text, generates embeddings, and upserts them to Qdrant.

    Inputs:
    - db (Session): Active database session.

    Outputs:
    - dict: Summary of how many records were embedded.
    """
    try:
        patients = db.query(Patient).all()
        appointments = db.query(Appointment).all()

        points_data = []

        # Process Patient records (use IDs starting at 100,000 to avoid overlap)
        for patient in patients:
            text_repr = (
                f"Patient Record ID: {patient.id}. "
                f"Full Name: {patient.first_name} {patient.last_name}. "
                f"Date of Birth: {patient.date_of_birth}. "
                f"Gender: {patient.gender or 'N/A'}. "
                f"Contact: {patient.contact_number or 'N/A'}. "
                f"Email: {patient.email or 'N/A'}. "
                f"Address: {patient.address or 'N/A'}. "
                f"Medical History: {patient.medical_history or 'None recorded'}."
            )
            points_data.append({
                "id": 100000 + patient.id,
                "text": text_repr,
                "metadata": {"record_type": "patient", "original_id": patient.id}
            })

        # Process Appointment records (use IDs starting at 200,000 to avoid overlap)
        for appt in appointments:
            patient_name = f"{appt.patient.first_name} {appt.patient.last_name}" if appt.patient else "Unknown"
            doctor_name = appt.doctor.full_name if appt.doctor else "Unknown"
            text_repr = (
                f"Appointment Record ID: {appt.id}. "
                f"Patient Name: {patient_name} (Patient ID: {appt.patient_id}). "
                f"Doctor: {doctor_name} (User ID: {appt.doctor_id}). "
                f"Date & Time: {appt.appointment_date}. "
                f"Reason: {appt.reason}. "
                f"Status: {appt.status}. "
                f"Notes: {appt.notes or 'None'}."
            )
            points_data.append({
                "id": 200000 + appt.id,
                "text": text_repr,
                "metadata": {"record_type": "appointment", "original_id": appt.id}
            })

        if not points_data:
            return {"message": "No database records found to embed.", "embedded_count": 0}

        qdrant_service.upsert_records(points_data)

        return {
            "message": "Successfully embedded database records into Qdrant.",
            "patients_embedded": len(patients),
            "appointments_embedded": len(appointments),
            "total_points": len(points_data)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to embed records: {str(e)}"
        )


def perform_semantic_search(query: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Runs semantic similarity search in Qdrant.

    Inputs:
    - query (str): The search query text.
    - limit (int): Maximum number of results to return.

    Outputs:
    - List[Dict]: Matching records with scores.
    """
    return qdrant_service.search_similar_records(query, limit=limit)


def ask_rag_question(question: str, limit: int = 4) -> Dict[str, Any]:
    """
    Full RAG pipeline: search Qdrant → get context → ask Groq LLM.
    Supports a mock fallback if Groq API key is not configured.

    Inputs:
    - question (str): The natural language question.
    - limit (int): Number of context chunks to retrieve.

    Outputs:
    - dict: 'answer' string and 'references' list.
    """
    # 1. Search for relevant context
    hits = perform_semantic_search(question, limit=limit)
    references = [
        hit["payload"]["text"]
        for hit in hits
        if "payload" in hit and "text" in hit["payload"]
    ]

    client = _get_groq_client()
    if client is None:
        if not references:
            return {
                "answer": (
                    "No relevant clinical records were found to answer your question.\n\n"
                    "*(Note: Running in Mock RAG mode since GROQ_API_KEY is not configured in backend/.env)*"
                ),
                "references": []
            }
        
        # Build a nice mock answer that summarizes the found context
        mock_answer = (
            "I retrieved the following relevant clinical records from the database to answer your question:\n\n"
        )
        for idx, ref in enumerate(references, 1):
            mock_answer += f"{idx}. {ref}\n"
            
        mock_answer += (
            "\n*(Note: Running in Mock RAG mode. Real-time answer synthesis requires configuring GROQ_API_KEY in backend/.env)*"
        )
        
        return {
            "answer": mock_answer,
            "references": references
        }

    if not references:
        return {
            "answer": "No relevant clinical records were found to answer your question.",
            "references": []
        }

    # 2. Build context string
    context_str = "\n\n".join(references)

    # 3. Ask Groq with context
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an intelligent Hospital Information Assistant. "
                        "Answer the question ONLY using the retrieved context below. "
                        "Do not make up facts. If the answer is not in the context, say so.\n\n"
                        f"Retrieved Context:\n{context_str}"
                    )
                },
                {"role": "user", "content": question}
            ],
            temperature=0.3,
            max_tokens=1024,
        )
        answer = response.choices[0].message.content
        return {"answer": answer, "references": references}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Groq API Error: {str(e)}. Please verify your GROQ_API_KEY in backend/.env."
        )
