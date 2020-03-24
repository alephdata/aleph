from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.cellebrite import CellebriteSupport
from ingestors.support.encoding import EncodingSupport


class CellebriteIngestor(Ingestor, EncodingSupport, CellebriteSupport):
    "Ingestor for Cellebrite XML reports"
    MIME_TYPES = ['text/xml']
    EXTENSIONS = ['xml']
    SCORE = 0.5

    def _item(self, meta, name):
        query = './ns:item[@name="%s"]/text()' % name
        return meta.xpath(query, namespaces=self.NSMAP)

    def ingest(self, file_path, entity):
        """Ingestor implementation."""
        entity.schema = model.get('Document')
        doc = self.parse_xml_path(file_path)
        root = doc.getroot()
        project_id = root.get('id')
        entity.add('messageId', project_id)
        owner = None

        for meta in root.xpath('./ns:metadata', namespaces=self.NSMAP):
            owner = self.manager.make_entity('LegalEntity')
            owner.add('proof', entity)
            identities = set()
            identities.update(self._item(meta, 'DeviceInfoUniqueID'))
            identities.update(self._item(meta, 'IMEI'))
            identities.update(self._item(meta, 'DeviceInfoUnitIdentifier'))
            if len(identities) and not owner.id:
                owner.make_id(project_id, *sorted(identities))
            owner.add('name', self._item(meta, 'DeviceInfoOwnerName'))
            owner.add('email', self._item(meta, 'DeviceInfoAppleID'))
            owner.add('phone', self._item(meta, 'MSISDN'))
            if not owner.has('name'):
                owner.add('name', self._item(meta, 'DeviceInfoDetectedModel'))
            if not owner.has('name'):
                man = self._item(meta, 'DeviceInfoSelectedManufacturer')
                name = self._item(meta, 'DeviceInfoSelectedDeviceName')
                if name is not None and man is not None:
                    owner.add('name', '%s (%s)' % (name, man))

        if owner.id is not None:
            self.manager.emit_entity(owner)

        query = '/ns:project/ns:decodedData'
        for decoded in root.xpath(query, namespaces=self.NSMAP):
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
