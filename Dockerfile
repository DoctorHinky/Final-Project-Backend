
# Image Base
FROM node:24-alpine

# Working Directory
# Set the working directory in the container to /app
# This is where your application code will be copied to
# and where commands will be run
WORKDIR /app

# Package json Kopieren, das macht Caching effizienter
# Copy package.json and package-lock.json to the working directory
# This allows Docker to cache the npm install step
# so that it doesn't have to run every time you build the image
COPY package*.json ./

# Install dependencies
# Install the dependencies defined in package.json
# This will also create a node_modules directory in the working directory
# and install all the dependencies listed in package.json
RUN npm install

# Copy the rest of the application code to the working directory
# This will copy all files and directories from the current directory
# on your host machine to the /app directory in the container
# The .dockerignore file is used to exclude files and directories
COPY . .

# Prisma Client generation
RUN npx prisma generate

# Build the application
# This will compile the TypeScript code into JavaScript
# and output the compiled files to the dist directory
# The build command is defined in package.json
RUN npm run build

# to get save the db is set:
RUN npx prisma generate

# Expose the port the app runs on
EXPOSE 4001

CMD [ "node", "dist/main" ]