FROM alephdata/platform-libreoffice

RUN pip3 install -q aiohttp \
                    celestial>=0.2.3 \
                    pyicu>=2.0.3
RUN mkdir -p /convert
COPY setup.py /convert
COPY convert /convert/convert
WORKDIR /convert
RUN pip3 install -e . 

CMD ["python3", "convert/server.py"]