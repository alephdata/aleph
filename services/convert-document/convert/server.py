import os
import shutil
import logging
import asyncio
from aiohttp import web
from tempfile import mkstemp
from pantomime import normalize_mimetype, normalize_extension

from convert.converter import FORMATS, PdfConverter
from convert.converter import ConversionFailure

MEGABYTE = 1024 * 1024
BUFFER_SIZE = 8 * MEGABYTE
MAX_UPLOAD = 800 * MEGABYTE
logging.basicConfig(level=logging.DEBUG)
logging.getLogger('aiohttp').setLevel(logging.WARNING)
log = logging.getLogger('convert')
converter = PdfConverter()


async def info(request):
    return web.Response(text="OK")


async def convert(request):
    data = await request.post()
    upload = data['file']
    extension = normalize_extension(upload.filename)
    mime_type = normalize_mimetype(upload.content_type, default=None)
    log.info('PDF convert: %s [%s]', upload.filename, mime_type)
    fd, upload_file = mkstemp()
    os.close(fd)
    fd, out_file = mkstemp(suffix='.pdf')
    os.close(fd)

    try:
        with open(upload_file, 'wb') as fh:
            shutil.copyfileobj(upload.file, fh, BUFFER_SIZE)

        filters = list(FORMATS.get_filters(extension, mime_type))
        timeout = int(request.query.get('timeout', 300))

        await asyncio.sleep(0)
        converter.convert_file(upload_file, out_file, filters,
                               timeout=timeout)
        out_size = os.path.getsize(out_file)
        if out_size == 0:
            raise ConversionFailure("Could not convert.")
        await asyncio.sleep(0)

        response = web.StreamResponse()
        response.content_length = out_size
        response.content_type = 'application/pdf'
        await response.prepare(request)
        with open(out_file, 'rb') as f:
            while True:
                chunk = f.read(BUFFER_SIZE)
                if not chunk:
                    break
                await response.write(chunk)
        return response
    except ConversionFailure as fail:
        log.info("Failed to convert: %s", fail)
        return web.Response(text=str(fail), status=400)
    except Exception as exc:
        log.exception('System error: %s.', exc)
        converter.terminate()
    finally:
        os.remove(upload_file)
        os.remove(out_file)


app = web.Application(client_max_size=MAX_UPLOAD)
app.add_routes([web.get('/', info)])
app.add_routes([web.post('/convert', convert)])
web.run_app(app, port=3000)
