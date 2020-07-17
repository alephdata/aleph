import logging
from lxml import etree
from lxml.etree import XMLSyntaxError, ParseError, ParserError
from pathlib import Path

from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class XMLSupport(object):
    """Safe XML document parser."""

    def get_xml_parser(self, **kwargs):
        return etree.XMLParser(
            ns_clean=True,
            recover=True,
            resolve_entities=False,
            no_network=True,
            **kwargs
        )

    def parse_xml_path(self, file_path, **kwargs):
        if isinstance(file_path, Path):
            file_path = file_path.as_posix()
        try:
            parser = self.get_xml_parser(**kwargs)
            return etree.parse(file_path, parser)
        except (ParserError, ParseError, XMLSyntaxError) as exc:
            raise ProcessingException("Failed to parse XML: %s" % exc) from exc
