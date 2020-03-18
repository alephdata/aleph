import logging

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

    def parse_parties(self, parties):
        party_entities = []
        ns = self.NSMAP
        for party in parties:
            name = party.xpath('./ns:field[@name="Name"]/ns:value/text()', namespaces=ns)  # noqa
            number = party.xpath('./ns:field[@name="Identifier"]/ns:value/text()', namespaces=ns)  # noqa
            if name and number:
                entity = self.manager.make_entity('LegalEntity')
                entity.make_id(name, number)
                entity.add('name', name)
                entity.add('phone', number)
                party_entities.append(entity)
        return party_entities

    def parse_call_parties(self, call, call_entity, call_types):
        """Call Parsing"""
        ns = self.NSMAP
        parties = call.xpath('./ns:multiModelField[@name="Parties"]/ns:model', namespaces=ns)  # noqa
        for party in self.parse_parties(parties):
            if call_types and call_types[0] == OUTGOING:
                call_entity.add('receiver', party)
            else:
                call_entity.add('caller', party)
            self.manager.emit_entity(party)
            number = party.get('phone')
            if call_types and call_types[0] == OUTGOING:
                call_entity.add('receiverNumber', number)
            else:
                call_entity.add('callerNumber', number)

    def parse_calls(self, root):
        ns = {"ns": root.nsmap[None]}
        calls = root.xpath("/ns:project/ns:decodedData/ns:modelType[@type='Call']/ns:model", namespaces=ns)  # noqa
        for call in calls:
            entity = self.manager.make_entity('Call')
            entity.make_id(call.get('id'))

            timestamp = call.xpath(
                './ns:field[@name="TimeStamp"]/ns:value[@format="TimeStampKnown"]/text()',  # noqa
                namespaces=ns
            )
            timestamp = [self.parse_timestamp(ts) for ts in timestamp]
            entity.add('date', timestamp)

            duration = call.xpath('./ns:field[@name="Duration"]/ns:value/text()', namespaces=ns)  # noqa
            duration = [self.get_seconds(ts) for ts in duration]
            entity.add('duration', duration)

            call_types = call.xpath('./ns:field[@name="Type"]/ns:value/text()', namespaces=ns)  # noqa
            if call_types and call_types[0] == OUTGOING:
                entity.add('caller', self.device_owner)
                entity.add('callerNumber', self.device_owner.get('phone'))
            else:
                entity.add('receiver', self.device_owner)
                entity.add('receiverNumber', self.device_owner.get('phone'))

            self.parse_call_parties(call, entity, call_types)
            self.manager.emit_entity(entity)

    # Message Parsing

    def parse_messages(self, root):
        ns = self.NSMAP
        threads = root.xpath("/ns:project/ns:decodedData/ns:modelType[@type='Chat']/ns:model", namespaces=ns)  # noqa
        for thread in threads:
            thread_id = thread.get('id')
            thread_name = thread.xpath('./ns:field[@name="Name"]/ns:value/text()', namespaces=ns)  # noqa
            thread_description = thread.xpath(
                './ns:field[@name="Description"]/ns:value/text()',
                namespaces=ns
            )
            messages = thread.xpath(
                './ns:multiModelField[@name="Messages"]/ns:model[@type="InstantMessage"]',  # noqa
                namespaces=ns
            )
            last_message = None
            for message in messages:
                message_id = message.get('id')
                senders = message.xpath('./ns:modelField[@name="From"]/ns:model[@type="Party"]', namespaces=ns)  # noqa
                senders = self.parse_parties(senders)
                receivers = message.xpath('./ns:modelField[@name="To"]/ns:model[@type="Party"]', namespaces=ns)  # noqa
                receivers = self.parse_parties(receivers)
                subject = message.xpath('./ns:field[@name="Subject"]/ns:value/text()', namespaces=ns)  # noqa
                body = message.xpath('./ns:field[@name="Body"]/ns:value/text()', namespaces=ns)  # noqa
                timestamp = message.xpath('./ns:field[@name="TimeStamp"]/ns:value/text()', namespaces=ns)  # noqa
                timestamp = [self.parse_timestamp(ts) for ts in timestamp]
                attachments = message.xpath(
                    './ns:multiModelField[@name="Attachments"]/'
                    'ns:model[@type="Attachment"]/ns:field[@name="Filename"]'
                    '/ns:value/text()', namespaces=ns
                )
                message_status = message.xpath('./ns:field[@name="Status"]/ns:value/text()', namespaces=ns)  # noqa

                entity = self.manager.make_entity('Message')
                entity.make_id(thread_id, message_id)
                entity.add('date', timestamp)
                entity.add('subject', subject)
                entity.add('threadTopic', thread_name)
                entity.add('threadTopic', thread_description)
                for sender in senders:
                    entity.add('sender', sender)
                    self.manager.emit_entity(sender)
                for receiver in receivers:
                    entity.add('recipients', receiver)
                    self.manager.emit_entity(receiver)
                if message_status and message_status[0] == 'Read':
                    entity.add('recipients', self.device_owner)
                elif message_status and message_status[0] == 'Sent':
                    entity.add('sender', self.device_owner)
                entity.add('bodyText', body)
                entity.add('metadata', {'attachments': attachments})
                if last_message:
                    entity.add('inReplyToMessage', last_message)
                    entity.add('inReplyTo', last_message.id)
                last_message = entity
                self.manager.emit_entity(entity)

    def parse_contacts(self, root):
        ns = self.NSMAP
        contacts = root.xpath("/ns:project/ns:decodedData/ns:modelType[@type='Contact']/ns:model", namespaces=ns)  # noqa
        for contact in contacts:
            name = contact.xpath('./ns:field[@name="Name"]/ns:value/text()', namespaces=ns)  # noqa
            numbers = contact.xpath(
                './ns:multiModelField[@type="ContactEntry"]/'
                'ns:model[@type="PhoneNumber"]/ns:field[@name="Value"]/'
                'ns:value/text()', namespaces=ns
            )
            # Some numbers have unicode whitespace in them. clean it up
            numbers = [n.encode('ascii', 'ignore').decode() for n in numbers]
            if not name:
                name = numbers
            if name and numbers:
                entity = self.manager.make_entity('LegalEntity')
                entity.make_id(name, numbers)
                entity.add('name', name)
                entity.add('phone', numbers)
                self.manager.emit_entity(entity)

    def parse_notes(self, root):
        ns = self.NSMAP
        notes = root.xpath("/ns:project/ns:decodedData/ns:modelType[@type='Note']/ns:model", namespaces=ns)  # noqa
        for note in notes:
            note_id = note.get('id')
            title = note.xpath("./ns:field[@name='Title']/ns:value/text()", namespaces=ns)  # noqa
            body = note.xpath("./ns:field[@name='Body']/ns:value/text()", namespaces=ns)  # noqa
            summary = note.xpath("./ns:field[@name='Summary']/ns:value/text()", namespaces=ns)  # noqa
            timestamp = note.xpath("./ns:field[@name='Creation']/ns:value/text()", namespaces=ns)  # noqa

            entity = self.manager.make_entity('PlainText')
            entity.make_id(self.device_id, note_id)
            entity.add('title', title)
            entity.add('title', summary)
            entity.add('bodyText', body)
            entity.add('date', self.parse_timestamp(timestamp))
            self.manager.emit_entity(entity)

    def parse_sms(self, root):
        ns = self.NSMAP
        smses = root.xpath("/ns:project/ns:decodedData/ns:modelType[@type='SMS']/ns:model", namespaces=ns)  # noqa
        for sms in smses:
            sms_id = sms.get('id')
            body = sms.xpath("./ns:field[@name='Body']/ns:value/text()", namespaces=ns)  # noqa
            timestamp = sms.xpath("./ns:field[@name='TimeStamp']/ns:value/text()", namespaces=ns)  # noqa
            parties = sms.xpath("./ns:multiModelField[@name='Parties']/ns:model", namespaces=ns)  # noqa

            sms_ent = self.manager.make_entity('Message')
            sms_ent.make_id(self.device_id, sms_id)
            sms_ent.add('bodyText', body)
            sms_ent.add('date', self.parse_timestamp(timestamp))
            for party in parties:
                name = party.xpath('./ns:field[@name="Name"]/ns:value/text()', namespaces=ns)  # noqa
                number = party.xpath('./ns:field[@name="Identifier"]/ns:value/text()', namespaces=ns)  # noqa
                party_role = party.xpath('./ns:field[@name="Role"]/ns:value/text()', namespaces=ns)  # noqa
                if not name:
                    name = number
                if name and number:
                    entity = self.manager.make_entity('LegalEntity')
                    entity.make_id(name, number)
                    entity.add('name', name)
                    entity.add('phone', number)
                    self.manager.emit_entity(entity)
                    if party_role and party_role[0] == 'From':
                        sms_ent.add('sender', entity)
                    elif party_role and party_role[0] == 'To':
                        sms_ent.add('recipients', entity)
            self.manager.emit_entity(sms_ent)
