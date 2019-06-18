from __future__ import unicode_literals

import time
import shutil
import logging
import zipfile
import pathlib
from lxml import etree
from email import utils
from datetime import datetime
from normality import safe_filename
from followthemoney import model
from followthemoney.types import registry

from ingestors.ingestor import Ingestor
from ingestors.support.email import EmailSupport
from ingestors.support.temp import TempFileSupport
from ingestors.exc import ProcessingException
from ingestors.util import safe_string

log = logging.getLogger(__name__)
MIME = 'application/xml+opfmessage'


class OPFParser(object):

    def parse_xml(self, file_path):
        parser = etree.XMLParser(huge_tree=True)
        try:
            return etree.parse(file_path, parser)
        except etree.XMLSyntaxError:
            # probably corrupt
            raise TypeError()


class OutlookOLMArchiveIngestor(Ingestor, TempFileSupport, OPFParser):
    MIME_TYPES = []
    EXTENSIONS = ['olm']
    SCORE = 10
    EXCLUDE = ['com.microsoft.__Messages']

    def extract_file(self, zipf, name):
        path = pathlib.Path(name)
        base_name = safe_filename(path.name)
        out_file = self.make_work_file(base_name)
        with open(out_file, 'w+b') as outfh:
            try:
                with zipf.open(name) as infh:
                    shutil.copyfileobj(infh, outfh)
            except KeyError:
                log.warning("Cannot load zip member: %s", name)
        return out_file

    def extract_hierarchy(self, entity, name):
        foreign_id = pathlib.PurePath(entity.id)
        path = pathlib.Path(name)
        for name in path.as_posix().split('/'):
            foreign_id = foreign_id.joinpath(name)
            if name in self.EXCLUDE:
                continue
            entity = self.manager.make_entity('Folder', parent=entity)
            entity.make_id(foreign_id.as_posix())
            self.manager.emit_entity(entity)
        return entity

    def extract_attachment(self, zipf, message, attachment):
        url = attachment.get('OPFAttachmentURL')
        name = attachment.get('OPFAttachmentName')
        name = name or attachment.get('OPFAttachmentContentID')
        child = self.manager.make_entity('Document', parent=message)
        if url is not None:
            file_path = self.extract_file(zipf, url)
            checksum = self.manager.archive_store(file_path)
            child.make_id(name, checksum)
            child.add('fileName', attachment.get('OPFAttachmentName'))
            child.add('fileName', attachment.get('OPFAttachmentContentID'))
            child.add('mimeType', attachment.get('OPFAttachmentContentType'))
            child.add('contentHash', checksum)
            self.manager.queue_entity(child)

    def extract_message(self, root, zipf, name):
        if 'message_' not in name or not name.endswith('.xml'):
            return
        parent = self.extract_hierarchy(root, name)
        xml_path = self.extract_file(zipf, name)
        checksum = self.manager.archive_store(xml_path)
        child = self.manager.make_entity('Document', parent=parent)
        child.make_id(checksum)
        child.add('contentHash', checksum)
        child.add('mimeType', MIME)
        self.manager.queue_entity(child)
        try:
            doc = self.parse_xml(xml_path)
            for el in doc.findall('.//messageAttachment'):
                self.extract_attachment(zipf, child, el)
        except TypeError:
            pass  # this will be reported for the individual file.

    def ingest(self, file_path, entity):
        entity.schema = model.get('Package')
        self._hierarchy = {}
        try:
            with zipfile.ZipFile(file_path, 'r') as zipf:
                for name in zipf.namelist():
                    try:
                        self.extract_message(entity, zipf, name)
                    except Exception:
                        log.exception('Error processing message: %s', name)
        except zipfile.BadZipfile:
            raise ProcessingException('Invalid OLM file.')


class OutlookOLMMessageIngestor(Ingestor, OPFParser, EmailSupport):
    MIME_TYPES = [MIME]
    EXTENSIONS = []
    SCORE = 15

    def get_email_addresses(self, doc, tag):
        path = './%s/emailAddress' % tag
        for address in doc.findall(path):
            email = safe_string(address.get('OPFContactEmailAddressAddress'))
            if not registry.email.validate(email):
                email = None
            self.result.emit_email(email)
            name = safe_string(address.get('OPFContactEmailAddressName'))
            if registry.email.validate(name):
                name = None
            if name or email:
                yield (name, email)

    def get_contacts(self, doc, tag, display=False):
        emails = []
        for (name, email) in self.get_email_addresses(doc, tag):
            if name is None:
                emails.append(email)
            elif email is None:
                emails.append(name)
            else:
                emails.append('%s <%s>' % (name, email))

        if len(emails):
            return '; '.join(emails)

    def get_contact_name(self, doc, tag):
        for (name, email) in self.get_email_addresses(doc, tag):
            if name is not None:
                return name

    def ingest(self, file_path, entity):
        entity.schema = model.get('Email')
        try:
            doc = self.parse_xml(file_path)
        except TypeError:
            raise ProcessingException("Cannot parse OPF XML file.")

        if len(doc.findall('//email')) != 1:
            raise ProcessingException("More than one email in file.")

        email = doc.find('//email')
        props = email.getchildren()
        props = {c.tag: safe_string(c.text) for c in props if c.text}
        headers = {
            'Subject': props.get('OPFMessageCopySubject'),
            'Message-ID': props.pop('OPFMessageCopyMessageID', None),
            'From': self.get_contacts(email, 'OPFMessageCopyFromAddresses'),
            'Sender': self.get_contacts(email, 'OPFMessageCopySenderAddress'),
            'To': self.get_contacts(email, 'OPFMessageCopyToAddresses'),
            'CC': self.get_contacts(email, 'OPFMessageCopyCCAddresses'),
            'BCC': self.get_contacts(email, 'OPFMessageCopyBCCAddresses'),
        }
        date = props.get('OPFMessageCopySentTime')
        if date is not None:
            date = datetime.strptime(date, '%Y-%m-%dT%H:%M:%S')
            date = time.mktime(date.timetuple())
            headers['Date'] = utils.formatdate(date)

        self.extract_headers_metadata(entity, headers)

        entity.add('title', props.pop('OPFMessageCopySubject', None))
        entity.add('title', props.pop('OPFMessageCopyThreadTopic', None))
        for tag in ('OPFMessageCopyFromAddresses',
                    'OPFMessageCopySenderAddress'):
            entity.add('author', self.get_contact_name(email, tag))

        entity.add('summary', props.pop('OPFMessageCopyPreview', None))
        entity.add('authoredAt', props.pop('OPFMessageCopySentTime', None))
        entity.add('modifiedAt', props.pop('OPFMessageCopyModDate', None))

        body = props.pop('OPFMessageCopyBody', None)
        html = props.pop('OPFMessageCopyHTMLBody', None)

        has_html = '1E0' == props.pop('OPFMessageGetHasHTML', None)
        if has_html and safe_string(html):
            self.extract_html_content(entity, html)
        else:
            entity.add('bodyText', body)
