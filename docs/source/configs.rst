Configuration Parameters
=======================

The primary config file is the `default_settings.py <https://github.com/CodeForAfrica/aleph/blob/master/aleph/default_settings.py>`_ which should be referenced by the `ALEPH_SETTINGS` environment variable

Be sure to export the following env variables:

- DATABASE_URL:   The postgres URI
- ALEPH_SETTINGS:  Absolute path to the settings file
- SECRET_KEY:  OAuth secret key
- TESSDATA_PREFIX:  Absolute path to the location of the tessaract training files: tessdata
- ARCHIVE_PATH:  Absolute path to the archive directory.
- RABBITMQ_BIGWIG_URL:  Rabbitmq broker URI
