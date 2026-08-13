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


def test_extract_text_nested_lists_and_quotes():
    ast = {
        "type": "doc",
        "content": [
            {
                "type": "blockquote",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": "Self-reflection is key."}]
                    }
                ]
            },
            {
                "type": "bulletList",
                "content": [
                    {
                        "type": "listItem",
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "Item 1"}]
                            }
                        ]
                    },
                    {
                        "type": "listItem",
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "Item 2"}]
                            }
                        ]
                    }
                ]
            }
        ]
    }
    extracted = extract_text_from_tiptap_json(ast)
    assert extracted == "Self-reflection is key.\nItem 1\nItem 2"


def test_extract_text_hard_breaks_and_code():
    ast = {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Line one"},
                    {"type": "hardBreak"},
                    {"type": "text", "text": "Line two"}
                ]
            },
            {
                "type": "codeBlock",
                "content": [{"type": "text", "text": "console.log('hello')"}]
            }
        ]
    }
    extracted = extract_text_from_tiptap_json(ast)
    assert extracted == "Line one\nLine two\nconsole.log('hello')"


def test_extract_text_malformed_node():
    assert extract_text_from_tiptap_json("not a dict") == ""
    assert extract_text_from_tiptap_json({"type": "doc", "content": "not a list"}) == ""

