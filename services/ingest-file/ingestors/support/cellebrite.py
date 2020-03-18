import logging
from banal import ensure_list
from normality import stringify

from ingestors.support.xml import XMLSupport
from ingestors.support.timestamp import TimestampSupport

log = logging.getLogger(__name__)
OUTGOING = 'Outgoing'


class CellebriteSupport(TimestampSupport, XMLSupport):
    NS = "http://pa.cellebrite.com/report/2.0"
    NSMAP = {"ns": NS}

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

    def parse_parties(self, parties):
        for party in parties:
            names = self._field_values(party, 'Name')
            identifiers = self._field_values(party, 'Identifier')
            yield self._get_party(names, identifiers)

    def parse_calls(self, doc, project_id, decoded, owner):
        for call in self._models(decoded, 'Call'):
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

    def parse_messages(self, doc, project_id, decoded, owner):
        """Message Parsing"""
        ns = self.NSMAP
        for thread in self._models(decoded, 'Chat'):
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

    def parse_contacts(self, doc, project_id, decoded):
        for contact in self._models(decoded, 'Contact'):
            name = self._field_values(contact, 'Name')
            numbers = []
            for el in self._models(contact, 'PhoneNumber'):
                numbers.extend(self._field_values(el, 'Value'))
            self._get_party(name, numbers, proof=doc)

    def parse_notes(self, doc, project_id, decoded):
        for note in self._models(decoded, 'Note'):
            entity = self.manager.make_entity('PlainText')
            entity.make_id(project_id, note.get('id'))
            entity.add('proof', doc)
            entity.add('title', self._field_values(note, 'Title'))
            entity.add('summary', self._field_values(note, 'Summary'))
            entity.add('bodyText', self._field_values(note, 'Body'))
            for timestamp in self._field_values(note, 'Creation'):
                entity.add('date', self.parse_timestamp(timestamp))
            self.manager.emit_entity(entity)

    def parse_sms(self, doc, project_id, decoded):
        for sms in self._models(decoded, 'SMS'):
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
