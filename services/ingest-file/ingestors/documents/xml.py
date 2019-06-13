from lxml import etree, html
from lxml.etree import ParseError, ParserError
from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.html import HTMLSupport
from ingestors.support.encoding import EncodingSupport
from ingestors.exc import ProcessingException


class XMLIngestor(Ingestor, EncodingSupport, HTMLSupport):
    "XML file ingestor class. Generates a tabular HTML representation."

    MIME_TYPES = ['text/xml']
    EXTENSIONS = ['xml']
    SCORE = 1
    MAX_SIZE = 4 * 1024 * 1024
    XSLT = etree.XML(b"""<?xml version="1.0" encoding="UTF-8"?>
        <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
            version="1.0">
        <xsl:output omit-xml-declaration="yes" indent="yes"/>
        <xsl:strip-space elements="*"/>

        <xsl:template match="/">
            <table>
            <xsl:apply-templates/>
            </table>
        </xsl:template>

        <xsl:template match="*">
            <tr>
            <td>
                <p><xsl:value-of select="name()"/></p>
            </td>
            <td>
                <p><xsl:value-of select="."/></p>
            </td>
            </tr>
        </xsl:template>

        <xsl:template match="*[*]">
            <tr>
            <td>
                <p><xsl:value-of select="name()"/></p>
            </td>
            <td>
                <table>
                <xsl:apply-templates/>
                </table>
            </td>
            </tr>
        </xsl:template>

        </xsl:stylesheet>""")

    def ingest(self, file_path, entity):
        """Ingestor implementation."""
        entity.schema = model.get('HyperText')
        for file_size in entity.get('fileSize'):
            if int(file_size) > self.MAX_SIZE:
                raise ProcessingException("XML file is too large.")

        try:
            doc = etree.parse(file_path)
        except (ParserError, ParseError):
            raise ProcessingException("XML could not be parsed.")

        text = self.extract_html_text(doc.getroot())
        entity.set('bodyText', text)
        transform = etree.XSLT(self.XSLT)
        html_doc = transform(doc)
        html_body = html.tostring(html_doc, encoding=str, pretty_print=True)
        entity.set('bodyHtml', html_body)
