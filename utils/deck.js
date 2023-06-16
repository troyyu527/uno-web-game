const CARD_COLOR_SUIT = ["Red", "Green", "Blue", "Yellow"];
const CARD_WILD_SUIT = ["Wild"];
const CARD_COLOR_VALUE = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9","Skip", "Reverse", "Draw Two"];
const CARD_WILD_VALUE = ["Wild", "Draw Four"];


//UNO Cards total 108
//Color value 12 (not includ '0') x 4 color x 2 counts = 96
//Color value '0' x 4 color x 1 count = 4
//Total Color Cards 100
//Wild value 2 x 1 wild x 4 counts = 8
//Total Wild Cards 8
//Total Cards => Color Cards + Wild Cards = 100 + 8 = 108

export class Deck{
  constructor(card=[],selector=null){
    this.cards = card;
    this.selector=selector;
  }
  get length(){
    return this.cards.length
  }
  getWeb(){
    return document.querySelector(this.selector)
  }
  getCard(index){
    return this.cards[index];
  }
  getHit(count=1){
    let _arr = [];
    if(count>this.length){
      for(let i=0;i<this.length;i++){
        _arr.push(this.detTop());
      }
    }else{
      for(let i=0;i<count;i++){
        _arr.push(this.detTop());
      }
    }
    
    return _arr
  }
  getTop(){
    return this.cards[0];
  }
  getBot(){
    return this.cards[this.length-1];
  }
  addTop(card){
    if(Array.isArray(card)){
      card.forEach(ele => {
        this.cards.unshift(ele)
      });
    }else{
      this.cards.unshift(card);
    }
  }
  addBot(card){
    if(Array.isArray(card)){
      card.forEach(ele => {
        this.cards.push(ele)
      });
    }else{
      this.cards.push(card);
    }
    
  }
  detTop(){
    let card = this.getTop();
    this.cards.shift();
    return card
  }
  detBot(){
    let card = this.getBot();
    this.cards.pop();
    return card
  }
  detCard(index){
    let card = this.getCard(index);
    this.cards.splice(index,1);
    return card
  }
  
  shuffle(){
    for (let first = this.length - 1; first > 0; first--) {
      let second = Math.floor(Math.random() * (first + 1)); // random index from 0 to i
      [this.cards[first], this.cards[second]] = [this.cards[second], this.cards[first]]; // swap elements
    }
  }
  //similar as shuffle, but not include first and last card
  recycle(){
    let firstCard=this.detTop();
    let lastCard=this.detBot();
    for (let first = this.length - 1; first > 0; first--) {
      let second = Math.floor(Math.random() * (first + 1)); // random index from 0 to i
      [this.cards[first], this.cards[second]] = [this.cards[second], this.cards[first]]; // swap elements
    }
    this.addTop(firstCard);
    this.addBot(lastCard);
  }

  clear(){
    this.cards=[];
  }

}

export class Card {
  constructor(suit,value,points=null,wildColor=null,hasPenalty=false){
    this.suit = suit;
    this.value = value;
    this.points = points;
    this.wildColor = wildColor;
    this.hasPenalty=hasPenalty;
  }
  //Ver. beta
  setWtPt(point){
    this.points = point;
  }

  setWildColor(color){
    this.wildColor = color;
  }

  setPenalty(action){
    this.hasPenalty = action;
  }

}

export function freshDeck(){
  let _pool =[];
  for (let i = 0; i < 2; i++) {
    for (let suitIndex = 0; suitIndex < CARD_COLOR_SUIT.length; suitIndex++) {
      let colorSuit = CARD_COLOR_SUIT[suitIndex];
      for (let valueIndex = 0; valueIndex < CARD_COLOR_VALUE.length; valueIndex++) {
        if (i === 1 && valueIndex === 0) {
          continue;
        }
        let colorValue = CARD_COLOR_VALUE[valueIndex];
        //deck.push([colorSuit, colorValue]);
        let card = new Card(colorSuit, colorValue);
        _pool.push(card);
      }
    }
  }
  for (let i = 0; i < 4; i++) {
    for (let suitIndex = 0; suitIndex < CARD_WILD_SUIT.length; suitIndex++) {
      let wildSuit = CARD_WILD_SUIT[suitIndex];
      for (let valueIndex = 0; valueIndex < CARD_WILD_VALUE.length; valueIndex++) {
        let wildValue = CARD_WILD_VALUE[valueIndex];
        //deck.push([wildSuit, wildValue]);
        let card = new Card(wildSuit, wildValue);
        _pool.push(card);
      }
    }
  }
  return _pool
}
//export default class {Deck}
//exports.Deck = new Deck

export {CARD_COLOR_SUIT,CARD_WILD_SUIT,CARD_COLOR_VALUE,CARD_WILD_VALUE}