from app.core.logging import get_logger

logger = get_logger(__name__)


class ChatHistoryManager:
    def __init__(self, max_messages: int = 20) -> None:
        self.max_messages = max_messages

    def prepare_for_context(self, messages: list) -> list[dict]:
        if not messages:
            return []

        if len(messages) <= self.max_messages * 2:
            result = self._to_dict_list(messages)
        else:
            result = self._to_dict_list(messages[-(self.max_messages * 2):])

        logger.debug(
            "history_windowed",
            original_count=len(messages),
            windowed_count=len(result),
            max_messages=self.max_messages,
        )
        return result

    @staticmethod
    def _to_dict_list(messages: list) -> list[dict]:
        return [
            {"role": msg["role"] if isinstance(msg, dict) else msg.role,
             "content": msg["content"] if isinstance(msg, dict) else msg.content}
            for msg in messages
        ]
