import logging
import google.auth
from google.cloud import translate

from ingestors import settings
from ingestors.analysis.language import detect_single_lang

log = logging.getLogger(__name__)


def should_translate(language_ids):
    """
    Returns true if the one or more of the language IDs in the supplied language_ids list
    should be translated, false otherwise. A language is translated if:
      1. Both the translation language white and black lists are empty
      2. If there are black listed languages, at least one of the language IDs is NOT in the black list
      3. The language white list is empty 
      4. If there are white listed languages, at least one of the language IDs is in the white list
    
    A language is NOT translated if:
      1. The list of language IDs is empty
      2. If there are black listed languages, all the language IDs are in the black list
      3. If there are white listed languages, none of the language IDs is in the white list
    """
    if not language_ids or not len(language_ids):
        # Language is unknown, so don't translate
        return False

    check_whitelist = settings.TRANSLATION_LANGUAGE_WHITE_LIST and len(settings.TRANSLATION_LANGUAGE_WHITE_LIST)
    check_blacklist = settings.TRANSLATION_LANGUAGE_BLACK_LIST and len(settings.TRANSLATION_LANGUAGE_BLACK_LIST)
    if not check_whitelist and not check_blacklist:
        return True
    
    if check_blacklist and all(item in settings.TRANSLATION_LANGUAGE_BLACK_LIST for item in language_ids):
        return False

    if not check_whitelist or any(item in settings.TRANSLATION_LANGUAGE_WHITE_LIST for item in language_ids):
        return True
    
    return False


class TranslateSupport(object):
    def translate_text(self, entity, text, language_ids=[], alt_body_text_prop="altBodyText", detected_language_prop="altTextSrcLanguage",
                       target_language_prop="altTextLanguage", quiet=True):
        try:
            if settings.TRANSLATION_API:
                if not language_ids or not len(language_ids):
                    lang_id = detect_single_lang([text.replace("\n", " ")])
                    language_ids = [lang_id]
                
                if not should_translate(language_ids):
                    log.debug("Not translating.")
                    return None

                if not hasattr(settings, "_translate_service"):
                    settings._translate_service = GoogleTranslateService()

                log.debug(f"Translating text: {len(text)} chars; languages: {', '.join(language_ids)}")
                translation = settings._translate_service.translate_text(text)
                translated_text = translation["translated_text"]
                if translated_text and len(translated_text):
                    log.debug("--------------- Translated Text ---------------")
                    log.debug("%s", translated_text)
                    entity.add(alt_body_text_prop, translated_text, quiet=quiet)
                    
                    language = translation["detected_language"]
                    if language:
                        entity.add(detected_language_prop, language, quiet=quiet)
                    
                    language = translation["target_language"]
                    if language:
                        entity.add(target_language_prop, language, quiet=quiet)

                    return translated_text

                return translated_text
        except:
            if not quiet:
                raise

            log.exception("An error occurred while translating.")

        return None


class GoogleTranslateService(object):
    def __init__(self):
        credentials, project_id = google.auth.default()
        self.client = translate.TranslationServiceClient(credentials=credentials)
        self.parent = self.client.location_path(project_id, "global")
        log.info("Using Google Translation Service. Charges apply.")

    def translate_text(self, text):
        """Translating Text."""
        # The Google API expects an array, so make sure that is what we are passing it
        if not isinstance(text, list):
            text = [text]

        response = self.client.translate_text(
            parent=self.parent,
            contents=text,
            mime_type="text/plain",  # mime types: text/plain, text/html
            target_language_code="en-US",
        )

        translation_dict = {}
        translated_text = []
        # Display the translation for each input text provided
        for translation in response.translations:
            translated_text.append(translation.translated_text)

        translation_dict["translated_text"] = translated_text
        # Get and add the first detected language code to translation object
        translation_dict["detected_language"] = response.translations[0].detected_language_code
        translation_dict["target_language"] = "en-US"

        return translation_dict
