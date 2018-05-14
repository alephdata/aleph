# derived from https://gist.github.com/six519/28802627584b21ba1f6a
# unlicensed
import os
import uno
import signal
import asyncio
import logging
import subprocess
from tempfile import mkstemp
from com.sun.star.beans import PropertyValue

from unoservice.formats import Formats
from unoservice.util import ConversionFailure
from unoservice.util import handle_timeout

CONNECTION_STRING = "socket,host=localhost,port=%s;urp;StarOffice.ComponentContext"  # noqa
COMMAND = 'soffice --nologo --headless --nocrashreport --nodefault --nofirststartwizard --norestore --invisible --accept="%s"'  # noqa
RESOLVER_CLASS = 'com.sun.star.bridge.UnoUrlResolver'
DESKTOP_CLASS = 'com.sun.star.frame.Desktop'
DEFAULT_PORT = 6519
FORMATS = Formats()

log = logging.getLogger(__name__)


class PdfConverter(object):
    """Launch a background instance of LibreOffice and convert documents
    to PDF using it's filters.
    """
    PDF_FILTERS = (
        ("com.sun.star.text.GenericTextDocument", "writer_pdf_Export"),
        ("com.sun.star.text.WebDocument", "writer_web_pdf_Export"),
        ("com.sun.star.sheet.SpreadsheetDocument", "calc_pdf_Export"),
        ("com.sun.star.presentation.PresentationDocument", "impress_pdf_Export"),  # noqa
        ("com.sun.star.drawing.DrawingDocument", "draw_pdf_Export"),
    )

    def __init__(self, host=None, port=None):
        self.port = port or DEFAULT_PORT
        self.desktop = None
        self.process = None

    def _svc_create(self, ctx, clazz):
        return ctx.ServiceManager.createInstanceWithContext(clazz, ctx)

    async def prepare(self):
        # Check if the LibreOffice process has an exit code:
        if self.process is None or self.process.poll() is not None:
            log.info("LibreOffice not running; reset.")
            self.terminate()

        connection = CONNECTION_STRING % self.port
        if self.process is None:
            log.info("Starting headless LibreOffice...")
            command = COMMAND % connection
            self.process = subprocess.Popen(command,
                                            shell=True,
                                            stdin=None,
                                            stdout=None,
                                            stderr=None)
            await asyncio.sleep(5)
            self.desktop = None

        if self.desktop is None:
            log.info("Connecting to UNO service...")
            local_context = uno.getComponentContext()
            resolver = self._svc_create(local_context, RESOLVER_CLASS)
            context = resolver.resolve("uno:%s" % connection)
            self.desktop = self._svc_create(context, DESKTOP_CLASS)

    def terminate(self):
        if self.desktop is not None:
            # Clear out our local LO handle.
            log.info("Destroying UNO desktop instance...")
            try:
                self.desktop.terminate()
            except Exception:
                log.exception("Failed to terminate")
            self.desktop = None

        if self.process is not None:
            # Check if the LibreOffice process is still running
            if self.process.poll() is None:
                log.info("Killing LibreOffice process...")
                self.process.kill()
            self.process = None

    def open_document(self, input_url, filters):
        for filter_name in filters:
            props = self.property_tuple({
                "Hidden": True,
                "MacroExecutionMode": 0,
                "ReadOnly": True,
                "FilterName": filter_name
            })
            doc = self.desktop.loadComponentFromURL(input_url,
                                                    '_blank',
                                                    0,
                                                    props)
            if doc is None:
                continue
            if hasattr(doc, 'refresh'):
                doc.refresh()
            return doc
        raise ConversionFailure("Cannot open this document")

    def convert_file(self, file_name, filters, timeout=300):
        fd, output_filename = mkstemp(suffix='.pdf')
        os.close(fd)

        file_name = os.path.abspath(file_name)
        input_url = uno.systemPathToFileUrl(file_name)
        output_url = uno.systemPathToFileUrl(output_filename)

        # Trigger SIGALRM after the timeout has passed.
        signal.signal(signal.SIGALRM, handle_timeout)
        signal.alarm(timeout)
        try:
            doc = self.open_document(input_url, filters)
            for (service, pdf) in self.PDF_FILTERS:
                if doc.supportsService(service):
                    prop = self.property_tuple({
                        "FilterName": pdf,
                        "MaxImageResolution": 300,
                        "SelectPdfVersion": 1,
                    })
                    doc.storeToURL(output_url, prop)
                    doc.close(True)
                    return output_filename
            raise ConversionFailure("Cannot export to PDF")
        except Exception:
            os.unlink(output_filename)
            raise
        finally:
            signal.alarm(0)

    def property_tuple(self, propDict):
        properties = []
        for k, v in propDict.items():
            property = PropertyValue()
            property.Name = k
            property.Value = v
            properties.append(property)
        return tuple(properties)
