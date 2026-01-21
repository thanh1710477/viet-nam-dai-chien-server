FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

ENV PORT=2567
EXPOSE 2567

CMD [ "npm", "start" ]
