const express= require('express')
const app= express()
const cors = require('cors')
const server= require('http').createServer(app)
require('dotenv').config()
const { threeos, moves, tempBoard1, setupBoard } = require('./data')

app.get('/', (req,res)=>{
  res.send('<h1>Server is up and running</h1>')
})

  
app.use(cors())

const io = require('socket.io')(server, {cors:{origin:"*"}})

  let initialGame={ 
    masterBoard: tempBoard1,
    placingCounter:0,
    brownChips:[0,1,2,3,4,5,6,7,8] ,
    yellowChips:[0,1,2,3,4,5,6,7,8],
   isYellowThreeo:false,
   isBrownThreeo:false,
   modal:'',
   earnedYellows:[],
   earnedBrowns:[],
   isYellowTurn:true,
   isBrownTurn:false,
   yellowCounter:0,
   brownCounter:0,
   yellowThreeos:[],
   brownThreeos:[],
   placedYellows:[],
   placedBrowns:[],
   aroundBrowns:[],
   aroundYellows:[],
   yThreeoNumber:[], 
   bThreeoNumber:[],
  }

const getGameEffects=(game=initialGame)=>{
      let flatThreeos = threeos.map((item) => game.masterBoard[item])
      let masterThreeos = []
      let yThreeos = []
      let bThreeos = []
      let yellows = [];
      let browns = [];
      let flatYellowThreeos = []
      let flatBrownThreeos = []
      for (let i = 0; i < flatThreeos.length; i += 3) {
        masterThreeos.push(flatThreeos.slice(i, i + 3))
      }
      yThreeos = masterThreeos.filter((item) => item[0].color === 'yellow' && item[1].color === 'yellow' && item[2].color === 'yellow')
      bThreeos = masterThreeos.filter((item) => item[0].color === 'brown' && item[1].color === 'brown' && item[2].color === 'brown')
      browns = game.masterBoard.filter((item) => item.color === 'brown')
      game.yellowCounter=yThreeos.length
      game.brownCounter=bThreeos.length

      yellows = game.masterBoard.filter((item) => item.color === 'yellow')
      browns = game.masterBoard.filter((item) => item.color === 'brown')
      flatYellowThreeos = yThreeos.flat().map(item => item.id)
      flatBrownThreeos = bThreeos.flat().map(item => item.id)
      game.yellowThreeos=[...new Set(flatYellowThreeos)]
      game.brownThreeos=[...new Set(flatBrownThreeos)]
      game.placedBrowns=browns
      game.placedYellows=yellows
      let emptyAroundYellows = yellows.map((item) => {
        return moves[item.id]
      }).flat().map(y => game.masterBoard[y]).filter(y => y.color === null)

      let emptyAroundBrowns = browns.map((item) => {
        return moves[item.id]
      }).flat().map(b => game.masterBoard[b]).filter(b => b.color === null)

      game.aroundBrowns=emptyAroundBrowns
      game.aroundYellows=emptyAroundYellows



}

const getNumberOfPlayersInRoom = (array, value) =>{
  let room = []
  for(let i= 0; i<array.length; i++){
    if(value===array[i]){
      room.push(array[i])
    }
  }
  return room.length
}

let players = []
let connectedRooms=[] 
let fullRooms=[]



io.on('connection', (socket)=>{
  console.log('new player connected');


socket.on('join room', (data)=>{
socket.join(data.room) 
const player = {
  room:data.room,
  id:socket.id
}
players.push(player)
connectedRooms.push(data.room)
fullRooms=getNumberOfPlayersInRoom(connectedRooms,data.room)
if(fullRooms===1){
  socket.emit('firstModal', 'waiting for someone else to join')
}
if(fullRooms===2){
  const turns = [true,false]
  const pointer = Math.floor(Math.random()*2)
  const turn = turns[pointer]
  socket.emit('yourTurn', turn)
  socket.to(data.room).emit('yourTurn', !turn)
  socket.emit('gameReady', 'both players joined. Start playing')
  socket.to(data.room).emit('gameReady', 'both players joined. Start playing.')
}
socket.emit('roomName', data.room)
io.emit('connectedRooms',connectedRooms)
socket.emit('playerName', data.player)
})


socket.on('firstTurn', data=>{
  socket.emit('firstTurn', data.turn)
  socket.to(data.room).emit('firstTurn',!data.turn)
})


socket.on('send message',(data)=>{
  
  socket.to(data.room).emit('new message',data)
  socket.to(data.room).emit('newMessage','new chat message')
})


  socket.on('start',data=>{
  socket.emit('startGame', data.game)
  socket.to(data.room).emit('startGame', data.game)
  const turns = [true,false]
  const pointer = Math.floor(Math.random()*2)
  const turn = turns[pointer]
  socket.emit('yourTurn', turn)
  socket.to(data.room).emit('yourTurn', !turn)

  })








// **** game actions **********

  socket.on('placeYellow',data=>{
    const game=data.game
    game.masterBoard[data.id]={id:data.id, color:'yellow', border:null,mark:null} 
    game.placingCounter=game.placingCounter +1
    game.yellowChips.pop()
    game.modal=''
    game.isBrownTurn=true
    game.isYellowTurn=false
    getGameEffects(game)
    game.yThreeoNumber.push(game.yellowCounter)
    if(data.yourTurn){

      socket.emit('yourTurn', !data.yourTurn)
    }
    if(data.room){

      socket.to(data.room).emit('yourTurn', data.yourTurn)
    }

    if(game.yThreeoNumber[game.yThreeoNumber.length-1]>game.yThreeoNumber[game.yThreeoNumber.length-2]&&game.placedBrowns.length!==game.brownThreeos.length){
    game.isYellowThreeo=true
    game.modal='Yellow Threeo'
    game.placingCounter=game.placingCounter-1
    game.isYellowTurn=true
    game.isBrownTurn=false
    if(data.yourTurn){

      socket.emit('yourTurn', data.yourTurn)
    }
    if(data.room){

      socket.broadcast.emit('yourTurn', !data.yourTurn)
    }
  }
  if(game.yThreeoNumber[game.yThreeoNumber.length-1]>game.yThreeoNumber[game.yThreeoNumber.length-2]&&game.placedBrowns.length===game.brownThreeos.length){
    game.modal='yellow threeo misfired. no non-threeo browns'
  }
  if (game.aroundBrowns.length === 0 && game.brownChips.length === 0){
    game.placingCounter=100
    game.modal='Yellows Win!...Browns are hostage...'
  }
    socket.emit('game',game)
    if(data.room){

      socket.to(data.room).emit('game',game)
      socket.emit('youPlayed', 'first')
    }
})



socket.on('placeBrown', data=>{
  goesSecond=socket.id
  const game=data.game
  game.masterBoard[data.id]={id:data.id, color:'brown', border:null, mark:null} 
  game.placingCounter=game.placingCounter+1
  game.brownChips.pop()
  game.modal=''
  game.isBrownTurn=false
  game.isYellowTurn=true
  getGameEffects(game)
  game.bThreeoNumber.push(game.brownCounter)
  if(data.yourTurn){

    socket.emit('yourTurn', !data.yourTurn)
  }
  if(data.room){

    socket.to(data.room).emit('yourTurn', data.yourTurn)
  }

  if(game.bThreeoNumber[game.bThreeoNumber.length-1]>game.bThreeoNumber[game.bThreeoNumber.length-2]&&game.placedYellows.length!==game.yellowThreeos.length){
  game.isBrownThreeo=true
  game.modal='Brown Threeo'
  game.placingCounter=game.placingCounter-1
  game.isYellowTurn=false
  game.isBrownTurn=true
if(data.yourTurn){

  socket.emit('yourTurn', data.yourTurn)
}
if(data.room){

  socket.to(data.room).emit('yourTurn', !data.yourTurn)
}
}
if(game.bThreeoNumber[game.bThreeoNumber.length-1]>game.bThreeoNumber[game.bThreeoNumber.length-2]&&game.placedYellows.length===game.yellowThreeos.length){
  game.modal='brown threeo misfired. no non-threeo yellows'
}
if(game.placingCounter===18){
  game.placingCounter=0
    socket.emit('yourTurn', !data.yourTurn)
  socket.to(data.room).emit('yourTurn', data.yourTurn)

}
    if (game.aroundYellows.length === 0 && game.brownChips.length === 0){
    game.placingCounter=100
    game.modal='Browns Win!...Yellows are hostage...'
  }


  socket.emit('game',game)

  if(data.room){

    socket.to(data.room).emit('game',game)
  
    socket.emit('youPlayed', 'second')
  }
})




socket.on('captureBrownPlacing', data=>{
  const game =data.game
  game.masterBoard[data.id]={id:data.id, color:null, border:null, mark:null}
  game.placingCounter=game.placingCounter+1
  game.isYellowThreeo=false
  game.modal=''
  game.isBrownTurn=true
  game.isYellowTurn=false
  game.earnedBrowns.push(game.earnedBrowns.length)
  getGameEffects()
   game.yThreeoNumber.push(game.yellowCounter)

  socket.emit('game',game)
  if(data.room){
    socket.to(data.room).emit('game',game)
  }
  if(data.yourTurn){

    socket.emit('yourTurn', !data.yourTurn)
  }
  if(data.room){

    socket.to(data.room).emit('yourTurn', data.yourTurn)
  }

})


socket.on('captureYellowPlacing', data=>{
  const game=data.game
  game.masterBoard[data.id]={id:data.id, color:null, border:null, mark:null}
  game.placingCounter=game.placingCounter+1
  game.isBrownThreeo=false
  game.modal=''
  game.isYellowTurn=true
  game.isBrownTurn=false
  game.earnedYellows.push(game.earnedYellows.length)
  getGameEffects()
  game.bThreeoNumber.push(game.brownCounter)
  socket.emit('game',game)
  if(data.room){
    socket.to(data.room).emit('game', game)
  }
  if(data.turn){

    socket.emit('yourTurn', !data.yourTurn)
  }
  if(data.room){

    socket.to(data.room).emit('yourTurn', data.yourTurn)
  }
})

socket.on('lastYellowCapturePlacing',data=>{
  const game=data.game
  game.masterBoard[data.id]={id:data.id, color:null, border:null,mark:null}
  game.placingCounter=0
  game.isBrownThreeo=false
  game.modal=''
  game.isBrownTurn=false
  game.isYellowTurn=true
  game.earnedYellows.push(game.earnedYellows.length)
  getGameEffects()
  game.bThreeoNumber.push(game.brownCounter)
  socket.emit('game',game)
  if(data.room){

    socket.to(data.room).emit('game',game)
  }
  if(data.yourTurn){

    socket.emit('yourTurn', !data.yourTurn)
  }

  if(data.room){

    socket.to(data.room).emit('yourTurn', data.yourTurn)
  }


})



 socket.on('pickupYellowMoving',data=>{
   const game = data.game
        let potentialMoves = moves[data.id].map((item)=>{
      return game.masterBoard[item]
  }).filter(item=>item.color===null)
  if(potentialMoves.length!==0){
  game.masterBoard[data.id] = { id: data.id, color: 'yellow', border: null, mark:'mark' }
  }
  let newPotential=potentialMoves.map((item)=>{
    return {id:item.id, color:null, border:'border'}
  })

 let newBoard = setupBoard(game.masterBoard, newPotential)
game.masterBoard=newBoard
  


  game.placingCounter=1
  game.modal=''
  game.isYellowTurn=true
  game.isBrownTurn=false
  getGameEffects(game)
  game.yThreeoNumber.push(game.yellowCounter)
  socket.emit('game',game)
  if(data.room){

    socket.to(data.room).emit('game',game)
  }
  if(data.yourTurn){

    socket.emit('yourTurn', data.yourTurn)
  }
  if(data.room){

    socket.to(data.room).emit('yourTurn', !data.yourTurn)
  }



 })


socket.on('placeYellowMoving',data=>{
  const game = data.game
  game.masterBoard[data.id]={id:data.id, color:'yellow', border:null, mark:null} 
  game.masterBoard[data.prevId]={id:data.prevId,color:null, border:null, mark:null}
  game.masterBoard.forEach(item=>{
    item.border=null
  })
  game.placingCounter=2
  game.modal=''
  game.isYellowTurn=false
  game.isBrownTurn=true
  getGameEffects(game)
  game.yThreeoNumber.push(game.yellowCounter)
  if(game.yThreeoNumber[game.yThreeoNumber.length-1]>game.yThreeoNumber[game.yThreeoNumber.length-2]&&game.placedBrowns.length!==game.brownThreeos.length){
  game.isYellowThreeo=true
  game.modal='Yellow Threeo'
  game.placingCounter=1
  game.isBrownTurn=false
  game.isYellowTurn=true
  if(data.yourTurn){

    socket.emit('yourTurn', data.yourTurn)
  }
  if(data.room){

    socket.to(data.room).emit('yourTurn', !data.yourTurn)
  }
 }else{
   if(data.yourTurn){

     socket.emit('yourTurn', !data.yourTurn)
   }
   if(data.room){

     socket.to(data.room).emit('yourTurn', data.yourTurn)
   }
 }
 if(game.yThreeoNumber[game.yThreeoNumber.length-1]>game.yThreeoNumber[game.yThreeoNumber.length-2]&&game.placedBrowns.length===game.brownThreeos.length){
   game.modal='yellow threeo misfire. no non-threeo browns'
 }
  if (game.aroundBrowns.length === 0 && game.brownChips.length === 0){
    game.placingCounter=100
    game.modal='Yellows Win!...Browns are hostage...'
  }


  socket.emit('game',game)
  if(data.room){

    socket.to(data.room).emit('game',game)
  }
})

socket.on('captureBrownMoving', data=>{
  const game= data.game
  game.masterBoard[data.id] ={id:data.id, color:null, border:null,mark:null}
  game.placingCounter=2
  game.isYellowThreeo=false
  game.modal=''
  game.isYellowTurn=false
  game.isBrownTurn=true
  game.earnedBrowns.push(game.earnedBrowns.length)
   getGameEffects(game)
   
  if(game.earnedBrowns.length===7){
    game.placingCounter=100
    game.modal='Yellows win...!  Click start to play again'
  }



  game.yThreeoNumber.push(game.yellowCounter)
  if(data.yourTurn){

    socket.emit('yourTurn', !data.yourTurn)
  }
  if(data.room){

    socket.to(data.room).emit('yourTurn', data.yourTurn)
    socket.to(data.room).emit('game',game)
  }
  socket.emit('game',game)


})

 socket.on('pickupBrownMoving',data=>{
   const game= data.game
     let potentialMoves = moves[data.id].map((item)=>{
      return game.masterBoard[item]
  }).filter(item=>item.color===null)
  if(potentialMoves.length!==0){
  game.masterBoard[data.id] = { id: data.id, color: 'brown', border: null, mark:'mark' }
  }
  let newPotential=potentialMoves.map((item)=>{
    return {id:item.id, color:null, border:'border'}
  })

 let newBoard = setupBoard(game.masterBoard, newPotential)
  game.masterBoard=newBoard
  game.placingCounter=3
  game.modal=''
  game.isBrownTurn=true
  game.isYellowTurn=false
  getGameEffects(game)
   game.bThreeoNumber.push(game.brownCounter)
  socket.emit('game',game)
  if(data.room){

    socket.to(data.room).emit('game',game)
    socket.to(data.room).emit('yourTurn', !data.yourTurn)
  }
  if(data.yourTurn){

    socket.emit('yourTurn', data.yourTurn)
  }

 })

 socket.on('placeBrownMoving',data=>{
   const game=data.game
  game.masterBoard[data.id]={id:data.id, color:'brown', border:null, mark:null}
  game.masterBoard[data.prevId]={id:data.prevId, color:null, border:null, mark:null}
  game.masterBoard.forEach(item=>{
    item.border=null
  })
  game.placingCounter=0
  game.modal=''
  game.isYellowTurn=true
  game.isBrownTurn=false
  getGameEffects(game)
  game.bThreeoNumber.push(game.brownCounter)
  if(data.yourTurn){

    socket.emit('yourTurn', !data.yourTurn)
  }
  if(data.room){

    socket.to(data.room).emit('yourTurn', data.yourTurn)
  }

  if(game.bThreeoNumber[game.bThreeoNumber.length-1]>game.bThreeoNumber[game.bThreeoNumber.length-2]&&game.placedYellows.length!==game.yellowThreeos.length){
  game.isBrownThreeo=true
  game.modal='Brown Threeo'
  game.placingCounter=3
  game.isBrownTurn=true
  game.isYellowTurn=false

  if(data.yourTurn){

    socket.emit('yourTurn', data.yourTurn)
  }
  if(data.room){

    socket.to(data.room).emit('yourTurn', !data.yourTurn)
  }
}
if(game.bThreeoNumber[game.bThreeoNumber.length-1]>game.bThreeoNumber[game.bThreeoNumber.length-2]&&game.placedYellows.length===game.yellowThreeos.length){
  game.modal='brown threeo misfire. no non-threeo yellows'
}
    if (game.aroundYellows.length === 0 && game.yellowChips.length === 0){
    game.placingCounter=100
    game.modal='Browns Win!...Yellows are hostage...'
  }


  socket.emit('game',game)
  if(data.room){

    socket.to(data.room).emit('game',game)
  }


 })

 socket.on('captureYellowMoving',data=>{
const game=data.game
 game.masterBoard[data.id] ={id:data.id, color:null, border:null, mark:null}
  game.placingCounter=0
  game.isBrownThreeo=false
  game.modal=''
  game.isYellowTurn=true
  game.isBrownTurn=false
  game.earnedYellows.push(game.earnedYellows.length)
  if(game.earnedYellows.length===7){
    game.placingCounter=100
    game.modal='Browns win...!  Click start to play again'
  }
getGameEffects
  game.bThreeoNumber.push(game.brownCounter)
  socket.emit('game',game)
  if(data.room){

    socket.to(data.room).emit('game',game)
    socket.to(data.room).emit('yourTurn', data.yourTurn)
  }
  if(data.yourTurn){

    socket.emit('yourTurn', !data.yourTurn)
  }

 })


// Navigation*******************************

socket.on('navigateBack',data=>{
  const id = socket.id
 if(data.back){
    const game =data.game

    game.masterBoard=data.back.masterBoard
 
    game.placingCounter=data.back.placingCounter
    game.isYellowThreeo=data.back.isYellowThreeo
    game.isBrownThreeo=data.back.isBrownThreeo
    game.isBrownTurn=data.back.isBrownTurn
    game.isYellowTurn=data.back.isYellowTurn
    game.modal=data.back.modal
    game.yellowChips=data.back.yellowChips
    game.brownChips=data.back.brownChips
    game.earnedBrowns=data.back.earnedBrowns
    game.earnedYellows=data.back.earnedYellows
    game.yellowCounter=data.back.yellowCounter
   game.brownCounter=data.back.brownCounter
   game.yellowThreeos=data.back.yellowThreeos
   game.brownThreeos=data.back.brownThreeos
   game.placedYellows=data.back.placedYellows
   game.placedBrowns=data.back.placedBrowns
   game.aroundBrowns=data.back.aroundBrowns
   game.aroundYellows=data.back.aroundYellows
   game.yThreeoNumber=data.back.yThreeoNumber
   game.bThreeoNumber=data.back.bThreeoNumber

    socket.emit('navigateBack', game)
    if(data.room){

      socket.to(data.room).emit('navigateBack',game)
      socket.to(data.room).emit('navigationModal','navigating back')
      socket.to(data.room).emit('yourTurn', data.yourTurn)
    }
    socket.emit('navigationModal','navigating back')

 }
})


socket.on('navigateForward',data=>{
  if(data.forward){

    const game=data.game
   

    game.masterBoard=data.forward.masterBoard
    game.placingCounter=data.forward.placingCounter
    game.isYellowThreeo=data.forward.isYellowThreeo
    game.isBrownThreeo=data.forward.isBrownThreeo
    game.isBrownTurn=data.forward.isBrownTurn
    game.isYellowTurn=data.forward.isYellowTurn
    game.modal=data.forward.modal
    game.yellowChips=data.forward.yellowChips
    game.brownChips=data.forward.brownChips
    game.earnedBrowns=data.forward.earnedBrowns
    game.earnedYellows=data.forward.earnedYellows
    game.yellowCounter=data.forward.yellowCounter
   game.brownCounter=data.forward.brownCounter
   game.yellowThreeos=data.forward.yellowThreeos
   game.brownThreeos=data.forward.brownThreeos
   game.placedYellows=data.forward.placedYellows
   game.placedBrowns=data.forward.placedBrowns
   game.aroundBrowns=data.forward.aroundBrowns
   game.aroundYellows=data.forward.aroundYellows
   game.yThreeoNumber=data.forward.yThreeoNumber
   game.bThreeoNumber=data.forward.bThreeoNumber


    socket.emit('navigateForward', game)
    if(data.room){

      socket.to(data.room).emit('navigateForward',game)
      socket.to(data.room).emit('yourTurn',data.yourTurn)
      socket.to(data.room).emit('navigationModal','navigating forward')
    }
    socket.emit('navigationModal','navigating forward')


  }
})

 


 

socket.on('disconnect',()=>{
  if(socket.id){
  const gonePlayer = players.find(p=>p.id===socket.id)
  if(gonePlayer){

    const room = gonePlayer.room
    socket.to(room).emit('playerLeft', 'opponent left the game')
    const playerIndex = players.indexOf(gonePlayer)
      connectedRooms=connectedRooms.filter(room=>connectedRooms.indexOf(room)!==playerIndex)
      players=players.filter(p=>p.id!==socket.id)
  }
  }
  

  console.log('user has left!!!');
})

 }) 


server.listen(process.env.PORT || 5000, () => console.log(`Server has started.`));