import magic
import logging
import balkhash
from pprint import pprint  # noqa
from tempfile import mkdtemp
from followthemoney import model
from banal import ensure_list
from normality import stringify
from pantomime import normalize_mimetype
from balkhash.utils import safe_fragment
from servicelayer.archive import init_archive
from servicelayer.archive.util import ensure_path
from servicelayer.extensions import get_extensions
from followthemoney.helpers import entity_filename

from ingestors.directory import DirectoryIngestor
from ingestors.exc import ProcessingException
from ingestors.util import filter_text, remove_directory
from ingestors import settings

log = logging.getLogger(__name__)


class Manager(object):
    """Handles the lifecycle of an ingestor. This can be subclassed to embed it
    into a larger processing framework."""

    #: Indicates that during the processing no errors or failures occured.
    STATUS_SUCCESS = u'success'
    #: Indicates occurance of errors during the processing.
    STATUS_FAILURE = u'failure'

    MAGIC = magic.Magic(mime=True)

    def __init__(self, stage, context):
        self.stage = stage
        self.context = context
        self.work_path = ensure_path(mkdtemp(prefix='ingestor-'))
        self.emitted = set()
        self._writer = None
        self._dataset = None

    @property
    def archive(self):
        if not hasattr(settings, '_archive'):
            settings._archive = init_archive()
        return settings._archive

    @property
    def dataset(self):
        if self._dataset is None:
            dataset = self.stage.job.dataset.name
            name = self.context.get('balkhash_name', dataset)
            self._dataset = balkhash.init(name)
        return self._dataset

    @property
    def writer(self):
        if self._writer is None:
            self._writer = self.dataset.bulk()
        return self._writer

    def make_entity(self, schema, parent=None):
        schema = model.get(schema)
        prefix = self.stage.job.dataset.name
        entity = model.make_entity(schema, key_prefix=prefix)
        self.make_child(parent, entity)
        return entity

    def make_child(self, parent, child):
        if parent is not None and child is not None:
            child.add('parent', parent.id)
            child.add('ancestors', parent.get('ancestors'))
            child.add('ancestors', parent.id)

    def emit_entity(self, entity, fragment=None):
        # pprint(entity.to_dict())
        self.writer.put(entity.to_dict(), fragment)
        self.emitted.add(entity.id)

    def emit_text_fragment(self, entity, texts, fragment):
        texts = [t for t in ensure_list(texts) if filter_text(t)]
        if len(texts):
            doc = self.make_entity(entity.schema)
            doc.id = entity.id
            doc.add('indexText', texts)
            self.emit_entity(doc, fragment=safe_fragment(fragment))

    def auction(self, file_path, entity):
        if not entity.has('mimeType'):
            if file_path.is_dir():
                entity.add('mimeType', DirectoryIngestor.MIME_TYPE)
                return DirectoryIngestor
            entity.add('mimeType', self.MAGIC.from_file(file_path.as_posix()))

        best_score, best_cls = 0, None
        for cls in get_extensions('ingestors'):
            score = cls.match(file_path, entity)
            if score > best_score:
                best_score = score
                best_cls = cls

        if best_cls is None:
            raise ProcessingException("Format not supported")
        return best_cls

    def queue_entity(self, entity):
        log.debug("Queue: %r", entity)
        self.stage.queue(entity.to_dict(), self.context)

    def store(self, file_path, mime_type=None):
        file_path = ensure_path(file_path)
        mime_type = normalize_mimetype(mime_type)
        if file_path is not None and file_path.is_file():
            return self.archive.archive_file(file_path, mime_type=mime_type)

    def ingest_entity(self, entity):
        for content_hash in entity.get('contentHash', quiet=True):
            file_name = entity_filename(entity)
            # log.info("Local archive name: %s", file_name)
            file_path = self.archive.load_file(content_hash,
                                               file_name=file_name,
                                               temp_path=self.work_path)
            if file_path is None or not file_path.exists():
                continue
            self.ingest(file_path, entity)
            return
        self.finalize(entity)

    def ingest(self, file_path, entity, **kwargs):
        """Main execution step of an ingestor."""
        file_path = ensure_path(file_path)
        if file_path.is_file() and not entity.has('fileSize'):
            entity.add('fileSize', file_path.stat().st_size)

        entity.set('processingStatus', self.STATUS_FAILURE)
        try:
            ingestor_class = self.auction(file_path, entity)
            log.info("Ingestor [%r]: %s", entity, ingestor_class.__name__)
            self.delegate(ingestor_class, file_path, entity)
            entity.set('processingStatus', self.STATUS_SUCCESS)
        except ProcessingException as pexc:
            entity.set('processingError', stringify(pexc))
            log.error("[%r] Failed to process: %s", entity, pexc)
        finally:
            self.finalize(entity)

    def finalize(self, entity):
        self.emit_entity(entity)
        self.writer.flush()

    def delegate(self, ingestor_class, file_path, entity):
        ingestor_class(self).ingest(file_path, entity)

    def close(self):
        self.writer.flush()
        self.dataset.close()
        remove_directory(self.work_path)
