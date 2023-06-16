import React,{useEffect} from 'react';

function Penalty(props){
  const {showSwitch,setSwitch,getNextPlayer,hit,mainDeck,currentMainCards,deck,currentDeckCards,actCard} = props
  const delay = ms => new Promise(res => setTimeout(res, ms));
  mainDeck.cards=currentMainCards
  

  useEffect(()=>{
    showPenalty()
    
  },[])
  
  let penaltyStyle
  if(actCard.value==="Skip"){
    penaltyStyle={
      backgroundImage:"url('./img/symbols/skip_white.svg')",
      width:"12rem",
      height:"12rem",
      backgroundSize:"200%",
    }
  }
  if(actCard.value==="Draw Two"){
    penaltyStyle={
      backgroundImage:"url('./img/symbols/draw_two_number_white.svg')",
      backgroundSize:"190%",
    }
  }
  if(actCard.value==="Draw Four"){
    penaltyStyle={
      backgroundImage:"url('./img/symbols/draw_four_number_white.svg')",
      backgroundSize:"190%",
    }
  }
  async function showPenalty(){
    if(actCard.value==="Skip"){
      //delay for finishing CSS animation
      await delay(1000);
    }
    if(actCard.value==="Draw Two"){
      //playing card total 2s > 1s CSS animation => ok
      for(let i=0;i<2;i++){
        await hit(mainDeck,deck,500);
      }
    }
    if(actCard.value==="Draw Four"){
      //playing card total 2s > 1s CSS animation => ok
      for(let i=0;i<4;i++){
        await hit(mainDeck,deck,500);
      }
    }
    setSwitch([false,false,false])
    getNextPlayer()
  }
  
  return (
    <div className="penalty" style={penaltyStyle}>
    </div>
  )
}

export default Penalty