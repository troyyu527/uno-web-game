import React, { useState, useEffect } from 'react';

function Setting(props) {
  const { isPause, setIsPause, currentPlayer, user } = props;
  const [showMsg, setShowMsg] = useState(false);

  useEffect(() => {
    let timer;
    if (showMsg) {
      timer = setTimeout(() => {
        setShowMsg(false);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [showMsg]);

  function togglePause() {
    setIsPause(!isPause);
  }

  function handleSettingClick() {
    if (currentPlayer === user) {
      togglePause();
    } else {
      setShowMsg(true);
    }
  }

  return (
    <>
      <div className="setting" onClick={handleSettingClick}></div>
      {showMsg && currentPlayer !== user && (
        <div className="warning">Please wait until your turn!</div>
      )}
    </>
  );
}


export default Setting