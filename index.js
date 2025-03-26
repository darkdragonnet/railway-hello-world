const http = require('http');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end('<h1>Hello World từ Railway!</h1><p>Đây là ứng dụng đơn giản để hiểu về server và Docker</p>');
});

server.listen(port, () => {
  console.log(`Server đang chạy tại port ${port}`);
});
