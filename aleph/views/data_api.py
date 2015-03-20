from werkzeug.exceptions import NotFound
from flask import Blueprint, redirect, send_file
from apikit import jsonify


from aleph.core import archive, url_for
from aleph import authz
from aleph.views.cache import etag_cache_keygen

blueprint = Blueprint('data', __name__)


def get_package(collection, package_id):
    authz.require(authz.source_read(collection))
    collection = archive.get(collection)
    package = collection.get(package_id)
    if not package.exists():
        raise NotFound()
    return package


@blueprint.route('/api/1/data/<collection>/<package_id>')
def package(collection, package_id):
    package = get_package(collection, package_id)
    if package.source is None:
        raise NotFound()
    return redirect(url_for('data.resource', collection=collection,
                            package_id=package_id,
                            path=package.source.path))


@blueprint.route('/api/1/manifest/<collection>/<package_id>')
def manifest(collection, package_id):
    etag_cache_keygen(collection, package_id)
    package = get_package(collection, package_id)
    return jsonify(package.manifest)


@blueprint.route('/api/1/data/<collection>/<package_id>/<path:path>')
def resource(collection, package_id, path):
    package = get_package(collection, package_id)
    resource = package.get_resource(path)
    if not resource.exists():
        raise NotFound()
    url = resource.url
    if url is not None:
        return redirect(url)
    return send_file(resource.fh(), mimetype=resource.meta.get('mime_type'))
