import yaml
from docstash import Stash


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
        self._collection = None

    @property
    def collection(self):
        if self._collection is None:
            config = self.config.get('config', {})
            stash = Stash(path=config.get('stash'))
            name = config.get('collection', 'default')
            self._collection = stash.get(name)
        return self._collection

    @property
    def stages(self):
        if self._stages is None:
            self._stages = []
            items = self.config.get('stages', {})
            for name, stage_config in items.items():
                stage = Stage(self, name, stage_config)
                self._stages.append(stage)
        return self._stages

    @property
    def ingests(self):
        if self._ingests is None:
            self._ingests = []
            items = self.config.get('stages', {})
            for name, ingest_config in items.items():
                ingest = Ingest(self, name, ingest_config)
                self._ingests.append(ingest)
        return self._ingests

    def load(self, config_file):
        with open(config_file, 'rb') as fh:
            config = yaml.load(fh.read())
            self.config.update(config)

    def __repr__(self):
        return '<Pipeline(%s)>' % self.name
