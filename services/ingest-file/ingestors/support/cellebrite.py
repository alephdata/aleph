import logging
import lxml.etree as ET

from banal import ensure_list
from normality import stringify

from ingestors.support.timestamp import TimestampSupport

log = logging.getLogger(__name__)
OUTGOING = 'Outgoing'


class CellebriteSupport(TimestampSupport):
    NS = "http://pa.cellebrite.com/report/2.0"
    NSMAP = {"ns": NS}

    def _ns_tag(self, tag):
        return '{{{0}}}{1}'.format(self.NS, tag)

    def get_seconds(self, time_str):
        """Get Seconds from time"""
        h, m, s = time_str.split(':')
        return float(h) * 3600 + float(m) * 60 + float(s)

    def _field_values(self, el, name):
        query = './ns:field[@name="%s"]/ns:value/text()' % name
        values = []
        for value in el.xpath(query, namespaces=self.NSMAP):
            value = stringify(value)
            if value is not None:
                values.append(value)
        return list(sorted(values))

    def _models(self, el, name):
        query = ".//ns:model[@type='%s']" % name
        yield from el.xpath(query, namespaces=self.NSMAP)

    def _get_party(self, names, identifiers, proof=None):
        party = self.manager.make_entity('LegalEntity')
        party.add('name', names)
        party.add('proof', proof)

        for identifier in sorted(identifiers, key=len, reverse=True):
            prop = 'email' if '@' in identifier else 'phone'
            party.add(prop, identifier)
            if not party.id:
                party.make_id(identifier)

        if not party.id:
            party.make_id(*ensure_list(names))

        if party.id:
            self.manager.emit_entity(party)
        return party

    def parse_metadata(self, doc, file_path):
        context = ET.iterparse(str(file_path), events=('end', ),
                               recover=True, tag=self._ns_tag('metadata'))
        project_id = None
        for event, meta in context:
            project = meta.getparent()
            project_id = project_id or project.get('id')
            if project is not None and project.tag != self._ns_tag('project'):
                meta.clear()
                break
            owner = self.manager.make_entity('LegalEntity')
            owner.add('proof', doc)
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
            meta.clear()
        del context

        if owner.id is not None:
            self.manager.emit_entity(owner)

        return project_id, owner

    def parse_content(self, entity, file_path, owner, project_id):
        context = ET.iterparse(str(file_path), events=('start', 'end'),
                               recover=True)
        elements_to_clear = []
        element_being_processed = None
        for event, el in context:
            parent = el.getparent()
            if parent is not None and parent.tag == self._ns_tag('modelType'):
                type_ = el.get('type')
                if type_ in ('Call', 'Chat', 'Note', 'SMS', 'Contact'):
                    if event == 'start':
                        element_being_processed = el.get('id')
                        continue
                    else:
                        if type_ == 'Call':
                            self.parse_calls(el, entity, project_id, owner)
                        elif type_ == 'Chat':
                            self.parse_messages(el, entity, project_id, owner)
                        elif type_ == 'Note':
                            self.parse_notes(el, entity, project_id)
                        elif type_ == 'SMS':
                            self.parse_sms(el, entity, project_id)
                        elif type_ == 'Contact':
                            self.parse_contacts(el, entity, project_id)
                        while elements_to_clear:
                            el = elements_to_clear.pop(0)
                            el.clear()
            if event == 'end':
                if element_being_processed is not None:
                    elements_to_clear.append(el)
                else:
                    el.clear()
        del context

    def parse_parties(self, parties):
        for party in parties:
            names = self._field_values(party, 'Name')
            identifiers = self._field_values(party, 'Identifier')
            yield self._get_party(names, identifiers)

    def parse_calls(self, call, doc, project_id, owner):
        entity = self.manager.make_entity('Call')
        entity.make_id(project_id, call.get('id'))
        # entity.add('proof', doc)

        for timestamp in self._field_values(call, 'TimeStamp'):
            entity.add('date', self.parse_timestamp(timestamp))

        for duration in self._field_values(call, 'Duration'):
            entity.add('duration', self.get_seconds(duration))

        call_types = self._field_values(call, 'Type')
        if OUTGOING in call_types:
            entity.add('caller', owner)
            entity.add('callerNumber', owner.get('phone'))
        else:
            entity.add('receiver', owner)
            entity.add('receiverNumber', owner.get('phone'))

        for party in self.parse_parties(self._models(call, 'Party')):
            if OUTGOING in call_types:
                entity.add('receiver', party)
                entity.add('receiverNumber', party.get('phone'))
            else:
                entity.add('caller', party)
                entity.add('callerNumber', party.get('phone'))

        self.manager.emit_entity(entity)

    def parse_messages(self, thread, doc, project_id, owner):
        """Message Parsing"""
        ns = self.NSMAP
        thread_id = thread.get('id')
        thread_name = self._field_values(thread, 'Name')
        thread_description = self._field_values(thread, 'Description')
        last_message = None
        for message in self._models(thread, 'InstantMessage'):
            message_id = message.get('id')
            entity = self.manager.make_entity('Message')
            entity.make_id(project_id, thread_id, message_id)
            entity.add('proof', doc)
            for timestamp in self._field_values(message, 'TimeStamp'):
                entity.add('date', self.parse_timestamp(timestamp))
            entity.add('subject', self._field_values(message, 'Subject'))
            entity.add('threadTopic', thread_name)
            entity.add('threadTopic', thread_description)
            senders = message.xpath('./ns:modelField[@name="From"]/ns:model[@type="Party"]', namespaces=ns)  # noqa
            for sender in self.parse_parties(senders):
                entity.add('sender', sender)

            receivers = message.xpath('./ns:modelField[@name="To"]/ns:model[@type="Party"]', namespaces=ns)  # noqa
            for receiver in self.parse_parties(receivers):
                entity.add('recipients', receiver)

            status = self._field_values(message, 'Status')
            if 'Read' in status:
                entity.add('recipients', owner)
            elif 'Sent' in status:
                entity.add('sender', owner)

            entity.add('bodyText', self._field_values(message, 'Body'))

            # attachments = message.xpath(
            #     './ns:multiModelField[@name="Attachments"]/'
            #     'ns:model[@type="Attachment"]/ns:field[@name="Filename"]'
            #     '/ns:value/text()', namespaces=ns
            # )
            # entity.add('metadata', {'attachments': attachments})

            entity.add('inReplyToMessage', last_message)
            last_message = entity
            self.manager.emit_entity(entity)

    def parse_contacts(self, contact, doc, project_id):
        name = self._field_values(contact, 'Name')
        numbers = []
        for el in self._models(contact, 'PhoneNumber'):
            numbers.extend(self._field_values(el, 'Value'))
        self._get_party(name, numbers, proof=doc)

    def parse_notes(self, note, doc, project_id):
        entity = self.manager.make_entity('PlainText')
        entity.make_id(project_id, note.get('id'))
        entity.add('proof', doc)
        entity.add('title', self._field_values(note, 'Title'))
        entity.add('summary', self._field_values(note, 'Summary'))
        entity.add('bodyText', self._field_values(note, 'Body'))
        for timestamp in self._field_values(note, 'Creation'):
            entity.add('date', self.parse_timestamp(timestamp))
        self.manager.emit_entity(entity)

    def parse_sms(self, sms, doc, project_id):
        entity = self.manager.make_entity('Message')
        entity.make_id(project_id, sms.get('id'))
        entity.add('proof', doc)
        entity.add('bodyText', self._field_values(sms, 'Body'))
        for timestamp in self._field_values(sms, 'TimeStamp'):
            entity.add('date', self.parse_timestamp(timestamp))
        for party in self._models(sms, 'Party'):
            name = self._field_values(party, 'Name')
            number = self._field_values(party, 'Identifier')
            party_entity = self._get_party(name, number, proof=doc)
            if 'From' in self._field_values(party, 'Role'):
                entity.add('sender', party_entity)
            else:
                entity.add('recipients', party_entity)
        self.manager.emit_entity(entity)
