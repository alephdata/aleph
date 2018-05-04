from setuptools import setup, find_packages

setup(
    name='alephprotos',
    version='0.0.2',
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    install_requires=['grpcio', 'grpcio-tools', 'twine'],
)
