from aleph.model.validation import resolver


class EntitySchema(object):
    """Update entities from JSON schema specified data."""

    _schema = None

    @property
    def schema(self):
        _, schema = resolver.resolve(self._schema)
        return schema
