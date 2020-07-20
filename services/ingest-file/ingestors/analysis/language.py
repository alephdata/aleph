import logging
import fasttext

from ingestors import settings

log = logging.getLogger(__name__)
THRESHOLD = 0.6


def detect_languages(entity, text, k=1):
    """Given a list of lines, return a list of (line, lang)"""
    if entity.has("language") or entity.has("detectedLanguage"):
        # Don't detect if a language is hard-coded.
        return
    entity.pop("detectedLanguage")
    if not hasattr(settings, "_lang_detector"):
        lid_model = fasttext.load_model(settings.LID_MODEL_PATH)
        settings._lang_detector = lid_model
    langs = settings._lang_detector.predict(text, k=k)
    for (lang, score) in zip(*langs):
        if score <= THRESHOLD:
            continue
        # fasttext labels are prefixed, with '__label__' by default
        lang = lang.replace("__label__", "")
        log.debug("Detected (%s chars): %s -> %.3f", len(text), lang, score)
        entity.add("detectedLanguage", lang)


def detect_single_lang(text):
    """
    Given a single line of text, returns the language ID for the most
    probable match.

    If the supplied text is an array of lines, then the language ID for
    most probable match of the first line is returned.
    """

    if not hasattr(settings, "_lang_detector"):
        lid_model = fasttext.load_model(settings.LID_MODEL_PATH)
        settings._lang_detector = lid_model
    lang = settings._lang_detector.predict(text, k=1)
    lang_id = lang[0][0][0]
    lang_id = lang_id.replace("__label__", "")
    return lang_id
