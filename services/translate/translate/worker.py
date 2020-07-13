import os
import logging
from ftmstore import Dataset
from servicelayer.worker import Worker
from followthemoney import model
from followthemoney.types import registry

log = logging.getLogger(__name__)
OP_TRANSLATE = 'translate'

# Not part of the example, just needed for google cloud translation:
from google.cloud import translate  # noqa
PROJECT_ID = os.environ.get('GOOGLE_PROJECT_ID')
TARGET_LANGUAGE = os.environ.get('TRANSLATE_LANGUAGE', 'en')


class ServiceWorker(Worker):
    """A long running task runner that uses Redis as a task queue"""

    def dispatch_next(self, task, entity_ids):
        if not len(entity_ids):
            return
        pipeline = task.context.get('pipeline')
        if pipeline is None or not len(pipeline):
            return
        # Find what the next index stage is:
        next_stage = pipeline.pop(0)
        stage = task.job.get_stage(next_stage)
        context = task.context
        context['pipeline'] = pipeline
        log.info('Sending %s entities to: %s', len(entity_ids), next_stage)
        stage.queue({'entity_ids': entity_ids}, context)

    def translate(self, writer, entity):
        if not entity.schema.is_a('Analyzable'):
            return

        # This isn't part of the example, just a generic call to Google
        # cloud translation. This implementation doesn't do caching, does
        # not check if the document is already in the target language,
        # and does not translate other string values like names.
        #
        # This code isn't the point. Don't run it in production, and if you
        # do anyway, don't complain about the fact it's bad. PRs welcome.
        if not hasattr(self, 'client'):
            self.client = translate.TranslationServiceClient()
            self.parent = self.client.location_path(PROJECT_ID, "global")

        # Get all the text parts of the entity:
        contents = entity.get_type_values(registry.text)
        if not len(contents):
            return
        log.info("Translating %r", entity)
        response = self.client.translate_text(
            parent=self.parent,
            contents=contents,
            mime_type="text/plain",
            target_language_code=TARGET_LANGUAGE,
        )
        # Make a copy of the entity with no properties set:
        translated = model.make_entity(entity.schema)
        translated.id = entity.id
        for translation in response.translations:
            # log.debug("Received: %s", translation.translated_text)
            translated.add('indexText', translation.translated_text)
            # Store the generated translation fragment for the entity
            # in the ftm-store database. All the properties of the
            # entity will be combined upon indexing.
            writer.put(translated)

    def handle(self, task):
        name = task.context.get('ftmstore', task.job.dataset.name)
        entity_ids = task.payload.get('entity_ids')
        dataset = Dataset(name, OP_TRANSLATE)
        try:
            writer = dataset.bulk()
            for entity in dataset.partials(entity_id=entity_ids):
                self.translate(writer, entity)
            writer.flush()
            self.dispatch_next(task, entity_ids)
        finally:
            dataset.close()
