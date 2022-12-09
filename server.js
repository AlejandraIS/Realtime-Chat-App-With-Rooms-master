//const express = require('express')

var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server)

app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

const rooms = { }

app.get('/', (req, res) => {
  res.render('index', { rooms: rooms })
})

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
 });

app.post('/room', (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect('/')
  }
  rooms[req.body.room] = { users: {} }
  res.redirect(req.body.room)
  // Send message that new room was created
  io.emit('room-created', req.body.room)
})

app.get('/:room', (req, res) => {
  if (rooms[req.params.room] == null) {
    return res.redirect('/')
  }
  res.render('room', { roomName: req.params.room })
})

server.listen(process.env.PORT || 3000);

/*var port_number = server.listen(process.env.PORT || 8080);
app.listen(port_number);*/

io.on('connection', socket => {
  socket.on('new-user', (room, name) => {
    socket.join(room)
    rooms[room].users[socket.id] = name
    socket.to(room).broadcast.emit('user-connected', name)
  })
  socket.on('send-chat-message', (room, message) => {
    socket.to(room).broadcast.emit('chat-message', { message: message, name: rooms[room].users[socket.id] })
  })

  socket.on('disconnect', () => {
    getUserRooms(socket).forEach(room => {
      socket.to(room).broadcast.emit('user-disconnected', rooms[room].users[socket.id])
      delete rooms[room].users[socket.id]
    })
  })

  socket.on('add:figure',data => {
    socket.broadcast.emit('add-figure',data);
  })
  socket.on('add:moving', data => {
    socket.broadcast.emit('add-moving',data);
  })
  socket.on('delete:figure', data => {
    socket.broadcast.emit('delete-figure',data);
  })
  socket.on('edit:text', data => {
    socket.broadcast.emit('edit-text',data);
  })
 /*.....CHAT...........
  socket.on('chat:message', (data)=>{
  io.sockets.emit('chat-message',data);
  })
  socket.on('chat:typing', (data) => {
  socket.broadcast.emit('chat-typing',data);
  })*/

})

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name)
    return names
  }, [])
}