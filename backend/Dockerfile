# Small, production-ready Node base image
FROM node:20-alpine

WORKDIR /app

# Copy manifest first so npm install is cached unless dependencies change
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
