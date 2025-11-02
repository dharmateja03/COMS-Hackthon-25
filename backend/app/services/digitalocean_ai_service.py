"""
DigitalOcean Gradient AI integration service
Uses DigitalOcean's GPU infrastructure and serverless inference for:
- Quiz question quality improvement
- Video content summarization
- Advanced semantic embeddings
- Real-time chat response generation
"""
import requests
from typing import List, Dict, Any, Optional
from app.core.config import settings
import json


class DigitalOceanAIService:
    def __init__(self):
        """
        Initialize DigitalOcean Gradient AI Service

        DigitalOcean Gradient AI provides:
        - GPU Droplets for heavy ML workloads
        - Serverless inference for instant LLM access
        - 1-Click Models for easy deployment
        """
        self.api_token = settings.DIGITALOCEAN_API_TOKEN
        self.gradient_endpoint = settings.DIGITALOCEAN_GRADIENT_ENDPOINT
        self.enabled = self._check_enabled()

    def _check_enabled(self) -> bool:
        """Check if DigitalOcean Gradient AI is configured"""
        if not self.api_token or self.api_token == "your_digitalocean_token_here":
            return False
        if not self.gradient_endpoint or self.gradient_endpoint == "your_gradient_endpoint_here":
            return False
        return True

    def generate_quiz_questions(
        self,
        content: str,
        num_questions: int = 25,
        difficulty: str = "medium"
    ) -> List[Dict[str, Any]]:
        """
        Use DigitalOcean Gradient AI to generate high-quality quiz questions

        This uses DigitalOcean's serverless inference with models like:
        - Llama 3.1 70B
        - Mistral Large
        - GPT-4 compatible models

        Args:
            content: Educational content to generate questions from
            num_questions: Number of questions to generate
            difficulty: easy, medium, hard

        Returns:
            List of quiz questions with answers and explanations
        """
        if not self.enabled:
            return self._generate_fallback_questions(content, num_questions)

        try:
            prompt = f"""
            You are an expert educator creating quiz questions.

            Content:
            {content[:4000]}  # Limit for token efficiency

            Generate {num_questions} multiple-choice questions at {difficulty} difficulty level.
            Each question should have:
            - A clear question
            - 4 options (A, B, C, D)
            - The correct answer index (0-3)
            - A detailed 2-sentence explanation

            Format as JSON array:
            [
                {{
                    "question": "...",
                    "options": ["A", "B", "C", "D"],
                    "correct": 0,
                    "explanation": "..."
                }},
                ...
            ]
            """

            headers = {
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "llama-3.1-70b-instruct",  # DigitalOcean 1-Click Model
                "messages": [
                    {"role": "system", "content": "You are an expert educational AI assistant."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 3000
            }

            response = requests.post(
                f"{self.gradient_endpoint}/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")

                # Parse JSON from response
                try:
                    questions = json.loads(content)
                    return questions[:num_questions]
                except json.JSONDecodeError:
                    # Fallback if JSON parsing fails
                    return self._generate_fallback_questions(content, num_questions)
            else:
                print(f"DigitalOcean Gradient AI error: {response.status_code}")
                return self._generate_fallback_questions(content, num_questions)

        except Exception as e:
            print(f"Error using DigitalOcean Gradient AI: {str(e)}")
            return self._generate_fallback_questions(content, num_questions)

    def generate_embeddings(
        self,
        texts: List[str],
        model: str = "text-embedding-ada-002"
    ) -> List[List[float]]:
        """
        Generate embeddings using DigitalOcean GPU infrastructure

        Uses DigitalOcean GPU Droplets for:
        - Fast batch embedding generation
        - Custom fine-tuned models
        - Cost-effective at scale

        Args:
            texts: List of text chunks to embed
            model: Embedding model to use

        Returns:
            List of embedding vectors
        """
        if not self.enabled:
            return []

        try:
            headers = {
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": model,
                "input": texts[:100]  # Batch process 100 at a time
            }

            response = requests.post(
                f"{self.gradient_endpoint}/v1/embeddings",
                headers=headers,
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                embeddings = [item["embedding"] for item in result.get("data", [])]
                return embeddings
            else:
                print(f"DigitalOcean embedding error: {response.status_code}")
                return []

        except Exception as e:
            print(f"Error generating embeddings with DigitalOcean: {str(e)}")
            return []

    def enhance_chat_response(
        self,
        user_message: str,
        context: str,
        conversation_history: List[Dict[str, str]] = None
    ) -> str:
        """
        Use DigitalOcean Gradient AI for intelligent chat responses

        Leverages:
        - Llama 3.1 70B for complex reasoning
        - GPU acceleration for fast responses
        - Context-aware generation

        Args:
            user_message: User's question
            context: Relevant course material
            conversation_history: Previous messages

        Returns:
            AI-generated response
        """
        if not self.enabled:
            return "DigitalOcean Gradient AI is not configured."

        try:
            messages = [
                {
                    "role": "system",
                    "content": "You are an encouraging AI tutor helping students learn. Use the provided context to answer questions accurately."
                }
            ]

            # Add conversation history
            if conversation_history:
                messages.extend(conversation_history[-5:])  # Last 5 messages for context

            # Add current question with context
            messages.append({
                "role": "user",
                "content": f"""Context from course materials:
{context[:3000]}

Student Question: {user_message}

Please provide a helpful, encouraging response that:
1. Directly answers the question
2. References the course materials
3. Explains concepts clearly
4. Encourages further learning"""
            })

            headers = {
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "llama-3.1-70b-instruct",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 500
            }

            response = requests.post(
                f"{self.gradient_endpoint}/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                return result.get("choices", [{}])[0].get("message", {}).get("content", "")
            else:
                print(f"DigitalOcean chat error: {response.status_code}")
                return "I'm having trouble connecting to the AI service. Please try again."

        except Exception as e:
            print(f"Error with DigitalOcean chat: {str(e)}")
            return "I encountered an error. Please try again."

    def summarize_video_transcript(
        self,
        transcript: str,
        max_summary_length: int = 500
    ) -> Dict[str, Any]:
        """
        Use DigitalOcean GPU infrastructure to summarize video content

        Generates:
        - Concise summary
        - Key topics
        - Important timestamps
        - Learning objectives

        Args:
            transcript: Full video transcript
            max_summary_length: Max words in summary

        Returns:
            {
                "summary": "...",
                "key_topics": [...],
                "learning_objectives": [...]
            }
        """
        if not self.enabled:
            return {
                "summary": "DigitalOcean Gradient AI not configured",
                "key_topics": [],
                "learning_objectives": []
            }

        try:
            prompt = f"""
            Analyze this video transcript and provide:
            1. A {max_summary_length}-word summary
            2. List of 5 key topics covered
            3. List of 3 learning objectives

            Transcript:
            {transcript[:5000]}

            Format as JSON:
            {{
                "summary": "...",
                "key_topics": ["topic1", "topic2", ...],
                "learning_objectives": ["objective1", ...]
            }}
            """

            headers = {
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "llama-3.1-70b-instruct",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.5,
                "max_tokens": 1000
            }

            response = requests.post(
                f"{self.gradient_endpoint}/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")

                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    return {
                        "summary": content[:max_summary_length],
                        "key_topics": [],
                        "learning_objectives": []
                    }
            else:
                return {
                    "summary": "Summary generation failed",
                    "key_topics": [],
                    "learning_objectives": []
                }

        except Exception as e:
            print(f"Error summarizing video: {str(e)}")
            return {
                "summary": f"Error: {str(e)}",
                "key_topics": [],
                "learning_objectives": []
            }

    def _generate_fallback_questions(self, content: str, num_questions: int) -> List[Dict[str, Any]]:
        """Fallback when DigitalOcean is not available"""
        return []


# Singleton instance
digitalocean_ai_service = DigitalOceanAIService()
