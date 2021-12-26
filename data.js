let spots = [];
for(let i=0; i<=168; i++){
 spots.push(i)
}
 const setupBoard = (arr1=[], arr2=[]) =>{
let c = arr2.map(noob=>noob.id)
let d= arr1.filter((item)=>c.indexOf(item.id)===-1)
return [...new Set([...arr2, ...d].sort((a,b)=>a.id-b.id))]
}

 let board= spots.map((spot)=>{
  return {id:spot, color: null, border: null}
})

const threeos = [
  0,  6, 12, 
  12,  90, 168, 
  168,  162, 156, 
  156,  78, 0, 
  28,  32, 36, 
  36,  88, 140, 
  140,  136, 132, 
  132,  80, 28, 
  56,  58, 60, 
  60,  86, 112, 
  112,  110, 108, 
  108,  82, 56, 
  6,  32, 58, 
  86,  88, 90, 
  162,  136, 110, 
  78,  80, 82, 
]
const moves = {
  0 : [6,78],
  6:  [0,32,12],
  12: [6,90],
  28: [32,80],
  32: [28, 6, 36, 58],
  36: [32,88],
  56: [82, 58],
  58: [56, 32, 60],
  60: [58,86],
  78: [156, 0, 80],
  80: [78,28,82,132],
  82: [80, 56, 108],
  86: [60, 88, 112],
  88: [86, 36, 90, 140],
  90: [88, 12, 168],
  108: [82, 110],
  110: [108, 136, 112],
  112: [110, 86],
  132: [80, 136],
  136: [132, 110, 140, 162],
  140: [136, 88],
  156: [78, 162],
  162: [156, 136, 168],
  168: [162, 90]
}


let arr1 =[{id:1,color:null},{id:2,color:null}, {id:3, color:null}]
let arr2 =[{id:1,color:'yellow'},{id:2,color:'yellow'}, ]
const updateBoard= (arr1,arr2)=>{
   arr1.forEach((item)=>{
   arr2.forEach((chip)=>{
     if(item.id===chip.id){
       item.color=chip.color
     }
   })
 })
return arr1
}

let a= [0,1,2,3,4,5,6]
let b=[]
let c=[]

 let tempBoard = [...board ]
 let tempBoard1= [...board]
 let tempBoard2= [...board]
 module.exports={tempBoard,tempBoard1, tempBoard2, threeos, moves,updateBoard,setupBoard }