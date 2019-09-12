import os
import logging
import traceback
import subprocess
from threading import RLock
from flask import Flask, request, send_file
from tempfile import mkstemp
from werkzeug.wsgi import ClosingIterator
from pantomime import normalize_mimetype, normalize_extension

from convert.formats import load_mime_extensions

TIMEOUT = 90
OUT_PATH = '/tmp/output.pdf'
logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger('convert')
lock = RLock()
extensions = load_mime_extensions()
listener = subprocess.Popen(['unoconv', '--listener', '-vvv'])
app = Flask("convert")
app.is_dead = False


class ShutdownMiddleware:
    def __init__(self, application):
        self.application = application

    def post_request(self):
        if app.is_dead:
            os._exit(0)

    def __call__(self, environ, after_response):
        iterator = self.application(environ, after_response)
        try:
            return ClosingIterator(iterator, [self.post_request])
        except Exception:
            traceback.print_exc()
            return iterator


app.wsgi_app = ShutdownMiddleware(app.wsgi_app)


@app.route("/")
def info():
    acquired = lock.acquire(timeout=2)
    if not acquired:
        return ("BUSY", 503)
    return ("OK", 200)


@app.route("/convert", methods=['POST'])
def convert():
    acquired = lock.acquire(timeout=2)
    if not acquired:
        return ("BUSY", 503)
    try:
        if os.path.exists(OUT_PATH):
            os.unlink(OUT_PATH)

        upload = request.files['file']
        extension = normalize_extension(upload.filename)
        mime_type = normalize_mimetype(upload.mimetype, default=None)
        if extension is None:
            extension = extensions.get(mime_type)
        log.info('PDF convert: %s [%s]', upload.filename, mime_type)
        fd, upload_file = mkstemp(suffix='.%s' % extension)
        fh = os.fdopen(fd, mode='wb')
        upload.save(fh)
        fh.close()
        if listener.poll() is not None:
            log.error("Listener has terminated.")
            app.is_dead = True
            return ("DEAD", 503)

        args = ['unoconv',
                '-f', 'pdf',
                '-o', OUT_PATH,
                '-i', 'MacroExecutionMode=0',
                '-i', 'ReadOnly=1',
                '-e', 'SelectPdfVersion=1',
                '-e', 'MaxImageResolution=300',
                '--no-launch',
                upload_file]
        err = subprocess.call(args, timeout=TIMEOUT)
        if err != 0 or not os.path.exists(OUT_PATH):
            return ('The document could not be converted to PDF.', 400)
        return send_file(OUT_PATH)
    except subprocess.TimeoutExpired:
        log.error("Timeout exceeded: %s", upload.filename)
        app.is_dead = True
        return ('Processing the document timed out.', 400)
    finally:
        lock.release()


if __name__ == '__main__':
    # app.run(debug=True, port=3000, host='0.0.0.0')
    app.run(port=3000, host='0.0.0.0', threaded=True)
