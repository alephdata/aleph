import grpc
import time
import statistics
# from threading import Thread
from alephclient.services.common_pb2 import Text
from alephclient.services.entityextract_pb2_grpc import EntityExtractStub

URL = 'localhost:50000'
TEXT = 'There was Joseph Stalin working at the Kremlin in Moscow'
channel = grpc.insecure_channel(URL)
service = EntityExtractStub(channel)
times = []
for i in range(100):
    start = time.time()
    image = Text(text=TEXT, languages=['en'])
    for ent in service.Extract(image):
        print(ent.text)
    end = time.time()
    times.append(end - start)

print(statistics.mean(times))


# def target():
#     channel = grpc.insecure_channel(URL)
#     service = EntityExtractStub(channel)
#     for i in range(300):
#         image = Text(text=TEXT, languages=['en'])
#         for ent in service.Extract(image):
#             # print(ent.text)
#             pass


# for i in range(20):
#     thread = Thread(target=target)
#     # thread.daemon = True
#     print(thread)
#     thread.start()
