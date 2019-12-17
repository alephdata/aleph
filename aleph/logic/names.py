import logging
from banal import ensure_list
from normality import normalize
from elasticsearch.helpers import scan

from aleph.core import es, kv
from aleph.model import Entity
from aleph.index.indexes import entities_read_index

log = logging.getLogger(__name__)
TOKEN_KEY = 'namefreq:tokens'
DIST_KEY = 'namefreq:dist'
TOTAL_KEY = 'namefreq:total'


def name_tokens(name):
    name = normalize(name, ascii=True)
    if name is None:
        return []
    return [n for n in name.split(' ') if len(n) > 1]


def iter_tokens(limit=1000000000):
    """Go through all the names in the index."""
    query = {'_source': {'include': 'names'}}
    index = entities_read_index(schema=Entity.LEGAL_ENTITY)
    seen = 0
    try:
        for res in scan(es, index=index, query=query, scroll='1440m'):
            names = ensure_list(res.get('_source', {}).get('names'))
            tokens = set()
            for name in names:
                tokens.update(name_tokens(name))
            yield from tokens

            seen += 1
            if seen % 1000 == 0:
                log.info("Entities: %s", seen)
            if limit is not None and seen > limit:
                return
    except Exception as ex:
        log.warning("Token iterator aborted: %s", ex)


def compute_name_frequencies():
    """Compute a numeric distribution of name frequencies."""
    # Count how often each name part (i.e. token) shows up across
    # the whole of the dataset or a sample.
    # This is very memory-intense and could be sent out to redis.
    # Doing it in redis is also icky because of the need to iterate
    # the data later, and because it would need to be fully reset
    # before each run of this. Maybe a hash would be a useful
    # structure here?
    pipe = kv.pipeline(transaction=False)
    pipe.delete(TOKEN_KEY)
    names_count = 0
    for idx, token in enumerate(iter_tokens()):
        pipe.hincrby(TOKEN_KEY, token, 1)
        names_count += 1
        if idx > 0 and idx % 10000 == 0:
            pipe.execute()
            pipe = kv.pipeline(transaction=False)
    pipe.execute()
    log.info("Names: %d, unique: %d", names_count, kv.hlen(TOKEN_KEY))

    # Next, count how often each count occurs, i.e. make a histogram
    # of name frequency.
    counts = {}
    max_count = 0
    for _, count in kv.hscan_iter(TOKEN_KEY):
        count = int(count)
        # Leave out one-offs because they skew and aren't really
        # useful in any way.
        if count == 1:
            continue
        if count not in counts:
            counts[count] = 0
        counts[count] += 1
        # Find out what the maximum count is.
        max_count = max((count, max_count))

    log.info("Counts: %d, max: %d", len(counts), max_count)
    total = 0
    pipe = kv.pipeline(transaction=False)
    pipe.delete(DIST_KEY)
    for idx in range(max_count, 1, -1):
        total += counts.get(idx, 0)
        pipe.hset(DIST_KEY, idx, total)
        if idx > 0 and idx % 10000 == 0:
            pipe.execute()
            pipe = kv.pipeline(transaction=False)
    log.info("Total: %d", total)
    pipe.set(TOTAL_KEY, total)
    pipe.execute()


def name_frequency(name):
    total = float(kv.get(TOTAL_KEY) or 1)
    tokens = name_tokens(name)
    counts = kv.hmget(TOKEN_KEY, tokens)
    counts = [int(c or 1) for c in counts]
    dists = kv.hmget(DIST_KEY, counts)
    dists = [int(d or 0) / total for d in dists]
    score = 1 - sum(dists)
    # TODO: maybe we can normalise this over the number of
    # characters in the string such that it biases towards
    # longer names with rare name parts.
    print(tokens, counts, dists, score)
    # dist = kv.hgetall(DIST_KEY).items()
    # dist = ((int(k), int(v)) for k, v in dist)
    # for count, num in sorted(dist):
    #     print(count, num)
