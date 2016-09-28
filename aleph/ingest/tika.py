from aleph.core import get_config
from lxml import html
from urlparse import urljoin
import requests


def extract_pdf(path, languages=None):
    with open(path, 'rb') as f:
        headers = {'accept': 'text/html'}
        tika_url = urljoin(get_config("TIKA_URI"), '/tika')
        r = requests.put(tika_url, data=f, headers=headers)
        r.raise_for_status()
        doc = html.fromstring(r.content.decode('utf-8'))
        pages = []
        for page in doc.findall('.//div[@class="page"]'):
            pages.append(page.text_content())
        return {'pages': pages}
