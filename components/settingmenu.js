import React, { useState} from 'react';
import Rule from '@components/rule';
import DataPage from '@components/datapage';
import AuthService from '@utils/services/auth.service';

function SettingMenu(props) {
  const {user, isPause, setIsPause, backHome,showData,loadData,loadGame,dirToGame,setShowData,getCurrentData,gameData,setGameData } = props;
  const [showRule, setShowRule] = useState(false);
  const [dataTitle,setDataTitle] = useState("Load");
  
  
  function togglePause() {
    setIsPause(!isPause);
  }

  function toggleRule() {
    setShowRule(!showRule);
  }

  function openDataPage(title){
    setDataTitle(title)
    setShowData(true)
  }
  
  return (
    <div className="model-setting">
      {!showRule && !showData &&(
        <div className="model-content-setting">
          <div className="menu-bar" onClick={togglePause}>
            Resume
          </div>
          <div className="menu-bar" onClick={toggleRule}>
            Rule
          </div>
          <div className="menu-bar" onClick={()=>openDataPage("Save")}>
            Save
          </div>
          <div className="menu-bar" onClick={()=>openDataPage("Load")}>
            Load
          </div>
          <div className="menu-bar" onClick={backHome}>
            Exit the Game
          </div>
        </div>
      )}

      {showRule && !showData &&(
        <Rule toggleRule={toggleRule}/>
      )}
      {showData && !showRule &&(
        <DataPage 
        title={dataTitle} 
        loadData={loadData}
        dirToGame={dirToGame}
        setShowData={setShowData}
        getCurrentData={getCurrentData}
        gameData={gameData}
        setGameData={setGameData}
        />
      )}
    </div>
  );
}


export default SettingMenu