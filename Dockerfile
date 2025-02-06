FROM node:latest

WORKDIR /seugarcom-backend

COPY . .

RUN rm -rf -node_modules
RUN yarn start

CMD ["yarn", "src/config/server.ts"]

EXPOSE 3333