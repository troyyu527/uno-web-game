import React from 'react';

function MainDeck(props) {
  const {deck,deckCards,hit,play,showSwitch,isPlayOpt,setIsPlayOpt,avaCheck,getNextPlayer,mainDeck,discard,discardCards,setDiscardCards,mainCards,setMainCards,currentPlayer} = props
  const isUserTurn = currentPlayer === deck.name;
  discard.cards=discardCards
  mainDeck.cards=mainCards
  deck.cards=deckCards
  
  async function hitUser(){
    await hit(mainDeck,deck)
    deck.getWeb().lastElementChild.style.visibility="hidden"
    if(avaCheck(deck.getBot(),discard)){
      
      setIsPlayOpt(true)
    }else{
      deck.getWeb().lastElementChild.style.visibility="visible"
      getNextPlayer()
    }
  }
  let layer =20
  let x=-1;
  let y=1;
  let str=""
  for(let i=0;i<layer;i++){
    let strPart= (x/10)+"rem "+(y/10)+"rem var(--card-border-color)"
    if(i!==layer-1){
      strPart+=",";
    }
    x--,y++,str+=strPart;
  }
  const deckStyle = {
    boxShadow:str
  }
  return (
    <div className="main-deck" onClick={isUserTurn && !showSwitch[2]? hitUser:null} >
      <div className="card-back top-card"></div>
      <div className="card-back card-deck" style={deckStyle}></div>
    </div>
  )
}

export default MainDeck