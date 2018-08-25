import statistics
import grpc
import time
from alephclient.services.entityextract_pb2_grpc import EntityExtractStub
from alephclient.services.common_pb2 import Text

URL = 'localhost:50000'

channel = grpc.insecure_channel(URL)
service = EntityExtractStub(channel)


def generate():
    with open('tests/fixtures/pace.txt', 'r', encoding='utf-8') as fh:
        for line in fh:
            yield Text(text=line, languages=['en'])


times = []
for i in range(1):
    start = time.time()
    entities = service.Extract(generate())
    for entity in entities.entities:
        print((entity.label, entity.weight, entity.type))
        pass
    end = time.time()
    times.append(end - start)

print(statistics.mean(times))
