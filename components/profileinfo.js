import React,{useState} from 'react'
import Image from 'next/image'
function ProfileInfo(props) {
  const {name,pos,currentPlayer} = props
  const randPicIndex=Math.floor(Math.random()*11)
  const [pixIndex, setPicIndex] = useState(randPicIndex)
  let isUserTurn = false
  if(currentPlayer===name) isUserTurn=true
  return (
    <div className={`profile ${pos} ${isUserTurn?"highlighted":""}`}>
      <div>{name}</div>
      <Image
          src={`./img/avatar_photo/avatar_${pixIndex}.svg`}
          alt="Avatar Photo"
          width={30}
          height={30}
        />
    </div>
  )
}

export default ProfileInfo