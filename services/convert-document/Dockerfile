FROM alephdata/platform-libreoffice

RUN pip install aiohttp \
                celestial>=0.2.3 \
                pyicu>=2.0.3
RUN mkdir -p /convert
COPY setup.py /convert
COPY convert /convert/convert
WORKDIR /convert
RUN pip install -e . 

CMD ["python", "convert/server.py"]