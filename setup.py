# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

from setuptools import setup, find_packages

setup(
    name="aleph",
    version="3.12.4",
    description="Document sifting web frontend",
    classifiers=[
        "Intended Audience :: Developers",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
    ],
    author="OCCRP Data Team",
    author_email="data@occrp.org",
    url="https://docs.alephdata.org",
    license="MIT",
    packages=find_packages(exclude=["ez_setup", "examples", "test"]),
    namespace_packages=[],
    include_package_data=True,
    zip_safe=False,
    install_requires=[],
    test_suite="nose.collector",
    entry_points={
        "console_scripts": ["aleph = aleph.manage:cli"],
    },
    tests_require=["coverage", "nose"],
)
