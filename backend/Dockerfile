FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir \
    django==5.2.7 \
    djangorestframework==3.16.1 \
    djangorestframework-simplejwt==5.5.1 \
    django-cors-headers==4.9.0 \
    python-dotenv==1.1.1 \
    gunicorn==23.0.0 \
    psycopg2-binary==2.9.10

COPY . /app

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
