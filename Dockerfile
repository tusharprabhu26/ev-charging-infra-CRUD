FROM node:16


WORKDIR /usr/src/app


COPY package*.json ./


RUN npm install --only=production


COPY . .


ENV PORT=8081


EXPOSE 8081


CMD [ "node", "index.js" ]
