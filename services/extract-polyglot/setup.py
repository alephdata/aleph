from setuptools import setup, find_packages

setup(
    name='service',
    packages=find_packages(),
    install_requires=['grpcio'],
)
