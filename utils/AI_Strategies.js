import {CARD_COLOR_SUIT,CARD_WILD_SUIT,CARD_COLOR_VALUE,CARD_WILD_VALUE} from '@utils/deck'
import {avaCheck} from '@utils/rule'
///Computer Strategies
//Apply Weight Points to each card currently hold
//Each card has to go thru Suit and Value stages, and add up it's points stage by stage 
//Select highest point card to play or draw card from main deck if no other options
//If highest point card has more than one, randomly play one of them




export function getOpt(player,discard){
  let index = 0
  let optList =[]
  let maxPt =[]
  
  player.cards.forEach(card=>{
    let point = wtList(card.suit,card.value,player.getMaxSuit(),player.getMaxValue())
    card.setWtPt(point);
    
    if(optList.length===0 && avaCheck(card,discard)){
      maxPt.push(point);
      optList.push(index);
    }else if(point === maxPt[0] && avaCheck(card,discard)){
      optList.push(index);
    }else if(point>maxPt[0] && avaCheck(card,discard)){
      optList=[];
      maxPt=[];
      optList.push(index);
    }
    index++
  })
  return optList
}

export function wtList(suit,value,maxSuit,maxValue){
  let point=0;
  //console.log(maxSuit,max)
  //Suit Stage 
  //Color-Suit
  if(CARD_COLOR_SUIT.includes(suit)){
    point+=2;
    if(maxSuit.includes(suit)){
      point+=3;
    }
  }
  //Wild-Suit
  if(CARD_WILD_SUIT.includes(suit)){
    point+= -1;
  }
  //Value Stage
  //Color-Value
  if(CARD_COLOR_VALUE.includes(value)){
    point+=1;
    if(maxValue.includes(value)){
      point+=2;
    }
  }
  //Wild-Value
  if(CARD_WILD_VALUE.includes(value)){
    point+= -1;
    if(maxValue.includes(value)){
      point+=1;
    }
  }
  return point
}



