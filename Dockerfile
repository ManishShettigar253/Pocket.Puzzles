# Stage 1: Build the React (Vite) application
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package files first to take advantage of Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Build the app for production (this creates the 'dist' folder)
RUN npm run build

# Stage 2: Serve the app using Nginx (a lightweight web server)
FROM nginx:alpine

# Copy the built files from the previous 'build' stage into Nginx's HTML folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 so the outside world can connect to Nginx
EXPOSE 80

# Start the Nginx server
CMD ["nginx", "-g", "daemon off;"]
