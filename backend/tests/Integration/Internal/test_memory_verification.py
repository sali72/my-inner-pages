import pytest
from app.memory.user_model_updater import (
    normalize_for_matching,
    verify_quote_in_text,
    UserModelUpdater,
)
from app.memory.db.models import UserModel, UserModelStats
from app.journals.db.models import Journal


def test_normalize_for_matching():
    text = "Hello, World! This is a... test—indeed."
    norm = normalize_for_matching(text)
    assert norm == "hello world this is a test indeed"


def test_verify_quote_in_text_exact():
    source = "I keep telling myself I don't need anyone's help, but when I got the job offer I wanted to call her."
    quote = "I keep telling myself I don't need anyone's help"
    assert verify_quote_in_text(quote, source) is True


def test_verify_quote_in_text_fuzzy():
    source = "I keep telling myself I don't need anyone's help, but when I got the job offer I wanted to call her."
    # Minor punctuation or small typo differences
    quote = "I keep telling myself I dont need anyone's help..."
    assert verify_quote_in_text(quote, source) is True


def test_verify_quote_in_text_hallucination():
    source = "Today was a quiet day at the park. Birds were singing."
    quote = "I feel totally overwhelmed by my family obligations."
    assert verify_quote_in_text(quote, source) is False


from types import SimpleNamespace

def test_valence_gate():
    updater = UserModelUpdater(None, None, None, None)
    
    safe_journals = [
        SimpleNamespace(rumination_index=0.2),
        SimpleNamespace(rumination_index=0.4),
    ]
    assert updater._check_valence_gate(safe_journals) is True
    
    ruminative_journals = [
        SimpleNamespace(rumination_index=0.85),
        SimpleNamespace(rumination_index=0.75),
    ]
    assert updater._check_valence_gate(ruminative_journals) is False
