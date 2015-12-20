import os
import six
import cgi
import mimetypes
from copy import deepcopy
from hashlib import sha1
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

    @property
    def title(self):
        return self.data.get('title')

    @title.setter
    def title(self, title):
        self.data['title'] = title

    @property
    def file_name(self):
        return self.data.get('file_name')

    @file_name.setter
    def file_name(self, file_name):
        if isinstance(file_name, six.string_types):
            file_name = make_filename(file_name)
        self.data['file_name'] = file_name
        if isinstance(file_name, six.string_types):
            if not self.title:
                self.title = file_name
            if not self.extension:
                _, self.extension = os.path.splitext(file_name)
            if not self.mime_type:
                self.mime_type, _ = mimetypes.guess_type(file_name)

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
        if isinstance(source_url, six.string_types):
            if not self.crawler_tag:
                self.crawler_tag = sha1(source_url.encode('utf-8')).hexdigest()
            if not self.source_path:
                self.source_path = urlparse(source_url).path

    @property
    def source_path(self):
        return self.data.get('source_path')

    @source_path.setter
    def source_path(self, source_path):
        self.data['source_path'] = source_path
        if isinstance(source_path, six.string_types):
            if not self.file_name:
                self.file_name = os.path.basename(source_path)

    @property
    def content_hash(self):
        return self.data.get('content_hash')

    @content_hash.setter
    def content_hash(self, content_hash):
        self.data['content_hash'] = content_hash

    @property
    def crawler_tag(self):
        return self.data.get('crawler_tag')

    @crawler_tag.setter
    def crawler_tag(self, crawler_tag):
        self.data['crawler_tag'] = crawler_tag

    @property
    def extension(self):
        return self.data.get('extension')

    @extension.setter
    def extension(self, extension):
        if isinstance(extension, six.string_types):
            extension = extension.lower().strip().strip('.')
        self.data['extension'] = extension

    @property
    def mime_type(self):
        return self.data.get('mime_type')

    @mime_type.setter
    def mime_type(self, mime_type):
        if isinstance(mime_type, six.string_types):
            mime_type = mime_type.strip()

        if mime_type in ['application/octet-stream', 'text/plain']:
            mime_type = None

        self.data['mime_type'] = mime_type
        if not self.extension and mime_type:
            self.extension = mimetypes.guess_extension(mime_type)

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

        # derive file name from headers
        if not self.data and 'content_disposition' in data:
            _, attrs = cgi.parse_header(data['content_disposition'])
            if 'filename' in attrs:
                self.file_name = attrs.get('filename')

        # derive mime type from headers
        if self.mime_type and 'content_type' in data:
            self.mime_type, _ = cgi.parse_header(data['content_type'])

    def __getitem__(self, name):
        return self.data.get(name)

    def __setitem__(self, name, value):
        self.data[name] = value

    def __delitem__(self, name):
        self.data.pop(name, None)

    def __iter__(self):
        return self.data.keys()

    def __len__(self):
        return len(self.data)

    def clone(self):
        return Metadata(data=self.to_dict())

    def to_dict(self):
        return deepcopy(self.data)
