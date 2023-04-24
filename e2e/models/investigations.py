from playwright.sync_api import Page, expect

import settings


class DocumentDrawer:
    def __init__(self, page: Page, filename: str):
        self.page = page
        self.filename = filename

    def navigate_to_text_tab(self, page_number=None):
        self.page.get_by_role("tab", name="Text").click()
        if page_number:
            self.page.locator("#page").click()
            self.page.locator("#page").fill(f"{page_number}")
            self.page.locator("#page").press("Enter")

    def close(self):
        self.page.get_by_role("button", name="Close").click()


class Investigation:
    def __init__(self, page: Page, name: str, url: str):
        self.page = page
        self.name = name
        self.url = url

    def navigate(self):
        self.page.goto(self.url)

    def upload_document(self, filename: str):
        self.page.get_by_role("button", name="Upload documents").click()
        self.page.get_by_label("Choose files to upload...").set_input_files(filename)
        self.page.get_by_role("button", name="Upload", exact=True).click()
        self.page.get_by_role("dialog", name="Upload documents").get_by_role(
            "button", name="Close"
        ).first.click()
        self.page.wait_for_selector("div[role='progressbar']", state="detached")

    def open_document(self, name: str):
        # TODO can't use exact=True below because the name is actually `Documents 0`
        self.page.get_by_role("menuitem", name="Documents").click()
        self.page.get_by_role("link", name="random.odt").click()

    def search_and_expect(self, query: str, filename: str):
        self.page.get_by_placeholder("Search this investigation").click()
        self.page.get_by_placeholder("Search this investigation").fill(query)
        self.page.get_by_placeholder("Search this investigation").press("Enter")
        self.page.get_by_role("link", name=filename).click()
        return DocumentDrawer(self.page, filename=filename)

    def delete(self):
        self.page.get_by_role("link", name=self.name).click()
        self.page.get_by_role("navigation").get_by_role("button").click()
        self.page.get_by_role("menuitem", name="Delete investigation").click()
        self.page.get_by_label("Confirmation").fill(self.name)
        self.page.get_by_role("button", name="Delete this investigation").click()

        self.page.reload()
        expect(self.page.get_by_text(self.name)).to_have_count(0)


class Investigations:
    def __init__(self, page: Page):
        self.page = page

    def navigate(self):
        self.page.goto(f"{settings.BASE_URL}/investigations")

    def new(self, name) -> Investigation:
        self.page.get_by_role("button", name="New investigation").click()
        self.page.get_by_placeholder("Untitled investigation").click()
        self.page.get_by_placeholder("Untitled investigation").fill(name)
        self.page.get_by_role("button", name="Save").click()
        return Investigation(self.page, name=name, url=self.page.url)
