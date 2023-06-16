import React,{useRef } from 'react'

function SoundTrack() {
  const audio1 = useRef(null)
  const audio2 = useRef(null)
  const audio3 = useRef(null)
  const audio4 = useRef(null)
  const audio5 = useRef(null)
  const audio6 = useRef(null)
  let seList = [
    {
      dom:audio1.current,
      finishTime:0
    },
    {
      dom:audio2.current,
      finishTime:0
    },
    {
      dom:audio3.current,
      finishTime:0
    },
    {
      dom:audio4.current,
      finishTime:0
    },
    {
      dom:audio5.current,
      finishTime:0
    },
    {
      dom:audio6.current,
      finishTime:0
    },
  ]
  //Global Sound effect
  const SE = {
    deal: {
      path: 'audio/card-delt.mp3',
      type: 'audio/mpeg',
      duration: 500,
      volume: 1,
    },
    play: {
      path: 'audio/card-play.mp3',
      type: 'audio/mpeg',
      duration: 500,
      volume: 1,
    },
    action: {
      path: 'audio/card-action.mp3',
      type: 'audio/mpeg',
      duration: 500,
      volume: 1,
    },
    reject: {
      path: 'audio/card-reject.mp3',
      type: 'audio/mpeg',
      duration: 500,
      volume: 1,
    },
    call: {
      path: 'audio/uno-call.mp3',
      type: 'audio/mpeg',
      duration: 500,
      volume: 0.5,
    },
    gameOver: {
      path: 'audio/game-win.mp3',
      type: 'audio/mpeg',
      duration: 2000,
      volume: 1,
    }
  };
  function broadcastSE(se){
    const now = new Date().getTime();
    const potentialDom = seList.find((item) => item.finishTime < now);
    if (potentialDom) {
      potentialDom.dom.setAttribute('src', se.path);
      potentialDom.dom.setAttribute('type', se.type);
      if(volume.value/100<0.05){
        potentialDom.dom.volume = 0
      }else{
        potentialDom.dom.volume = se.volume;
      }
      potentialDom.finishTime = now + se.duration;
      setTimeout(() => potentialDom.dom.play(), 0);
    }else{
      console.log("Unable to play",se.path)
    }
  }
  return (
    <>
      <audio ref={audio1}/>
      <audio ref={audio2}/>
      <audio ref={audio3}/>
      <audio ref={audio4}/>
      <audio ref={audio5}/>
      <audio ref={audio6}/>
    </>
  )
}

export default SoundTrack