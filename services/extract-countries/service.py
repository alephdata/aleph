import io
import csv
import grpc
import time
import zipfile
import logging
import ahocorasick
from concurrent import futures
from normality import normalize
from collections import Counter

from alephclient.services.geoextract_pb2_grpc import (
    add_GeoExtractServicer_to_server, GeoExtractServicer
)
from alephclient.services.geoextract_pb2 import CountryTags

log = logging.getLogger('service')


class GeoExtractServicer(GeoExtractServicer):
    # Feature codes: http://www.geonames.org/export/codes.html
    FEATURES = [
        'ADM1',
        'PCLD',
        # 'TERR',
        # 'PPLC',
        # 'PPLA'
    ]

    MAX_TAGS = 3
    TAG_FREQUENCY_CUT = 0.01

    def __init__(self, geo_corpus_path):
        self.automaton = ahocorasick.Automaton()

        log.info("Building country automaton...")
        names_count = 0
        with zipfile.ZipFile(geo_corpus_path, "r") as zf:
            all_geonames = zf.open("allCountries.txt", "r")
            wrapped = io.TextIOWrapper(all_geonames, 'utf-8')
            reader = csv.reader(wrapped, delimiter='\t')

            for row in reader:
                if row[7] in self.FEATURES:
                    continue

                country = normalize(row[8])
                if country is None:
                    continue

                names = set(row[3].split(','))
                names.add(row[1])
                names.add(row[2])
                names = [normalize(n) for n in names]

                for name in names:
                    if name is None or len(name) < 4:
                        continue
                    names_count += 1
                    self.automaton.add_word(name, country)

        self.automaton.make_automaton()
        log.info("...done: %s", names_count)

    def ExtractCountries(self, request_iterator, context):
        country_tags = []
        word_count = 0

        for text_obj in request_iterator:
            text = normalize(text_obj.text)
            if text is None:
                continue

            word_count += len(text.split())
            for index, country in self.automaton.iter(text):
                # log.debug("Matched: %s -> %s", name, country)
                country_tags.append(country)

        doc_tags = []
        co_counts = Counter(country_tags)
        top_n = co_counts.most_common(self.MAX_TAGS)

        for tag_num in range(1, self.MAX_TAGS + 1):
            if len(top_n) >= tag_num:
                freq = top_n[tag_num-1][1] / max(1, word_count)
                log.info('tag is %s, freq = %.2f', top_n[tag_num-1], freq)
                if freq >= self.TAG_FREQUENCY_CUT:
                    doc_tags.append(top_n[tag_num-1][0])

        return CountryTags(countries=doc_tags)


def serve(port):
    geo_corpus_path = "/tmp/allCountries.zip"
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=20))
    add_GeoExtractServicer_to_server(
        GeoExtractServicer(geo_corpus_path), server
    )
    server.add_insecure_port(port)
    server.start()
    log.info("Server started: %s", port)
    try:
        while True:
            time.sleep(84600)
    except KeyboardInterrupt:
        server.stop(60)


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    logging.getLogger('service').setLevel(logging.INFO)
    serve('[::]:50000')
