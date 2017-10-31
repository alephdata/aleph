from aleph.views.util import get_best_next_url
from aleph.tests.util import TestCase, UI_URL


class ViewUtilTest(TestCase):

    def setUp(self):
        super(ViewUtilTest, self).setUp()

    def test_get_best_next_url_blank(self):
        self.assertEqual(UI_URL, get_best_next_url(''))

    def test_get_best_next_url_unsafe(self):
        self.assertEqual(UI_URL, get_best_next_url(self.fake.url()))  # noqa

    def test_get_best_next_url_unsafe_safe(self):
        self.assertEqual(UI_URL + 'next', get_best_next_url(self.fake.url(), '/next'))

    def test_get_best_next_url_all_unsafe(self):
        self.assertEqual(UI_URL, get_best_next_url(self.fake.url(), self.fake.url()))  # noqa
