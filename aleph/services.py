import grpc
from threading import local

from aleph import settings


class ServiceClientMixin(object):
    """Helper mixing to manage the connectivity with a gRPC endpoint."""
    SERVICE = None
    Error = grpc.RpcError
    Status = grpc.StatusCode
    TEMPORARY_ERRORS = (grpc.StatusCode.UNAVAILABLE,
                        grpc.StatusCode.RESOURCE_EXHAUSTED)

    @property
    def channel(self):
        """Lazily connect to the RPC service."""
        if not self.has_channel():
            return
        if not hasattr(self, '_local'):
            self._local = local()
        if not hasattr(self._local, 'channel') or self._local.channel is None:
            options = (
                # ('grpc.keepalive_time_ms', settings.GRPC_CONN_AGE),
                ('grpc.keepalive_timeout_ms', settings.GRPC_CONN_AGE),
                ('grpc.max_connection_age_ms', settings.GRPC_CONN_AGE),
                ('grpc.max_connection_idle_ms', settings.GRPC_CONN_AGE),
                ('grpc.lb_policy_name', settings.GRPC_LB_POLICY)
            )
            self._local.channel = grpc.insecure_channel(self.SERVICE, options)
        return self._local.channel

    def has_channel(self):
        return self.SERVICE is not None

    def reset_channel(self):
        self._local.channel = None
