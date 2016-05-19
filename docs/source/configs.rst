Configuration Parameters
=======================

The primary config file is the `default_settings.py <https://github.com/CodeForAfrica/aleph/blob/master/aleph/default_settings.py>`_ which should be referenced by the `ALEPH_SETTINGS` environment variable

Be sure to export the following env variables:

- DATABASE_URL:   The postgres URI
- ALEPH_SETTINGS:  Absolute path to the settings file
- OAUTH_SECRET=wTEEOYW5b66EumjZ_XHNh4Yv
- OAUTH_KEY=914424606018-68qjso1v76sath3t3pe639oo42qopddg.apps.googleusercontent.com
- TESSDATA_PREFIX:  Absolute path to the location of the tessaract training files: tessdata
- ARCHIVE_PATH:  Absolute path to the archive directory.
- RABBITMQ_BIGWIG_URL:  Rabbitmq broker URI
- BONSAI_URL=http://localhost:9200
