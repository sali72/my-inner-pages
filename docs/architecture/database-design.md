# Database Design

## MongoDB Collections

### Users Collection

```javascript
{
  _id: ObjectId("..."),
  email: "user@example.com",           // Unique, indexed
  hashed_password: "bcrypt_hash...",   // Bcrypt with salt rounds=12
  is_verified: false,                  // Email verification status
  created_at: ISODate("2024-01-01"),
  updated_at: ISODate("2024-01-01")
}
```

**Indexes:**
- `email` (unique, ascending)
- `created_at` (ascending)

### Journals Collection

```javascript
{
  _id: ObjectId("..."),
  user_id: "user_object_id",           // Owner reference
  title: "My Journal Entry",           // Max 200 chars
  content: "Today was great...",       // Max 50000 chars
  tags: ["personal", "growth"],        // Array of strings
  created_at: ISODate("2024-01-01"),
  updated_at: ISODate("2024-01-01")
}
```

**Indexes:**
- `user_id` (ascending) - For user-specific queries
- `created_at` (descending) - For sorting by date
- `user_id + created_at` (compound) - Optimized list queries

## Design Decisions

### Why MongoDB?

✅ **Schema Flexibility**
- Journal entries can evolve (add metadata, attachments later)
- Tags stored as native arrays
- No complex migrations for schema changes

✅ **Document Model**
- Each journal is self-contained
- No joins needed for user's journals
- Natural fit for JSON API

✅ **Performance**
- Fast document retrieval by user_id
- Efficient array operations (tags)
- Good for read-heavy workloads

### Replica Set Requirement

**Why needed:**
- MongoDB transactions require replica set
- Ensures ACID guarantees for critical operations
- Production-ready architecture

**Setup:**
```bash
# Initialize replica set
mongod --replSet rs0
mongo --eval "rs.initiate()"
```

### User ID as String

**Pattern:**
```python
user_id: str  # Stored as string in journals
```

**Rationale:**
- Avoid ObjectId dependency in domain logic
- Easier serialization to JSON
- String comparison faster than ObjectId
- Can switch ID generation strategy if needed

## Data Access Patterns

### Journal Queries

**List User's Journals (Paginated)**
```python
journals = await Journal.find(
    Journal.user_id == user_id
).sort(-Journal.created_at).skip(skip).limit(limit).to_list()
```

**Get Specific Journal**
```python
journal = await Journal.find_one(
    Journal.id == journal_id,
    Journal.user_id == user_id
)
```

**Recent Journals for AI Context**
```python
journals = await Journal.find(
    Journal.user_id == user_id
).sort(-Journal.created_at).limit(5).to_list()
```

### User Queries

**Find by Email**
```python
user = await User.find_one(User.email == email)
```

**Get by ID**
```python
user = await User.get(user_id)
```

## Repository Pattern

### Base Operations

Every repository provides:
- `create(data)` - Insert new document
- `get(id, user_id)` - Retrieve by ID with ownership check
- `update(id, user_id, data)` - Update with ownership check
- `delete(id, user_id)` - Delete with ownership check
- `find_by_user(user_id, filters)` - Query user's documents

### Session Management

```python
from app.core.deps.database import get_current_session

class JournalRepository:
    async def create(self, journal: Journal) -> Journal:
        session = get_current_session()
        # Use session for operation
        await journal.insert(session=session)
        return journal
```

### Transaction Support

```python
from app.core.transactions import with_transaction

@with_transaction
async def complex_operation():
    # Multiple operations in transaction
    await repo1.create(...)
    await repo2.update(...)
    # Auto-commit or rollback on error
```

## Data Validation

### Schema Level (Beanie Models)

```python
from beanie import Document
from pydantic import Field, field_validator

class Journal(Document):
    user_id: str
    title: str = Field(max_length=200)
    content: str = Field(max_length=50000)
    tags: list[str] = Field(default_factory=list)
    
    @field_validator('tags')
    def validate_tags(cls, v):
        if len(v) > 20:
            raise ValueError("Maximum 20 tags allowed")
        return v
```

### API Level (Pydantic Schemas)

```python
from pydantic import BaseModel, field_validator

class CreateJournalRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=50000)
    tags: list[str] = Field(default_factory=list)
    
    @field_validator('tags')
    def validate_tags(cls, v):
        return [tag.strip().lower() for tag in v if tag.strip()]
```

## Migration Strategy

### Current (No Migrations)
- Fresh database per environment
- Schema defined in Beanie models
- Auto-created on first use

### Future (When Needed)
- Use Beanie's migration system
- Version controlled migration scripts
- Backwards compatible changes preferred

**Example Migration:**
```python
# migrations/001_add_journal_mood.py
from beanie import Document

async def migrate():
    # Add new field with default
    await Journal.find().update({"$set": {"mood": "neutral"}})
```

## Backup Strategy

### Development
- Docker volume for persistence
- Manual mongodump if needed

### Production Recommendations
- Automated daily backups
- Point-in-time recovery enabled
- Store backups in S3/GCS
- Test restore procedure regularly

**Backup Command:**
```bash
mongodump --uri="mongodb://..." --out=/backup/$(date +%Y%m%d)
```

## Performance Optimization

### Current Optimizations
- Indexes on frequently queried fields
- Pagination to limit result size
- Projection to exclude large fields when not needed
- Connection pooling via Motor

### Future Optimizations
- Aggregation pipeline for complex queries
- Caching layer (Redis) for read-heavy data
- Read replicas for scaling reads
- Sharding by user_id for horizontal scaling

## Data Privacy

### User Data Isolation
- Every query includes user_id filter
- Repository layer enforces ownership
- No cross-user data exposure

### Sensitive Data
- Passwords: Bcrypt hashed (never stored plain)
- Tokens: Not stored in database (stateless JWT)
- Journal content: Not encrypted (self-hosted option available)

### Data Deletion
```python
# Hard delete (GDPR compliance)
await Journal.find(Journal.user_id == user_id).delete()
await User.find(User.id == user_id).delete()
```

## Monitoring

### Key Metrics
- Query performance (slow query log)
- Connection pool utilization
- Document count per collection
- Index usage statistics
- Storage size

### MongoDB Commands
```javascript
// Check indexes
db.journals.getIndexes()

// Query stats
db.journals.stats()

// Slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 })
```
