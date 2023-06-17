import React from 'react';
import Card from '@components/card';


function Discard(props) {
  const {cards,showCard} = props
  
  return (
    <div className="discard-pile">
      {cards.map((card, index) => {
        return (
          <div className="card-style" key={index} style={{visibility:showCard?"visible":"hidden"}}>
            <Card index={index} card={card}/>
          </div>
        )
      })}
    </div>
  )
}

export default Discard