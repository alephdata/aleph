import pytest
from playwright.sync_api import Page

from models import Home, Investigation, Investigations, DocumentDrawer


@pytest.fixture
def investigation(page: Page):
    """Creates an investigation and deletes it afterwards."""
    home = Home(page)
    home.navigate()
    home.sign_in()
    investigations: Investigations = home.navigate_to_investigations()
    investigation: Investigation = investigations.new(name="[e2e] Don't look in here")
    yield investigation
    investigation.navigate()
    investigation.delete()


def test_ingest_odt(page: Page, investigation: Investigation) -> None:
    """
    Creates an investigation, uploads an odt file and awaits it to be there.
    Searches for a word inside it, opens the file preview, looks at the extracted
    text and browses to the last page.
    """
    investigation.upload_document("e2e/fixtures/random.odt")

    drawer: DocumentDrawer = investigation.search_and_expect(
        "superprecise", "random.odt"
    )
    drawer.navigate_to_text_tab(page_number=14)
    drawer.close()
