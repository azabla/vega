# --- development: vite dev server ---
FROM node:22-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# --- build static bundle ---
FROM dev AS build
ARG VITE_API_URL=/api
ARG VITE_PORTFOLIO_USERNAME
ENV VITE_API_URL=$VITE_API_URL \
    VITE_PORTFOLIO_USERNAME=$VITE_PORTFOLIO_USERNAME
RUN npm run build

# --- production: serve with nginx ---
FROM nginx:alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
