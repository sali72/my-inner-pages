from typing import TypedDict


class WSClientMessage(TypedDict):
    type: str
    content: str
