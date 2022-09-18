FROM node:16.13.1-alpine3.15
WORKDIR /usr/src/app
RUN apk update && apk add git
RUN npm install -g pm2
COPY ./dist ./dist
COPY ./ecosystem.config.js .
COPY ./package*.json .
RUN npm i
EXPOSE 3000
CMD ["pm2-runtime", "start", "ecosystem.config.js"]