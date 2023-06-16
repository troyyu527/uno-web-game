import React from 'react';
import Card from '@components/card';
import { rejectCardAni } from '@utils/animation';

function UserDeck(props) {
  const {showCard,play,broadcastSE,SE,isReverse,setIsReverse,avaCheck,showSwitch,setSwitch,getNextPlayer,deck,mainDeck,discard,deckCards,setDeckCards,discardCards,setDiscardCards,mainCards,setMainCards,pos,currentPlayer,setCurrentPlayer} = props
  const isUserTurn = currentPlayer === deck.name;
  let cardGap = 3
  //Restore previous object(card array) when re-render
  deck.cards=deckCards
  mainDeck.cards=mainCards
  discard.cards=discardCards
  if(deckCards){
    if(deckCards.length>10 && deckCards.length<=15) cardGap = 2
    if(deckCards.length>15) cardGap = 1
  }
  async function playCard(e,cardIndex,card){
    // Handle the logic to play the selected card
    if(avaCheck(card,discard)){
      await play(deck,discard,cardIndex)
      if(deck.cards.length===1) broadcastSE(SE.call)
      if(deck.cards.length){
        if(card.suit==="Wild"){
          setSwitch([true,false,false])
        }else if(card.value==="Skip"||card.value==="Reverse"||card.value==="Draw Two"){
          if(card.value==="Reverse") setIsReverse(!isReverse)
          setSwitch([false,true,false])
        }else{
          getNextPlayer()
        }
      }else{
        setCurrentPlayer(null)
      }
      
      
    }else{
      rejectCardAni(e.currentTarget,broadcastSE,SE)
    }
    
    
  };
  
  return (
    <div className={`player ${pos}`}>
      {deckCards.map((card, index) => {
        const gap = index !== 0 ? cardGap : 0;
        return (
          <div className="card-style" key={index} style={{visibility:showCard?"visible":"hidden"}} onClick={isUserTurn && !showSwitch[2]? async (e)=>playCard(e,index,card):null}>
            <Card
              index={index}
              card={card}
              gap={gap}
              deckPos={pos}
              isUserTurn={isUserTurn}
            />
          </div>
        );
      })}
    </div>
  )
}

export default UserDeck