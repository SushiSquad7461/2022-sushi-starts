FROM node:16-alpine

WORKDIR /app
ADD . /app

RUN npm install --no-optional

ENTRYPOINT ["/app/entrypoint.sh"]
