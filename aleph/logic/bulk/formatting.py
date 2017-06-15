import re
import six
from normality import collapse_spaces

FORMAT_PATTERN = re.compile('{{([^(}})]*)}}')


class Formatter(object):

    def __init__(self, template):
        self.template = six.text_type(template)
        self.refs = []
        self.replacements = {}
        for ref in FORMAT_PATTERN.findall(self.template):
            self.refs.append(ref)
            repl = '{{%s}}' % ref
            self.replacements[repl] = ref

    def apply(self, record):
        value = six.text_type(self.template)
        for repl, ref in self.replacements.items():
            ref_value = record.get(ref) or ''
            ref_value = six.text_type(ref_value)
            value = value.replace(repl, ref_value)
        return collapse_spaces(value).strip()
