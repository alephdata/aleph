# coding: utf-8
import json
import time
import random
import logging
from datetime import datetime, date
import functools
from pkg_resources import iter_entry_points

from celery import Task
from celery.signals import task_prerun, task_postrun
from elasticsearch import Transport
from banal import ensure_list, is_mapping
from normality import stringify
from flask_babel.speaklater import LazyString
from opencensus.trace import execution_context
from opencensus.trace import tracer as tracer_module
from opencensus.trace.exporters import stackdriver_exporter
from opencensus.trace.samplers import probability
from opencensus.trace.exporters.transports.background_thread import BackgroundThreadTransport  # noqa

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


class SessionTask(Task):

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        from aleph.core import db
        db.session.remove()


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


@task_prerun.connect
def create_publish_span(task_id=None, task=None, *args, **kwargs):
    if settings.STACKDRIVER_TRACE_PROJECT_ID:
        exporter = stackdriver_exporter.StackdriverExporter(
            project_id=settings.STACKDRIVER_TRACE_PROJECT_ID,
            transport=BackgroundThreadTransport
        )
        sampler = probability.ProbabilitySampler(
            rate=settings.TRACE_SAMPLING_RATE
        )
        tracer = tracer_module.Tracer(exporter=exporter, sampler=sampler)
        span = tracer.start_span()
        span.name = '[celery]{0}'.format(task.name)
        execution_context.set_opencensus_tracer(tracer)
        span.add_attribute('args', str(kwargs['args']))
        span.add_attribute('kwargs', str(kwargs['kwargs']))
        execution_context.set_current_span(span)


@task_postrun.connect
def end_successful_task_span(task_id=None, task=None, *args, **kwargs):
    tracer = execution_context.get_opencensus_tracer()
    tracer.end_span()


class TracingTransport(Transport):
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

def result_key(obj):
    """Generate a tuple to describe a cache ID for a search result"""
    if is_mapping(obj):
        return (obj.get('id'), obj.get('updated_at'))
    return (getattr(obj, 'id', None), getattr(obj, 'updated_at', None))
