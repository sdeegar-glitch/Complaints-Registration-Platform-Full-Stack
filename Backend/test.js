const express = require('express');
const app = express();

const adminRoutes = express.Router();
adminRoutes.get('/stats', (req, res) => res.send('stats'));

const complaintRoutes = express.Router();
complaintRoutes.patch('/admin/complaints/:id/reopen', (req, res) => res.send('reopen'));

app.use('/api/admin', adminRoutes);
app.use('/api', complaintRoutes);

app.use((req, res) => {
  res.status(404).send('Not Found Fallback');
});

const http = require('http');
const server = http.createServer(app);
server.listen(0, () => {
  const port = server.address().port;
  http.request({
    port,
    method: 'PATCH',
    path: '/api/admin/complaints/123/reopen'
  }, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log('Result:', data);
      process.exit(0);
    });
  }).end();
});
