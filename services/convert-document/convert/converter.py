# derived from https://gist.github.com/six519/28802627584b21ba1f6a
# unlicensed
import os
import uno
import time
import logging
import subprocess
from threading import Timer
from com.sun.star.beans import PropertyValue
from com.sun.star.connection import NoConnectException

from convert.formats import Formats

CONNECTION_STRING = "socket,host=localhost,port=%s,tcpNoDelay=1;urp;StarOffice.ComponentContext"  # noqa
COMMAND = 'soffice --nologo --headless --nocrashreport --nodefault --nofirststartwizard --norestore --invisible --accept="%s"'  # noqa
RESOLVER_CLASS = 'com.sun.star.bridge.UnoUrlResolver'
DESKTOP_CLASS = 'com.sun.star.frame.Desktop'
DEFAULT_PORT = 6519
FORMATS = Formats()

log = logging.getLogger(__name__)


class ConversionFailure(Exception):
    pass


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
        self.connection = CONNECTION_STRING % self.port
        self.local_context = uno.getComponentContext()
        self.resolver = self._svc_create(self.local_context, RESOLVER_CLASS)
        self.process = None

    def _svc_create(self, ctx, clazz):
        return ctx.ServiceManager.createInstanceWithContext(clazz, ctx)

    def terminate(self):
        # FIXME: this was done after discovering that killing the LO
        # process will only terminating it after the current request
        # is processed, which may well be never.
        log.warning("Hard timeout.")
        os._exit(1)

    def connect(self):
        # Check if the LibreOffice process has an exit code
        if self.process is None or self.process.poll() is not None:
            log.info("Starting headless LibreOffice...")
            command = COMMAND % self.connection
            self.process = subprocess.Popen(command,
                                            shell=True,
                                            stdin=None,
                                            stdout=None,
                                            stderr=None)

        while True:
            try:
                context = self.resolver.resolve("uno:%s" % self.connection)
                return self._svc_create(context, DESKTOP_CLASS)
            except NoConnectException:
                time.sleep(1)

    def convert_file(self, file_name, out_file, filters, timeout=300):
        timer = Timer(timeout, self.terminate)
        timer.start()
        try:
            desktop = self.connect()
            if desktop is None:
                raise RuntimeError("Cannot connect to LibreOffice.")
            file_name = os.path.abspath(file_name)
            input_url = uno.systemPathToFileUrl(file_name)
            for filter_name in filters:
                props = self.get_input_properties(filter_name)
                doc = desktop.loadComponentFromURL(input_url, '_blank', 0, props)  # noqa
                if doc is None:
                    continue
                if hasattr(doc, 'refresh'):
                    doc.refresh()
                output_url = uno.systemPathToFileUrl(out_file)
                prop = self.get_output_properties(doc)
                doc.storeToURL(output_url, prop)
                doc.dispose()
                doc.close(True)
                del doc
        finally:
            timer.cancel()

    def get_input_properties(self, filter_name):
        return self.property_tuple({
            "Hidden": True,
            "MacroExecutionMode": 0,
            "ReadOnly": True,
            "FilterName": filter_name
        })

    def get_output_properties(self, doc):
        for (service, pdf) in self.PDF_FILTERS:
            if doc.supportsService(service):
                return self.property_tuple({
                    "FilterName": pdf,
                    "MaxImageResolution": 300,
                    "SelectPdfVersion": 1,
                })
        raise ConversionFailure("PDF export not supported.")

    def property_tuple(self, propDict):
        properties = []
        for k, v in propDict.items():
            property = PropertyValue()
            property.Name = k
            property.Value = v
            properties.append(property)
        return tuple(properties)
