"""
Snowflake Cortex AI integration service
Provides AI-powered features using Snowflake's Cortex AI capabilities
"""
import snowflake.connector
from typing import List, Dict, Any, Optional
import json
from app.core.config import settings


class SnowflakeService:
    def __init__(self):
        self.account = settings.SNOWFLAKE_ACCOUNT
        self.user = settings.SNOWFLAKE_USER
        self.password = settings.SNOWFLAKE_PASSWORD
        self.database = settings.SNOWFLAKE_DATABASE
        self.schema = settings.SNOWFLAKE_SCHEMA
        self.warehouse = settings.SNOWFLAKE_WAREHOUSE
        self.use_cortex = settings.SNOWFLAKE_USE_CORTEX
        self.enabled = self._check_enabled()

    def _check_enabled(self) -> bool:
        """Check if Snowflake is configured and enabled"""
        if not self.account or self.account == "your_account_here":
            return False
        if not self.user or self.user == "your_username_here":
            return False
        if not self.password or self.password == "your_password_here":
            return False
        return True

    def get_connection(self):
        """Create Snowflake connection"""
        if not self.enabled:
            raise Exception("Snowflake is not configured. Set SNOWFLAKE_* environment variables.")

        return snowflake.connector.connect(
            account=self.account,
            user=self.user,
            password=self.password,
            database=self.database,
            schema=self.schema,
            warehouse=self.warehouse
        )

    def generate_study_recommendations(
        self,
        weak_topics: List[str],
        strong_topics: List[str],
        recent_scores: List[float],
        context: str = ""
    ) -> Dict[str, Any]:
        """
        Use Snowflake Cortex AI to generate personalized study recommendations

        Args:
            weak_topics: List of topics student struggles with
            strong_topics: List of topics student excels at
            recent_scores: Recent quiz scores
            context: Additional context about the student

        Returns:
            {
                "recommendations": ["Study topic 1", "Practice topic 2"],
                "study_plan": "Detailed study plan...",
                "estimated_hours": 5,
                "priority_topics": ["Topic 1", "Topic 2"]
            }
        """
        if not self.enabled or not self.use_cortex:
            # Return basic recommendations without Snowflake
            return self._generate_basic_recommendations(weak_topics, strong_topics, recent_scores)

        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            # Build prompt for Cortex AI
            # Note: Avoid % signs in f-strings to prevent SQL formatting issues
            weak_list = ', '.join(weak_topics) if weak_topics else 'None identified'
            strong_list = ', '.join(strong_topics) if strong_topics else 'None identified'
            scores_list = ', '.join([f'{score}' for score in recent_scores]) if recent_scores else 'No scores yet'
            context_text = context if context else 'None'

            prompt = f"""You are an AI tutor analyzing a student's performance. Generate personalized study recommendations.

Student Performance Data:
- Weak Topics: {weak_list}
- Strong Topics: {strong_list}
- Recent Quiz Scores: {scores_list}
- Additional Context: {context_text}

Generate a JSON response with:
1. List of 3-5 specific study recommendations
2. A detailed study plan (paragraph format)
3. Estimated study hours needed
4. Priority topics to focus on first

Format as JSON:
{{
    "recommendations": ["recommendation 1", "recommendation 2", ...],
    "study_plan": "detailed plan text",
    "estimated_hours": 5,
    "priority_topics": ["topic 1", "topic 2"]
}}"""

            # Use Snowflake Cortex COMPLETE function
            # Using mixtral-8x7b which is available in most regions
            # Available models: mistral-7b, mixtral-8x7b, llama2-70b-chat, llama3-8b, llama3-70b
            query = "SELECT SNOWFLAKE.CORTEX.COMPLETE('mixtral-8x7b', %(prompt)s) as response"

            cursor.execute(query, {'prompt': prompt})
            result = cursor.fetchone()

            if result and result[0]:
                # Parse the response
                response_text = result[0]
                # Extract JSON from response
                try:
                    # Try to parse as JSON
                    recommendations = json.loads(response_text)
                except:
                    # If not valid JSON, create structured response
                    recommendations = {
                        "recommendations": [
                            f"Focus on {topic}" for topic in weak_topics[:3]
                        ],
                        "study_plan": response_text,
                        "estimated_hours": len(weak_topics) * 2,
                        "priority_topics": weak_topics[:3]
                    }

                cursor.close()
                conn.close()

                return recommendations

            cursor.close()
            conn.close()

            # Fallback to basic recommendations
            return self._generate_basic_recommendations(weak_topics, strong_topics, recent_scores)

        except Exception as e:
            print(f"Snowflake Cortex AI error: {str(e)}")
            # Fallback to basic recommendations
            return self._generate_basic_recommendations(weak_topics, strong_topics, recent_scores)

    def _generate_basic_recommendations(
        self,
        weak_topics: List[str],
        strong_topics: List[str],
        recent_scores: List[float]
    ) -> Dict[str, Any]:
        """Fallback recommendations when Snowflake is not available"""

        recommendations = []
        priority_topics = weak_topics[:3] if weak_topics else []

        # Generate recommendations based on weak topics
        if weak_topics:
            for topic in weak_topics[:3]:
                recommendations.append(f"Review and practice {topic}")
            recommendations.append("Take additional practice quizzes on weak areas")
        else:
            recommendations.append("Great job! Continue practicing to maintain your skills")
            if strong_topics:
                recommendations.append(f"Consider advanced topics in {strong_topics[0]}")

        # Analyze score trend
        if len(recent_scores) >= 2:
            trend = "improving" if recent_scores[0] > recent_scores[-1] else "declining"
            if trend == "declining":
                recommendations.append("Focus on fundamentals - your scores are declining")
            else:
                recommendations.append("Keep up the good work - your scores are improving!")

        # Build study plan
        study_plan = ""
        if weak_topics:
            study_plan = f"Focus on strengthening your understanding of: {', '.join(weak_topics[:3])}. "
            study_plan += f"Allocate {len(weak_topics) * 2} hours this week to review these topics. "

        if strong_topics:
            study_plan += f"You're doing well in {', '.join(strong_topics[:2])}. "

        study_plan += "Take regular practice quizzes to track your progress."

        return {
            "recommendations": recommendations,
            "study_plan": study_plan,
            "estimated_hours": len(weak_topics) * 2 if weak_topics else 3,
            "priority_topics": priority_topics,
            "source": "basic_algorithm"  # Indicate this is fallback
        }

    def vector_similarity_search(
        self,
        query_embedding: List[float],
        embeddings_table: str = "document_embeddings",
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Use Snowflake's vector similarity search (fallback for Gemini quota issues)

        Args:
            query_embedding: Vector embedding of the query
            embeddings_table: Name of the table containing embeddings
            top_k: Number of top results to return

        Returns:
            List of {text, similarity_score, metadata}
        """
        if not self.enabled:
            return []

        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            # Use Snowflake's VECTOR_COSINE_SIMILARITY function
            query = f"""
            SELECT
                chunk_text,
                VECTOR_COSINE_SIMILARITY(embedding, PARSE_JSON(%s)::VECTOR(FLOAT, 768)) as similarity_score,
                file_name,
                chunk_index
            FROM {embeddings_table}
            ORDER BY similarity_score DESC
            LIMIT {top_k};
            """

            cursor.execute(query, (json.dumps(query_embedding),))
            results = cursor.fetchall()

            cursor.close()
            conn.close()

            return [
                {
                    "text": row[0],
                    "similarity_score": float(row[1]),
                    "file_name": row[2],
                    "chunk_index": row[3]
                }
                for row in results
            ]

        except Exception as e:
            print(f"Snowflake vector search error: {str(e)}")
            return []


# Singleton instance
snowflake_service = SnowflakeService()
