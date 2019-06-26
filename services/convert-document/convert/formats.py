from lxml import etree
from collections import defaultdict, OrderedDict
from pantomime import normalize_mimetype, normalize_extension

NS = {'oor': 'http://openoffice.org/2001/registry'}
NAME = '{%s}name' % NS['oor']


class Formats(object):
    FILES = [
        '/usr/lib/libreoffice/share/registry/writer.xcd',
        '/usr/lib/libreoffice/share/registry/impress.xcd',
        '/usr/lib/libreoffice/share/registry/draw.xcd',
        # '/usr/lib/libreoffice/share/registry/calc.xcd',
    ]

    def __init__(self):
        self.media_types = defaultdict(list)
        self.extensions = defaultdict(list)
        for xcd_file in self.FILES:
            doc = etree.parse(xcd_file)
            path = './*[@oor:package="org.openoffice.TypeDetection"]/node/node'
            for tnode in doc.xpath(path, namespaces=NS):
                node = {}
                for prop in tnode.findall('./prop'):
                    name = prop.get(NAME)
                    for value in prop.findall('./value'):
                        node[name] = value.text

                name = node.get('PreferredFilter', tnode.get(NAME))
                media_type = normalize_mimetype(node.get('MediaType'),
                                                default=None)
                if media_type is not None:
                    self.media_types[media_type].append(name)

                for ext in self.parse_extensions(node.get('Extensions')):
                    self.extensions[ext].append(name)

    def parse_extensions(self, extensions):
        if extensions is not None:
            for ext in extensions.split(' '):
                if ext == '*':
                    continue
                ext = normalize_extension(ext)
                if ext is not None:
                    yield ext

    def get_filters(self, extension, media_type):
        filters = OrderedDict()
        for filter_name in self.media_types.get(media_type, []):
            filters[filter_name] = None
        for filter_name in self.extensions.get(extension, []):
            filters[filter_name] = None
        return filters.keys()
