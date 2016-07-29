import logging

from aleph.graph.util import NodeType, EdgeType

log = logging.getLogger(__name__)

EntityNode = NodeType('Entity', key='alephEntity')
PhoneNode = NodeType('Phone')
EmailNode = NodeType('Email')
CollectionNode = NodeType('Collection', key='alephCollection')
DocumentNode = NodeType('Document', key='alephDocument')

NODE_TYPES = [EntityNode, PhoneNode, EmailNode, CollectionNode, DocumentNode]

LOCATED_AT = EdgeType('LOCATED_AT')
CONTACT_FOR = EdgeType('CONTACT_FOR')
MENTIONS = EdgeType('MENTIONS')
PART_OF = EdgeType('PART_OF', hidden=True)
AKA = EdgeType('AKA', key='alephId')

EDGE_TYPES = [LOCATED_AT, CONTACT_FOR, MENTIONS, PART_OF, AKA]
