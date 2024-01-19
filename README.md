# Install
1. Run `npm install` to install the objects bigger than a black hole
2. Create a `.env` file with content:
```properties
DATABASE_URL="file:./dev.db"
```
You can provide other file names, such as production.db etc.

3. Run `npx prisma db push` to build the db
4. Create a user with `npm run register <name> <password>`
5. Run with `npm start`

# Using docker?
1. Run `docker compose up`
2. While the container is running, run `docker exec quicklink-main-1 npm run register <name> <password>`