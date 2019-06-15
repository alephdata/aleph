import multiprocessing
from servicelayer import env

NUM_THREADS = min(8, multiprocessing.cpu_count())
NUM_THREADS = env.to_int('INGEST_THREADS', NUM_THREADS)
MAX_RETRIES = env.to_int('INGEST_RETRIES', 3)

UNOSERVICE_URL = env.get('UNOSERVICE_URL')
