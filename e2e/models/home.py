from playwright.sync_api import Page

from models.investigations import Investigations
import settings


class Home:
    def __init__(self, page: Page):
        self.page = page

    def navigate(self):
        self.page.goto(settings.BASE_URL)

    def sign_in(self):
        self.page.get_by_role("button", name="Sign in").click()
        self.page.get_by_role("textbox", name="Email address").fill(
            settings.E2E_USERNAME
        )
        self.page.get_by_label("Password").click()
        self.page.get_by_label("Password").fill(settings.E2E_PASSWORD)
        self.page.get_by_role("dialog", name="Sign in").get_by_role(
            "button", name="Sign in"
        ).click()

    def navigate_to_investigations(self) -> Investigations:
        self.page.get_by_role("menuitem", name="Investigations").click()
        return Investigations(self.page)
