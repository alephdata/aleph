import logging
import frontmatter
from pathlib import Path

from aleph.settings import SETTINGS

log = logging.getLogger(__name__)


def load_pages(locale):
    """Poor man's CMS.

    The purpose of the pages mechanism is to show instance-specific
    documentation and meta-info. This includes "about" pages listed
    in the navbar, and a special snippet that is shown on the home
    page once it is loaded. See the directory `aleph/pages` for the
    default examples.
    """
    directory = Path(SETTINGS.PAGES_PATH)
    candidates = {}
    for path in directory.iterdir():
        page = frontmatter.load(path).to_dict()
        name, lang, _ = path.name.split(".", 2)
        page["name"] = name
        page["lang"] = page.get("lang", lang)
        page["title"] = page.get("title", name)
        page["short"] = page.get("short", page["title"])
        page["icon"] = page.get("icon", "book")
        page["menu"] = page.get("menu", False)
        page["home"] = page.get("home", False)
        page["sidebar"] = page.get("sidebar", not page["home"])
        candidates.setdefault(name, {})
        candidates[name][lang] = page
    pages = []
    # Try to pick a version of the page written in the active
    # locale, else fall back to the system default.
    for name, langs in candidates.items():
        for lang in [locale, SETTINGS.DEFAULT_LANGUAGE]:
            if lang in langs:
                pages.append(langs.get(lang))
                break
    return pages
