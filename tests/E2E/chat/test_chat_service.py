"""
Tests for chat module internal logic (ChatHistoryManager, title generation).

Covers the sliding-window and title-generation logic that is not
exercised through the REST API E2E tests alone.
"""

from datetime import datetime

from app.chat.history_manager import ChatHistoryManager
from app.chat.service import ChatPersistenceService
from app.chat.config import ChatModuleConfig
from app.chat.db.repository import ChatRepository
from app.chat.db.models import ChatMessage


class TestChatHistoryManager:
    """Tests for ChatHistoryManager sliding-window logic."""

    def setup_method(self):
        self.manager = ChatHistoryManager(max_messages=3)

    def _make_messages(self, count: int) -> list[ChatMessage]:
        """Create alternating user/assistant messages."""
        msgs: list[ChatMessage] = []
        for i in range(count):
            role = "user" if i % 2 == 0 else "assistant"
            msgs.append(ChatMessage(role=role, content=f"Message {i + 1}"))
        return msgs

    def test_empty_messages(self):
        result = self.manager.prepare_for_context([])
        assert result == []

    def test_within_window_returns_all(self):
        messages = self._make_messages(4)  # 4 <= max*2 (6)
        result = self.manager.prepare_for_context(messages)

        assert len(result) == 4
        assert result[0]["role"] == "user"
        assert result[0]["content"] == "Message 1"
        assert result[-1]["content"] == "Message 4"

    def test_exceeds_window_trims_to_last_n(self):
        messages = self._make_messages(10)  # 10 > max*2 (6)
        result = self.manager.prepare_for_context(messages)

        assert len(result) == 6
        assert result[0]["content"] == "Message 5"
        assert result[-1]["content"] == "Message 10"

    def test_exactly_at_boundary_returns_all(self):
        messages = self._make_messages(6)  # 6 == max*2
        result = self.manager.prepare_for_context(messages)

        assert len(result) == 6
        assert result[0]["content"] == "Message 1"

    def test_single_message(self):
        messages = self._make_messages(1)
        result = self.manager.prepare_for_context(messages)

        assert len(result) == 1
        assert result[0]["content"] == "Message 1"

    def test_to_dict_list_handles_dicts(self):
        dict_messages = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi"},
        ]
        result = self.manager.prepare_for_context(dict_messages)  # type: ignore

        assert len(result) == 2
        assert result[0]["role"] == "user"
        assert result[1]["content"] == "Hi"

    def test_to_dict_list_handles_objects(self):
        obj_messages = [
            ChatMessage(role="user", content="Hello"),
            ChatMessage(role="assistant", content="Hi"),
        ]
        result = self.manager.prepare_for_context(obj_messages)

        assert len(result) == 2
        assert result[0]["role"] == "user"
        assert result[1]["content"] == "Hi"


class TestChatTitleGeneration:
    """Tests for ChatPersistenceService._generate_title logic."""

    def setup_method(self):
        config = ChatModuleConfig(max_title_length=20)
        repo = ChatRepository()
        self.service = ChatPersistenceService(chat_repository=repo, config=config)

    def test_normal_title(self):
        title = self.service._generate_title("Hello world")
        assert title == "Hello world"

    def test_truncates_long_content(self):
        title = self.service._generate_title("a" * 30)
        assert len(title) <= 20
        assert title == "a" * 17 + "..."
        assert title.endswith("...")

    def test_replaces_newlines_with_spaces(self):
        title = self.service._generate_title("Line one\nLine two")
        assert title == "Line one Line two"

    def test_empty_content_returns_default(self):
        title = self.service._generate_title("   ")
        assert title == "New chat"

    def test_content_at_boundary(self):
        title = self.service._generate_title("a" * 20)
        assert title == "a" * 20
        assert not title.endswith("...")

    def test_content_one_over_boundary(self):
        title = self.service._generate_title("a" * 21)
        assert len(title) <= 20
        assert title == "a" * 17 + "..."
        assert title.endswith("...")

    def test_strips_whitespace(self):
        title = self.service._generate_title("  Hello  ")
        assert title == "Hello"
