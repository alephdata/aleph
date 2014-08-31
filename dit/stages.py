import logging

from stevedore.extension import ExtensionManager

NAMESPACE = 'dit.stages'

log = logging.getLogger(__name__)


def init_stages(app):
    manager = ExtensionManager(namespace=NAMESPACE,
                               propagate_map_exceptions=True,
                               invoke_on_load=False)
    log.info('Available stages: %s', ', '.join(manager.names()))
    stages = {}
    for ext in manager.extensions:
        stages[ext.name] = ext
    return stages

