from setuptools import setup, find_packages

setup(
    name='aleph',
    version='2.1.5',
    description="Document sifting web frontend",
    long_description="",
    classifiers=[
        "Intended Audience :: Developers",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
    ],
    keywords='',
    author='OCCRP Data Team',
    author_email='data@occrp.org',
    url='https://github.com/alephdata/aleph/wiki',
    license='MIT',
    packages=find_packages(exclude=['ez_setup', 'examples', 'test']),
    namespace_packages=[],
    include_package_data=True,
    zip_safe=False,
    install_requires=[],
    test_suite='nose.collector',
    entry_points={
        'aleph.init': [],
        'aleph.analyzers': [
            'lang = aleph.analyze.language:LanguageAnalyzer',
            'emails = aleph.analyze.regex:EMailAnalyzer',
            'phones = aleph.analyze.regex:PhoneNumberAnalyzer',
            'corasick = aleph.analyze.corasick_entity:AhoCorasickEntityAnalyzer',  # noqa
            'ner = aleph.analyze.extract_entity:EntityExtractor',
            'country = aleph.analyze.extract_country:CountryExtractor',
            'ip = aleph.analyze.regex:IPAnalyzer',
            'iban = aleph.analyze.regex:IBANAnalyzer',
        ],
        'console_scripts': [
            'aleph = aleph.manage:main',
        ]
    },
    tests_require=['coverage', 'nose']
)
