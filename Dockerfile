FROM node:lts-alpine

RUN apk add --no-cache gcompat

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "start"]