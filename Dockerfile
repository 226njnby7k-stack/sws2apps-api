FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY locales ./locales
COPY public ./public
# Handlebars email templates — mail_config resolves viewPath to ./src/v3/views/
# at runtime, so they must be present or MAIL_ENABLED sends would fail.
COPY src/v3/views ./src/v3/views
EXPOSE 8000
CMD ["node", "dist/index.js"]
