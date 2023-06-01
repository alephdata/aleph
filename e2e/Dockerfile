FROM mcr.microsoft.com/playwright/python:v1.34.0-focal
COPY entrypoint.sh wait-for ./
RUN apt update -y \
    && apt install -y netcat wget \
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
RUN pip install pytest-playwright
ENTRYPOINT ["./entrypoint.sh"]
