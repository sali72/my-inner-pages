from pydantic import BaseModel


class JournalModuleConfig(BaseModel):
    """Journal module specific configuration."""
    
    # Pagination defaults
    default_page_size: int = 20
    max_page_size: int = 100
    
    # Content limits
    max_title_length: int = 200
    max_content_length: int = 50000
    
    # Feature flags
    enable_soft_delete: bool = True
    enable_tags: bool = True
