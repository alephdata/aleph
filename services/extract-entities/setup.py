from setuptools import setup, find_packages

setup(
    name='entityextractor',
    version='0.0.1',
    author='Organized Crime and Corruption Reporting Project',
    author_email='pudo@occrp.org',
    url='https://occrp.org',
    license='MIT',
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    namespace_packages=[],
    include_package_data=True,
    package_data={},
    zip_safe=False,
    test_suite='nose.collector',
    tests_require=['coverage', 'pytest']
)
