import jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from app.core.config import Settings


class JWTService:
    """Service for encoding and decoding JWT tokens."""
    
    def __init__(self, settings: Settings):
        self.secret_key = settings.jwt_secret_key
        self.algorithm = "HS256"
    
    def encode_token(self, payload: Dict[str, Any]) -> str:
        """
        Encode a JWT token.
        
        Args:
            payload: Token payload data
            
        Returns:
            Encoded JWT token string
        """
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def decode_token(self, token: str) -> Dict[str, Any]:
        """
        Decode and verify a JWT token.
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded token payload
            
        Raises:
            jwt.InvalidTokenError: If token is invalid or expired
        """
        return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
