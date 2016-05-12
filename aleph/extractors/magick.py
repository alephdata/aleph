import os
import logging
import subprocess
from tempfile import mkstemp

from aleph.core import get_config

log = logging.getLogger(__name__)


def image_to_pdf(path):
    """Turn an image into an A4 PDF file."""
    fh, out_path = mkstemp(suffix='.pdf')
    os.close(fh)
    convert = get_config('CONVERT_BIN')
    args = [convert, path, '-density', '300', '-define',
            'pdf:fit-page=A4', out_path]
    subprocess.call(args)
    return out_path
