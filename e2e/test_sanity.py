from playwright.sync_api import Page, expect

import os
import time

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080/")


def test_ingest_odt(page: Page) -> None:
    """
    Creates an investigation, uploads an odt file and awaits it to be there.
    Searches for a word inside it, opens the file preview, looks at the extracted
    text and browses to the last page.
    """
    investigation_name = "[test] Don't look in here"

    page.goto(BASE_URL)
    page.get_by_role("menuitem", name="Investigations").click()
    page.get_by_role("button", name="New investigation").click()
    page.get_by_placeholder("Untitled investigation").click()
    page.get_by_placeholder("Untitled investigation").fill(investigation_name)
    page.get_by_role("button", name="Save").click()
    page.get_by_role("button", name="Upload documents").click()
    page.get_by_label("Choose files to upload...").set_input_files(
        "e2e/fixtures/random.odt"
    )
    page.get_by_role("button", name="Upload", exact=True).click()
    page.get_by_role("dialog", name="Upload documents").get_by_role("button", name="Close").click()
    page.wait_for_selector("div[role='progressbar']", state="detached")
    page.reload()
    page.get_by_role("link", name="random.odt").click()
    page.get_by_placeholder("Search this investigation").click()
    page.get_by_placeholder("Search this investigation").fill("superprecise")
    page.get_by_placeholder("Search this investigation").press("Enter")
    page.get_by_role("link", name="random.odt").click()
    page.get_by_role("tab", name="Text").click()
    page.locator("#page").click()
    page.locator("#page").fill("14")
    page.locator("#page").press("Enter")
    page.get_by_role("button", name="Close").click()
    page.get_by_role("link", name="[test] Don't look in here").click()
    page.get_by_role("navigation").get_by_role("button").click()
    page.get_by_role("menuitem", name="Delete investigation").click()
    page.get_by_role("button", name="Delete").click()

    page.reload()
    expect(page.get_by_text(investigation_name)).to_have_count(0)
