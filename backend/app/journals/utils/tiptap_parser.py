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
