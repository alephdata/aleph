from setuptools import setup, find_packages

setup(
    name="translate",
    version="0.0.1",
    author="Organized Crime and Corruption Reporting Project",
    packages=find_packages(exclude=["tests"]),
    package_dir={"translate": "translate"},
    include_package_data=True,
    install_requires=[
        # When you use this in production, pin the dependencies!
        "followthemoney",
        "followthemoney-store[postgresql]",
        "servicelayer[google,amazon]",
        # Example implementation:
        "google-cloud-translate",
    ],
    license="MIT",
    zip_safe=False,
    test_suite="tests",
    tests_require=[],
    entry_points={"console_scripts": ["translate = translate.cli:cli"],},
)
