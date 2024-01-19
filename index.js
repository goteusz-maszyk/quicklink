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
  saveUninitialized: false,
  cookie: {
    sameSite: "strict"
  }
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
  if (req.session.user != null && auth(req.session.user.username, req.session.user.encrypted_password, true)) {
    res.redirect("/admin/dashboard")
    res.end()
    return
  }

  res.render("index")
});

app.post('/', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  const user = await auth(username, password, false);
  if (user != null) {
    req.session.user = user;
  }
  res.redirect("/");
  res.end();
});

app.get('/admin/dashboard', async (req, res) => {
  const links = await prisma.link.findMany()
  res.render('dashboard', { links });
});

app.post('/admin/createlink', async (req, res) => {
  if (req.body.name && req.body.shortLinkName && req.body.url && !(await prisma.link.findFirst({ where: { short_id: req.body.shortLinkName }}))) {
    await prisma.link.create({
      data: {
        name: req.body.name,
        short_id: req.body.shortLinkName,
        url: req.body.url
      }
    })
  }

  res.redirect("/admin/dashboard")
  res.end()
})

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
  try {
    await prisma.link.delete({
      where: {
        short_id: req.params.id
      }
    })
  } catch (e) {}
  res.redirect("/dashboard")
  res.end()
});

app.get('/admin/account', async (req, res) => {
  const { username } = req.session.user;
  res.render("account", { username });
  res.end();
});

app.post('/admin/changename', async (req, res) => {
  const username = req.body.name
  const user = await prisma.user.update({
    where: {
      id: req.session.user.id
    },
    data: {
      username: username
    }
  });
  req.session.user = user

  res.redirect('/admin/account')
  res.end()
})

app.post("/admin/changepassword", async (req, res) => {
  const { current_password, new_password } = req.body;

  if (bcrypt.compareSync(current_password, req.session.user.encrypted_password)) {
    await prisma.user.update({
      where: {
        id: req.session.user.id
      },
      data: {
        encrypted_password: bcrypt.hashSync(new_password, 10)
      }
    });
  }

  res.redirect('/admin/logout')
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

async function auth(username, password, encrypted) {
  const user = await prisma.user.findFirst({
    where: {
      username: username
    }
  });
  if (user == null) {
    return null
  }
  if (encrypted) {
    return user.encrypted_password == password ? user : null
  } else {
    return bcrypt.compareSync(password, user.encrypted_password) ? user : null
  }
}

process.on("exit", async (_code) => {
  await prisma.$disconnect()
})

process.on('uncaughtException', (e) => {
  console.error(e)
})