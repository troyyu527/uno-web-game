import React,{useEffect} from 'react';

function Action(props){
  const {broadcastSE,SE,isReverse,setIsReverse,setSwitch,getNextPlayer,discard,currentDiscardCards,} = props
  const delay = ms => new Promise(res => setTimeout(res, ms));
  discard.cards=currentDiscardCards
 
  useEffect(()=>{
    showAct()
  },[])

  let actionStyle
  if(discard.getBot()){
    if(discard.getBot().value==="Skip"){
      actionStyle={
        backgroundImage:"url('./img/symbols/skip_black.svg')",
        backgroundSize:"300%",
      }
    }
    if(discard.getBot().value==="Reverse"){
      actionStyle={
        backgroundImage:"url('./img/symbols/reverse_black.svg')",
        backgroundSize:"200%",
      }
    }
    if(discard.getBot().value==="Draw Two"){
      actionStyle={
        backgroundImage:"url('./img/symbols/draw_two_black.svg')",
        backgroundSize:"190%",
      }
    }
    if(discard.getBot().value==="Draw Four"){
      actionStyle={
        backgroundImage:"url('./img/symbols/draw_four_black.svg')",
        backgroundSize:"190%",
      }
    } 
    
  }
  async function showAct(){
    //delay for finishing CSS animation
    broadcastSE(SE.action)
    await delay(1000)
    getNextPlayer()
    setSwitch([false,false,true]) 
  }
  
  return (
    <div className="action" style={actionStyle}> 
    </div>
  )
}

export default Action