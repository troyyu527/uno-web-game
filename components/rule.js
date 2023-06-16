import React from 'react'

function Rule(props){
  const {toggleRule}=props
  return (
    <div className="model-content">
          <div>
            <style>
              {`.rule-content{
                user-select: none;
                background-image: linear-gradient(90deg,red,yellow);
                border: 5px solid rgb(50,168,82);
                padding: 1.5rem;
              }
              
              h1{
                display: flex;
                justify-content:center ;
                align-items: center;
              }
              
              table,th,td{
                border-collapse: collapse;
                border: 2px solid;
                padding: 0.25rem;
              }`}
            </style>
            <div className="rule-content">
              <h1>UNO CARD GAME RULE</h1>
              <p>
                To start a hand, seven cards are dealt to each player, and the
                top card of the remaining deck is flipped over and set aside to
                begin the discard pile. If the first top card of the remaining
                deck is a Wild or Wild Draw Four card, flip again and repeat
                until the card is neither Wild nor Wild Draw Four. The first
                player is randomly chosen to begin the game.
              </p>
              <p>On a player's turn, they must do one of the following:</p>
              <ul>
                <li>Play one card matching the discard in color, number, or symbol</li>
                <li>Play a Wild card or a Wild Draw Four card</li>
                <li>Draw the top card from the deck and play it if possible</li>
              </ul>
              <p>
                Cards are played by laying them face-up on top of the discard
                pile. Play initially proceeds clockwise around the table.
              </p>
              <p>Action or Wild cards have the following effects:</p>
              <table>
                <tbody>
                  <tr>
                    <th>Card</th>
                    <th>Effect when played from hand</th>
                  </tr>
                  <tr>
                    <td>Skip</td>
                    <td>Next player in sequence misses a turn</td>
                  </tr>
                  <tr>
                    <td>Reverse</td>
                    <td>
                      Order of play switches directions (clockwise to
                      counterclockwise, or vice versa)
                    </td>
                  </tr>
                  <tr>
                    <td>Draw Two (+2)</td>
                    <td>
                      Next player in sequence draws two cards and misses a turn
                    </td>
                  </tr>
                  <tr>
                    <td>Wild</td>
                    <td>
                      Player declares the next color to be matched (may be used
                      on any turn even if the player has matching color)
                    </td>
                  </tr>
                  <tr>
                    <td>Wild Draw Four</td>
                    <td>
                      Player declares the next color to be matched; next player
                      in sequence draws four cards and misses a turn (may be
                      used on any turn even if the player has matching color)
                    </td>
                  </tr>
                </tbody>
              </table>
              <ul>
                <li>
                  A player who draws a playable card from the deck must either
                  play or keep that card and may play no other card from their
                  hand on that turn.
                </li>
                <li>
                  A player may play a Wild card or a Wild Draw Four card at any
                  time, even if that player has other playable cards.
                </li>
                <li>
                  When playing a Wild or Wild Draw Four card, a player may
                  declare the current color as the next one to be matched.
                </li>
                <li>
                  If the draw deck runs out during play, the top discard is set
                  aside and the rest of the pile is shuffled to create a new
                  deck. Play then proceeds normally.
                </li>
                <li>It is illegal to trade cards of any sort with another player.</li>
              </ul>
              <p>
                A player who plays their penultimate card must call "Uno" as a
                warning to the other players (the system will call for you)
              </p>
              <p>The first player to get rid of their last card ("going out") wins.</p>
            </div>
          </div>
          <div className="back-btn" onClick={toggleRule}>Back</div>
        </div>
  )
}

export default Rule