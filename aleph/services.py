import grpc

from aleph import settings


class ServiceClientMixin(object):
    """Helper mixing to manage the connectivity with a gRPC endpoint."""
    SERVICE = None
    Error = grpc.RpcError

    @property
    def channel(self):
        """Lazily connect to the RPC service."""
        if not self.has_channel():
            return
        if not hasattr(self, '_channel') or self._channel is None:
            options = (('grpc.max_connection_age_ms', settings.GRPC_CONN_AGE),
                       ('grpc.lb_policy_name', settings.GRPC_LB_POLICY))
            self._channel = grpc.insecure_channel(self.SERVICE, options)
        return self._channel

    def has_channel(self):
        return self.SERVICE is not None
