from setuptools import setup, find_packages

setup(
    name="aleph",
    version="3.8.6",
    description="Document sifting web frontend",
    long_description="",
    classifiers=[
        "Intended Audience :: Developers",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
    ],
    keywords="",
    author="OCCRP Data Team",
    author_email="data@occrp.org",
    url="https://github.com/alephdata/aleph/wiki",
    license="MIT",
    packages=find_packages(exclude=["ez_setup", "examples", "test"]),
    namespace_packages=[],
    include_package_data=True,
    zip_safe=False,
    install_requires=[],
    test_suite="nose.collector",
    entry_points={
        "aleph.init": [],
        "aleph.oauth": [
            "azure = aleph.oauth:handle_azure_oauth",
            "google = aleph.oauth:handle_google_oauth",
            "keycloak = aleph.oauth:handle_keycloak_oauth",
            "cognito = aleph.oauth:handle_cognito_oauth",
        ],
        "console_scripts": ["aleph = aleph.manage:cli",],
    },
    tests_require=["coverage", "nose"],
)
