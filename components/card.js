import React from 'react'
function Card(props) {
  let {index ,card, gap,isUserTurn,deckPos} = props
  const CARD_IMG_POSITION={
    "SUIT":{
      "Red":{x:0,y:0},
      "Green":{x:0,y:28},
      "Blue":{x:0,y:42},
      "Yellow":{x:0,y:14},
      "Wild":{x:7.586*13,y:0}
    },
    "VALUE":{
      "0":{x:0,y:0},
      "1":{x:7.586,y:0},
      "2":{x:7.586*2,y:0},
      "3":{x:7.586*3,y:0},
      "4":{x:7.586*4,y:0},
      "5":{x:7.586*5,y:0},
      "6":{x:7.586*6,y:0},
      "7":{x:7.586*7,y:0},
      "8":{x:7.586*8,y:0},
      "9":{x:7.586*9,y:0},
      "Skip":{x:7.586*10,y:0},
      "Reverse":{x:7.586*11,y:0},
      "Draw Two":{x:7.586*12,y:0},
      "Wild":{x:0,y:0},
      "Draw Four":{x:0,y:56}
    }
  }
  
  function renderPos(){
    //let cardWidth =70
    //let maxLength = 250
    //let cardGap = ((maxLength-cardWidth)/(counts-4))/10
    return gap+"rem"
  }
  function getCardPos(card){
    //move each card x+7.586% y+14%
    let moveX=CARD_IMG_POSITION.SUIT[card.suit].x+CARD_IMG_POSITION.VALUE[card.value].x;
    let moveY=CARD_IMG_POSITION.SUIT[card.suit].y+CARD_IMG_POSITION.VALUE[card.value].y;
    let x=0.68+moveX;
    let y=1+moveY;
    return x+"%"+" "+y+"%" 
  }
  const cardStyle = {zIndex: index + ''}
  
  if(deckPos==="player-bot" || deckPos==="player-top"){
    cardStyle.marginLeft=renderPos()
  }else{
    cardStyle.marginTop=renderPos()
  }
  
  const cardFrontStyle = {
    backgroundPosition: getCardPos(card),
  };

  
  return (
    <div className="card" style={cardStyle} >
      <div className={`card-front ${isUserTurn?"card-highlighted":null}`} style={cardFrontStyle}></div>
      <div className="card-back"></div>
    </div>
  )
}

export default Card