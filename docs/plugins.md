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
    }
)
```

See the [main setup.py](https://github.com/alephdata/aleph/blob/master/setup.py)
for a real example.

The supported entry points include:

* ``aleph.init``, for simple functions to be executed upon system startup.
* ``aleph.analyzers``, which are run to extract structured metadata from
  documents after they have been imported.

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
