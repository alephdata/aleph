ARG PLAYWRIGHT_VERSION
FROM mcr.microsoft.com/playwright/python:v${PLAYWRIGHT_VERSION}
COPY entrypoint.sh wait-for requirements.txt ./
RUN apt update -y \
    && apt install -y netcat wget \
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
RUN pip install -r requirements.txt
ENTRYPOINT ["./entrypoint.sh"]
