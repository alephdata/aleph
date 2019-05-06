from blinker import signal

# This file houses plugin endpoints for aleph. These are called at various
# times during the lifecycle of the server and can be used to hook in
# extension functionality.

# Register additional API endpoints.
register_blueprints = signal('register_blueprints')

# Handle OAuth return values.
handle_oauth_session = signal('handle_oauth_session')

# Handle request logging.
handle_request_log = signal('handle_request_log')
