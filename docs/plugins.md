# Extending Aleph (Plugins)

Aleph's functionality can be extended via a system of plug-ins which are small
Python modules.

Plugins can be located both within the main aleph code base, or in an external
Python module. They are registered and activated using a distutils entrypoint:

An example:

```python
from setuptools import setup, find_packages

setup(
    name='aleph_occrp',
    version='0.2',
    [...]
    entry_points={
        'aleph.init': [
            'occrpext = aleph_occrp:register'
        ]
        'aleph.crawlers': [
            'my_crawler = aleph_occrp.my_crawler:CrawlerClass'
        ]
    }
)
```

See the
[main setup.py](https://github.com/alephdata/aleph/blob/master/setup.py) for a real
example.

The supported entry points include:

* ``aleph.init``, for simple functions to be executed upon system startup.
* ``aleph.crawlers``, for [Crawlers](#crawlers)
* ``aleph.ingestors`` to support additional file type imports.
* ``aleph.analyzers``, which are run to extract structured metadata from documents after they have been imported.

## Signals

The documentation for this part is missing at the moment.

## Custom SCSS

An additional environment variable, ``CUSTOM_SCSS_PATH``, can be used to
specify the path to a SCSS file which will be imported into the application
upon start. The given path must be  absolute, or relative to the run-time
location of Aleph. An example would be:

```bash
docker-compose run -e CUSTOM_SCSS_PATH=my.scss app make web
```

## Creating new crawlers

Custom crawlers are useful to directly import large amounts of data into the
system. This can make sense for custom scrapers or crawlers where the
indirection of using [Metafolders](glossary.md#metafolders) is not desirable.

Crawlers are Python classes and exposed via the `entry_point` of a Python
package. To develop a custom crawler, start by setting up a separate Python
package with it's own `setup.py` ([learn
more](https://python-packaging.readthedocs.io/en/latest/)).

A basic crawler will extend the relevant `Crawler` class from Aleph and
implement its `crawl()` method, below you can find an example:

```python
from aleph.crawlers import DocumentCrawler

class ExampleCrawler(DocumentCrawler):
    COLLECTION_ID = 'example'

    def crawl(self):
	    for i in range(0, 1000):
		     meta = self.metadata()
	         meta.foreign_id = 'example-doc:%s' % i
             meta.title = 'Document Number %s' % i
             meta.mime_type = 'application/pdf'
             url = 'https://example.com/documents/%s.pdf' % i
             self.emit_url(meta, url)
```

Besides `emit_url`, results can also be forwarded using the `emit_file(meta,
file_path)` method. If a crawler creates collections, it can use
`emit_collection(collection, entity_search_terms)` which will start a partial
re-index of documents.

To support indexing only new documents on incremental/update crawls, you can
use `self.skip_incremental`:

```python
    if self.skip_incremental(foreign_id):
        logger.info("Skipping known %s", foreign_id)
        return
```

In order to make sure that Aleph can find the new crawler, it must be added
to the `setup.py` of your package, see above how plugins work:

```python
setup(
    name='mypackage',
    ...
    entry_points={
        'aleph.crawlers': [
            'example = mypackage.example:ExampleCrawler'
        ]
    }
)
```

Finally, you must ensure that the plugin package is installed in your `aleph`
docker container (or using your deployment method), for example by extending
the `Dockerfile` to include the plugin package. Once this is ready, run the
crawler from inside the container:

```bash
docker-compose run app python aleph/manage.py crawl example
```

## Custom OAuth

It's possible to hook into the login code to support other providers, but you
need to handle the creation of user and group roles through some specific code.
This is the code used at OCCRP for OAuth via the Investigative Dashboard (it
requires the use of plugins to be activated:

```python
from aleph import signals

@signals.handle_oauth_session.connect
def handle_occrp_oauth(sender, provider=None, session=None):
    from aleph.model import Role
    if 'investigativedashboard.org' not in provider.base_url:
        return
    me = provider.get('api/2/accounts/profile/')
    user_id = 'idashboard:user:%s' % me.data.get('id')
    role = Role.load_or_create(user_id, Role.USER,
                               me.data.get('display_name'),
                               email=me.data.get('email'),
                               is_admin=me.data.get('is_admin'))
    role.clear_roles()
    for group in me.data.get('groups', []):
        group_id = 'idashboard:%s' % group.get('id')
        group_role = Role.load_or_create(group_id, Role.GROUP,
                                         group.get('name'))
        role.add_role(group_role)
    session['user'] = role.id
```
