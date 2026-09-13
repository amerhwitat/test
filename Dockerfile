FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends bash ca-certificates git python3 python3-pip nodejs npm gcc g++ make cmake openjdk-21-jdk-headless rustc cargo && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . /app
RUN useradd -m -u 10001 appuser && chown -R appuser:appuser /app
USER appuser
CMD ["bash"]
