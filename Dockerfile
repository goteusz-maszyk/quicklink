FROM node:21.1.0

COPY . /

RUN npm install
RUN echo DATABASE_URL="file:./dev.db" > .env
RUN npx prisma db push

EXPOSE 4000
ENTRYPOINT [ "npm", "start" ]