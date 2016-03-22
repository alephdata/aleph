from setuptools import setup, find_packages

setup(
    name='aleph',
    version='0.2',
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
    url='http://grano.cc',
    license='MIT',
    packages=find_packages(exclude=['ez_setup', 'examples', 'test']),
    namespace_packages=[],
    include_package_data=True,
    zip_safe=False,
    install_requires=[],
    test_suite='nose.collector',
    entry_points={
        'aleph.ingestors': [
            'html = aleph.ingest.text:HtmlIngestor',
            'pdf = aleph.ingest.text:PDFIngestor',
            'doc = aleph.ingest.text:DocumentIngestor',
            'img = aleph.ingest.text:ImageIngestor',
            'messy = aleph.ingest.tabular:MessyTablesIngestor',
            'dbf = aleph.ingest.tabular:DBFIngestor',
            'rar = aleph.ingest.packages:RARIngestor',
            'zip = aleph.ingest.packages:ZipIngestor',
            'tar = aleph.ingest.packages:TarIngestor',
            'gz = aleph.ingest.packages:GzipIngestor',
            'bz2 = aleph.ingest.packages:BZ2Ingestor'
        ],
        'aleph.analyzers': [
            'lang = aleph.analyze.language:LanguageAnalyzer',
            'entities = aleph.analyze.entities:EntityAnalyzer'
        ],
        'aleph.crawlers': [
            'opennames = aleph.crawlers.opennames:OpenNamesCrawler',
            'spindle = aleph.crawlers.spindle:SpindleCrawler',
            'idrequests = aleph.crawlers.idashboard:IDRequests',
            'idfiles = aleph.crawlers.idashboard:IDFiles'
        ],
        'console_scripts': [
            'aleph = aleph.manage:main',
        ]
    },
    tests_require=[
        'coverage', 'nose'
    ]
)
