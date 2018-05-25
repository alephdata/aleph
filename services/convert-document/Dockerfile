FROM alephdata/platform-libreoffice:2.1.4

RUN pip3 install -q aiohttp \
                    celestial>=0.2.3 \
                    pyicu>=2.0.3
RUN mkdir -p /convert
COPY setup.py /convert
COPY convert /convert/convert
WORKDIR /convert
RUN pip3 install -q -e . 

HEALTHCHECK --interval=10s --timeout=302s --start-period=4s --retries=3 \
    CMD curl --fail http://localhost:3000 || exit 1

CMD ["python3", "convert/server.py"]