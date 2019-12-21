from aleph.model import Linkage
from aleph.model.common import make_textid


class Profile(object):

    def __init__(self, profile_id, authz=None):
        self.profile_id = profile_id
        self.authz = authz
        self._linkages = None

    @property
    def linkages(self):
        if self._linkages is None:
            q = Linkage.by_profile(self.profile_id)
            self._linkages = q.all()
        return self._linkages

    @property
    def entity_ids(self):
        for linkage in self.linkages:
            if linkage.decision is False:
                continue
            yield linkage.entity_id

    @classmethod
    def create(cls, authz=None):
        return cls(make_textid(), authz=authz)

    def __repr__(self):
        return '<Profile(%s)>' % self.profile_id


def compute_profile(profile_id):
    """Given a partial profile, continue to find matching
    identical entities and related documents."""
    # Compute profile object from linkages
    # Run match query on combined object
    # Score results
