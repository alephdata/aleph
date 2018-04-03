from setuptools import setup, find_packages

setup(
    name='aleph',
    version='2.0.2',
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
    url='http://aleph.readthedocs.io',
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
            'polyglot = aleph.analyze.polyglot_entity:PolyglotEntityAnalyzer'
        ],
        'console_scripts': [
            'aleph = aleph.manage:main',
        ]
    },
    tests_require=['coverage', 'nose']
)
