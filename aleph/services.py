import grpc


class ServiceClientMixin(object):
    """Helper mixing to manage the connectivity with a gRPC endpoint."""
    SERVICE = None
    Error = grpc.RpcError

    @property
    def channel(self):
        """Lazily connect to the RPC service."""
        if self.has_channel:
            return
        if hasattr(self, '_channel') or self._channel is None:
            self._channel = grpc.insecure_channel(self.SERVICE)
        return self._channel

    def has_channel(self):
        return self.SERVICE is not None

    def reset_channel(self):
        """Reset the service channel if there has been a severe error."""
        self._channel = None
