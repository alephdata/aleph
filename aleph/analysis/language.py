import logging
import fasttext
from normality import collapse_spaces

from aleph.core import settings
from aleph.analysis.util import TEXT_MAX_LENGTH

log = logging.getLogger(__name__)
THRESHOLD = 0.6


def detect_languages(entity, texts):
    """Given a list of lines, return a list of (line, lang)"""
    if entity.has('language'):
        # Don't detect if a language is hard-coded.
        return
    entity.pop('detectedLanguage')
    if not hasattr(settings, '_lang_detector'):
        lid_model = fasttext.load_model(settings.LID_MODEL_PATH)
        settings._lang_detector = lid_model
    text = collapse_spaces(' '.join(texts))[:TEXT_MAX_LENGTH]
    langs = settings._lang_detector.predict(text, k=3)
    for (lang, score) in zip(*langs):
        if score <= THRESHOLD:
            continue
        # fasttext labels are prefixed, with '__label__' by default
        lang = lang.replace('__label__', '')
        log.debug("Detected (%s chars): %s -> %.3f",
                  len(text), lang, score)
        entity.add('detectedLanguage', lang)
