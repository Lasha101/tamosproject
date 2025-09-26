# frontend/Dockerfile
# Stage 1: Build the React application
FROM node:18-alpine as build
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . .
# IMPORTANT: Pass the API URL as a build argument
ARG REACT_APP_API_URL
ENV VITE_API_URL=${REACT_APP_API_URL}
RUN npm run build

# Stage 2: Serve the built files with Nginx
FROM nginx:stable-alpine
# Copy the built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html
# Copy the default Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]