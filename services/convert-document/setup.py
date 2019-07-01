from setuptools import setup, find_packages

setup(
    name='convert',
    version='3.2.1',
    packages=find_packages(exclude=[]),
    install_requires=[
        'aiohttp',
        'pantomime',
    ],
)
