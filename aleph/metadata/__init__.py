import os
import six
import cgi
import mimetypes
from collections import Mapping
from flanker.addresslib import address
from urlparse import urlparse
from normality import slugify

from aleph.util import make_filename
from aleph.metadata.tabular import Tabular
from aleph.metadata.parsers import chomp, parse_date
from aleph.metadata.parsers import parse_domain, parse_url
from aleph.metadata.reference import is_country_code, is_language_code
from aleph.metadata.base import MetadataFactory, Field


class PDFAlternative(object):
    """Alternate PDF version."""

    def __init__(self, meta):
        self.meta = meta
        self.extension = 'pdf'
        self.mime_type = 'application/pdf'
        self.file_name = self.meta.file_name + '.pdf'

    @property
    def content_hash(self):
        return self.meta.pdf_version

    @content_hash.setter
    def content_hash(self, content_hash):
        self.meta.pdf_version = content_hash


class Metadata(object):
    """Handle all sorts of metadata normalization for documents."""

    __metaclass__ = MetadataFactory

    content_hash = Field(protected=True)
    crawler = Field(protected=True)
    crawler_run = Field(protected=True)
    _foreign_id = Field('foreign_id', protected=True)
    _file_name = Field('file_name')
    _title = Field('title')
    _extension = Field('extension')
    _mime_type = Field('mime_type', label='Content type')
    encoding = Field(protected=True)
    author = Field(label='Document author')
    summary = Field()
    source_url = Field(protected=True)
    source_path = Field(protected=True)
    pdf_version = Field(protected=True)
    _headers = Field('headers', protected=True)
    _parent = Field('parent', protected=True)
    _keywords = Field('keywords', multi=True, label='Keywords')
    _phone_numbers = Field('phone_numbers', multi=True, label='Phone numbers')
    _dates = Field('dates', multi=True, label='Dates')
    _urls = Field('urls', multi=True)
    _emails = Field('emails', multi=True, label='E-mail addresses')
    _domains = Field('domains', multi=True, label='Domains')
    _tables = Field('tables', multi=True, protected=True)

    def __init__(self):
        for field in self.fields.values():
            setattr(self, field.attr, [] if field.multi else None)

    def has(self, name):
        value = getattr(self, self.fields[name].attr)
        if value is None:
            return False
        if isinstance(value, (list, set, tuple)):
            return len(value) > 0
        if isinstance(value, six.string_types):
            return len(value.strip()) > 0
        return True

    @property
    def parent(self):
        if self._parent is not None:
            return Metadata.from_data(self._parent)

    @parent.setter
    def parent(self, parent):
        if isinstance(parent, Metadata):
            parent = parent.to_attr_dict()
        self._parent = parent

    @property
    def title(self):
        return self._title or self._file_name or self.file_name

    @title.setter
    def title(self, title):
        self._title = chomp(title)

    @property
    def file_name(self):
        file_name = self._file_name

        # derive file name from headers
        if file_name is None and 'content_disposition' in self.headers:
            _, attrs = cgi.parse_header(self.headers['content_disposition'])
            file_name = chomp(attrs.get('filename'))

        if file_name is None and self.source_path:
            file_name = os.path.basename(self.source_path)

        if file_name is None and self.source_url:
            parsed = urlparse(self.source_url)
            file_name = os.path.basename(parsed.path)

        return make_filename(file_name) or 'data'

    @file_name.setter
    def file_name(self, file_name):
        self._file_name = chomp(file_name)

    @property
    def languages(self):
        return self._languages

    @languages.setter
    def languages(self, languages):
        self._languages = []
        for lang in languages:
            self.add_language(lang)

    def add_language(self, language):
        lang = chomp(language, lower=True)
        if is_language_code(lang) and lang not in self._languages:
            self._languages.append(lang)

    @property
    def countries(self):
        return self._countries

    @countries.setter
    def countries(self, countries):
        self._countries = []
        for country in countries:
            self.add_country(country)

    def add_country(self, country):
        country = chomp(country, lower=True)
        if is_country_code(country) and country not in self._countries:
            self._countries.append(country)

    @property
    def keywords(self):
        return self._keywords

    @keywords.setter
    def keywords(self, keywords):
        self._keywords = []
        for kw in keywords:
            self.add_keyword(kw)

    def add_keyword(self, kw):
        kw = chomp(kw)
        if kw is not None and kw not in self._keywords:
            self._keywords.append(kw)

    @property
    def emails(self):
        return self._emails

    @emails.setter
    def emails(self, emails):
        self._emails = []
        for email in emails:
            self.add_email(email)

    def add_email(self, email):
        parsed = address.parse(email)
        if parsed is None:
            return
        self.add_domain(parsed.hostname)
        if parsed.address not in self._emails:
            self._emails.append(parsed.address)

    @property
    def urls(self):
        return self._urls

    @urls.setter
    def urls(self, urls):
        self._urls = []
        for url in urls:
            self.add_url(url)

    def add_url(self, url):
        url = parse_url(url)
        if url is not None and url not in self._urls:
            self._urls.append(url)
        self.add_domain(url)

    @property
    def domains(self):
        return self._domains

    @domains.setter
    def domains(self, domains):
        self._domains = []
        for domain in domains:
            self.add_domain(domain)

    def add_domain(self, domain):
        domain = parse_domain(domain)
        if domain and domain not in self._domains:
            self._domains.append(domain)

    @property
    def phone_numbers(self):
        return self._phone_numbers

    @phone_numbers.setter
    def phone_numbers(self, phone_numbers):
        self._phone_numbers = []
        for phone_number in phone_numbers:
            self.add_phone_number(phone_number)

    def add_phone_number(self, number):
        number = chomp(number)
        if number and number not in self._phone_numbers:
            self._phone_numbers.append(number)

    @property
    def dates(self):
        return self._dates

    @dates.setter
    def dates(self, dates):
        self._dates = []
        for obj in dates:
            self.add_date(obj)

    def add_date(self, obj):
        date = parse_date(obj)
        if date is not None and date not in self._dates:
            self._dates.append(date)

    @property
    def foreign_id(self):
        return self._foreign_id or self.source_url or self.source_path

    @foreign_id.setter
    def foreign_id(self, foreign_id):
        self._foreign_id = chomp(foreign_id)

    @property
    def extension(self):
        extension = self._extension

        if extension is None and self.file_name:
            _, extension = os.path.splitext(self.file_name)

        if isinstance(extension, six.string_types):
            extension = extension.lower().strip().strip('.')
        return extension

    @extension.setter
    def extension(self, extension):
        self._extension = chomp(extension)

    @property
    def mime_type(self):
        mime_type = self._mime_type

        if mime_type is None and self.file_name:
            mime_type, _ = mimetypes.guess_type(self.file_name)

        # derive mime type from headers
        if mime_type is None and 'content_type' in self.headers:
            mime_type, _ = cgi.parse_header(self.headers['content_type'])

        if mime_type != 'application/octet-stream':
            return mime_type

    @mime_type.setter
    def mime_type(self, mime_type):
        self._mime_type = chomp(mime_type)

    @property
    def headers(self):
        # normalize header names
        raw = self._headers or {}
        return {slugify(k, sep='_'): v for k, v in raw.items()}

    @headers.setter
    def headers(self, headers):
        self._headers = dict(headers) if isinstance(headers, Mapping) else None

    @property
    def is_pdf(self):
        return self.extension == 'pdf' or self.mime_type == 'application/pdf'

    @property
    def pdf(self):
        return self if self.is_pdf else PDFAlternative(self)

    @property
    def tables(self):
        return [Tabular(s) for s in self._tables]

    @tables.setter
    def tables(self, tables):
        self._tables = []
        for schema in tables:
            if isinstance(schema, Tabular):
                schema = schema.to_dict()
            self._tables.append(schema)

    def clone(self):
        return type(self).from_data(self.to_attr_dict())

    def make_child(self):
        child = self.clone()
        child.parent = self.clone()
        child.title = None
        child.source_path = None
        child.file_name = None
        child.extension = None
        child.content_hash = None
        child.mime_type = None
        child.foreign_id = None
        return child

    def update(self, data, safe=True):
        # This will assign to the proxied field names, i.e. input
        # processing will be applied to the data.
        for field in self.fields.values():
            if safe and field.protected:
                continue
            if field.name in data:
                setattr(self, field.name, data[field.name])

    @classmethod
    def from_data(cls, data, safe=False):
        """Instantiate a Metadata object based on a given dict."""
        obj = cls()
        obj.update(data, safe=safe)
        return obj

    @classmethod
    def facets(cls):
        facets = {}
        for field in cls().fields.values():
            if field.label is not None:
                facets[field.name] = field.label
        return facets

    def to_attr_dict(self, compute=False):
        """Return the data for each attribute."""
        # This will return the underlying (uncomputed) values by default. They
        # are suitable for serialization into the database, but not
        # for indexing.
        data = {}
        for field in self.fields.values():
            name = field.name if compute else field.attr
            value = getattr(self, name)
            if value is not None:
                data[field.name] = value
        return data

    def to_index_dict(self):
        """Generate ElasticSearch form."""
        data = self.to_attr_dict(compute=True)
        data.pop('parent', None)
        data.pop('headers', None)
        data.pop('tables', None)
        data.pop('pdf_version', None)
        # data.pop('crawler_run', None)
        return data

    def to_dict(self):
        """Generate REST API form."""
        data = self.to_attr_dict(compute=True)
        data.pop('pdf_version', None)
        data['is_pdf'] = self.is_pdf
        return data

    def __repr__(self):
        return '<Metadata(%r,%r)>' % (self.file_name, self.content_hash)
