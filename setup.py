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
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    namespace_packages=[],
    include_package_data=True,
    zip_safe=False,
    install_requires=[],
    entry_points={
        'loadkit.operators': [
            'aleph_indexer = aleph.processing.indexer:IndexerOperator',
            'aleph_tagger = aleph.processing.tagger:TaggerOperator'
        ],
        'aleph.crawlers': [
            'doccloud = aleph.crawlers.doccloud:DocumentCloudCrawler',
            'sourceafrica = aleph.crawlers.doccloud:SourceAfricaCrawler',
        ],
        'console_scripts': [
            'aleph = aleph.manage:main',
        ]
    },
    tests_require=[]
)
