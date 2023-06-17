import React,{ useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

import MainDeck from '@components/maindeck';
import PlayerDeck from '@components/playerdeck';
import UserDeck from '@components/userdeck';
import ProfileInfo from '@components/profileinfo';
import Discard from '@components/discard';
import SelectColor from '@components/selectcolor';
import Setting from '@components/setting';
import TurnDirection from '@components/turndirection';
import BGM from '@components/bgm';
import Action from '@components/action';
import Penalty from '@components/penalty';
import OptCard from '@components/optcard';
import GameOver from '@components/gameover';
import SettingMenu from '@components/settingmenu';
import DataPage from '@components/datapage';

import {Deck,freshDeck, Card} from '@utils/deck'
import { Player } from '@utils/player';
import { playCardAni,hitCardAni } from '@utils/animation';
import AuthService from '@utils/services/auth.service';

//import {start} from '../public/src/main'
function Game(){
  const initialHits = 7;
  const router = useRouter();
  const initHitCardTime = 200;
  const playCardTime = 1000;
  //state varies
  const [isPause,setIsPause] = useState(false)
  const [isGame, setIsGame] = useState(false);
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser())
  const [showColActPen,setColActPen] = useState([false,false,false])
  const [isReverse,setIsReverse] = useState(false);
  const [isPlayOpt,setIsPlayOpt] = useState(false)
  const [isBGM,setIsBGM] = useState(true)
  const [isGameOver,setIsGameOver] = useState(false)
  const [showData, setShowData] = useState(false);
  const [showMenuData, setShowMenuData] = useState(false);
  const [showCard, setShowCard] = useState(false);

  
  const delay = ms => new Promise(res => setTimeout(res, ms));
  let user = currentUser?currentUser.user:"Player"
  let winner = null
  
  
  const [gameData, setGameData] = useState([{},{},{},{}]);

  //initial profiles
  let playerQueue = [user,"AI-1","AI-2","AI-3"];
  let p1 = new Player(playerQueue[0],'.player-bot');
  let p2 = new Player(playerQueue[1],'.player-left');
  let p3 = new Player(playerQueue[2],'.player-top');
  let p4 = new Player(playerQueue[3],'.player-right');
  let playerDecks = [p1,p2,p3,p4]
  //initial cards
  let mainDeck = new Deck(freshDeck(),'.main-deck');
  let discard = new Deck([],'.discard-pile')
  //initial deck state
  const [currentPlayerQueue,setCurrentPlayerQueue] = useState(playerQueue)
  const [currentPlayer,setCurrentPlayer] = useState(null)
  const [currentP1Cards,setCurrentP1Cards] = useState(p1.cards);
  const [currentP2Cards,setCurrentP2Cards] = useState(p2.cards);
  const [currentP3Cards,setCurrentP3Cards] = useState(p3.cards);
  const [currentP4Cards,setCurrentP4Cards] = useState(p4.cards);
  const [currentMainCards,setCurrentMainCards] = useState(mainDeck.cards);
  const [currentDiscardCards,setCurrentDiscardCards] = useState(discard.cards);
  const [currentWinner,setCurrentWinner] = useState(null)
  //
  const backHome = () =>{router.push('/')}
  //Sound Effect
  const audio1 = useRef(null)
  const audio2 = useRef(null)
  const audio3 = useRef(null)
  const audio4 = useRef(null)
  const audio5 = useRef(null)
  const audio6 = useRef(null)
  let seList = [
    {
      dom:audio1,
      finishTime:0
    },
    {
      dom:audio2,
      finishTime:0
    },
    {
      dom:audio3,
      finishTime:0
    },
    {
      dom:audio4,
      finishTime:0
    },
    {
      dom:audio5,
      finishTime:0
    },
    {
      dom:audio6,
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
      potentialDom.dom.current.setAttribute('src', se.path);
      potentialDom.dom.current.setAttribute('type', se.type);
      // if(volume.value/100<0.05){
      //   potentialDom.dom.current.volume = 0
      // }else{
        potentialDom.dom.current.volume = se.volume;
      //}
      potentialDom.finishTime = now + se.duration;
      setTimeout(() => potentialDom.dom.current.play(), 0);
    }else{
      console.log("Unable to play",se.path)
    }
  }
  //
  useEffect(()=>{
    AuthService.getGameData(user)
    .then(res=>{
      let sortGameData = [{},{},{},{}]
      res.data.forEach((obj,i)=>{
        sortGameData[obj.index]=obj
      })
      setGameData(sortGameData)
    })
    .catch(()=>{
      setGameData([{},{},{},{}])
    })
  },[])
  useEffect(() => {
    // This code will execute whenever currentPlayer changes
    //console.log("Current player changed:", currentPlayer);
    if(isGame){
      if(currentP1Cards.length===0) winner=p1.name
      if(currentP2Cards.length===0) winner=p2.name
      if(currentP3Cards.length===0) winner=p3.name
      if(currentP4Cards.length===0) winner=p4.name
    }
    if(winner){
      setIsBGM(false)
      broadcastSE(SE.gameOver)
      setCurrentWinner(winner)
      setIsGameOver(true)
      //gameOver(winner)
    }
    
  }, [currentPlayer,gameData]);

  
  const startGame = async () =>{
    setIsGame(true)
    winner = null
    // if(currentUser) user = currentUser.user
    // console.log(user)
    mainDeck.shuffle();
	  //Deal cards to each player
    await delay(500)
    let count=0
    while(count<initialHits){
      for(let deck of playerDecks){
        await hit(mainDeck,deck,initHitCardTime);
        //await delay(initHitCardTime)
      }
      count++
    }
    do{
      await hit(mainDeck,discard,playCardTime);
      //await delay(playCardTime)
    }while(discard.getBot().suit=="Wild")
    getNextPlayer()
  }
  
  //actions
  async function hit(main,deck,time=1000){
    //if(isPause) await pauseEvent()
    
    let card = main.getHit(1);
    deck.addBot(card)
    updateWeb()
    await delay(1)
    if(deck.name){ 
      hitCardAni(deck.getWeb().lastElementChild,time,broadcastSE,SE);
    }else{
      hitCardAni(discard.getWeb().lastElementChild,time,broadcastSE,SE);
    }
    // check & recycle discard pile in case run out of main deck cards
    while(discard.length>10){
      let card = discard.getHit()
      main.addBot(card)
      main.shuffle()
    }
    await delay(time+1)
    setShowCard(true)
  }
  async function play(deck,discard,cardIndex,time=1000){
    //if(isPause) await pauseEvent()
    let cardWebPos = deck.getWeb().children[cardIndex]
    let oriObj = cardWebPos.getBoundingClientRect();
    let selectCard = deck.detCard(cardIndex)
    discard.addBot(selectCard)
    updateWeb()
    await delay(1)
    playCardAni(deck,oriObj,discard.getWeb().lastElementChild, time,broadcastSE,SE);
    await delay(time+1)
    setShowCard(true)
  }
  function updateWeb(){
    setCurrentP1Cards([...p1.cards])
    setCurrentP2Cards([...p2.cards])
    setCurrentP3Cards([...p3.cards])
    setCurrentP4Cards([...p4.cards])
    setCurrentMainCards([...mainDeck.cards])
    setCurrentDiscardCards([...discard.cards])
  }
  function getCurrentData(){
    let data = {
      user:user,
      date:new Date().getTime(),
      currentPlayer:currentPlayer,
      currentPlayerQueue:currentPlayerQueue,
      isReverse:isReverse,
      main:currentMainCards,
      discard:currentDiscardCards,
      p1:currentP1Cards,
      p2:currentP2Cards,
      p3:currentP3Cards,
      p4:currentP4Cards
    }
    return data
  }
  function getNextPlayer(changeDirection=false){
    let selector;
    let count=1
    if(changeDirection) count=2 
    while(count!==0){
      if(!isReverse){
        selector = currentPlayerQueue.shift()
        currentPlayerQueue.push(selector)
      }else{
        selector = currentPlayerQueue.pop()
        currentPlayerQueue.unshift(selector)
      }
      count--
    }
    setCurrentPlayerQueue([...currentPlayerQueue])
    setCurrentPlayer(selector)
  }
  function loadGame(){
    setShowMenuData(true)
  }
  function loadData(index,dirToGame){
    if(gameData[index].index){
      let data = gameData[index]
      let [p1cards,p2cards,p3cards,p4cards,maincards,discardcards] =[[],[],[],[],[],[]]
      data.p1.forEach(e =>p1cards.push(new Card(e.suit,e.value,e.points,e.wildColor,e.hasPenalty)));
      data.p2.forEach(e =>p2cards.push(new Card(e.suit,e.value,e.points,e.wildColor,e.hasPenalty)));
      data.p3.forEach(e =>p3cards.push(new Card(e.suit,e.value,e.points,e.wildColor,e.hasPenalty)));
      data.p4.forEach(e =>p4cards.push(new Card(e.suit,e.value,e.points,e.wildColor,e.hasPenalty)));
      data.main.forEach(e =>maincards.push(new Card(e.suit,e.value,e.points,e.wildColor,e.hasPenalty)));
      data.discard.forEach(e =>discardcards.push(new Card(e.suit,e.value,e.points,e.wildColor,e.hasPenalty)));
      p1.cards=p1cards
      p2.cards=p2cards
      p3.cards=p3cards
      p4.cards=p4cards
      mainDeck.cards=maincards
      discard.cards=discardcards
      updateWeb()
      setCurrentPlayer(data.currentPlayer)
      setCurrentPlayerQueue(data.currentPlayerQueue)
      setIsReverse(data.isReverse)
      
      // const discardChildElements = document.querySelector(".discard-pile").children;
      // for (let i = 0; i < discardChildElements.length; i++) {
      //   discardChildElements[i].style.visibility = "visible";
      // }
      setShowCard(true)
      
      if(dirToGame){
        setIsGame(true)
        setShowMenuData(false)
      }else{
        setIsPause(false)
        setShowData(false)
      }
      // const cardStyle = document.querySelectorAll(".card-style");
      // cardStyle.forEach(card => {
      //   card.style.visibility = "visible";
      // });
    }
    
  }
  function pauseEvent(){
    
  }
  //Availability check
  function avaCheck(card,discard) {
    if(discard.length!==0){
      //check wild card
      if(card.suit=="Wild"){
        return true
      }
      //check color
      if (card.suit == discard.getBot().suit || card.suit == discard.getBot().wildColor) {
        return true
      }
      //check value
      if (card.value == discard.getBot().value) {
        return true
      }
    }
    return false 
  }
  return (
  <div className="game-body">
    {isGameOver && 
      <GameOver winner={currentWinner} backHome={backHome} startGame={startGame} setIsGameOver={setIsGameOver}/>
    }
    {!isGame && !isGameOver && !showData && !showMenuData &&
      <div className="model-menu">
        <div className="model-content-menu">
          <div className="bar-btn" onClick={startGame}>Start</div>
          <div className="bar-btn" onClick={loadGame}>Load</div>
          <div className="bar-btn" onClick={backHome}>Exit</div>
        </div>
      </div>
    }
    {showMenuData && (
      <div className="model-setting">
        <DataPage 
        title="Load" 
        showData={showData}
        setShowData={setShowMenuData}
        dirToGame={true}
        loadData={loadData}
        gameData={gameData}
        setGameData={setGameData}
        />
      </div> 
      )}
    {isGame && !isGameOver && 
      <div className="game-board">
        <div className="deck box1"> 
          <MainDeck 
            deck={p1}
            deckCards={currentP1Cards}
            hit={hit}
            play={play}
            showSwitch={showColActPen}
            isPlayOpt={isPlayOpt}
            setIsPlayOpt={setIsPlayOpt}
            avaCheck={avaCheck}
            getNextPlayer={getNextPlayer}
            mainDeck={mainDeck} 
            discard={discard} 
            mainCards={currentMainCards}
            setMainCards={setCurrentMainCards}
            discardCards={currentDiscardCards}
            setDiscardCards={setCurrentDiscardCards}
            currentPlayer={currentPlayer}/>
        </div>
        <div className="deck box2">
          <ProfileInfo name={p3.name} pos={"p3"} currentPlayer={currentPlayer}/>
          {showColActPen[2] && currentPlayer===p3.name &&
            <Penalty 
              showSwitch={showColActPen}
              setSwitch={setColActPen} 
              getNextPlayer={getNextPlayer} 
              hit={hit} mainDeck={mainDeck} 
              currentMainCards={currentMainCards} 
              deck={p3} 
              currentDeckCards={currentP3Cards} 
              actCard={currentDiscardCards[currentDiscardCards.length-1]}/>
          }
          <PlayerDeck 
            showCard={showCard}
            isPause={isPause}
            pauseEvent={pauseEvent}
            play={play}
            hit={hit}
            broadcastSE={broadcastSE}
            SE={SE}
            isReverse={isReverse}
            setIsReverse={setIsReverse}
            userName={p1.name}
            avaCheck={avaCheck}
            showSwitch={showColActPen}
            setSwitch={setColActPen}
            getNextPlayer={getNextPlayer}
            deck={p3} 
            mainDeck={mainDeck}
            discard={discard}
            deckCards={currentP3Cards}
            setDeckCards={setCurrentP3Cards} 
            discardCards={currentDiscardCards} 
            setDiscardCards={setCurrentDiscardCards} 
            mainCards={currentMainCards}
            setMainCards={setCurrentMainCards}
            pos={"player-top"} 
            currentPlayer={currentPlayer}
            setCurrentPlayer={setCurrentPlayer}
          />
        </div>
        <div className="deck box3">
          <BGM isBGM={isBGM}/>
          <Setting isPause={isPause} setIsPause={setIsPause} currentPlayer={currentPlayer} user={user}/>
        </div> 
        <div className="deck box4">
          <ProfileInfo name={p2.name} pos={"p2"} currentPlayer={currentPlayer}/>
          {showColActPen[2] && currentPlayer===p2.name &&
            <Penalty 
              showSwitch={showColActPen}
              setSwitch={setColActPen} 
              getNextPlayer={getNextPlayer} 
              hit={hit} mainDeck={mainDeck} 
              currentMainCards={currentMainCards} 
              deck={p2} 
              currentDeckCards={currentP2Cards} 
              actCard={currentDiscardCards[currentDiscardCards.length-1]}/>
          }
          <PlayerDeck 
            showCard={showCard}
            isPause={isPause}
            pauseEvent={pauseEvent}
            play={play}
            hit={hit}
            broadcastSE={broadcastSE}
            SE={SE}
            isReverse={isReverse}
            setIsReverse={setIsReverse}
            userName={p1.name}
            avaCheck={avaCheck}
            showSwitch={showColActPen}
            setSwitch={setColActPen}
            getNextPlayer={getNextPlayer}
            deck={p2} 
            mainDeck={mainDeck}
            discard={discard}
            deckCards={currentP2Cards}
            setDeckCards={setCurrentP2Cards} 
            discardCards={currentDiscardCards} 
            setDiscardCards={setCurrentDiscardCards} 
            mainCards={currentMainCards}
            setMainCards={setCurrentMainCards}
            pos={"player-left"} 
            currentPlayer={currentPlayer}
            setCurrentPlayer={setCurrentPlayer}
          />
        </div>
        <div className="deck box5">
          {showColActPen[0] &&
            <SelectColor setSwitch={setColActPen} getNextPlayer={getNextPlayer} discard={discard} currentDiscardCards={currentDiscardCards}/>
          }
          {showColActPen[1] &&
            <Action broadcastSE={broadcastSE}
            SE={SE} isReverse={isReverse} 
            setIsReverse={setIsReverse} 
            setSwitch={setColActPen} 
            getNextPlayer={getNextPlayer} 
            discard={discard} 
            currentDiscardCards={currentDiscardCards}/>
          }
          <Discard cards={currentDiscardCards} showCard={showCard}/>
          <TurnDirection isReverse={isReverse}/>
        </div>
        <div className="deck box6">
          <ProfileInfo name={p4.name} pos={"p4"} currentPlayer={currentPlayer}/>
          {showColActPen[2] && currentPlayer===p4.name &&
            <Penalty 
              showSwitch={showColActPen}
              setSwitch={setColActPen} 
              getNextPlayer={getNextPlayer} 
              hit={hit} mainDeck={mainDeck} 
              currentMainCards={currentMainCards} 
              deck={p4} 
              currentDeckCards={currentP4Cards} 
              actCard={currentDiscardCards[currentDiscardCards.length-1]}/>
          }
          <PlayerDeck
            showCard={showCard} 
            isPause={isPause}
            pauseEvent={pauseEvent}
            play={play}
            hit={hit}
            broadcastSE={broadcastSE}
            SE={SE}
            isReverse={isReverse}
            setIsReverse={setIsReverse}
            userName={p1.name}
            avaCheck={avaCheck}
            showSwitch={showColActPen}
            setSwitch={setColActPen}
            getNextPlayer={getNextPlayer}
            deck={p4} 
            mainDeck={mainDeck}
            discard={discard}
            deckCards={currentP4Cards}
            setDeckCards={setCurrentP4Cards} 
            discardCards={currentDiscardCards} 
            setDiscardCards={setCurrentDiscardCards} 
            mainCards={currentMainCards}
            setMainCards={setCurrentMainCards}
            pos={"player-right"} 
            currentPlayer={currentPlayer}
            setCurrentPlayer={setCurrentPlayer}
          />
        </div>
        <div className="deck box7" />
        <div className="deck box8">
          <ProfileInfo name={p1.name} pos={"p1"} currentPlayer={currentPlayer}/>
          {showColActPen[2] && currentPlayer===p1.name &&
            <Penalty 
              showSwitch={showColActPen}
              setSwitch={setColActPen} 
              getNextPlayer={getNextPlayer} 
              hit={hit} mainDeck={mainDeck} 
              currentMainCards={currentMainCards} 
              deck={p1} 
              currentDeckCards={currentP1Cards} 
              actCard={currentDiscardCards[currentDiscardCards.length-1]}/>
          }
          {isPlayOpt && currentPlayer===p1.name &&
            <OptCard 
              play={play}
              broadcastSE={broadcastSE}
              SE={SE}
              isPlayOpt={isPlayOpt} 
              setIsPlayOpt={setIsPlayOpt} 
              setSwitch={setColActPen} 
              isReverse={isReverse} 
              setIsReverse={setIsReverse} 
              getNextPlayer={getNextPlayer} 
              deck={p1} 
              deckCards={currentP1Cards} 
              discard={discard} 
              discardCards={currentDiscardCards}/>
          }
          <UserDeck 
            showCard={showCard}
            play={play}
            broadcastSE={broadcastSE}
            SE={SE}
            avaCheck={avaCheck}
            showSwitch={showColActPen}
            setSwitch={setColActPen}
            isReverse={isReverse}
            setIsReverse={setIsReverse}
            getNextPlayer={getNextPlayer}
            deck={p1} 
            mainDeck={mainDeck}
            discard={discard}
            deckCards={currentP1Cards}
            setDeckCards={setCurrentP1Cards} 
            discardCards={currentDiscardCards} 
            setDiscardCards={setCurrentDiscardCards} 
            mainCards={currentMainCards}
            setMainCards={setCurrentMainCards}
            pos={"player-bot"} 
            currentPlayer={currentPlayer}
            setCurrentPlayer={setCurrentPlayer}
          />
        </div>
        <div className="deck box9" />
      </div>
    }
    {isPause && 
      <SettingMenu
        user={user}
       isPause={isPause}
       setIsPause={setIsPause} 
       backHome={backHome} 
       showData={showData} 
       loadData={loadData}
       loadGame={loadGame}
       dirToGame={false}
       setShowData={setShowData}
       getCurrentData={getCurrentData}
       gameData={gameData}
       setGameData={setGameData}
       />
    }
    <audio ref={audio1}/>
    <audio ref={audio2}/>
    <audio ref={audio3}/>
    <audio ref={audio4}/>
    <audio ref={audio5}/>
    <audio ref={audio6}/>
  </div>
  )
}
  
  
  


export default Game