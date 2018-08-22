import statistics
import grpc
import time
from alephclient.services.ocr_pb2_grpc import RecognizeTextStub
from alephclient.services.ocr_pb2 import Image

URL = 'localhost:50000'

channel = grpc.insecure_channel(URL)
service = RecognizeTextStub(channel)

mfsa_data = open('tests/fixtures/mfsa.png', 'rb').read()
russian_data = open('tests/fixtures/russian.png', 'rb').read()

times = []
for i in range(10):
    start = time.time()
    image = Image(data=mfsa_data, languages=['en'])
    res = service.Recognize(image)
    image = Image(data=russian_data, languages=['ru'])
    res = service.Recognize(image)
    end = time.time()
    times.append(end - start)

print([res.text], statistics.mean(times))
