import logging
from servicelayer.jobs import Job
from flask.sessions import SessionInterface, SecureCookieSession

log = logging.getLogger(__name__)


class Session(SecureCookieSession):
    
    def __init__(self, cache, session_id):
        self.id = session_id
        self.key = cache.key('session', session_id)
        previous = cache.get_complex(self.key)
        if previous is None:
            self.new = True
        log.info("Retrieving session [%s]: %r", self.id, previous or {})
        super(Session, self).__init__(initial=previous)

    @property
    def job_id(self):
        if 'job_id' not in self:
            self['job_id'] = Job.random_id()
        return self.get('job_id')


class SessionManager(SessionInterface):

    def __init__(self, cache):
        self.cache = cache
    
    def open_session(self, app, request):
        session_id = request.headers.get("X-Aleph-Session")
        if session_id is not None:
            return Session(self.cache, session_id)

    def save_session(self, app, session, response):
        if session.modified:
            # if session.id is None:
            data = dict(session.items())
            log.info("Storing session [%s]: %r", session.id, data)
            self.cache.set_complex(session.key, data)