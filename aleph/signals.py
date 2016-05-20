from blinker import signal

# This file houses plugin endpoints for aleph. These are called at various
# times during the lifecycle of the server and can be used to hook in
# extension functionality.

# Register additional API endpoints.
register_blueprints = signal('register_blueprints')

# Post-process a documents search query.
document_query_process = signal('document_query_process')
