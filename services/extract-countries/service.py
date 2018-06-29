import string
import ahocorasick
import zipfile
import csv
import io
import logging
import grpc
import time
from concurrent import futures
from collections import Counter

from alephclient.services.geoextract_pb2_grpc import add_GeoExtractServicer_to_server  # noqa
from alephclient.services.geoextract_pb2_grpc import GeoExtractServicer  # noqa
from alephclient.services.geoextract_pb2 import CountryTags  # noqa

log = logging.getLogger('service')


class GeoExtractServicer(GeoExtractServicer):

    def __init__(self, geo_corpus_path):
        self.max_tags = 3
        self.tag_freq_cut = 0.01
        self.excluded_tags = ['TO', 'law', 'laws', 'No', 'I', 'V', 'X', '1',
                              '2', '3', '4', '5', '6', '7', '8', '9']

        self.country_automaton = ahocorasick.Automaton()

        with zipfile.ZipFile(geo_corpus_path, "r") as zf:
            all_geonames = zf.open("allCountries.txt", "r")
            wrapped = io.TextIOWrapper(all_geonames, 'utf-8')
            reader = csv.reader(wrapped, delimiter='\t')

            for row in reader:
                if row[7] not in ['PCLI', 'ADM1']:
                    continue

                geonameid = row[0]
                name = row[1]
                asciiname = row[2]
                alternatenames = row[3]
                feature_code = row[7]
                country_code = row[8]

                self.country_automaton.add_word(str(asciiname),
                                                (str(country_code),
                                                str(asciiname)))

                for alt_name in str.split(str(alternatenames), ','):
                    self.country_automaton.add_word(str(alt_name),
                                                    (str(country_code),
                                                    str(alt_name)))

        self.country_automaton.make_automaton()

    def clean_str(self, raw_str):
        strip_punct = str.maketrans('', '', string.punctuation)

        return raw_str.translate(strip_punct)

    def ngrams(self, doc_in, ngram_range):
        doc_in = doc_in.split(' ')
        ngram_out = []
        for i in range(len(input)-ngram_range+1):
            ngram_out.append(' '.join(input[i:i+ngram_range]))
        return ngram_out

    def extract(self, request_iterator):

        mention_tags = []
        doc = ""

        for text_obj in request_iterator:
            text = text_obj.text
            if text is None or not len(text.strip()):
                continue
            doc += text

        for word in str.split(doc, ' '):
            for index, value in self.country_automaton.iter(word):
                if self.clean_str(str(value[1])) in self.excluded_tags:
                        continue
                if self.clean_str(word) == self.clean_str(str(value[1])):
                    mention_tags.append(value[0])

        for ng_len in range(2, 7):
            doc_ngram = self.ngrams(doc, ng_len)

            for ngram in doc_ngram:
                for index, value in self.country_automaton.iter(ngram):
                    if self.clean_str(str(value[1])) in self.excluded_tags:
                        continue
                    if self.clean_str(ngram) == self.clean_str(str(value[1])):
                        mention_tags.append(value[0])

        return self.derive_doc_tags(doc, mention_tags)

    def derive_doc_tags(self, doc, country_tags):
        doc_tags = []

        word_count = len(doc.split())
        co_counts = Counter(country_tags)
        top_n = co_counts.most_common(self.max_tags)

        for tag_num in range(1, self.max_tags + 1):
            if len(top_n) >= tag_num:
                print ('tag is ' + str(top_n[tag_num-1]))
                print('freq is ' + str(top_n[tag_num-1][1]/word_count))
                if top_n[tag_num-1][1]/word_count >= self.tag_freq_cut:
                    doc_tags.append(top_n[tag_num-1][0])

        return doc_tags


def serve(port):
    geo_corpus_path = "/tmp/countries.zip"
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=20))
    add_GeoExtractServicer_to_server(GeoExtractServicer(geo_corpus_path),
                                     server)
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
    logging.getLogger('geoextract').setLevel(logging.INFO)
    serve('[::]:50000')
