FROM mcr.microsoft.com/playwright/python:v1.31.0-focal
COPY entrypoint.sh .
RUN apt update -y \
    && apt install -y netcat wget \
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
RUN pip install pytest-playwright
RUN curl -O https://raw.githubusercontent.com/eficode/wait-for/v2.2.3/wait-for && chmod +x ./wait-for
ENTRYPOINT ["./entrypoint.sh"]
