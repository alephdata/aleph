import os
import sys
import signal
import requests
from multiprocessing import Pool

signal.signal(signal.SIGINT, signal.SIG_IGN)
url = os.environ.get('UNOSERVICE_URL')


def request(i):
    path = sys.argv[1]
    files = {'file': open(path, 'rb')}
    data = {'extension': 'docx'}
    # print('send request')
    res = requests.post(url, files=files, data=data)
    # message = res.text if res.status_code != 200 else ''
    print(res.status_code, res.content[:20])
    # print(res.content == open(path, 'rb').read())


pool = Pool(20)
try:
    pool.map(request, range(10000))
except KeyboardInterrupt:
    pool.terminate()
    pool.join()

# request(5)
