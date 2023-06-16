//AI select Wild color
export function selectColorActAI(deck,discard){
	
	let colorList = deck.getMaxSuit()
	let selectColor=null;
	let selectIndex = Math.floor(Math.random()*colorList.length);
	selectColor = colorList[selectIndex];
	if(selectColor==="Wild" || selectColor===undefined){
		let randomColor = ["Red","Blue","Green","Yello"];
		selectIndex = Math.floor(Math.random()*randomColor.length);
		selectColor=randomColor[selectIndex];
	}
	setWildCard(discard,selectColor);
}

export function setWildCard(discard,color){
  const Wild_Color_POSITION={
    "Red":{
      "trueColor":"#ff5555",
      "posWild":"99.298% 1%",
      "posDrawFour":"99.298% 57%"
    },
    "Blue":{
      "trueColor":"#5555ff",
      "posWild":"99.298% 15%",
      "posDrawFour":"99.298% 71%"
    },
    "Yellow":{
      "trueColor":"#ffaa00",
      "posWild":"99.298% 29%",
      "posDrawFour":"99.298% 85%"
    },
    "Green":{
      "trueColor":"#55aa55",
      "posWild":"99.298% 43%",
      "posDrawFour":"99.298% 99%"
    }
  }
	let wildCardWeb = discard.getWeb().lastElementChild.firstElementChild.firstElementChild;
  
	let wildCard = discard.cards[discard.length-1]
	wildCard.setWildColor(color);
	//delayAni(500)
	wildCardWeb.style.backgroundImage = "url('./img/cards/UNO_cards_deck_wild.svg')";
	if(wildCard.value=="Wild"){
		wildCardWeb.style.backgroundPosition = Wild_Color_POSITION[color].posWild;
	}else if(wildCard.value=="Draw Four"){
		wildCardWeb.style.backgroundPosition = Wild_Color_POSITION[color].posDrawFour;
	}
	

}
