import yaml


class Ingest(object):

    def __init__(self, pipeline, name, config):
        self.pipeline = pipeline
        self.name = name
        self.config = config

    def run(self):
        pass

    def __repr__(self):
        return '<Ingest(%s)>' % self.name


class Stage(object):

    def __init__(self, pipeline, name, config):
        self.pipeline = pipeline
        self.name = name
        self.config = config

    def run(self, document):
        pass

    def __repr__(self):
        return '<Stage(%s)>' % self.name


class Pipeline(object):

    def __init__(self, config_file=None):
        self.config = dict()
        self.name = config_file
        if config_file is not None:
            self.load(config_file)
        self._stages = None
        self._ingests = None

    def load(self, config_file):
        with open(config_file, 'rb') as fh:
            config = yaml.load(fh.read())
            self.config.update(config)

    def __repr__(self):
        return '<Pipeline(%s)>' % self.name
