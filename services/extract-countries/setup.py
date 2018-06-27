from setuptools import setup, find_packages

setup(
    name='service',
    packages=find_packages(),
    install_requires=[
        'string',
        'ahocorasick',
        'zipfile',
        'csv',
        'io',
        'collections',
        'grpcio-tools',
        'alephclient==0.6.0'
    ],
)
