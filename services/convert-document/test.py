import signal
import requests
from multiprocessing import Pool

signal.signal(signal.SIGINT, signal.SIG_IGN)


def request(i):
    path = 'fixtures/candea.pptx'
    files = {'file': open(path, 'rb')}
    data = {'extension': 'docx'}
    # print('send request')
    res = requests.post('http://localhost:5003/convert',
                        files=files, data=data)
    # message = res.text if res.status_code != 200 else ''
    print(i, res.status_code, res.content[:20])
    # print(res.content == open(path, 'rb').read())


pool = Pool(20)
try:
    pool.map(request, range(10000))
except KeyboardInterrupt:
    pool.terminate()
    pool.join()

# request(5)