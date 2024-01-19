const express = require("express");
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { randomUUID } = require("crypto");


const port = process.env.PORT || 4000;
const app = express();
const prisma = new PrismaClient()

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(session({
  secret: randomUUID(),
  resave: false,
  saveUninitialized: false
}))

app.use((req, res, next) => {
  if (req.session.user == null && req.path.startsWith('/admin')) {
    res.redirect("/")
    res.end()
    return
  }
  next()
})

app.get('/', (req, res) => {
  if (req.session.user != null) {
    res.redirect("/admin/dashboard")
    res.end()
    return
  }

  res.render("index")
})

app.get('/admin/dashboard', async (req, res) => {
  const links = await prisma.link.findMany()
  res.render('dashboard', { links });
});

app.post('/admin/createlink', async (req, res) => {
  if (!req.body.name || !req.body.shortLinkName || !req.body.url) {
    res.redirect("/admin/dashboard")
    res.end()
    return
  }
  await prisma.link.create({
    data: {
      name: req.body.name,
      short_id: req.body.shortLinkName,
      url: req.body.url
    }
  })

  res.redirect("/admin/dashboard")
  res.end()
})

app.post('/', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  const user = await auth(username, password);
  if (user != null) {
    req.session.user = user;
  }
  res.redirect("/");
  res.end();
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/login');
    }
  });
});

app.get('/admin/delete/:id', async (req, res) => {
  await prisma.link.delete({
    where: {
      short_id: req.params.id
    }
  })

  res.redirect("/dashboard")
  res.end()
})

app.get('/:id', async (req, res) => {
  const link = await prisma.link.findFirst({
    where: {
      short_id: req.params.id
    }
  })

  if (link == null) {
    res.redirect('/')
  } else {
    res.redirect(link.url)
  }

  res.end()
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

async function auth(username, password) {
  const user = await prisma.user.findFirst({
    where: {
      username: username
    }
  });
  if (user == null) {
    return null
  }
  return bcrypt.compareSync(password, user.encrypted_password) ? user : null
}

process.on("exit", async (_code) => {
  await prisma.$disconnect()
})