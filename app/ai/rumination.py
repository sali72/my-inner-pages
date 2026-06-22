import re
from dataclasses import dataclass
from typing import Optional

RUMINATION_THRESHOLD: float = 0.70
_MIN_WORDS: int = 10


@dataclass(frozen=True)
class LanguageRuminationConfig:
    tokenizer: re.Pattern
    abstract_markers: frozenset[str]
    concrete_markers: frozenset[str]


_ENGLISH_TOKENIZER = re.compile(r"[a-z]+")

_EN_ABSTRACT: frozenset[str] = frozenset({
    "always", "never", "everything", "nothing", "everyone", "nobody",
    "all", "none", "constantly", "forever", "every", "whole",
    "should", "shouldn't", "should not", "must", "mustn't", "must not",
    "ought", "supposed to",
    "why", "because", "meaning", "purpose", "reason", "means",
    "ruminate", "ruminating", "ruminated", "obsess", "obsessing",
    "obsessed", "worry", "worrying", "worried", "dwell", "dwelling",
    "dwelled", "overthink", "overthinking", "overthought",
    "failure", "worthless", "hopeless", "pointless", "meaningless",
    "useless", "stupid", "terrible", "horrible", "awful",
    "can't", "cannot", "impossible", "unbearable",
    "pathetic", "incompetent", "inadequate",
})

_EN_CONCRETE: frozenset[str] = frozenset({
    "saw", "heard", "felt", "touched", "smelled", "tasted",
    "noticed", "watched", "listened", "observed",
    "today", "yesterday", "tomorrow", "tonight",
    "morning", "afternoon", "evening", "midnight",
    "walked", "ate", "called", "wrote", "went", "sat", "stood",
    "talked", "cooked", "cleaned", "drove", "bought", "made",
    "worked", "met", "read", "played", "exercised", "drank",
    "slept", "ran", "swam", "climbed", "built", "fixed",
    "baked", "painted", "drew", "typed", "texted",
    "here", "now", "currently",
})

_LANGUAGES: dict[str, LanguageRuminationConfig] = {
    "en": LanguageRuminationConfig(
        tokenizer=_ENGLISH_TOKENIZER,
        abstract_markers=_EN_ABSTRACT,
        concrete_markers=_EN_CONCRETE,
    ),
}

# Rough script detection for auto-language selection.
# Extend this when adding new languages.
_SCRIPT_RANGES: dict[str, tuple[int, int]] = {
    "ar": (0x0600, 0x06FF),
}


def _detect_language(text: str) -> str:
    for code, (lo, hi) in _SCRIPT_RANGES.items():
        for ch in text:
            if lo <= ord(ch) <= hi and not ch.isspace():
                return code
    return "en"


def compute_rumination_index(text: str, lang: Optional[str] = None) -> float:
    if not text:
        return 0.0

    lang = lang or _detect_language(text)
    cfg = _LANGUAGES.get(lang)

    if cfg is None:
        return 0.0

    words = cfg.tokenizer.findall(text.lower())

    if len(words) < _MIN_WORDS:
        return 0.0

    abstract = sum(1 for w in words if w in cfg.abstract_markers)
    concrete = sum(1 for w in words if w in cfg.concrete_markers)

    total = abstract + concrete
    if total == 0:
        return 0.0

    return abstract / total
