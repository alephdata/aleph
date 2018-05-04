import grpc

from alephprotos import EntityExtractStub, Entity, Text


def extract_text(stub, text, languages=[]):
    messages = iter([Text(text=text, languages=languages)])
    responses = stub.Extract(messages)
    for response in responses:
        type_ = Entity.Type.Name(response.type)
        print("Received: %s (%s)" % (response.label, type_))


def run():
    channel = grpc.insecure_channel('localhost:50000')
    stub = EntityExtractStub(channel)
    for i in range(10000):
        text = "Frau Angela Merkel hat einen Hund in Berlin."
        extract_text(stub, text, ['de'])


if __name__ == '__main__':
    run()
