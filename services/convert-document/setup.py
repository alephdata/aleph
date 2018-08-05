from setuptools import setup, find_packages

setup(
    name='convert',
    packages=find_packages(exclude=[]),
    install_requires=[
        'aiohttp',
        'celestial',
        'pyicu==2.0.5',
        'pytest'
    ],
)
