FROM alephdata/platform-ner:2.2.0

RUN mkdir -p /service
ADD requirements.txt /service
RUN pip install -q -r /service/requirements.txt
ADD setup.py entityextractor tests /service/
RUN pip install -q -e /service
WORKDIR /service

HEALTHCHECK --interval=10s --timeout=2s --start-period=4s --retries=3 \
    CMD curl --fail http://localhost:50000 || exit 1

EXPOSE 50000
CMD ["python", "/service/entityextractor/service.py"]