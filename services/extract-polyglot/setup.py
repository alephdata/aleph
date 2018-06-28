from setuptools import setup, find_packages

setup(
    name='service',
    packages=find_packages(),
    install_requires=[
        'grpcio',
        'grpcio-tools',
        'alephclient==0.6.6'
    ],
)
