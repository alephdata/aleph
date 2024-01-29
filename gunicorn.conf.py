import os
from prometheus_client import multiprocess


_PROM_ENABLED = os.environ.get("PROMETHEUS_ENABLED", False)
_PROM_MULTIPROC_DIR = os.environ.get("PROMETHEUS_MULTIPROC_DIR", None)

wsgi_app = "aleph.wsgi:app"
bind = "0.0.0.0:8000"
timeout = 3600

if _PROM_ENABLED:
    # Gunicorn will bind to port 8000 (the default, publicly exposed port)
    # and port 9100 (which is accessible internally only). The metrics endpoint
    # is only available on the internal port.
    bind = ["0.0.0.0:8000", "0.0.0.0:9100"]

    # In multiprocess mode, the Prometheus client writes metrics to to the filesystem
    # to aggregate them across processes. We need to ensure the directory used by the
    # client exists and is empty on application startup. We also need to notify the
    # client if a Gunicorn worker process exits so that the client clean up data related
    # to that process.
    #
    # For more information see:
    # https://github.com/prometheus/client_python#multiprocess-mode-eg-gunicorn
    def on_starting(_):
        if _PROM_ENABLED and _PROM_MULTIPROC_DIR:
            for file in os.scandir(_PROM_MULTIPROC_DIR):
                os.unlink(file.path)


    def child_exit(_, worker):
        if _PROM_ENABLED and _PROM_MULTIPROC_DIR:
            multiprocess.mark_process_dead(worker.pid)
