from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.pdf import PDFSupport
from ingestors.support.ole import OLESupport


class DocumentIngestor(Ingestor, OLESupport, PDFSupport):
    """Office/Word document ingestor class.

    Converts the document to PDF and extracts the text.
    Mostly a slightly adjusted PDF ingestor.

    Requires system tools:

    - Open/Libre Office with dependencies
    - image ingestor dependencies to cover any embeded images OCR
    """

    MIME_TYPES = [
        # Text documents
        "text/richtext",
        "text/rtf",
        "application/rtf",
        "application/x-rtf",
        "application/msword",
        "application/vnd.ms-word",
        "application/wordperfect",
        "application/vnd.wordperfect",
        # Presentations
        "application/vnd.ms-powerpoint",
        "application/vnd.sun.xml.impress",
        "application/vnd.ms-powerpoint.presentation",
        "application/vnd.ms-powerpoint.presentation.12",
        # MS Office files with short stream missing
        "application/CDFV2-unknown",
        "application/CDFV2-corrupt" "application/clarisworks",  # ClarisWorks_Draw
        "application/epub+zip",  # EPUB Document
        "application/macwriteii",  # MacWrite
        "application/msword",  # MS Word 2007 XML VBA
        "application/prs.plucker",  # Plucker eBook
        "application/vnd.corel-draw",  # Corel Draw Document
        "application/vnd.lotus-wordpro",  # LotusWordPro
        "application/vnd.ms-powerpoint",  # MS PowerPoint 97 Vorlage
        "application/vnd.ms-powerpoint.presentation.macroEnabled.main+xml",  # Impress MS PowerPoint 2007 XML VBA  # noqa
        "application/vnd.ms-works",  # Mac_Works
        "application/vnd.palm",  # Palm_Text_Document
        "application/vnd.sun.xml.draw",  # StarOffice XML (Draw)
        "application/vnd.sun.xml.draw.template",  # draw_StarOffice_XML_Draw_Template  # noqa
        "application/vnd.sun.xml.impress",  # StarOffice XML (Impress)
        "application/vnd.sun.xml.impress.template",  # impress_StarOffice_XML_Impress_Template  # noqa
        "application/vnd.sun.xml.writer",  # StarOffice XML (Writer)
        "application/vnd.sun.xml.writer.global",  # writer_globaldocument_StarOffice_XML_Writer_GlobalDocument  # noqa
        "application/vnd.sun.xml.writer.template",  # writer_StarOffice_XML_Writer_Template  # noqa
        "application/vnd.sun.xml.writer.web",  # writer_web_StarOffice_XML_Writer_Web_Template  # noqa
        "application/vnd.visio",  # Visio Document
        "application/vnd.wordperfect",  # WordPerfect
        "application/x-abiword",  # AbiWord
        "application/x-aportisdoc",  # PalmDoc
        "application/x-fictionbook+xml",  # FictionBook 2
        "application/x-hwp",  # writer_MIZI_Hwp_97
        "application/x-iwork-keynote-sffkey",  # Apple Keynote
        "application/x-iwork-pages-sffpages",  # Apple Pages
        "application/x-mspublisher",  # Publisher Document
        "application/x-mswrite",  # MS_Write
        "application/x-pagemaker",  # PageMaker Document
        "application/x-sony-bbeb",  # BroadBand eBook
        "application/x-t602",  # T602Document
        "image/x-cmx",  # Corel Presentation Exchange
        "image/x-freehand",  # Freehand Document
        "image/x-wpg",  # WordPerfect Graphics
    ]
    EXTENSIONS = [
        "602",  # T602Document
        "abw",  # AbiWord
        "cdr",  # Corel Draw Document
        "cmx",  # Corel Presentation Exchange
        "cwk",  # ClarisWorks_Draw
        "doc",  # Mac_Word
        "dot",  # MS Word 97 Vorlage
        "dps",  # MS PowerPoint 97
        "dpt",  # MS PowerPoint 97 Vorlage
        "epub",  # EPUB Document
        "fb2",  # FictionBook 2
        "fh",  # Freehand Document
        "fh1",  # Freehand Document
        "fh10",  # Freehand Document
        "fh11",  # Freehand Document
        "fh2",  # Freehand Document
        "fh3",  # Freehand Document
        "fh4",  # Freehand Document
        "fh5",  # Freehand Document
        "fh6",  # Freehand Document
        "fh7",  # Freehand Document
        "fh8",  # Freehand Document
        "fh9",  # Freehand Document
        "fodg",  # OpenDocument Drawing Flat XML
        "fodp",  # OpenDocument Presentation Flat XML
        "fodt",  # OpenDocument Text Flat XML
        "hwp",  # writer_MIZI_Hwp_97
        "key",  # Apple Keynote
        "lrf",  # BroadBand eBook
        "lwp",  # LotusWordPro
        "mcw",  # MacWrite
        "mw",  # MacWrite
        "mwd",  # Mariner_Write
        "nxd",  # WriteNow
        "odg",  # draw8
        "odm",  # writerglobal8
        "otg",  # draw8_template
        "oth",  # writerweb8_writer_template
        "otm",  # writerglobal8_template
        "otp",  # impress8_template
        "ott",  # writer8_template
        "p65",  # PageMaker Document
        "pages",  # Apple Pages
        "pdb",  # Palm_Text_Document
        "pm",  # PageMaker Document
        "pm6",  # PageMaker Document
        "pmd",  # PageMaker Document
        "pot",  # PowerPoint 3
        "pps",  # MS PowerPoint 97 AutoPlay
        "ppt",  # PowerPoint 3
        # 'pptm',  # Impress Office Open XML
        "pub",  # Publisher Document
        "qxd",  # QXP Document
        "qxt",  # QXP Document
        "rtf",  # Rich Text Format
        "sda",  # StarOffice_Drawing
        "sdd",  # StarOffice_Presentation
        "sdw",  # StarOffice_Writer
        "std",  # draw_StarOffice_XML_Draw_Template
        "sti",  # impress_StarOffice_XML_Impress_Template
        "stw",  # writer_StarOffice_XML_Writer_Template
        "sxd",  # StarOffice XML (Draw)
        "sxg",  # writer_globaldocument_StarOffice_XML_Writer_GlobalDocument
        "sxi",  # StarOffice XML (Impress)
        "sxw",  # StarOffice XML (Writer)
        # 'tab',  # Text
        # 'tsv',  # Text
        # 'txt',  # Text
        "vdx",  # Visio Document
        "vsd",  # Visio Document
        "vsdm",  # Visio Document
        "vsdx",  # Visio Document
        "wn",  # WriteNow
        "wpd",  # WordPerfect
        "wpg",  # WordPerfect Graphics
        "wps",  # Mac_Works
        "wpt",  # MS Word 97 Vorlage
        "wri",  # MS_Write
        "xlc",  # MS Excel 95
        "xlm",  # MS Excel 95
        "xls",  # MS Excel 95
        "xlw",  # MS Excel 95
        # 'xml',  # OpenDocument Drawing Flat XML
        "zabw",  # AbiWord
        # 'zip',  # FictionBook 2
        "zmf",  # ZMF Document
    ]
    SCORE = 6

    def ingest(self, file_path, entity):
        """Ingestor implementation."""
        entity.schema = model.get("Pages")
        self.extract_ole_metadata(file_path, entity)
        pdf_path = self.document_to_pdf(file_path, entity)
        self.pdf_alternative_extract(entity, pdf_path)
