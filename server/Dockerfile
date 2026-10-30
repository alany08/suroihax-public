# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Certbot for SSL
# RUN apt-get update && apt-get install -y certbot

# Copy package.json and package-lock.json (if present)
COPY package*.json ./

# Install dependencies
RUN npm i

# Copy the rest of your application code into the container
COPY . .

# Expose the port the app runs on (adjust if your app uses a different port)
EXPOSE 6969

# Obtain initial certificates using Certbot (you may adjust this for testing)
# This command will run Certbot in standalone mode and fetch certificates for the domain
# RUN certbot certonly --standalone --non-interactive --agree-tos --email alanyu08@gmail.com -d suroihax.duckdns.org

# Add a cron job to renew the certificate automatically
# Certbot will stop Fastify before renewing and restart it afterward
# RUN (crontab -l ; echo "0 0 * * * certbot renew --non-interactive --pre-hook 'killall node' --post-hook 'node server.js'") | crontab -

# Set environment variable if needed (e.g., production)
ENV NODE_ENV=production
ENV discord_hook=https://discord.com/api/webhooks/1235400272315027456/gVGIh9C8Xz3xeo7d8-LUIzLnH6SxmNdkVR28YNnT99SNJp_K6N2yNmIpyJtcUrihb3wI
ENV PORT=6969

# Start the app
CMD ["npm", "start"]
