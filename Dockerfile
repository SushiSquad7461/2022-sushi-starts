FROM node:16-alpine

WORKDIR /usr/src/app
ADD . /usr/src/app

RUN npm install --no-optional

ADD ./entrypoint.sh /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
