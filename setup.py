from setuptools import setup, find_packages

setup(
    name='aleph',
    version='1.2-dev',
    description="Document sifting web frontend",
    long_description="",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
    ],
    keywords='',
    author='Friedrich Lindenberg',
    author_email='friedrich@pudo.org',
    url='http://aleph.readthedocs.io',
    license='MIT',
    packages=find_packages(exclude=['ez_setup', 'examples', 'test']),
    namespace_packages=[],
    include_package_data=True,
    zip_safe=False,
    install_requires=[],
    test_suite='nose.collector',
    entry_points={
        'aleph.ingestors': [
            'skip = aleph.ingest.dummy:SkipIngestor',
            'pdf = aleph.ingest.text:PDFIngestor',
            'doc = aleph.ingest.document:DocumentIngestor',
            'txt = aleph.ingest.document:PlainTextIngestor',
            'ppt = aleph.ingest.document:PresentationIngestor',
            'html = aleph.ingest.html:HtmlIngestor',
            'djvu = aleph.ingest.djvu:DjVuIngestor',
            'img = aleph.ingest.image:ImageIngestor',
            'email = aleph.ingest.email_:EmailFileIngestor',
            'mbox = aleph.ingest.email_:MboxFileIngestor',
            'msg = aleph.ingest.msg:OutlookMsgIngestor',
            'cronos = aleph.ingest.cronos:CronosIngestor',
            'pst = aleph.ingest.email_:OutlookIngestor',
            'mdb = aleph.ingest.mdb:AccessIngestor',
            'messy = aleph.ingest.tabular:MessyTablesIngestor',
            'dbf = aleph.ingest.dbf:DBFIngestor',
            'rar = aleph.ingest.packages:RARIngestor',
            'zip = aleph.ingest.packages:ZipIngestor',
            'tar = aleph.ingest.packages:TarIngestor',
            '7z = aleph.ingest.packages:SevenZipIngestor',
            'gz = aleph.ingest.packages:GzipIngestor',
            'bz2 = aleph.ingest.packages:BZ2Ingestor'
        ],
        'aleph.analyzers': [
            'lang = aleph.analyze.language:LanguageAnalyzer',
            'emails = aleph.analyze.regex:EMailAnalyzer',
            'urls = aleph.analyze.regex:URLAnalyzer',
            'phones = aleph.analyze.regex:PhoneNumberAnalyzer',
            'corasick = aleph.analyze.corasick_entity:AhoCorasickEntityAnalyzer',  # noqa
            'polyglot = aleph.analyze.polyglot_entity:PolyglotEntityAnalyzer'
        ],
        'aleph.crawlers': [
            # 'stub = aleph.crawlers.stub:StubCrawler',
            'sourceafrica = aleph.crawlers.documentcloud:SourceAfricaCrawler'
        ],
        'aleph.init': [
        ],
        'console_scripts': [
            'aleph = aleph.manage:main',
        ]
    },
    tests_require=['coverage', 'nose']
)
