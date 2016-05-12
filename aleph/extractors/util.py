import six
import chardet
import logging
from unicodedata import category

log = logging.getLogger(__name__)


def guess_encoding(text):
    if isinstance(text, six.text_type):
        return
    if text is None or not len(str(text).strip()):
        return
    if isinstance(text, six.string_types):
        enc = chardet.detect(text)
        return enc.get('encoding', 'utf-8')


def safe_text(text):
    if text is None:
        return
    try:
        encoding = guess_encoding(text)
        if encoding:
            text = text.decode(encoding)
        if not isinstance(text, six.text_type):
            return
        text = ''.join(ch for ch in text if category(ch)[0] != 'C')
        return text.replace(u'\xfe\xff', '')  # remove BOM
    except Exception as ex:
        log.exception(ex)
        return


def text_fragments(frags):
    text = []
    for frag in frags:
        if frag is None:
            continue
        frag = frag.strip()
        if len(frag):
            text.append(frag)

    text = '\n'.join(text)
    return text.strip()
