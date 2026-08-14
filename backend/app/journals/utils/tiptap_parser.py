import re
import copy
from typing import Any, Dict, Optional

BLOCK_NODES = {
    "paragraph",
    "heading",
    "blockquote",
    "codeBlock",
    "bulletList",
    "orderedList",
    "listItem",
    "taskItem",
}


def extract_text_from_tiptap_json(node: Optional[Dict[str, Any]]) -> str:
    """
    Recursively extract plain text from a Tiptap / ProseMirror JSON AST.
    Handles block nodes, hard breaks, nested lists, and inline text.
    """
    if not node or not isinstance(node, dict):
        return ""

    node_type = node.get("type", "")

    # Text node base case
    if node_type == "text":
        return str(node.get("text", ""))

    # Hard break
    if node_type == "hardBreak":
        return "\n"

    content = node.get("content", [])
    if not isinstance(content, list):
        return ""

    text_parts = [extract_text_from_tiptap_json(child) for child in content if isinstance(child, dict)]
    combined = "".join(text_parts)

    if node_type in BLOCK_NODES and combined:
        if not combined.endswith("\n"):
            combined += "\n"

    return combined.strip() if node_type == "doc" else combined


def replace_hashtag_in_text(text: str, old_tag: str, new_tag: Optional[str]) -> str:
    """
    Replace or remove #old_tag in plain text.
    If new_tag is provided, #old_tag is replaced with #new_tag.
    If new_tag is None, #old_tag is converted to old_tag (stripping the leading #).
    """
    if not text or not old_tag:
        return text

    escaped_tag = re.escape(old_tag)
    pattern = re.compile(rf'#{escaped_tag}\b', flags=re.IGNORECASE)

    if new_tag is not None:
        return pattern.sub(f'#{new_tag}', text)
    else:
        return pattern.sub(old_tag, text)


def replace_hashtag_in_tiptap_json(
    node: Optional[Dict[str, Any]], old_tag: str, new_tag: Optional[str]
) -> Optional[Dict[str, Any]]:
    """
    Recursively replace or remove #old_tag in text nodes of a Tiptap / ProseMirror JSON AST.
    """
    if not node or not isinstance(node, dict):
        return node

    new_node = copy.deepcopy(node)
    _transform_tiptap_node(new_node, old_tag, new_tag)
    return new_node


def _transform_tiptap_node(node: Dict[str, Any], old_tag: str, new_tag: Optional[str]) -> None:
    if node.get("type") == "text" and "text" in node:
        node["text"] = replace_hashtag_in_text(str(node["text"]), old_tag, new_tag)

    content = node.get("content")
    if isinstance(content, list):
        for child in content:
            if isinstance(child, dict):
                _transform_tiptap_node(child, old_tag, new_tag)

