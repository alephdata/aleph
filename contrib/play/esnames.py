# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

import os
import json
import redis
import requests
import normality
from collections import defaultdict

conn = redis.Redis(decode_responses=True)


def name_tokens(name):
    name = normality.normalize(name, latinize=True)
    # if len(name) > 2:
    #     return [name]
    # return []
    return [n for n in name.split(" ") if len(n)]


def get_entities():
    params = {
        "include": ["names", "countries", "schema"],
        "schema": ["Thing"],
        "api_key": os.environ.get("ALEPH_API_KEY"),
    }
    url = "http://localhost:5000/api/2/entities/_stream"
    res = requests.get(url, params=params, stream=True)
    for line in res.iter_lines():
        entity = json.loads(line)
        yield entity


def flush():
    conn.delete("_total")
    for key in conn.scan_iter("names:*"):
        conn.delete(key)


def name_stats():
    # flush()
    name_count = 0
    name_lengths = []
    for idx, entity in enumerate(get_entities()):
        tokens = defaultdict(int)
        for name in entity.get("names", []):
            name_count += 1
            name = name_tokens(name)
            name_lengths.append(len(name))
            for token in name:
                tokens[token] += 1

        for key, count in tokens.items():
            conn.incrby("names:" + key, count)
        conn.incrby("_total", sum(tokens.values()))

        if idx % 1000 == 0:
            print(idx)
        if idx > 100000:
            break

    # print('unique tokens', len(tokens))
    print("name count", name_count)
    name_avg = sum(name_lengths) / float(name_count)
    print("name avg", name_avg)
    # counter = Counter(tokens)
    # print(counter.most_common(50))


def name_score(name):
    max_value = 0
    count_value = 0
    total_value = 0
    for key in conn.scan_iter("names:*"):
        value = int(conn.get(key))
        max_value = max(value, max_value)
        count_value += 1
        total_value += value
    # total = total_value / count_value
    total = max_value
    # total = int(conn.get('_total'))
    tokens = name_tokens(name)
    keys = ["names:" + t for t in tokens]
    values = conn.mget(keys)
    total_score = 1
    for value in values:
        value = int(value or 1)
        score = (max_value - value) / value
        # score = 1 - (total / max(1, value))
        total_score += score
    total_score = total_score / max_value
    print(name, total_score, total, values)
    # values = [int(v or 0) for v in conn.mget(keys)]
    # print(total, values)


if __name__ == "__main__":
    # name_stats()
    name_score("the bank")
    name_score("zen koan")
    name_score("nazarbayev")
    name_score("friedrich lindenberg")
