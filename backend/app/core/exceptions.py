"""
Custom exceptions for the application.
"""


class AppException(Exception):
    """Base exception for all application errors."""
    
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class DatabaseException(AppException):
    """Exception raised for database operation errors."""
    pass


class RepositoryException(DatabaseException):
    """Exception raised for repository-level errors."""
    pass


class DocumentNotFoundException(RepositoryException):
    """Exception raised when a document is not found."""
    
    def __init__(self, model_name: str, identifier: str):
        message = f"{model_name} not found"
        details = {"model": model_name, "identifier": identifier}
        super().__init__(message, details)


class DuplicateDocumentException(RepositoryException):
    """Exception raised when trying to create a duplicate document."""
    
    def __init__(self, model_name: str, field: str, value: str):
        message = f"{model_name} with {field}='{value}' already exists"
        details = {"model": model_name, "field": field, "value": value}
        super().__init__(message, details)
