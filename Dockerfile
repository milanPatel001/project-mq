FROM postgres:latest

ENV POSTGRES_PASSWORD=1234
ENV POSTGRES_DB=pokemon
ENV POSTGRES_USER=postgres

ADD ./schemas/poke.sql /docker-entrypoint-initdb.d/
EXPOSE 5432

