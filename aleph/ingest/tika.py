from aleph.core import get_config
from bs4 import BeautifulSoup
from urlparse import urljoin
import requests


def extract_pdf(path, languages=None):
    with open(path, 'rb') as f:
        headers = {'accept': 'text/html'}
        tika_url = get_config("TIKA_URI")
        r = requests.put(urljoin(tika_url, '/tika'), data=f, headers=headers)
        r.raise_for_status()
        soup = BeautifulSoup(r.text.encode('utf8', 'replace'), 'html.parser')
        pages = []
        for i, page in enumerate(soup.findAll('div', class_='page')):
            pages.append(page.get_text())
        return {'pages': pages}
