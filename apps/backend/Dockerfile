# 1. Use an official lightweight Node.js image
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /usr/src/app

# 3. Copy package files first to leverage Docker layer caching
COPY package*.json ./

# 4. Install production dependencies only
RUN npm install --only=production

# 5. Copy the rest of your application code
COPY . .

# 6. Expose the port your app runs on inside the container
EXPOSE 3000

# 7. Define the command to start your application
CMD ["npm", "start"]