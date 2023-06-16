import React from 'react';
import Card from '@components/card';

function OptCard(props){
  const {play,broadcastSE,SE,isPlayOptcard,setIsPlayOpt,setSwitch,isReverse,setIsReverse,getNextPlayer,deck,deckCards,discard,discardCards} = props
  const delay = ms => new Promise(res => setTimeout(res, ms));
  discard.cards=discardCards
  deck.cards=deckCards
  
  async function playCardAct(){
    let card = deck.getBot()
    let cardIndex = deck.cards.length-1
    setIsPlayOpt(false)
    await play(deck,discard,cardIndex)
    if(deck.cards.length===1) broadcastSE(SE.call)
    if(card.suit==="Wild"){
      setSwitch([true,false,false])
    }else if(card.value==="Skip"||card.value==="Reverse"||card.value==="Draw Two"){
      if(card.value==="Reverse") setIsReverse(!isReverse)
      setSwitch([false,true,false])
    }else{
      getNextPlayer()
    }
    
  }
  function keepCardAct(){
    deck.getWeb().lastElementChild.style.visibility="visible"
    setIsPlayOpt(false)
    getNextPlayer()
  }
  return (
    <div className="play-keep-btn"> 
      <Card card={deck.getBot()}/>
      <div className='play-btn' onClick={playCardAct}>PLAY</div>
      <div className='keep-btn' onClick={keepCardAct}>KEEP</div>
    </div>
  )
}

export default OptCard