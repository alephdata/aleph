

class Ingestor(object):

    def match(self, meta):
        return False

    def ingest_file(self, file_path, meta):
        raise NotImplemented()

    def create_document(self, meta):
        pass

    @classmethod
    def dispatch(cls, meta):
        print "FUUUUUU", meta.to_dict()
