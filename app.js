const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const loginHandler = require('./loginHandler.js')
const webSocket = require('./socket/socket.js');

const app = express();
app.use('/db_char', express.static(path.join(__dirname, 'db_char')));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'db_char')));

app.use(loginHandler.secureStatic({'/waiting.html': 'USER', '/start_all.html': 'ADMIN'}, loginHandler.db));

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
webSocket(server, loginHandler.db);
console.log(`websocket server is running at ${PORT}`)

// root page
app.get('/', (req, res) => {
  if (loginHandler.checkCookie(req)) {
    res.redirect('/waiting_vote_client.html');
    return;
  } else if (loginHandler.cookieExists(req)) {
    let userData = loginHandler.getCookie(req);
    if (userData.password === "wlqrkrhtlvek") {
      res.status(200).sendFile(__dirname + '/secure/start_all.html');
      return;
    }
  } else {
    res.status(200).sendFile(__dirname + '/public/root.html');
    return;
  }

  if (loginHandler.cookieExists(req) && !loginHandler.checkCookie(req)) {
    res.clearCookie('USER');
    res.send(`
        <script>
            alert('로그인 정보가 잘못되었습니다. 다시 로그인하세요.');
            window.location.href = '/signup.html';
        </script>
    `);
    return;
  }

  res.clearCookie('USER');
  res.send(`
      <script>
          alert('예외가 발생했습니다. 다시 로그인하세요.');
          window.location.href = '/signup.html';
      </script>
  `);
});

app.post('/signup', (req, res) => {
  const { username } = req.body;
  const exists = loginHandler.db.get(username);

  if (exists) {
      res.status(400).send(`duplicate username: ${username}`);
      return;
  }

  const newUser = {
    username
  };
  loginHandler.db.set(username, newUser);

  loginHandler.addCookie(newUser, res)
  console.log(loginHandler.db)
  res.redirect('/');
  return;
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log(username, password)

  if (username == 'raytoto0423') {
    if (password == 'wlqrkrhtlvek') {
      admin_info = {
        username,
        password
      }
      loginHandler.addCookie(admin_info, res)
      res.redirect('/')
    } else {
      res.send(`<script>alert('관리자 로그인 실패 : 아이디나 패스워드 불일치');</script>`)
    }
  } else {
    res.send(`<script>alert('관리자 로그인 실패 : 아이디나 패스워드 불일치');</script>`)
  }
})

app.post('/logout', (req, res) => {
  if (loginHandler.getCookie(req)) {
    loginHandler.removeCookie(res)
    res.redirect('/signup.html')
  }
  else {
    res.send(`<script>alert('로그아웃 실패 : 로그인 되어있지 않습니다.');</script>`)
  }
})

const fs = require('fs'); // ← 이거 꼭 상단에 추가

app.get('/photo-count', (req, res) => {
  const folderPath = path.join(__dirname, 'db_char');
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      res.status(500).json({ count: 0 });
    } else {
      const visibleFiles = files.filter(file => !file.startsWith('.'));
      res.json({ count: visibleFiles.length });
    }
  });
});

app.get('/user-list', (req, res) => {
  const users = Array.from(loginHandler.db.values())
      .filter(user => user.username && user.username !== 'raytoto0423')  // 관리자 제외
      .map(user => user.username);
  res.json({ users });
});

