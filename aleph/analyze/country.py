import grpc
import logging

from aleph import settings
from aleph.analyze.analyzer import Analyzer
from alephclient.services.geoextract_pb2_grpc import GeoExtractStub
from alephclient.services.common_pb2 import Text

log = logging.getLogger(__name__)


class CountryExtractor(Analyzer):
    SERVICE = settings.GEOEXTRACT_SERVICE

    def __init__(self):
        self.active = self.SERVICE is not None

    def make_iterator(self, document):
        # TODO: Probably makes more sense to move it into the base class?
        languages = list(document.languages)
        if not len(languages):
            languages = [settings.DEFAULT_LANGUAGE]
        for text in document.texts:
            text = Text(text=text, languages=languages)
            yield text

    def analyze(self, document):
        languages = list(document.languages)
        if not len(languages):
            languages = [settings.DEFAULT_LANGUAGE]
        try:
            channel = grpc.insecure_channel(self.SERVICE)
            service = GeoExtractStub(channel)
            log.info("Service connection established!")
            countries = service.ExtractCountries(
                self.make_iterator(document)
            )
            countries = countries.countries
            for country in countries:
                document.add_country(country)
        except grpc.RpcError as exc:
            log.warning("gRPC Error: %s", exc)

        if len(document.countries):
            log.info("Countries for [%s]: %r", document.id, document.countries)
