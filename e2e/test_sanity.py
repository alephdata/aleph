from playwright.sync_api import Page

from models import Home, Investigations, DocumentDrawer


def test_ingest_odt(page: Page) -> None:
    """
    Creates an investigation, uploads an odt file and awaits it to be there.
    Searches for a word inside it, opens the file preview, looks at the extracted
    text and browses to the last page.
    """
    investigation_name = "[e2e] Don't look in here"

    home = Home(page)
    home.navigate()
    investigations: Investigations = home.navigate_to_investigations()
    investigation = investigations.new(name=investigation_name)
    investigation.upload_document("e2e/fixtures/random.odt")

    drawer: DocumentDrawer = investigation.search_and_expect(
        "superprecise", "random.odt"
    )
    drawer.navigate_to_text_tab(page_number=14)
    drawer.close()

    investigation.navigate()
    investigation.delete()
