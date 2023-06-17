import axios from "axios"
const API_URL = "https://uno-game-server.glitch.me/api"

class AuthService{
  login(username,password){
    return axios.post(API_URL+"/user"+"/login",{username,password})
  }
  logout(){
    localStorage.removeItem("user")
  }
  register(username,email,password,gender,role){
    return axios.post(API_URL+"/user"+"/register",{
      //post req.body
      username,
      email,
      password,
      gender,
      role,
    })
  }
  getCurrentUser(){
    if (typeof window !== 'undefined') {
      let data = JSON.parse(localStorage.getItem("user"))
      if(data){
        return data
      }else{
        return null
      }
    }else{
      return null
    }
  }
  modifyUser(_id,username,email,password,gender){
    return axios.patch(API_URL+"/user"+"/modify"+"/"+_id,{
      //post req.body
      username,
      email,
      password,
      gender,
    })
  }
  deleteUser(_id){
    return axios.delete(API_URL+"/user"+"/delete"+"/"+_id)
  }
  getGameData(user){
    return axios.get(API_URL + "/gameData" + "/" + user)
  }
  saveGameData(data){
    const {user,index,name,date,currentPlayer,currentPlayerQueue,isReverse,main,discard,p1,p2,p3,p4}=data
    return axios.post(API_URL+"/gameData"+"/data",{
      //post req.body
      user,index,name,date,currentPlayer,currentPlayerQueue,isReverse,main,discard,p1,p2,p3,p4
    })
  }
  deleteGameData(user,index){
    return axios.delete(API_URL+"/gameData"+"/"+user+"/"+index)
  }
  deleteGameDataAll(user){
    return axios.delete(API_URL+"/gameData"+"/"+user)
  }
}

export default new AuthService()