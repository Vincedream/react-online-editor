FROM node:8.16.2-alpine
RUN apk --update add tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone \
    && apk del tzdata
RUN mkdir -p /usr/src/node-app
WORKDIR /usr/src/node-app
COPY . /usr/src/node-app

COPY package.json /app/package.json

RUN npm i --registry=https://registry.npm.taobao.org

RUN npm run build

EXPOSE 80

ENTRYPOINT ["node", "index.js"]
