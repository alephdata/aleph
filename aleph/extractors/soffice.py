import os
import logging
import shutil
import subprocess
from tempfile import mkdtemp

from aleph.core import get_config

log = logging.getLogger(__name__)
# other formats:
# http://opengrok.libreoffice.org/s?n=25&start=0&q=PreferredFilter&sort=relevancy&project=core,


def document_to_pdf(path):
    """Convert LibreOffice-supported documents to PDF."""
    work_dir = mkdtemp()
    instance_dir = mkdtemp()
    try:
        soffice = get_config('SOFFICE_BIN')
        instance_path = '"-env:UserInstallation=file://%s"' % instance_dir
        args = [soffice, '--convert-to', 'pdf',
                '--nofirststartwizard', instance_path,
                '--norestore', '--nologo', '--nodefault', '--nolockcheck',
                '--invisible', '--outdir', work_dir,
                '--headless', path]
        log.debug('Converting document: %r', ' '.join(args))
        subprocess.call(args)
        for out_file in os.listdir(work_dir):
            return os.path.join(work_dir, out_file)
    except Exception as ex:
        log.exception(ex)
    finally:
        shutil.rmtree(instance_dir)
