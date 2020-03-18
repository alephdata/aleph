from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.cellebrite import CellebriteSupport
from ingestors.support.encoding import EncodingSupport


class CellebriteIngestor(Ingestor, EncodingSupport, CellebriteSupport):
    "Ingestor for Cellebrite XML reports"
    MIME_TYPES = ['text/xml']
    EXTENSIONS = ['xml']
    SCORE = 0.5

    def ingest(self, file_path, entity):
        """Ingestor implementation."""
        entity.schema = model.get('Document')
        doc = self.parse_xml_path(file_path)
        ns = self.NSMAP
        root = doc.getroot()

        project_id = root.get('id')
        entity.add('messageId', project_id)
        owner = None

        for meta in root.xpath('./ns:metadata', namespaces=ns):
            owner = self.manager.make_entity('LegalEntity')
            owner.add('proof', entity)
            identities = set()
            identities.update(meta.xpath('./ns:item[@name="DeviceInfoUniqueID"]/text()', namespaces=ns))  # noqa
            identities.update(meta.xpath('./ns:item[@name="IMEI"]/text()', namespaces=ns))  # noqa
            if len(identities) and not owner.id:
                owner.make_id(project_id, *sorted(identities))
            owner.add('email', meta.xpath('./ns:item[@name="DeviceInfoAppleID"]/text()', namespaces=ns))  # noqa
            owner.add('name', meta.xpath('./ns:item[@name="DeviceInfoOwnerName"]/text()', namespaces=ns))  # noqa
            owner.add('phone', meta.xpath('./ns:item[@name="MSISDN"]/text()', namespaces=ns))  # noqa

        if owner.id is not None:
            self.manager.emit_entity(owner)

        for decoded in root.xpath('/ns:project/ns:decodedData', namespaces=ns):
            self.parse_calls(entity, project_id, decoded, owner)
            self.parse_messages(entity, project_id, decoded, owner)
            self.parse_notes(entity, project_id, decoded)
            self.parse_sms(entity, project_id, decoded)
            self.parse_contacts(entity, project_id, decoded)

    @classmethod
    def match(cls, file_path, entity):
        score = super(CellebriteIngestor, cls).match(file_path, entity)
        if score <= 0:
            return score
        with open(file_path, 'r') as fp:
            data = fp.read(1024 * 16)
            namespace = 'xmlns="%s"' % cls.NS
            if namespace in data:
                return cls.SCORE * 30
        return -1
