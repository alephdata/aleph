"""
    flask_testing.utils
    ~~~~~~~~~~~~~~~~~~~
    Flask unittest integration.
    :copyright: (c) 2010 by Dan Jacob.
    :license: BSD, see LICENSE for more details.
"""
import gc
import unittest

from werkzeug.utils import cached_property

# Use Flask's preferred JSON module so that our runtime behavior matches.
from flask import json_available, templating, template_rendered

try:
    from flask import message_flashed

    _is_message_flashed = True
except ImportError:
    message_flashed = None
    _is_message_flashed = False

if json_available:
    from flask import json

_is_signals = True


class ContextVariableDoesNotExist(Exception):
    pass


class JsonResponseMixin(object):
    """
    Mixin with testing helper methods
    """

    @cached_property
    def json(self):
        if not json_available:  # pragma: no cover
            raise NotImplementedError
        return json.loads(self.data)


def _make_test_response(response_class):
    class TestResponse(response_class, JsonResponseMixin):
        pass

    return TestResponse


def _empty_render(template, context, app):
    """
    Used to monkey patch the render_template flask method when
    the render_templates property is set to False in the TestCase
    """
    if _is_signals:
        template_rendered.send(app, template=template, context=context)

    return ""


def _check_for_message_flashed_support():
    if not _is_signals or not _is_message_flashed:
        raise RuntimeError(
            "Your version of Flask doesn't support message_flashed. "
            "This requires Flask 0.10+ with the blinker module installed."
        )


def _check_for_signals_support():
    if not _is_signals:
        raise RuntimeError(
            "Your version of Flask doesn't support signals. "
            "This requires Flask 0.6+ with the blinker module installed."
        )


class FlaskTestCase(unittest.TestCase):
    render_templates = True
    run_gc_after_test = False

    def create_app(self):
        """
        Create your Flask app here, with any
        configuration you need.
        """
        raise NotImplementedError

    def __call__(self, result=None):
        """
        Does the required setup, doing it here
        means you don't have to call super.setUp
        in subclasses.
        """
        try:
            self._pre_setup()
            super(FlaskTestCase, self).__call__(result)
        finally:
            self._post_teardown()

    def debug(self):
        try:
            self._pre_setup()
            super(FlaskTestCase, self).debug()
        finally:
            self._post_teardown()

    def _pre_setup(self):
        self.app = self.create_app()

        self._orig_response_class = self.app.response_class
        self.app.response_class = _make_test_response(self.app.response_class)

        self.client = self.app.test_client()

        self._ctx = self.app.test_request_context()
        self._ctx.push()

        if not self.render_templates:
            # Monkey patch the original template render with a empty render
            self._original_template_render = templating._render
            templating._render = _empty_render

        self.templates = []
        self.flashed_messages = []

        if _is_signals:
            template_rendered.connect(self._add_template)

            if _is_message_flashed:
                message_flashed.connect(self._add_flash_message)

    def _add_flash_message(self, app, message, category):
        self.flashed_messages.append((message, category))

    def _add_template(self, app, template, context):
        if len(self.templates) > 0:
            self.templates = []
        self.templates.append((template, context))

    def _post_teardown(self):
        if getattr(self, '_ctx', None) is not None:
            self._ctx.pop()
            del self._ctx

        if getattr(self, 'app', None) is not None:
            if getattr(self, '_orig_response_class', None) is not None:
                self.app.response_class = self._orig_response_class
            del self.app

        if hasattr(self, 'client'):
            del self.client

        if hasattr(self, 'templates'):
            del self.templates

        if hasattr(self, 'flashed_messages'):
            del self.flashed_messages

        if _is_signals:
            template_rendered.disconnect(self._add_template)

            if _is_message_flashed:
                message_flashed.disconnect(self._add_flash_message)

        if hasattr(self, '_original_template_render'):
            templating._render = self._original_template_render

        if self.run_gc_after_test:
            gc.collect()

    def get_context_variable(self, name):
        """
        Returns a variable from the context passed to the
        template. Only works if your version of Flask
        has signals support (0.6+) and blinker is installed.
        Raises a ContextVariableDoesNotExist exception if does
        not exist in context.
        :versionadded: 0.2
        :param name: name of variable
        """
        _check_for_signals_support()

        for template, context in self.templates:
            if name in context:
                return context[name]
        raise ContextVariableDoesNotExist
