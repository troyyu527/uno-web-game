import React,{ useState,useEffect,useRef } from 'react'


function BGM(props) {
  const {isBGM} = props 
  const [volume, setVolume] = useState(30);
  const [showInput, setShowInput] = useState(false);
  const audioRef = useRef(null)
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      if (isBGM){
        audioElement.play();
      }else{
        audioElement.pause();
      } 
      audioElement.volume = volume / 100;
    }
  }, [isBGM, volume]);
  const handleInputChange = (event) => {
    setVolume(event.target.value);
  };
  const toggleInput = () => {
    setShowInput(!showInput);
  };
  return (
    <>
      <audio ref={audioRef} id="bgm" loop src="./audio/a-small-miracle.mp3" type="audio/mpeg" />
      <div className="music" onClick={toggleInput}/>
      {showInput && 
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={handleInputChange}
          className="volume-slider"
        />
      }
    </>
  )
}

export default BGM