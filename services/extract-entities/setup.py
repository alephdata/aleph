from setuptools import setup, find_packages


setup(
    name='entityextractor',
    version='0.0.1',
    author='Organized Crime and Corruption Reporting Project',
    author_email='data@occrp.org',
    url='https://occrp.org',
    license='MIT',
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    namespace_packages=[],
    include_package_data=True,
    package_data={},
    install_requires=[
        'PyICU==2.0.6',
        # 'pycld2==0.31',
        # 'polyglot==16.7.4',
        # 'Morfessor==2.0.4',
        # 'spacy', - explicit in Dockerfile
        'grpcio==1.11.0',
        'alephclient==0.7.2'
    ],
    zip_safe=False
)
