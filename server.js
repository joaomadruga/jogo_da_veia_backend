const { Socket } = require('socket.io');

const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true
    }
  });

let messages = []
let room = [];
// [socket1, socket2]

io.on('connection', socket => { 
    console.log(`Socket conectado: ${socket.id}`)
    console.log(`Socket status: ${socket.connected}`)
    

    for (var i = 0; i < room.length; i++){
      if (room[i].admin == socket.id || room[i].playerOSocket == socket.id){
      try {
        io.sockets.sockets.get(room[i].admin).emit('previousMessages', room[i].messages);
        io.sockets.sockets.get(room[i].playerOSocket).emit('previousMessages', room[i].messages);
      } catch (e){

      }
       break;
      }
     }

    

    socket.on('sendMessage', data => {
      messages.push(data);
      let playerOSocket, admin;
      for (var i = 0; i < room.length; i++){
       if (room[i].code == data.roomCode){
        playerOSocket = room[i].playerOSocket;
        admin = room[i].admin;
        const newObj = {
          admin: room[i].admin,
          code: room[i].code,
          playerX: room[i].playerX,
          playerOName: room[i].playerOName,
          playerOSocket: playerOSocket,
          messages: messages,
          playsX: room[i].playsX,
          playsO: room[i].playsO
        }
        room.splice(i, 1, newObj)
        break;
       }
      }
      console.log(messages)
      try{
        io.sockets.sockets.get(playerOSocket).emit('receivedMessage', data)
        io.sockets.sockets.get(admin).emit('receivedMessage', data)
        console.log('emiti!')
      }catch(e){}
      messages = []
    })

    socket.on('disconnect', () => {
      console.log('desconectou')
      for (var i = 0; i < room.length; i++){
        if(room[i].admin == socket.id){
          const playerOSocket = String(room[i].playerOSocket);
          try{
            io.emit('reloadPage', {adminSocket: socket.id, playerOSocket: playerOSocket})
            io.sockets.sockets.get(playerOSocket).disconnect();
          }catch(e){}
          socket.disconnect();
          room.splice(i, 1);
          break;
        }
      }
    });

    socket.on('createRoom', data => {
      let isNewRoomCode = false;
      let roomCode;
      while (isNewRoomCode == false){
        const temporaryRoomCode = String(Math.floor(Math.random() * 50000) + 1);
        isNewRoomCode = true;
        for (var i = 0; i < room.length; i++){
          if(room[i].code === temporaryRoomCode){
            isNewRoomCode = false;
            break;
          }
        }
        roomCode = temporaryRoomCode;
      }
      room.push({admin: data.adminSocket, code: roomCode, playerX: data.adminName, playsX: [], playsO: []})
      console.log(room)
      io.emit('roomCode', roomCode)
    })

    socket.on('joinRoom', data => {
      let isRoom = false;
      let actualRoom;
      let index;
      for (var i = 0; i < room.length; i++){
        if(String(room[i].code) == String(data.roomCode)){
          actualRoom = room[i];
          index = i;
          isRoom = true;
          console.log(room[i].admin.connected)
          break;
        }
      }
      io.emit('isRoom', isRoom)
      if(isRoom){
        const newObj = {
          admin: actualRoom.admin,
          code: actualRoom.code,
          playerX: actualRoom.playerX,
          playerOName: data.playerO,
          playerOSocket: data.socket,
          playsX: actualRoom.playsX,
          playsO: actualRoom.playsO
        }
        room.splice(index, 1, newObj)
        console.log(room)
      }
    })

    socket.on('clicked', data => {
      for (var i = 0; i < room.length; i++){
        if(String(room[i].code) == String(data.roomCode)){
          let playsX = room[i].playsX;
          let playsO = room[i].playsO;
          let shift;
          data.playsX !== null ? playsX.push(data.playsX) : shift = 'O'
          data.playsO !== null ? playsO.push(data.playsO) : shift = 'X'
          const newObj = {
            admin: room[i].admin,
            code: room[i].code,
            playerX: room[i].playerX,
            playerOName: room[i].playerOName,
            playerOSocket: room[i].playerOSocket,
            messages: room[i].messages || [],
            playsX: playsX,
            playsO: playsO
          }
          room.splice(i, 1, newObj)
          try{
            const playersName = [room[i].playerX, room[i].playerOName]
            data.playsX != null ? io.sockets.sockets.get(room[i].playerOSocket).emit('clicked', {play: data.playsX, shift: shift, playersName: playersName}) : io.sockets.sockets.get(room[i].playerOSocket).emit('clicked', {play: data.playsO, shift: shift, playersName: playersName}) 
            data.playsX != null ? io.sockets.sockets.get(room[i].admin).emit('clicked', {play: data.playsX, shift: shift, playersName: playersName}) : io.sockets.sockets.get(room[i].admin).emit('clicked', {play: data.playsO, shift: shift, playersName: playersName});
          }catch(e){
            console.log(e)
          }
          console.log(newObj)
          break;
        } 
      }

      socket.on('restartGame', data => {
        for (var i = 0; i < room.length; i++){
          if(String(room[i].code) == String(data)){
            let playsX = [];
            let playsO = [];
            let shift = 'X';
            const newObj = {
              admin: room[i].admin,
              code: room[i].code,
              playerX: room[i].playerX,
              playerOName: room[i].playerOName,
              playerOSocket: room[i].playerOSocket,
              messages: room[i].messages || [],
              playsX: playsX,
              playsO: playsO
            }
            room.splice(i, 1, newObj)
            try{
              data.playsX != null ? io.sockets.sockets.get(room[i].playerOSocket).emit('restartGame', shift) : io.sockets.sockets.get(room[i].playerOSocket).emit('restartGame', shift) 
              data.playsX != null ? io.sockets.sockets.get(room[i].admin).emit('restartGame', shift) : io.sockets.sockets.get(room[i].admin).emit('restartGame', shift);
            }catch(e){
              console.log(e)
            }
            console.log('reinicei')
            console.log(newObj)
            break;
          } 
        }
      })

      console.log(data)
    })

 });
server.listen(8000);