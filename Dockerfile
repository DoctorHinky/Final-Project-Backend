FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Prisma Client generation
RUN npx prisma generate

# Expose the port the app runs on
EXPOSE 4001

CMD [ "node", "dist/main" ]