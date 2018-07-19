from setuptools import setup, find_packages

setup(
    name='service',
    packages=find_packages(),
    install_requires=[
        'pyicu',
        'normality',
        # 'grpcio-tools',
        'tesserocr',
        'languagecodes',
        'alephclient==0.6.7'
    ],
)
