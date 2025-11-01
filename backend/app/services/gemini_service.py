"""
Gemini API integration service
Handles PDF text extraction, video processing, quiz generation, and chat
"""
import google.generativeai as genai
from typing import List, Dict, Any, Optional
import PyPDF2
import json
from app.core.config import settings

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)


class GeminiService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-pro')

    def extract_pdf_text(self, pdf_path: str) -> str:
        """Extract text from PDF file"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text.strip()
        except Exception as e:
            raise Exception(f"Error extracting PDF text: {str(e)}")

    def process_video(self, video_path: str) -> Dict[str, Any]:
        """
        Process video using Gemini multimodal API
        Returns: {
            'transcript': str,
            'timestamps': [{'time_seconds': int, 'time_display': str, 'topic': str, 'description': str}],
            'summary': str,
            'duration_seconds': int
        }
        """
        try:
            # Upload video to Gemini
            video_file = genai.upload_file(path=video_path)

            # Wait for processing
            import time
            while video_file.state.name == "PROCESSING":
                time.sleep(2)
                video_file = genai.get_file(video_file.name)

            if video_file.state.name == "FAILED":
                raise Exception("Video processing failed")

            # Generate transcript with timestamps
            prompt = """
            Analyze this educational video and provide:
            1. Full transcript of the video
            2. Key timestamps with topics (format: MM:SS - Topic - Brief description)
            3. A summary of the main points covered
            4. Approximate duration in seconds

            Return the response in JSON format:
            {
                "transcript": "full transcript text",
                "timestamps": [
                    {
                        "time_seconds": 0,
                        "time_display": "00:00",
                        "topic": "Introduction",
                        "description": "Brief description"
                    }
                ],
                "summary": "summary text",
                "duration_seconds": 1800
            }
            """

            response = self.model.generate_content([prompt, video_file])

            # Parse JSON response
            result_text = response.text.strip()
            # Remove markdown code blocks if present
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]

            result = json.loads(result_text.strip())

            # Delete uploaded file
            genai.delete_file(video_file.name)

            return result

        except Exception as e:
            raise Exception(f"Error processing video: {str(e)}")

    def generate_embeddings(self, text: str) -> List[float]:
        """Generate embeddings for text using Gemini"""
        try:
            result = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            raise Exception(f"Error generating embeddings: {str(e)}")

    def chunk_text(self, text: str, chunk_size: int = 1000) -> List[str]:
        """Split text into chunks for processing"""
        words = text.split()
        chunks = []
        current_chunk = []
        current_size = 0

        for word in words:
            current_chunk.append(word)
            current_size += len(word) + 1

            if current_size >= chunk_size:
                chunks.append(' '.join(current_chunk))
                current_chunk = []
                current_size = 0

        if current_chunk:
            chunks.append(' '.join(current_chunk))

        return chunks

    def generate_quiz(self, content: str, num_questions: int = 25) -> List[Dict[str, Any]]:
        """
        Generate quiz questions from content
        Returns: [
            {
                'id': 'q1',
                'question': 'Question text',
                'options': ['A', 'B', 'C', 'D'],
                'correct': 0,  # index of correct answer
                'explanation': 'Why this is correct'
            }
        ]
        """
        try:
            prompt = f"""
            Create {num_questions} multiple-choice quiz questions from the following educational content.

            Requirements:
            - Each question should have 4 options
            - Include a 2-line explanation for each correct answer
            - Questions should test understanding, not just memorization
            - Cover different topics from the content

            Content:
            {content[:10000]}  # Limit content to avoid token limits

            Return response in JSON format:
            [
                {{
                    "id": "q1",
                    "question": "Question text here?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct": 0,
                    "explanation": "This is correct because... This demonstrates..."
                }}
            ]
            """

            response = self.model.generate_content(prompt)
            result_text = response.text.strip()

            # Remove markdown code blocks if present
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]

            questions = json.loads(result_text.strip())
            return questions

        except Exception as e:
            raise Exception(f"Error generating quiz: {str(e)}")

    def chat(self, message: str, context: str = "") -> str:
        """
        Chat with Gemini AI
        Args:
            message: User's question
            context: Relevant context from course materials (RAG)
        """
        try:
            prompt = f"""
            You are an AI tutor helping students learn. Use the provided context to answer the student's question.

            Context from course materials:
            {context}

            Student's question: {message}

            Provide a helpful, clear explanation. If the context doesn't contain relevant information, say so.
            """

            response = self.model.generate_content(prompt)
            return response.text

        except Exception as e:
            raise Exception(f"Error in chat: {str(e)}")

    def semantic_search_query(self, query: str) -> List[float]:
        """Generate embedding for search query"""
        try:
            result = genai.embed_content(
                model="models/embedding-001",
                content=query,
                task_type="retrieval_query"
            )
            return result['embedding']
        except Exception as e:
            raise Exception(f"Error generating query embedding: {str(e)}")


# Singleton instance
gemini_service = GeminiService()
