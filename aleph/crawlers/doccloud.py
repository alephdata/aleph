import math
import logging
import requests
from urlparse import urljoin
from itertools import count

from aleph.crawlers import Crawler, TagExists

log = logging.getLogger(__name__)
PAGE_SIZE = 2

requests.packages.urllib3.disable_warnings()


class DocumentCloudCrawler(Crawler):

    LABEL = "DocumentCloud"
    SITE = "https://www.documentcloud.org/"

    def crawl(self):
        auth = (self.source.config.get('username'),
                self.source.config.get('password'))
        project_id = self.source.config.get('project_id')
        if project_id is None or auth[0] is None or auth[1] is None:
            return
        url = urljoin(self.SITE, '/api/search.json')
        params = {'q': 'projectid:%s' % project_id, 'per_page': PAGE_SIZE}
        for page in count(1):
            params['page'] = page
            res = requests.get(url, verify=False, auth=auth, params=params)
            data = res.json()
            for doc in data.get('documents', []):
                try:
                    id = self.check_tag(url=doc.get('canonical_url'))
                    pdf_url = doc.get('resources', {}).get('pdf')
                    pdf_auth = None if 'amazonaws.com' in pdf_url else auth
                    res = requests.get(pdf_url, auth=pdf_auth, verify=False)
                    self.emit_ingest(res, package_id=id,
                                     title=doc.get('title'),
                                     source_url=doc.get('canonical_url'),
                                     summary=doc.get('description'))
                except TagExists:
                    pass
            pages = math.ceil(data.get('total') / PAGE_SIZE)
            if page > pages:
                return

    def get_projects(self, username, password):
        url = urljoin(self.SITE, '/api/projects.json')
        res = requests.get(url, verify=False, auth=(username, password))
        if res.status_code != 200:
            return False

        projects = []
        for project in res.json().get('projects'):
            project.pop('document_ids')
            project.pop('description')
            projects.append(project)

        return projects


class SourceAfricaCrawler(DocumentCloudCrawler):

    LABEL = "sourceAFRICA"
    SITE = "https://sourceafrica.net/"
