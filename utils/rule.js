//Availability check
export function avaCheck(card,discard) {
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