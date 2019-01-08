from setuptools import setup, find_packages


setup(
    name='entityextractor',
    version='0.0.1',
    license='MIT',
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    include_package_data=True,
    install_requires=[],
    zip_safe=False
)
