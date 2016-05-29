import os
import six
import cgi
import mimetypes
from datetime import date, datetime
from copy import deepcopy
from urlparse import urlparse
from normality import slugify
from collections import MutableMapping, Mapping

from aleph.util import make_filename
from aleph.metadata.tabular import Tabular


class PDFAlternative(object):
    """Alternate PDF version."""

    def __init__(self, meta):
        self.meta = meta
        self.extension = 'pdf'
        self.mime_type = 'application/pdf'
        self.file_name = self.meta.file_name + '.pdf'

    @property
    def content_hash(self):
        return self.meta.data.get('pdf_version')

    @content_hash.setter
    def content_hash(self, content_hash):
        self.meta.data['pdf_version'] = content_hash


class Metadata(MutableMapping):
    """Handle all sorts of metadata normalization for documents."""

    def __init__(self, data=None):
        if data is None:
            data = {}
        self.data = data

    def has(self, name):
        value = self.data.get(name)
        if value is None:
            return False
        if isinstance(value, (six.text_type, list, set, tuple)):
            return len(value) > 0
        return True

    def clear(self, name):
        self.data.pop(name, None)

    @property
    def parent(self):
        if 'parent' not in self.data or \
                not isinstance(self.data.get('parent'), dict):
            return None
        return Metadata(data=self.data.get('parent'))

    @parent.setter
    def parent(self, parent):
        if isinstance(parent, Metadata):
            parent = parent.data
        self.data['parent'] = parent

    @property
    def title(self):
        title = self.data.get('title')
        if title is None or not len(title.strip()):
            if self.file_name:
                title = self.file_name
        return title

    @title.setter
    def title(self, title):
        self.data['title'] = title

    @property
    def file_name(self):
        file_name = self.data.get('file_name') \
            if self.has('file_name') else None

        # derive file name from headers
        if file_name is None and 'content_disposition' in self.headers:
            _, attrs = cgi.parse_header(self.headers['content_disposition'])
            file_name = attrs.get('filename')

        if file_name is None and self.source_path:
            file_name = os.path.basename(self.source_path)

        return make_filename(file_name)

    @file_name.setter
    def file_name(self, file_name):
        self.data['file_name'] = file_name

    @property
    def summary(self):
        return self.data.get('summary')

    @summary.setter
    def summary(self, summary):
        self.data['summary'] = summary

    @property
    def author(self):
        return self.data.get('author')

    @author.setter
    def author(self, author):
        self.data['author'] = author

    @property
    def languages(self):
        return list(set(self.data.get('languages', [])))

    @languages.setter
    def languages(self, languages):
        self.data['languages'] = []
        for lang in languages:
            self.add_language(lang)

    def add_language(self, language):
        language = language.lower().strip()
        languages = self.languages
        languages.append(language)
        self.data['languages'] = list(languages)

    @property
    def countries(self):
        return list(set(self.data.get('countries', [])))

    @countries.setter
    def countries(self, countries):
        self.data['countries'] = []
        for country in countries:
            self.add_country(country)

    def add_country(self, country):
        country = country.lower().strip()
        countries = self.countries
        countries.append(country)
        self.data['countries'] = list(countries)

    @property
    def keywords(self):
        return list(set(self.data.get('keywords', [])))

    @keywords.setter
    def keywords(self, keywords):
        self.data['keywords'] = []
        for kw in keywords:
            self.add_keyword(kw)

    def add_keyword(self, keyword):
        keyword = keyword.strip()
        keywords = self.keywords
        keywords.append(keyword)
        self.data['keywords'] = list(set(keywords))

    @property
    def recipients(self):
        return list(set(self.data.get('recipients', [])))

    @recipients.setter
    def recipients(self, recipients):
        self.data['recipients'] = []
        for recipient in recipients:
            self.add_recipient(recipient)

    def add_recipient(self, recipient):
        recipients = self.recipients
        recipients.append(recipient)
        self.data['recipients'] = list(recipients)

    @property
    def dates(self):
        _dates = set()
        for date_ in self.data.get('dates', []):
            if date is not None:
                _dates.add(date_.strip('.').strip())
        return list(_dates)

    @dates.setter
    def dates(self, dates):
        self.data['dates'] = []
        for obj in dates:
            self.add_date(obj)

    def add_date(self, obj):
        if isinstance(obj, datetime):
            obj = obj.date()
        if isinstance(obj, date):
            obj = obj.isoformat()
        else:
            if isinstance(obj, six.string_types):
                obj = obj[:10]
            else:
                return
            # this may raise ValueError etc.
            datetime.strptime(obj, '%Y-%m-%d')
        dates = self.dates
        dates.append(obj)
        self.data['dates'] = list(dates)

    @property
    def source_url(self):
        return self.data.get('source_url')

    @source_url.setter
    def source_url(self, source_url):
        self.data['source_url'] = source_url

    @property
    def source_path(self):
        source_path = self.data.get('source_path') \
            if self.has('source_path') else None
        if source_path is None and self.source_url:
            source_path = urlparse(self.source_url).path
        return source_path

    @source_path.setter
    def source_path(self, source_path):
        self.data['source_path'] = source_path

    @property
    def content_hash(self):
        return self.data.get('content_hash')

    @content_hash.setter
    def content_hash(self, content_hash):
        self.data['content_hash'] = content_hash

    @property
    def foreign_id(self):
        foreign_id = self.data.get('foreign_id')
        if foreign_id is not None:
            return unicode(foreign_id)

    @foreign_id.setter
    def foreign_id(self, foreign_id):
        self.data['foreign_id'] = foreign_id

    @property
    def extension(self):
        extension = self.data.get('extension') \
            if self.has('extension') else None

        if extension is None and self.file_name:
            _, extension = os.path.splitext(self.file_name)

        if isinstance(extension, six.string_types):
            extension = extension.lower().strip().strip('.')
        return extension

    @extension.setter
    def extension(self, extension):
        self.data['extension'] = extension

    @property
    def mime_type(self):
        mime_type = self.data.get('mime_type') \
            if self.has('mime_type') else None

        if mime_type is None and self.file_name:
            mime_type, _ = mimetypes.guess_type(self.file_name)

        # derive mime type from headers
        if mime_type is None and 'content_type' in self.headers:
            mime_type, _ = cgi.parse_header(self.headers['content_type'])

        if mime_type in ['application/octet-stream']:
            mime_type = None
        return mime_type

    @mime_type.setter
    def mime_type(self, mime_type):
        if isinstance(mime_type, six.string_types):
            mime_type = mime_type.strip()

        self.data['mime_type'] = mime_type

    @property
    def headers(self):
        # normalize header names
        headers = {}
        for k, v in self.data.get('headers', {}).items():
            headers[slugify(k, sep='_')] = v
        return headers

    @headers.setter
    def headers(self, headers):
        if isinstance(headers, Mapping):
            self.data['headers'] = dict(headers)

    @property
    def is_pdf(self):
        if self.extension == 'pdf':
            return True
        if self.mime_type in ['application/pdf']:
            return True
        return False

    @property
    def pdf(self):
        if self.is_pdf:
            return self
        return PDFAlternative(self)

    @property
    def tables(self):
        return [Tabular(s) for s in self.data.get('tables', [])]

    @tables.setter
    def tables(self, tables):
        data = []
        if isinstance(tables, (list, tuple, set)):
            for schema in tables:
                if isinstance(schema, Tabular):
                    schema = schema.to_dict()
                data.append(schema)
        self.data['tables'] = data

    def __getitem__(self, name):
        return self.data.get(name)

    def __setitem__(self, name, value):
        self.data[name] = value

    def __delitem__(self, name):
        self.data.pop(name, None)

    def __iter__(self):
        return self.data.keys()

    def __repr__(self):
        return '<Metadata(%r,%r)>' % (self.file_name, self.content_hash)

    def __len__(self):
        return len(self.data)

    def clone(self):
        return Metadata(data=deepcopy(self.data))

    def to_index_dict(self):
        return {
            'content_hash': self.content_hash,
            'foreign_id': self.foreign_id,
            'file_name': self.file_name,
            'author': self.author,
            'dates': self.dates,
            'countries': self.countries,
            'languages': self.languages,
            'keywords': self.keywords,
            'recipients': self.recipients,
            'extension': self.extension,
            'mime_type': self.mime_type,
            'headers': self.headers,
            'source_path': self.source_path,
            'source_url': self.source_url,
            'title': self.title,
            'summary': self.summary
        }

    def to_dict(self):
        data = deepcopy(self.data)
        if self.has('parent'):
            data['parent'] = self.parent.to_dict()
        data.update(self.to_index_dict())
        data['is_pdf'] = self.is_pdf
        data['headers'] = self.headers
        return data
