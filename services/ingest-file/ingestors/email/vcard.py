import logging
import vobject
from banal import ensure_list
from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.encoding import EncodingSupport

log = logging.getLogger(__name__)


class VCardIngestor(Ingestor, EncodingSupport):
    MIME_TYPES = ['text/vcard', 'text/x-vcard']
    EXTENSIONS = ['vcf', 'vcard']
    SCORE = 10

    def get_field(self, card, field):
        items = ensure_list(card.contents.get(field))
        return [i.value for i in items]

    def ingest(self, file_path, entity):
        entity.schema = model.get('PlainText')
        text = self.read_file_decoded(entity, file_path)
        entity.set('bodyText', text)
        for card in vobject.readComponents(text):
            person = self.manager.make_entity('Person')
            person.add('name', self.get_field(card, 'n'))
            person.add('name', self.get_field(card, 'fn'))
            person.add('gender', self.get_field(card, 'gender'))
            person.add('birthDate', self.get_field(card, 'bday'))
            person.add('position', self.get_field(card, 'title'))
            person.add('summary', self.get_field(card, 'note'))
            person.add('keywords', self.get_field(card, 'categories'))
            person.add('phone', self.get_field(card, 'tel'))
            person.add('weakAlias', self.get_field(card, 'nickname'))
            for email in self.get_field(card, 'email'):
                key = email.strip().lower()
                if len(key):
                    person.make_id(key)
                person.add('email', email)
            if person.id:
                self.manager.emit_entity(person)
