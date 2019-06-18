import shutil
import logging
import zipfile
import pathlib
from lxml import etree
from pprint import pprint  # noqa
from normality import safe_filename
from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.temp import TempFileSupport
from ingestors.support.timestamp import TimestampSupport
from ingestors.support.email import EmailSupport, EmailIdentity
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


class OutlookOLMMessageIngestor(Ingestor, OPFParser, EmailSupport, TimestampSupport):  # noqa
    MIME_TYPES = [MIME]
    EXTENSIONS = []
    SCORE = 15

    def get_contacts(self, doc, tag):
        path = './%s/emailAddress' % tag
        for address in doc.findall(path):
            name = address.get('OPFContactEmailAddressName')
            email = address.get('OPFContactEmailAddressAddress')
            yield EmailIdentity(self.manager, name, email)

    def get_date(self, props, tag):
        return self.parse_timestamp(props.pop(tag, None))

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

        entity.add('subject', props.pop('OPFMessageCopySubject', None))
        entity.add('threadTopic', props.pop('OPFMessageCopyThreadTopic', None))
        entity.add('summary', props.pop('OPFMessageCopyPreview', None))
        entity.add('messageId', props.pop('OPFMessageCopyMessageID', None))
        entity.add('date', self.get_date(props, 'OPFMessageCopySentTime'))
        entity.add('modifiedAt', self.get_date(props, 'OPFMessageCopyModDate'))

        senders = self.get_contacts(email, 'OPFMessageCopySenderAddress')
        self.apply_identities(entity, senders, 'emitters', 'sender')

        froms = self.get_contacts(email, 'OPFMessageCopyFromAddresses')
        self.apply_identities(entity, froms, 'emitters', 'from')

        tos = self.get_contacts(email, 'OPFMessageCopyToAddresses')
        self.apply_identities(entity, tos, 'recipients', 'to')

        ccs = self.get_contacts(email, 'OPFMessageCopyCCAddresses')
        self.apply_identities(entity, ccs, 'recipients', 'cc')

        bccs = self.get_contacts(email, 'OPFMessageCopyBCCAddresses')
        self.apply_identities(entity, bccs, 'recipients', 'bcc')

        entity.add('bodyText', props.pop('OPFMessageCopyBody', None))
        html = props.pop('OPFMessageCopyHTMLBody', None)
        has_html = '1E0' == props.pop('OPFMessageGetHasHTML', None)
        if has_html and safe_string(html):
            self.extract_html_content(entity, html)

        pprint(props)
