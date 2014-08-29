import os
import subprocess
from tempfile import mkdtemp, mkstemp

from dit.extract.util import file_empty


def convert_ocr(path, dest):
    tmp_dir = mkdtemp()
    base = os.path.join(tmp_dir, 'conv')
    args = ['pdftoppm', path, base]
    subprocess.call(args)
    contents = []
    for page in os.listdir(tmp_dir):
        page_path = os.path.join(tmp_dir, page)
        sysfd, page_dest = mkstemp()
        args = ['tesseract', page_path, page_dest, '-l', 'eng', '-psm', '1']
        subprocess.call(args)
        with open(page_dest + '.txt', 'rb') as fh:
            contents.append(fh.read())
        os.close(sysfd)
    contents = '\n\n'.join(contents)
    if len(contents.strip()):
        with open(dest, 'wb') as fh:
            fh.write(contents)


def convert_doc(path):
    try:
        dest_path = path.replace('.pdf', '.txt')
        if not file_empty(dest_path):
            return
        args = ['pdftotext', path, dest_path]
        subprocess.call(args)
        if file_empty(dest_path):
            print "Empty TXT: %s" % path
            convert_ocr(path, dest_path)
        if file_empty(dest_path):
            print "Empty OCR: %s" % dest_path
            if os.path.exists(dest_path):
                os.unlink(dest_path)
    except Exception, e:
        print e
