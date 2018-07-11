import grpc
import logging

from aleph import settings
from aleph.analyze.analyzer import Analyzer, TextIterator
from alephclient.services.geoextract_pb2_grpc import GeoExtractStub

log = logging.getLogger(__name__)


class CountryExtractor(Analyzer, TextIterator):
    SERVICE = settings.COUNTRIES_SERVICE

    def __init__(self):
        self.active = self.SERVICE is not None

    def analyze(self, document):
        if not document.supports_nlp or len(document.countries):
            return

        try:
            channel = grpc.insecure_channel(self.SERVICE)
            service = GeoExtractStub(channel)
            texts = self.text_iterator(document)
            countries = service.ExtractCountries(texts)
            for country in countries.countries:
                document.add_country(country)
        except grpc.RpcError as exc:
            log.warning("gRPC Error: %s", exc)

        if len(document.countries):
            log.info("Countries [%s]: %r", document.id, document.countries)
