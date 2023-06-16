import React from 'react';

function GameOver(props){
  const {winner,backHome,startGame,setIsGameOver}=props

  const handleRematch = ()=>{
    setIsGameOver(false)
    startGame()
  }
  const handleExit = ()=>{
    backHome()
  }
  return (
    <div className='gameover-body'>
      <div id="tudo">

        <div className="gameover">
        <p> GAME </p>
        <p> OVER </p>
        </div>

        <div className="continue"> <p> CONTINUE? </p> </div>

        <div className="opcoes">
          <div className="yes" onClick={handleRematch}>YES</div>
          <div className="no" onClick={handleExit}>NO</div>
        </div>

      </div>
    </div>
    
  );
};

export default GameOver;