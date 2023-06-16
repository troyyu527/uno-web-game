import React,{useEffect} from 'react';
import Card from '@components/card';
import { getOpt } from '@utils/AI_Strategies';
import { selectColorActAI } from '@utils/actions';

function PlayerDeck(props) {
  const {showCard,isPause,pauseEvent,play,hit,broadcastSE,SE,isReverse,setIsReverse,avaCheck,showSwitch,setSwitch,getNextPlayer,userName,deck,mainDeck,discard,deckCards,setDeckCards,discardCards,setDiscardCards,mainCards,setMainCards,pos,currentPlayer,setCurrentPlayer} = props
  const delay = ms => new Promise(res => setTimeout(res, ms));
  let cardGap = 3
  //Restore previous object(card array) when re-render
  deck.cards=deckCards
  mainDeck.cards=mainCards
  discard.cards=discardCards
  if(deckCards){
    if(deckCards.length>10 && deckCards.length<=15) cardGap = 2
    if(deckCards.length>15) cardGap = 1
  }
  //AI strategy
  useEffect(()=>{
    if(currentPlayer===deck.name && !showSwitch[2]){
      let options = getOpt(deck,discard)
      //Case 1 -No card to play,draw card
      if(options.length===0){
        drawCard()
      //Case 2 -Select card to play
      }else{
        playCard(options)
      }
    }
  },[currentPlayer])
  
  async function drawCard(){
    await delay(1000)
    await hit(mainDeck,deck)
    //case 1 -> play
    await delay(1000)
    if(avaCheck(deck.getBot(),discard)){
      let cardIndex = deck.length-1;
      let playCard = deck.getBot()
      await play(deck,discard,cardIndex)
      playCardLogic(playCard)
    //case 2 -> keep
    }else{
      getNextPlayer()
    }
    
  }
  async function playCard(options){
    let cardIndex= options[Math.floor(Math.random()*options.length)];
    let playCard = deck.getCard(cardIndex);
    await delay(1000)
    await play(deck,discard,cardIndex)
    if(deck.cards.length){
      playCardLogic(playCard)
    }else{
      setCurrentPlayer(null)
    }
    
  }
  function playCardLogic(playCard){
    if(deck.cards.length===1) broadcastSE(SE.call)
    if(playCard.suit==="Wild"){
      selectColorActAI(deck,discard);
      if(playCard.value==="Draw Four"){
        setSwitch([false,true,false])
      }else{
        getNextPlayer()
      }
    }else if(playCard.value==="Skip"||playCard.value==="Reverse"||playCard.value==="Draw Two"){
      if(playCard.value==="Reverse") setIsReverse(!isReverse)
      setSwitch([false,true,false])
    }else{
      getNextPlayer()
    }
  }
  return (
    <div className={`player ${pos}`}>
      {deckCards.map((card, index) => {
        const gap = index !== 0 ? cardGap : 0;
        return (
          <div className="card-style" key={index} style={{visibility:showCard?"visible":"hidden"}} >
            <Card
              index={index}
              card={card}
              gap={gap}
              deckPos={pos}
            />
          </div>
        );
      })}
    </div>
  )
}

export default PlayerDeck