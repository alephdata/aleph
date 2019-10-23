import normality
from servicelayer.cache import make_key
from elasticsearch.helpers import scan

from aleph.core import es, kv
from aleph.model import Entity
from aleph.index.indexes import entities_read_index


def get_total():
    key = make_key('names', '_total_')
    total = kv.get(key)
    if total is not None:
        return int(str(total))
    body = {'query': {'match_all': {}}}
    index = entities_read_index(Entity.LEGAL_ENTITY)
    count = es.count(index=index, body=body).get('count', 0)
    kv.set(key, count, ex=3600)
    return int(count)


def name_tokens(name):
    name = normality.normalize(name, latinize=True)
    if name is None:
        return []
    return [n for n in name.split(' ') if len(n) > 1]


def get_composite_frequency(name):
    names = name_tokens(name)
    keys = [make_key('names', n) for n in names]
    counts = {n: c for n, c in zip(names, kv.mget(keys))}
    uncached = [n for (n, c) in counts.items() if c is None]
    queries = []
    for name in uncached:
        queries.append({'index': entities_read_index(Entity.LEGAL_ENTITY)})
        queries.append({
            'size': 0,
            'query': {'term': {'names.text': name}}
        })
    if len(queries):
        res = es.msearch(body=queries)
        for name, resp in zip(uncached, res.get('responses', [])):
            total = resp.get('hits', {}).get('total', {}).get('value')
            key = make_key('names', name)
            counts[name] = total
            kv.set(key, total, ex=3600)
    total = get_total()
    score = 1.0
    for _, count in counts.items():
        freq = int(count) / max(1, total)
        rate = (1 - freq) ** 10
        print(freq, rate)
        score = score * rate
    return counts, total, score


def all_names():
    query = {
        '_source': {'include': 'names'}
    }
    index = entities_read_index(schema=Entity.LEGAL_ENTITY)
    seen = 0
    for res in scan(es, index=index, query=query, scroll='1410m'):
        seen += 1
        if seen > 100000:
            return
        yield res.get('_source', {}).get('names')


def name_distribution():
    """Compute a numeric distribution of name frequencies."""
    # Count how often each name part (i.e. token) shows up across
    # the whole of the dataset or a sample.
    # This is very memory-intense and could be sent out to redis.
    # Doing it in redis is also icky because of the need to iterate
    # the data later, and because it would need to be fully reset
    # before each run of this. Maybe a hash would be a useful
    # structure here?
    tokens = {}
    for name in all_names():
        for token in name_tokens(name):
            if token not in tokens:
                tokens[token] = 0
            tokens[token] += 1
    # Next, count how often each count occurs, i.e. make a histogram
    # of name frequency.
    counts = {}
    max_count = 0
    for (name, count) in tokens.items():
        # Leave out one-offs because they skew and aren't really
        # useful in any way.
        if count == 1:
            continue
        if count not in counts:
            counts[count] = 0
        counts[count] += 1
        # Find out what the maximum count is.
        max_count = max((count, max_count))
    total = 0
    cumulative = {}
    for count in range(max_count, 1, -1):
        total += counts.get(count, 0)
        cumulative[count] = total
    # for (count, num) in sorted(counts.items(), reverse=True):
    #     total += num
    #     cumulative[count] = total
    for (token, count) in sorted(tokens.items()):
        if count > 50:
            print(token, count, counts[count], cumulative[count] / total)
    print(len(tokens), len(counts), len(cumulative), max_count)
    return cumulative, total
