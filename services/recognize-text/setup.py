from setuptools import setup, find_packages


setup(
    name='textrecognizer',
    version='0.0.1',
    author='Organized Crime and Corruption Reporting Project',
    author_email='pudo@occrp.org',
    url='https://occrp.org',
    license='MIT',
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    namespace_packages=[],
    include_package_data=True,
    package_data={},
    install_requires=[
        'pyicu',
        'banal',
        'pillow',
        'grpcio==1.11.0',
        'pytest',
        'normality',
        'tesserocr',
        'languagecodes>=1.0.4',
        'alephclient==0.7.1'
    ],
    zip_safe=False
)
