import pytest
from app.journals.utils.tiptap_parser import extract_text_from_tiptap_json


def test_extract_text_empty_node():
    assert extract_text_from_tiptap_json(None) == ""
    assert extract_text_from_tiptap_json({}) == ""


def test_extract_text_simple_paragraph():
    ast = {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": "Hello world"}]
            }
        ]
    }
    assert extract_text_from_tiptap_json(ast) == "Hello world"


def test_extract_text_multiple_blocks():
    ast = {
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "content": [{"type": "text", "text": "Title"}]
            },
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": "First paragraph."}]
            },
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": "Second paragraph."}]
            }
        ]
    }
    extracted = extract_text_from_tiptap_json(ast)
    assert extracted == "Title\nFirst paragraph.\nSecond paragraph."
