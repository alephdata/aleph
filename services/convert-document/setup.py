from setuptools import setup, find_packages

setup(
    name='convert',
    packages=find_packages(exclude=[]),
    install_requires=[
        'aiohttp',
        'pantomime',
        'pyicu',
        'pytest'
    ],
)
