import logging
from servicelayer.jobs import Job
from flask.sessions import SessionInterface, SecureCookieSession

log = logging.getLogger(__name__)


class Session(SecureCookieSession):
    """A session linked to the aleph redis cache."""

    def __init__(self, cache, session_id, data=None):
        self.id = session_id
        self.key = cache.key("session", session_id)
        if self.id is not None:
            data = cache.get_complex(self.key)
        super(Session, self).__init__(initial=data)

    @property
    def job_id(self):
        """Make all the processing tasks submitted within a user session
        part of the same job."""
        self.setdefault("job_id", Job.random_id())
        return self.get("job_id")


class SessionManager(SessionInterface):
    def __init__(self, cache):
        self.cache = cache

    def open_session(self, app, request):
        session_id = request.headers.get("X-Aleph-Session")
        return Session(self.cache, session_id)

    def save_session(self, app, session, response):
        if session.id is None or not session.modified:
            return
        data = dict(session.items())
        log.info("Storing session [%s]: %r", session.id, data)
        self.cache.set_complex(session.key, data, expires=self.cache.EXPIRE)