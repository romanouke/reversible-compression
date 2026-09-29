FROM node:20-alpine

WORKDIR /app

# Dependencies are installed before the source is copied so edits to the app
# do not invalidate the (slow) npm install layer.
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
