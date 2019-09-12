from lxml import etree
from pantomime import normalize_mimetype, normalize_extension

NS = {'oor': 'http://openoffice.org/2001/registry'}
NAME = '{%s}name' % NS['oor']
FILES = [
    '/usr/lib/libreoffice/share/registry/writer.xcd',
    '/usr/lib/libreoffice/share/registry/impress.xcd',
    '/usr/lib/libreoffice/share/registry/draw.xcd',
]


def load_mime_extensions():
    media_types = {}
    for xcd_file in FILES:
        doc = etree.parse(xcd_file)
        path = './*[@oor:package="org.openoffice.TypeDetection"]/node/node'
        for tnode in doc.xpath(path, namespaces=NS):
            node = {}
            for prop in tnode.findall('./prop'):
                name = prop.get(NAME)
                for value in prop.findall('./value'):
                    node[name] = value.text

            media_type = normalize_mimetype(node.get('MediaType'),
                                            default=None)
            if media_type is None:
                continue

            extensions = node.get('Extensions')
            if extensions is None:
                continue

            extension = normalize_extension(extensions.split(' ')[0])
            if extension is not None:
                media_types[media_type] = extension
    return media_types
