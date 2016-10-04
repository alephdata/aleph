from flask_oauthlib.client import OAuth
from flask import session

oauth = OAuth()


def get_oauth_token():
    if 'oauth' in session:
        sig = session.get('oauth')
        return (sig.get('access_token'), '')


def setup_providers(app):
    providers = app.config.get('OAUTH', [])
    if isinstance(providers, dict):
        # support for legacy single provider
        providers = [providers]

    for provider in providers:
        name = provider.pop('name')
        # legacy provider
        if name == 'provider':
            name = 'google'
        label = provider.pop('label', name.capitalize())

        provider = oauth.remote_app(name, **provider)
        provider.label = label
        provider.tokengetter(get_oauth_token)


def configure_oauth(app):
    setup_providers(app)
    oauth.init_app(app)
    return oauth
