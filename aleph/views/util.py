import types
import simplejson
from hashlib import sha1
from urllib import urlencode
from datetime import datetime, date
from inspect import isgenerator

from restpager import Pager as RESTPager
from sqlalchemy.orm import Query
from sqlalchemy.ext.associationproxy import _AssociationList
from werkzeug.exceptions import NotFound
from flask import Response, request

from aleph.core import url_for


def obj_or_404(obj):
    if obj is None:
        raise NotFound()
    return obj


def request_data():
    data = request.get_json(silent=True)
    if data is None:
        data = dict(request.form.items())
    return data


class Pager(RESTPager):

    def url(self, query):
        url = url_for(request.endpoint, **dict(self.kwargs))
        if len(query):
            url = url + '?' + urlencode(query)
        return url


class AppEncoder(simplejson.JSONEncoder):
    """ This encoder will serialize all entities that have a to_dict
    method by calling that method and serializing the result. """

    def default(self, obj):
        if hasattr(obj, 'to_dict'):
            return obj.to_dict()
        elif isinstance(obj, datetime):
            return obj.isoformat() + 'Z'
        elif isinstance(obj, date):
            return obj.isoformat()
        elif isinstance(obj, Query) or isinstance(obj, _AssociationList):
            return [r for r in obj]
        elif isgenerator(obj):
            return [o for o in obj]
        elif isinstance(obj, set):
            return [o for o in obj]
        return super(AppEncoder, self).default(obj)


def jsonify(obj, status=200, headers=None, index=False, encoder=AppEncoder):
    """ Custom JSONificaton to support obj.to_dict protocol. """
    data = encoder().encode(obj)
    if 'callback' in request.args:
        cb = request.args.get('callback')
        data = '%s && %s(%s)' % (cb, cb, data)
    return Response(data, headers=headers,
                    status=status,
                    mimetype='application/json')


def cache_hash(*a, **kw):
    """ Try to hash an arbitrary object for caching. """

    def cache_str(o):
        if isinstance(o, (types.FunctionType, types.BuiltinFunctionType,
                          types.MethodType, types.BuiltinMethodType,
                          types.UnboundMethodType)):
            return getattr(o, 'func_name', 'func')
        if isinstance(o, dict):
            o = [k + ':' + cache_str(v) for k, v in o.items()]
        if isinstance(o, (list, tuple, set)):
            o = sorted(map(cache_str, o))
            o = '|'.join(o)
        if isinstance(o, basestring):
            return o
        if hasattr(o, 'updated_at'):
            return cache_str((repr(o), o.updated_at))
        return repr(o)

    hash = cache_str((a, kw)).encode('utf-8')
    return sha1(hash).hexdigest()
