import os
import cgi
import mimetypes
from banal import ensure_list
from collections import Mapping
from followthemoney.types import registry
from pantomime import normalize_mimetype, DEFAULT
from urllib.parse import unquote, urlparse

from normality import safe_filename, stringify, slugify


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
        if isinstance(value, str):
            return len(value.strip()) > 0
        return True

    def update_meta(self):
        pass

    def _meta_text(self, field, value):
        value = stringify(value)
        if value is None:
            self.meta.pop(field, None)
        else:
            self.meta[field] = value
        self.update_meta()

    def _meta_add(self, field, value):
        values = self.meta.pop(field, [])
        if value is not None and value not in values:
            values.append(value)
        if len(values):
            self.meta[field] = values
        self.update_meta()

    @property
    def title(self):
        return self.meta.get('title') or self.file_name

    @title.setter
    def title(self, title):
        self._meta_text('title', title)

    @property
    def summary(self):
        return self.meta.get('summary')

    @summary.setter
    def summary(self, summary):
        self._meta_text('summary', summary)

    @property
    def author(self):
        return self.meta.get('author')

    @author.setter
    def author(self, author):
        self._meta_text('author', author)

    @property
    def generator(self):
        return self.meta.get('generator')

    @generator.setter
    def generator(self, generator):
        self._meta_text('generator', generator)

    @property
    def crawler(self):
        return self.meta.get('crawler')

    @crawler.setter
    def crawler(self, crawler):
        self._meta_text('crawler', crawler)

    @property
    def file_size(self):
        return self.meta.get('file_size')

    @file_size.setter
    def file_size(self, file_size):
        self.meta['file_size'] = file_size
        self.update_meta()

    @property
    def file_name(self):
        """The file title is a human-readable interpretation of the file name.
        It is used for labelling or as a backup title. It should not be used
        to generate an actual file system path."""
        file_name = self.meta.get('file_name')

        # derive file name from headers
        disposition = self.headers.get('content_disposition')
        if file_name is None and disposition is not None:
            _, attrs = cgi.parse_header(disposition)
            filename = attrs.get('filename') or ''
            file_name = stringify(unquote(filename))

        if file_name is None and self.source_url:
            try:
                parsed = urlparse(self.source_url)
                parts = unquote(parsed.path).rsplit('/', 1)
                path = stringify(parts[-1])
                if path is not None and '.' in path:
                    file_name = path
            except Exception:
                pass

        return file_name

    @file_name.setter
    def file_name(self, file_name):
        self._meta_text('file_name', file_name)

    @property
    def safe_file_name(self):
        """File name is a slugified version of the file title that is safe to
        use as part of a file system path."""
        return safe_filename(self.file_name, default='data')

    @property
    def source_url(self):
        return registry.url.clean(self.meta.get('source_url'))

    @source_url.setter
    def source_url(self, source_url):
        self._meta_text('source_url', source_url)

    @property
    def message_id(self):
        return registry.identifier.clean(self.meta.get('message_id'))

    @message_id.setter
    def message_id(self, message_id):
        self._meta_text('message_id', message_id)

    @property
    def in_reply_to(self):
        in_reply_to = self.meta.get('in_reply_to')
        return registry.identifier.normalize_set(in_reply_to)

    @in_reply_to.setter
    def in_reply_to(self, in_reply_to):
        self.meta.pop('in_reply_to', None)
        for message_id in ensure_list(in_reply_to):
            self.add_in_reply_to(message_id)

    def add_in_reply_to(self, message_id):
        self._meta_add('in_reply_to', message_id)

    @property
    def languages(self):
        languages = self.meta.get('languages')
        return registry.language.normalize_set(languages)

    @languages.setter
    def languages(self, languages):
        self.meta.pop('languages', None)
        for lang in ensure_list(languages):
            self.add_language(lang)

    def add_language(self, language):
        self._meta_add('languages', language)

    @property
    def countries(self):
        countries = self.meta.get('countries')
        return registry.country.normalize_set(countries)

    @countries.setter
    def countries(self, countries):
        self.meta.pop('countries', None)
        for country in ensure_list(countries):
            self.add_country(country)

    def add_country(self, country):
        self._meta_add('countries', country)

    @property
    def keywords(self):
        return self.meta.get('keywords', [])

    @keywords.setter
    def keywords(self, keywords):
        self.meta.pop('keywords', None)
        for kw in ensure_list(keywords):
            self.add_keyword(kw)

    def add_keyword(self, kw):
        self._meta_add('keywords', stringify(kw))

    @property
    def date(self):
        return self.meta.get('date')

    @date.setter
    def date(self, date):
        self._meta_text('date', registry.date.clean(date))

    @property
    def authored_at(self):
        return self.meta.get('authored_at')

    @authored_at.setter
    def authored_at(self, date):
        self._meta_text('authored_at', registry.date.clean(date))

    @property
    def modified_at(self):
        return self.meta.get('modified_at')

    @modified_at.setter
    def modified_at(self, date):
        self._meta_text('modified_at', registry.date.clean(date))

    @property
    def published_at(self):
        return self.meta.get('published_at')

    @published_at.setter
    def published_at(self, date):
        self._meta_text('published_at', registry.date.clean(date))

    @property
    def retrieved_at(self):
        return self.meta.get('retrieved_at')

    @retrieved_at.setter
    def retrieved_at(self, date):
        self._meta_text('retrieved_at', registry.date.clean(date))

    @property
    def dates(self):
        dates = set([self.date,
                     self.authored_at,
                     self.modified_at,
                     self.published_at])
        return [d for d in dates if d is not None]

    @property
    def extension(self):
        extension = self.meta.get('extension')

        if extension is None and self.file_name:
            _, extension = os.path.splitext(self.file_name)

        extension = stringify(extension)
        if extension is None:
            return None

        return extension.lower().strip().strip('.')

    @extension.setter
    def extension(self, extension):
        self._meta_text('extension', extension)

    @property
    def encoding(self):
        # TODO: read from HTTP headers?
        return self.meta.get('encoding')

    @encoding.setter
    def encoding(self, encoding):
        self._meta_text('encoding', encoding)

    @property
    def mime_type(self):
        mime_type = self.meta.get('mime_type')

        if mime_type is None and self.file_name:
            mime_type, _ = mimetypes.guess_type(self.file_name)

        # derive mime type from headers
        if mime_type is None:
            mime_type = self.headers.get('content_type')

        mime_type = normalize_mimetype(mime_type)
        if mime_type != DEFAULT:
            return mime_type

    @mime_type.setter
    def mime_type(self, mime_type):
        self._meta_text('mime_type', mime_type)

    @property
    def headers(self):
        raw = self.meta.get('headers', {})
        return {slugify(k, sep='_'): v for k, v in raw.items()}

    @headers.setter
    def headers(self, headers):
        self.meta['headers'] = {}
        if isinstance(headers, Mapping):
            for key, value in headers.items():
                key, value = stringify(key), stringify(value)
                if key is not None and value is not None:
                    self.meta['headers'][key] = value
        if not (self.meta['headers']):
            self.meta.pop('headers')
        self.update_meta()

    @property
    def pdf_version(self):
        if self.extension == 'pdf' or self.mime_type == 'application/pdf':
            return self.content_hash
        return self.meta.get('pdf_version')

    @pdf_version.setter
    def pdf_version(self, pdf_version):
        self._meta_text('pdf_version', pdf_version)

    @property
    def columns(self):
        return self.meta.get('columns', [])

    @columns.setter
    def columns(self, columns):
        columns = ensure_list(columns)
        if len(columns):
            self.meta['columns'] = columns
        else:
            self.meta.pop('columns', None)
        self.update_meta()
