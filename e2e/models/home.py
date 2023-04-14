from playwright.sync_api import Page

from models.investigations import Investigations
import settings


class Home:
    def __init__(self, page: Page):
        self.page = page

    def navigate(self):
        self.page.goto(settings.BASE_URL)

    def navigate_to_investigations(self) -> Investigations:
        self.page.get_by_role("menuitem", name="Investigations").click()
        return Investigations(self.page)
