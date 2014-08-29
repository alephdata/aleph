import os
from setuptools import setup, find_packages

REQUIREMENTS = os.path.join(os.path.dirname(__file__), 'requirements.txt')
REQUIREMENTS = open(REQUIREMENTS, 'r').read().splitlines()

VERSION = os.path.join(os.path.dirname(__file__), 'VERSION')
VERSION = open(VERSION, 'r').read().strip()

setup(
    name='dit',
    version=VERSION,
    description="Bits of code for document mining.",
    long_description="",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
    ],
    keywords='',
    author='Friedrich Lindenberg',
    author_email='friedrich@pudo.org',
    url='http://pudo.org',
    license='MIT',
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    namespace_packages=[],
    include_package_data=True,
    zip_safe=False,
    install_requires=REQUIREMENTS,
    entry_points={},
    tests_require=[]
)
