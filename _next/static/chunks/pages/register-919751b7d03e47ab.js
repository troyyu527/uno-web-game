(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[495],{5511:function(e,a,s){(window.__NEXT_P=window.__NEXT_P||[]).push(["/register",function(){return s(4134)}])},4134:function(e,a,s){"use strict";s.r(a);var t=s(5893),r=s(7294),l=s(1163),n=s(4538),i=s(5753);a.default=function(){let e=(0,l.useRouter)(),[a,s]=(0,r.useState)(""),[c,d]=(0,r.useState)(""),[o,m]=(0,r.useState)(""),[u,h]=(0,r.useState)(""),[p,x]=(0,r.useState)("Member"),[g,v]=(0,r.useState)(""),[f,j]=(0,r.useState)(!1),N=e=>{h(e.target.value)};return(0,t.jsx)(n.E.div,{initial:{opacity:0,y:-200},animate:{opacity:1,y:0},transition:{duration:.5},children:(0,t.jsxs)("div",{className:"form-body",children:[(0,t.jsxs)("div",{className:"form-holder",children:[(0,t.jsx)("div",{className:"back",onClick:()=>{e.push("/")},children:"Back"}),(0,t.jsx)("div",{className:"form-content",children:(0,t.jsxs)("div",{className:"form-items",children:[(0,t.jsx)("h3",{children:"Register Now"}),(0,t.jsx)("p",{children:"This is for recording the game data. Don't put your real personal information."}),(0,t.jsxs)("div",{className:"form",children:[g&&(0,t.jsxs)("div",{id:"InfoBanner",children:[(0,t.jsx)("span",{className:"reversed reversedRight",children:(0,t.jsx)("span",{children:"⚠"})}),(0,t.jsx)("span",{className:"reversed reversedLeft",children:g})]}),(0,t.jsx)("div",{className:"col-md-12",children:(0,t.jsx)("input",{className:"form-control",onChange:e=>{s(e.target.value)},type:"text",name:"username",placeholder:"Username",required:!0})}),(0,t.jsx)("div",{className:"col-md-12",children:(0,t.jsx)("input",{className:"form-control",onChange:e=>{d(e.target.value)},type:"email",name:"email",placeholder:"E-mail Address",required:!0})}),(0,t.jsx)("div",{className:"col-md-12",children:(0,t.jsx)("input",{className:"form-control",onChange:e=>{m(e.target.value)},type:"password",name:"password",placeholder:"Password",required:!0})}),(0,t.jsxs)("div",{className:"col-md-12 mt-3",style:{marginTop:"15px",display:"flex",alignItems:"center"},children:[(0,t.jsx)("label",{className:"mb-3 mr-1",for:"gender",children:"Gender: "}),(0,t.jsx)("input",{type:"radio",onClick:N,value:"Male",className:"btn-check",name:"gender",id:"male"}),(0,t.jsx)("label",{className:"btn btn-sm btn-outline-secondary",for:"male",children:"Male"}),(0,t.jsx)("input",{type:"radio",onClick:N,value:"Female",className:"btn-check",name:"gender",id:"female"}),(0,t.jsx)("label",{className:"btn btn-sm btn-outline-secondary",for:"female",children:"Female"}),(0,t.jsx)("input",{type:"radio",onClick:N,value:"Secret",className:"btn-check",name:"gender",id:"secret"}),(0,t.jsx)("label",{className:"btn btn-sm btn-outline-secondary",for:"secret",children:"Secret"})]}),(0,t.jsx)("div",{className:"col-md-12",children:(0,t.jsxs)("select",{className:"form-select mt-3",value:p,onChange:e=>{x(e.target.value)},children:[(0,t.jsx)("option",{selected:!0,value:"Member",children:"Member"}),(0,t.jsx)("option",{disabled:!0,value:"Admin",children:"Admin (Not Available)"}),(0,t.jsx)("option",{disabled:!0,value:"Visitor",children:"Visitor (Not Available)"})]})}),(0,t.jsxs)("div",{className:"form-check",style:{margin:"15px 0",display:"flex",alignItems:"center"},children:[(0,t.jsx)("input",{className:"form-check-input",type:"checkbox",value:"",id:"invalidCheck",required:!0}),(0,t.jsx)("label",{className:"form-check-label",children:"I consent to the data use for this website"})]}),(0,t.jsx)("div",{className:"form-button mt-3",style:{display:"flex",justifyContent:"center"},children:(0,t.jsx)("button",{id:"submit",onClick:()=>{j(!0),i.Z.register(a,c,o,u,p).then(()=>{j(!1),window.alert("Registration succeeded. You are redirected to the home page."),e.push("/")}).catch(e=>{j(!1),v(e.response.data)})},className:"btn btn-primary",children:"Register"})})]})]})})]}),f&&(0,t.jsx)("div",{className:"notice",children:(0,t.jsx)("p",{children:"Sending Request..."})})]})})}},5753:function(e,a,s){"use strict";var t=s(6154);let r="https://uno-game-server.glitch.me/api";a.Z=new class{login(e,a){return t.Z.post(r+"/user/login",{username:e,password:a})}logout(){localStorage.removeItem("user")}register(e,a,s,l,n){return t.Z.post(r+"/user/register",{username:e,email:a,password:s,gender:l,role:n})}getCurrentUser(){return JSON.parse(localStorage.getItem("user"))||null}modifyUser(e,a,s,l,n){return t.Z.patch(r+"/user/modify/"+e,{username:a,email:s,password:l,gender:n})}deleteUser(e){return t.Z.delete(r+"/user/delete/"+e)}getGameData(e){return t.Z.get(r+"/gameData/"+e)}saveGameData(e){let{user:a,index:s,name:l,date:n,currentPlayer:i,currentPlayerQueue:c,isReverse:d,main:o,discard:m,p1:u,p2:h,p3:p,p4:x}=e;return t.Z.post(r+"/gameData/data",{user:a,index:s,name:l,date:n,currentPlayer:i,currentPlayerQueue:c,isReverse:d,main:o,discard:m,p1:u,p2:h,p3:p,p4:x})}deleteGameData(e,a){return t.Z.delete(r+"/gameData/"+e+"/"+a)}deleteGameDataAll(e){return t.Z.delete(r+"/gameData/"+e)}}}},function(e){e.O(0,[827,538,774,888,179],function(){return e(e.s=5511)}),_N_E=e.O()}]);