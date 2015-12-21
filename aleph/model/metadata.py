import os
import six
import cgi
import mimetypes
from copy import deepcopy
from urlparse import urlparse
from normality import slugify
from collections import MutableMapping, Mapping

from aleph.util import make_filename


class Metadata(MutableMapping):
    """ Handle all sorts of metadata normalization for documents. """

    def __init__(self, data=None):
        if data is None:
            data = {}
        self.data = data

    def has(self, name):
        return self.data.get('name') is not None

    @property
    def title(self):
        title = self.data.get('title')
        if title is None and self.file_name:
            title = self.file_name
        return title

    @title.setter
    def title(self, title):
        self.data['title'] = title

    @property
    def file_name(self):
        file_name = self.data.get('file_name')

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
    def source_url(self):
        return self.data.get('source_url')

    @source_url.setter
    def source_url(self, source_url):
        self.data['source_url'] = source_url

    @property
    def source_path(self):
        source_path = self.data.get('source_path')
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
    def extension(self):
        extension = self.data.get('extension')

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
        mime_type = self.data.get('mime_type')

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
        return self.data.get('headers', {})

    @headers.setter
    def headers(self, headers):
        # normalize header names
        if isinstance(headers, Mapping):
            data = {}
            for k, v in headers.items():
                data[slugify(k, sep='_')] = v

        self.data['headers'] = data

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

    def to_dict(self):
        data = deepcopy(self.data)
        data['file_name'] = self.file_name
        data['extension'] = self.extension
        data['mime_type'] = self.mime_type
        data['source_path'] = self.source_path
        data['title'] = self.title
        return data
