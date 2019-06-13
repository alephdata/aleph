import multiprocessing
from servicelayer import env

INGESTOR_THREADS = min(8, multiprocessing.cpu_count())
INGESTOR_THREADS = env.to_int('INGESTOR_THREADS', INGESTOR_THREADS)

MAX_RETRIES = 3
RETRY_BACKOFF_SECONDS = 5
RETRY_BACKOFF_FACTOR = 2