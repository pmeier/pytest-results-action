FROM python:3.10-slim

RUN pip install tabulate

COPY pytest-summary-gha /pytest-summary-gha

ENTRYPOINT ["python", "-m", "pytest-summary-gha"]
