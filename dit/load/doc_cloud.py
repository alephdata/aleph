from urlparse import urljoin

import requests

from dit.app import app


def documentcloudify(file_name, data):
    auth = (app.config.get('DOCCLOUD_USER'),
            app.config.get('DOCCLOUD_PASS'))
    host = app.config.get('DOCCLOUD_HOST')
    project_id = app.config.get('DOCCLOUD_PROJECT')
    title = data.get('Description')
    search_url = urljoin(host, '/api/search.json')
    params = {'q': 'projectid:%s title:"%s"' % (project_id, title)}
    res = requests.get(search_url, params=params, auth=auth,
                       verify=False)
    found = res.json()
    if found.get('total') > 0:
        return found.get('documents')[0].get('canonical_url')
    req_data = {
        'title': title,
        'source': 'Windeeds CIPC Search',
        'published_url': data.get('url'),
        'access': 'private',
        'project': project_id
        }
    files = {
        'file': open(file_name, 'rb')
    }
    upload_url = urljoin(host, '/api/upload.json')
    res = requests.post(upload_url, files=files,
                        verify=False, auth=auth, data=req_data)
    return res.json().get('canonical_url')
