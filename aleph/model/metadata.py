import os
import six
import cgi
import mimetypes
from collections import Mapping
from urllib import unquote
from urlparse import urlparse
from dalet import is_country_code, is_language_code
from dalet import parse_email, parse_country, parse_url
from dalet import parse_domain, parse_date
from ingestors.util import make_filename

from aleph.text import slugify, string_value
from aleph.model.tabular import Tabular


class Metadata(object):
    """Handle all sorts of metadata normalization for documents."""

    def __init__(self):
        self.meta = {}

    def has_meta(self, name):
        value = self.meta.get(name)
        if value is None:
            return False
        if isinstance(value, (list, set, tuple)):
            return len(value) > 0
        if isinstance(value, six.string_types):
            return len(value.strip()) > 0
        return True

    def update_meta(self):
        pass

    @property
    def title(self):
        return self.meta.get('title') or self.file_title

    @title.setter
    def title(self, title):
        self.meta['title'] = string_value(title)
        self.update_meta()

    @property
    def summary(self):
        return self.meta.get('summary')

    @summary.setter
    def summary(self, summary):
        self.meta['summary'] = string_value(summary)
        self.update_meta()

    @property
    def author(self):
        return self.meta.get('author')

    @author.setter
    def author(self, author):
        self.meta['author'] = string_value(author)
        self.update_meta()

    @property
    def file_size(self):
        file_size = self.meta.get('file_size')
        return None if file_size is None else int(file_size)

    @file_size.setter
    def file_size(self, file_size):
        self.meta['file_size'] = file_size
        self.update_meta()

    @property
    def file_title(self):
        """The file title is a human-readable interpretation of the file name.
        It is used for labelling or as a backup title. It should not be used
        to generate an actual file system path."""
        file_title = self.meta.get('file_name')

        # derive file name from headers
        disposition = self.headers.get('content_disposition')
        if file_title is None and disposition is not None:
            _, attrs = cgi.parse_header(disposition)
            filename = attrs.get('filename') or ''
            file_title = string_value(unquote(filename))

        if file_title is None and self.source_url:
            parsed = urlparse(self.source_url)
            file_title = os.path.basename(parsed.path) or ''
            file_title = string_value(unquote(file_title))

        return file_title

    @property
    def file_name(self):
        """File name is a slugified version of the file title that is safe to
        use as part of a file system path."""
        return make_filename(self.file_title, default='data')

    @file_name.setter
    def file_name(self, file_name):
        self.meta['file_name'] = string_value(file_name)
        self.update_meta()

    @property
    def source_url(self):
        return self.meta.get('source_url')

    @source_url.setter
    def source_url(self, source_url):
        self.meta['source_url'] = string_value(source_url)
        self.update_meta()

    @property
    def languages(self):
        return self.meta.get('languages', [])

    @languages.setter
    def languages(self, languages):
        self.meta['languages'] = []
        for lang in languages:
            self.add_language(lang)

    def add_language(self, language):
        self.meta.setdefault('languages', [])
        lang = string_value(language)
        if lang is None:
            return
        lang = lang.lower()
        if is_language_code(lang) and lang not in self.meta['languages']:
            self.meta['languages'].append(lang)
            self.update_meta()

    @property
    def countries(self):
        return self.meta.get('countries', [])

    @countries.setter
    def countries(self, countries):
        self.meta['countries'] = []
        for country in countries:
            self.add_country(country)

    def add_country(self, country):
        self.meta.setdefault('countries', [])
        country = parse_country(country)
        if country is None:
            return
        if is_country_code(country) and country not in self.meta['countries']:
            self.meta['countries'].append(country)
            self.update_meta()

    @property
    def keywords(self):
        return self.meta.get('keywords', [])

    @keywords.setter
    def keywords(self, keywords):
        self.meta['keywords'] = []
        for kw in keywords:
            self.add_keyword(kw)

    def add_keyword(self, kw):
        self.meta.setdefault('keywords', [])
        kw = string_value(kw)
        if kw is not None and kw not in self.meta['keywords']:
            self.meta['keywords'].append(kw)
            self.update_meta()

    @property
    def emails(self):
        return self.meta.get('emails', [])

    @emails.setter
    def emails(self, emails):
        self.meta['emails'] = []
        for email in emails:
            self.add_email(email)

    def add_email(self, email):
        self.meta.setdefault('emails', [])
        email = parse_email(email)
        if email is not None and email not in self.meta['emails']:
            if self.add_domain(email):
                self.meta['emails'].append(email)
                self.update_meta()

    @property
    def urls(self):
        return self.meta.get('urls', [])

    @urls.setter
    def urls(self, urls):
        self.meta['urls'] = []
        for url in urls:
            self.add_url(url)

    def add_url(self, url):
        self.meta.setdefault('urls', [])
        url = parse_url(url)
        if url is not None and url not in self.meta['urls']:
            if self.add_domain(url):
                self.meta['urls'].append(url)
                self.update_meta()

    @property
    def domains(self):
        return self.meta.get('domains', [])

    @domains.setter
    def domains(self, domains):
        self.meta.setdefault('domains', [])
        for domain in domains:
            self.add_domain(domain)

    def add_domain(self, domain):
        self.meta.setdefault('domains', [])
        domain = parse_domain(domain)
        if domain is None:
            return False
        if domain not in self.meta['domains']:
            self.meta['domains'].append(domain)
            self.update_meta()
        return True

    @property
    def phone_numbers(self):
        return self.meta.get('phone_numbers', [])

    @phone_numbers.setter
    def phone_numbers(self, phone_numbers):
        self.meta['phone_numbers'] = []
        for phone_number in phone_numbers:
            self.add_phone_number(phone_number)

    def add_phone_number(self, number):
        self.meta.setdefault('phone_numbers', [])
        number = string_value(number)
        if number and number not in self.meta['phone_numbers']:
            self.meta['phone_numbers'].append(number)
            self.update_meta()

    @property
    def dates(self):
        return self.meta.get('dates', [])

    @dates.setter
    def dates(self, dates):
        self.meta['dates'] = []
        for obj in dates:
            self.add_date(obj)

    def add_date(self, obj):
        self.meta.setdefault('dates', [])
        date = parse_date(obj)
        if date is not None and date not in self.meta['dates']:
            self.meta['dates'].append(date)
            self.update_meta()

    @property
    def extension(self):
        extension = self.meta.get('extension')

        if extension is None and self.file_name:
            _, extension = os.path.splitext(self.file_name)

        if extension is None or not len(extension):
            return None

        extension = six.text_type(extension).lower().strip().strip('.')
        return extension

    @extension.setter
    def extension(self, extension):
        self.meta['extension'] = string_value(extension)

    @property
    def encoding(self):
        return self.meta.get('encoding')

    @encoding.setter
    def encoding(self, encoding):
        self.meta['encoding'] = string_value(encoding)
        self.update_meta()

    @property
    def mime_type(self):
        mime_type = self.meta.get('mime_type')

        if mime_type is None and self.file_name:
            mime_type, _ = mimetypes.guess_type(self.file_name)

        # derive mime type from headers
        if mime_type is None and self.headers.get('content_type') is not None:
            mime_type, _ = cgi.parse_header(self.headers['content_type'])

        if mime_type != 'application/octet-stream':
            return mime_type

    @mime_type.setter
    def mime_type(self, mime_type):
        self.meta['mime_type'] = string_value(mime_type)

    @property
    def headers(self):
        raw = self.meta.get('headers', {})
        return {slugify(k, sep='_'): v for k, v in raw.items()}

    @headers.setter
    def headers(self, headers):
        self.meta['headers'] = {}
        if isinstance(headers, Mapping):
            for key, value in headers.items():
                self.meta['headers'][key] = string_value(value)
            self.update_meta()

    @property
    def pdf_version(self):
        if self.extension == 'pdf' or self.mime_type == 'application/pdf':
            return self.content_hash
        return self.meta.get('pdf_version')

    @pdf_version.setter
    def pdf_version(self, pdf_version):
        self.meta['pdf_version'] = string_value(pdf_version)
        self.update_meta()

    @property
    def columns(self):
        return self.meta.get('columns', [])

    @columns.setter
    def columns(self, columns):
        self.meta['columns'] = columns
        self.update_meta()

    @property
    def tables(self):
        if len(self.columns):
            schema = dict(sheet=0, sheet_name=self.title, columns=[])
            for column in self.columns:
                schema['columns'].append({'name': column, 'label': column})
            return [Tabular(schema)]
        return [Tabular(s) for s in self.meta.get('tables', [])]

    @tables.setter
    def tables(self, tables):
        self.meta['tables'] = []
        for schema in tables:
            if isinstance(schema, Tabular):
                schema = schema.to_dict()
            self.meta['tables'].append(schema)

    def to_meta_dict(self):
        """Generate ElasticSearch form."""
        return {
            'title': self.title,
            'summary': self.summary,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'source_url': self.source_url,
            'languages': self.languages,
            'countries': self.countries,
            'phone_numbers': self.phone_numbers,
            'urls': self.urls,
            'domains': self.domains,
            'dates': self.dates,
            'emails': self.emails,
            'keywords': self.keywords,
            'encoding': self.encoding,
            'extension': self.extension,
            'mime_type': self.mime_type,
            'headers': self.headers,
            'pdf_version': self.pdf_version,
            'tables': self.tables
        }
