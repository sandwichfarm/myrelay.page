#builder 
FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY . ./
RUN npm ci
RUN npm run build
#server 
FROM nginx:alpine
COPY --from=builder /usr/src/app/build /usr/share/nginx/html