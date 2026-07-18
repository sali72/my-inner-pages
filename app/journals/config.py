from pydantic import BaseModel


class JournalModuleConfig(BaseModel):
    """Journal module specific configuration."""
    
    # Pagination defaults
    default_page_size: int = 20
    max_page_size: int = 100
    
    # Content limits
    max_title_length: int = 200
    max_content_length: int = 50000
    
    # Tag limits
    max_tags_per_journal: int = 20
    max_tag_length: int = 50

    # Feature flags
    enable_tags: bool = True
