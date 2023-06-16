import React,{useEffect} from 'react';
import { setWildCard } from '@utils/actions';
function SelectColor(props){
  const {setSwitch,getNextPlayer,discard,currentDiscardCards} = props
  discard.cards=currentDiscardCards
  
  function setColor(e){
    setWildCard(discard,e.currentTarget.getAttribute('color'));
    if(discard.getBot().value==="Draw Four"){
      setSwitch([false,true,false])
    }else{
      setSwitch([false,false,false])
      getNextPlayer()
    }
  }
  
  const red={
    backgroundColor:"#ff5555",
    borderRadius:"50% 0 0 0"
  }
  const blue={
    backgroundColor:"#5555ff",
    borderRadius:"0 50% 0 0"
  }
  const yellow={
    backgroundColor:"#ffaa00",
    borderRadius:"0 0 0 50%"
  }
  const green={
    backgroundColor:"#55aa55",
    borderRadius:"0 0 50% 0"
  }
  return (
    <div className="selectColor">
      <div className="color" style={red} color={"Red"} onClick={(e)=>setColor(e)}></div>
      <div className="color" style={blue} color={"Blue"} onClick={(e)=>setColor(e)}></div>
      <div className="color" style={yellow} color={"Yellow"} onClick={(e)=>setColor(e)}></div>
      <div className="color" style={green} color={"Green"} onClick={(e)=>setColor(e)}></div>
    </div>
  )
}

export default SelectColor