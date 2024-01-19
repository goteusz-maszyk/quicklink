const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const chalk = require('chalk')

const prisma = new PrismaClient()

async function main() {
  const username = process.argv[2]
  const password = process.argv[3]
  if (username == undefined || password == undefined) {
    console.log("USAGE: npm run unregister <username>")
    return
  }
  const user = await prisma.user.delete({
    where: {
      username: username
    }
  })
  console.log(chalk.red("Deleted user:"))
  console.log(JSON.stringify(user))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })