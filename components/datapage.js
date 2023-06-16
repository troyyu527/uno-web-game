import React from 'react'
import AuthService from '@utils/services/auth.service';
import fileImg from "@public/img/file.png";
import emptyImg from "@public/img/empty.png";

function DataPage(props){
  
  const {title,dirToGame,loadData,showData,setShowData,getCurrentData,gameData,setGameData}=props
  
  function addNew(index){
    const userInput = window.prompt("Please enter the file name you want to save:");
    let data = getCurrentData()
    AuthService.deleteGameData(data.user,index)
    data.index = index
    data.name = userInput
    AuthService
    .saveGameData(data)
    .then(()=>{
      window.alert("Success to save the file!")
      let newGameData =gameData || []
      newGameData[index]=data
      setGameData([...newGameData])
    })
    .catch((e)=>{
      window.alert("Fail to save the file, please try again")
    })
  }
  function closeDataPage(){
    setShowData(!showData)
  }
  function DataModel(props){
    const {data,index}=props
    return(
      <div className='data-model'>
        <div className="container" onClick={title==="Save"?()=>addNew(index):()=>loadData(index,dirToGame)}>
          {data ? (
            <img src={fileImg} alt="File Saved" width="230" height="160"/>
          ) : (
            <img src={emptyImg} alt="Empty-File" width="230" height="160"/>
          )}
        </div>
        <p>{data ? data.name : 'Empty File'}</p>
      </div>
    )
  }
  return (
    <div className="model-content">
      <div>
        <style>
          {`
          .data-content{
            display:flex;
            justify-content: center;
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
            <DataModel key={0} index={0} data={gameData?gameData.find(obj => obj.index === 0):null}/>
            <DataModel key={1} index={1} data={gameData?gameData.find(obj => obj.index === 1):null}/>
            <DataModel key={2} index={2} data={gameData?gameData.find(obj => obj.index === 2):null}/>
            <DataModel key={3} index={3} data={gameData?gameData.find(obj => obj.index === 3):null}/> 
          </div>
        </div>
      </div>
      <div className='btn-container'>
        {/* {title==="Save" &&
          <div className="btn" onClick={addNew}>Add New</div>
        } */}
        <div className="btn" onClick={closeDataPage}>Back</div>
      </div>
      
    </div>
  )
}

export default DataPage