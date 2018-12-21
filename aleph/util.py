# coding: utf-8
import json
import time
import random
import logging
from datetime import datetime, date
import functools
from pkg_resources import iter_entry_points
import sys

from celery import Task
from celery.signals import task_prerun, task_postrun, setup_logging
from elasticsearch import Transport
from banal import ensure_list, is_mapping
from normality import stringify
from flask_babel.speaklater import LazyString
from opencensus.trace import execution_context
from opencensus.trace import tracer as tracer_module
from opencensus.trace.exporters import stackdriver_exporter
from opencensus.trace.samplers import probability
from opencensus.trace.exporters.transports.background_thread import BackgroundThreadTransport  # noqa
from opencensus.trace.tracers.noop_tracer import NoopTracer
from pythonjsonlogger import jsonlogger

from aleph import settings

log = logging.getLogger(__name__)
EXTENSIONS = {}


def get_extensions(section):
    if section not in EXTENSIONS:
        EXTENSIONS[section] = {}
    if not EXTENSIONS[section]:
        for ep in iter_entry_points(section):
            EXTENSIONS[section][ep.name] = ep.load()
    return list(EXTENSIONS[section].values())


def dict_list(data, *keys):
    """Get an entry as a list from a dict. Provide a fallback key."""
    for key in keys:
        if key in data:
            return ensure_list(data[key])
    return []


def backoff(failures=0):
    failures = min(7, failures)
    sleep = 2 ** (failures + random.random())
    log.debug("Back-off: %.2fs", sleep)
    time.sleep(sleep)


def make_key(*criteria):
    """Make a string key out of many criteria."""
    criteria = [c or '' for c in criteria]
    criteria = [str(c) for c in criteria]
    return ':'.join(criteria)


def html_link(text, link):
    text = text or '[untitled]'
    if link is None:
        return "<span class='reference'>%s</span>" % text
    return "<a class='reference' href='%s'>%s</a>" % (link, text)


def anonymize_email(name, email):
    """Generate a simple label with both the name and email of a user."""
    name = stringify(name)
    email = stringify(email)
    if email is None:
        return name
    if '@' in email:
        mailbox, domain = email.rsplit('@', 1)
        if len(mailbox):
            repl = '*' * (len(mailbox) - 1)
            mailbox = mailbox[0] + repl
        email = '%s@%s' % (mailbox, domain)
    if name is None:
        return email
    return '%s <%s>' % (name, email)


def filter_texts(texts):
    """Remove text strings not worth indexing for full-text search."""
    for text in texts:
        if not isinstance(text, str):
            continue
        if not len(text.strip()):
            continue
        try:
            # try to exclude numeric data from
            # spreadsheets
            float(text)
            continue
        except Exception:
            pass
        yield text


def result_key(obj):
    """Generate a tuple to describe a cache ID for a search result"""
    if is_mapping(obj):
        return (obj.get('id'), obj.get('updated_at'))
    return (getattr(obj, 'id', None), getattr(obj, 'updated_at', None))


class JSONEncoder(json.JSONEncoder):
    """ This encoder will serialize all entities that have a to_dict
    method by calling that method and serializing the result. """

    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, bytes):
            return obj.decode('utf-8')
        if isinstance(obj, LazyString):
            return str(obj)
        if isinstance(obj, set):
            return [o for o in obj]
        if hasattr(obj, 'to_dict'):
            return obj.to_dict()
        return json.JSONEncoder.default(self, obj)


# Tracing Utilities

def trace_function(span_name):
    def decorator_trace(func):
        @functools.wraps(func)
        def wrapper_trace(*args, **kwargs):
            tracer = execution_context.get_opencensus_tracer()
            with tracer.span(name=span_name):
                value = func(*args, **kwargs)
                return value
        return wrapper_trace
    return decorator_trace


class TracingTransport(Transport):
    """Trace all network calls to ElasticSearch"""
    def __init__(self, *args, **kwargs):
        super(TracingTransport, self).__init__(*args, **kwargs)

    def perform_request(
        self, method, url, headers=None, params=None, body=None
    ):
        span_name = 'es.{}'.format(url)
        tracer = execution_context.get_opencensus_tracer()
        with tracer.span(name=span_name) as span:
            span.add_attribute('elasticsearch.url', url)
            span.add_attribute('elasticsearch.method', method)
            if body:
                span.add_attribute('elasticsearch.statement', str(body))
            if params:
                span.add_attribute('elasticsearch.params', str(params))
            if headers:
                span.add_attribute('elasticsearch.headers', str(headers))
            return super(TracingTransport, self).perform_request(
                                method, url, headers, params, body
                        )


# Logging Utilities

class MaxLevelLogFilter(object):
    def __init__(self, highest_log_level):
        self._highest_log_level = highest_log_level

    def filter(self, log_record):
        return log_record.levelno <= self._highest_log_level


class StackdriverJsonFormatter(jsonlogger.JsonFormatter, object):
    """Format logs in a way that Stackdriver likes"""
    def __init__(self, fmt="%(levelname) %(message)", style='%', *args, **kwargs):  # noqa
        jsonlogger.JsonFormatter.__init__(self, fmt=fmt, *args, **kwargs)

    def process_log_record(self, log_record):
        # Set some parameters from
        # https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry
        # and https://cloud.google.com/logging/docs/agent/configuration
        log_record['severity'] = log_record['levelname']
        del log_record['levelname']
        tracer = execution_context.get_opencensus_tracer()
        trace_id = tracer.span_context.trace_id
        log_record['logging.googleapis.com/trace'] = "projects/{0}/traces/{1}".format(  # noqa
            settings.STACKDRIVER_TRACE_PROJECT_ID,
            trace_id
        )
        if not isinstance(tracer, NoopTracer):
            current_span = execution_context.get_current_span()
            span_id = current_span.span_id if current_span else None
        else:
            span_id = None
        log_record['logging.googleapis.com/spanId'] = span_id
        return super(
            StackdriverJsonFormatter, self
        ).process_log_record(log_record)


def setup_stackdriver_logging():
    formatter = StackdriverJsonFormatter()
    # A handler for low level logs that should be sent to STDOUT
    info_handler = logging.StreamHandler(sys.stdout)
    info_handler.setLevel(logging.DEBUG)
    info_handler.addFilter(MaxLevelLogFilter(logging.WARNING))
    info_handler.setFormatter(formatter)

    # A handler for high level logs that should be sent to STDERR
    error_handler = logging.StreamHandler(sys.stderr)
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    # root logger default level is WARNING, so we'll override to be DEBUG
    root_logger.setLevel(logging.DEBUG)
    # Clear out existing handlers
    root_logger.handlers.clear()
    root_logger.addHandler(info_handler)
    root_logger.addHandler(error_handler)


# Celery Utilities

class SessionTask(Task):

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        from aleph.core import db
        db.session.remove()


@task_prerun.connect
def prerun_task_span(task_id=None, task=None, *args, **kwargs):
    if settings.STACKDRIVER_TRACE_PROJECT_ID:
        exporter = stackdriver_exporter.StackdriverExporter(
            project_id=settings.STACKDRIVER_TRACE_PROJECT_ID,
            transport=BackgroundThreadTransport
        )
        sampler = probability.ProbabilitySampler(
            rate=settings.CELERY_TRACE_SAMPLING_RATE
        )
        tracer = tracer_module.Tracer(exporter=exporter, sampler=sampler)
        span = tracer.start_span()
        span.name = '[celery]{0}'.format(task.name)
        execution_context.set_opencensus_tracer(tracer)
        span.add_attribute('args', str(kwargs['args']))
        span.add_attribute('kwargs', str(kwargs['kwargs']))
        execution_context.set_current_span(span)


@task_postrun.connect
def end_task_span(task_id=None, task=None, *args, **kwargs):
    tracer = execution_context.get_opencensus_tracer()
    tracer.end_span()


@setup_logging.connect
def config_loggers(*args, **kwags):
    if settings.STACKDRIVER_TRACE_PROJECT_ID:
        setup_stackdriver_logging()
