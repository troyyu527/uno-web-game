import React from 'react'

function TurnDirection(props) {
  let {isReverse} = props
  return (
    <div className= {isReverse?"counter-clockwise direction":"clockwise direction"}></div>
  )
}

export default TurnDirection