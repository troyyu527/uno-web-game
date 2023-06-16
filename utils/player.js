import {Deck,Card} from './deck.js'

export class Player extends Deck{
  constructor(name="NPC",selector,cards){
    super(cards,selector)
    this.name=name;
    this.status="Normal";
    
    //this.selector=selector;
  }
  
  updateStatus(){
    if(this.cards.length>4){
      return this.status="Normal";
    }else if(this.cards.length<5 && this.cards.length>2){
      return this.status="Urgent";
    }else if(this.cards.length==2){
      return this.status="Critical";
    }else if(this.cards.length==1){
      return this.status="UNO";
    }else{
      return this.status="Winner";
    }
  }
  // getWeb(){
  //   return document.querySelector(this.selector);
  // }
  getMaxSuit(){
    let resultList =[]
    let counter={}
    this.cards.forEach(card=>{
      if(!counter[card.suit]){
        counter[card.suit]= 1;
      }else{
        counter[card.suit]++;
      }
      
    })
    //console.log(counter)
    Object.entries(counter).forEach(([key,value])=>{
      if(resultList.length==0 || counter[resultList[0]]==value){
        resultList.push(key)
      }else if(counter[resultList[0]]<value){
        resultList=[];
        resultList.push(key);
      }
    })
    return resultList
  }
  getMaxValue(){
    let resultList =[]
    let counter={}
    this.cards.forEach(card=>{
      if(!counter[card.value]){
        counter[card.value]= 1;
      }else{
        counter[card.value]++;
      }
      
    })
    //console.log(counter)
    Object.entries(counter).forEach(([key,value])=>{
      if(resultList.length==0 || counter[resultList[0]]==value){
        resultList.push(key)
      }else if(counter[resultList[0]]<value){
        resultList=[];
        resultList.push(key);
      }
    });
    return resultList
  }
}

