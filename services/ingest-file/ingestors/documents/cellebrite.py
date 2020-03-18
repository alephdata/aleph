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
        print(project_id)

        self.device_owner = self.manager.make_entity('LegalEntity')
        self.device_id = root.xpath('./ns:metadata/ns:item[@name="DeviceInfoUniqueID"][1]/text()', namespaces=ns)[0]  # noqa
        imei = root.xpath('./ns:metadata/ns:item[@name="IMEI"][1]/text()', namespaces=ns)[0]  # noqa
        self.device_owner.make_id(self.device_id, imei)
        emails = root.xpath('./ns:metadata/ns:item[@name="DeviblceInfoAppleID"]/text()', namespaces=ns)  # noqa
        self.device_owner.add('email', emails)
        name = root.xpath('./ns:metadata/ns:item[@name="DeviceInfoOwnerName"]/text()', namespaces=ns)  # noqa
        self.device_owner.add('name', name)
        phone_numbers = root.xpath('./ns:metadata/ns:item[@name="MSISDN"]/text()', namespaces=ns)  # noqa
        self.device_owner.add('phone', phone_numbers)
        self.manager.emit_entity(self.device_owner)

        self.parse_calls(root)
        self.parse_messages(root)
        self.parse_notes(root)
        self.parse_sms(root)
        self.parse_contacts(root)

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
