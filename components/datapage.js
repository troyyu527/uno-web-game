import React from 'react'
import AuthService from '@utils/services/auth.service';


function DataPage(props){
  
  const {title,dirToGame,loadData,setShowData,getCurrentData,gameData,setGameData}=props
  
  function addNew(index){
    let userInput
    do{
      userInput = window.prompt("Please enter the file name you want to save:");
    }while(userInput !==null && userInput === "")
    
    let data = getCurrentData()
    AuthService.deleteGameData(data.user,index)
    data.index = index
    data.name = userInput
    AuthService
    .saveGameData(data)
    .then(()=>{
      window.alert("Success to save the file!")
      let newGameData =gameData
      newGameData[index]=data
      setGameData([...newGameData])
    })
    .catch((e)=>{
      window.alert("Fail to save the file, please try again")
    })
  }
  function closeDataPage(){
    setShowData(false)
  }
  function DataModel(props){
    const {data,index}=props
    return(
      <div className='data-model'>
        <div className="container" onClick={title==="Save"?()=>addNew(index):()=>loadData(index,dirToGame)}>
          {data.index ? (
            <img src="./img/file.png" alt="File Saved" width="230" height="160"/>
          ) : (
            <img src="./img/empty.png" alt="Empty-File" width="230" height="160"/>
          )}
        </div>
        <p>{data.index ? data.name : 'Empty File'}</p>
      </div>
    )
  }
  return (
    <div className="model-content">
      
        <style>
          {`
          .data-content{
            display:flex;
            justify-content: center;
            padding: 1.5rem;
            height:85%;
          }
          h1{
            position:absolute;
            top:10px;
            left:10px;
          }
          .main-container{
            top:15px;
            display:flex;
            flex-wrap:wrap;
            
            position:absolute;
            height:80%;
            width:80%;
            border:5px solid blue;
            
          }
          .data-model{
            flex:1;
            min-width: 40%;
            border:5px solid gray;
            align-items: center;
          }
          .container{
            display:flex;
            justify-content: center;
            padding:5px;
          }
          .container:hover {
            cursor:pointer;
          }
          .data-model:hover {
            border:5px solid green;
          }
          p{
            display:flex;
            justify-content: center;
            position:relative;
          }
          `}
        </style>
        <div className="data-content">
          <h1>{title}</h1>
          <div className='main-container'>
            <DataModel key={0} index={0} data={gameData[0]}/>
            <DataModel key={1} index={1} data={gameData[1]}/>
            <DataModel key={2} index={2} data={gameData[2]}/>
            <DataModel key={3} index={3} data={gameData[3]}/> 
          </div>
        </div>
        <div className='btn-container'>
          <div className="btn" onClick={closeDataPage}>Back</div>
        </div>
      
      
      
    </div>
  )
}

export default DataPage