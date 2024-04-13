#builder 
FROM node:alpine as builder
WORKDIR /usr/src/app
COPY . ./
RUN yarn install
RUN yarn build
#server 
FROM nginx:alpine
COPY --from=builder /usr/src/app/build /usr/share/nginx/html