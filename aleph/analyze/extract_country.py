import logging
from alephclient.services.geoextract_pb2_grpc import GeoExtractStub

from aleph import settings
from aleph.services import ServiceClientMixin
from aleph.analyze.analyzer import Analyzer, TextIterator

log = logging.getLogger(__name__)


class CountryExtractor(Analyzer, TextIterator, ServiceClientMixin):
    SERVICE = settings.COUNTRIES_SERVICE

    def __init__(self):
        self.active = self.has_channel()

    def analyze(self, document):
        if not document.supports_nlp or len(document.countries):
            return

        try:
            service = GeoExtractStub(self.channel)
            texts = self.text_iterator(document)
            countries = service.ExtractCountries(texts)
            for country in countries.countries:
                document.add_country(country)

            log.info("Countries [%s]: %r", document.id, document.countries)
        except self.Error as exc:
            log.exception("gRPC Error: %s", self.SERVICE)
            self.reset_channel()

        
