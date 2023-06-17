(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[277],{9344:function(e,s,a){(window.__NEXT_P=window.__NEXT_P||[]).push(["/profile",function(){return a(7329)}])},7329:function(e,s,a){"use strict";a.r(s);var r=a(5893),n=a(7294),t=a(1163),l=a(5753);s.default=function(){let e=(0,t.useRouter)(),[s,a]=(0,n.useState)(l.Z.getCurrentUser()||{}),[c,i]=(0,n.useState)(!1),[d,o]=(0,n.useState)((null==s?void 0:s.user)||""),[m,u]=(0,n.useState)((null==s?void 0:s.email)||""),[_,h]=(0,n.useState)((null==s?void 0:s.password)||""),[p,x]=(0,n.useState)((null==s?void 0:s.gender)||""),[g,j]=(0,n.useState)("0"),[f,v]=(0,n.useState)(!1),[N,b]=(0,n.useState)(""),S=()=>{e.push("/")},y=e=>{f?(i(!0),l.Z.modifyUser(s._id,d,m,_,p).then(()=>{s.user=d,s.email=m,s.password=_,s.gender=p,localStorage.setItem("user",JSON.stringify(s)),i(!1),v(!1)}).catch(e=>{i(!1),b(e.response.data)})):v(!f)},k=e=>{x(e.target.value)};return(0,n.useEffect)(()=>{s||S()},[s]),(0,n.useEffect)(()=>{l.Z.getGameData(d).then(e=>{j(""+e.data.length)}).catch(()=>{j("0")})},[]),(0,r.jsx)(r.Fragment,{children:(0,r.jsxs)("div",{className:"form-body",children:[(0,r.jsxs)("div",{className:"form-holder",children:[(0,r.jsx)("div",{className:"back",onClick:S,children:"Back"}),(0,r.jsx)("div",{className:"form-content",children:(0,r.jsxs)("div",{className:"form-items",children:[(0,r.jsx)("h3",{children:"Account Info"}),f?(0,r.jsx)("p",{children:"Please Fill Your New Information."}):(0,r.jsx)("p",{children:"Here Is Your Account Information."}),(0,r.jsx)("p",{style:{marginTop:"-20px"},children:"_________________________________________________________________"}),(0,r.jsxs)("div",{className:"form",children:[!f&&(0,r.jsxs)("div",{className:"account",children:[(0,r.jsxs)("div",{className:"account-info",children:[(0,r.jsxs)("p",{children:["User: ",d]}),(0,r.jsxs)("p",{children:["Email: ",m]}),(0,r.jsx)("p",{children:"Password: (Hidden)"}),(0,r.jsxs)("p",{children:["Gender: ",p]}),(0,r.jsxs)("p",{children:["Role: ",(null==s?void 0:s.role)||"Member"]}),(0,r.jsxs)("p",{children:["Saved Game File: ",g]})]}),(0,r.jsxs)("div",{className:"btn-container",children:[(0,r.jsx)("div",{className:"btn-form",onClick:y,children:"Modify"}),(0,r.jsx)("div",{className:"btn-form",onClick:()=>{0!==Number(g)&&l.Z.deleteGameDataAll(d).then(()=>{j("0")})},children:"Clear Game Data"}),(0,r.jsx)("div",{className:"btn-form",onClick:a=>{let r=confirm("Are You Sure To Delete This Account?");r&&(i(!0),l.Z.deleteUser(s._id).then(()=>{i(!1),localStorage.removeItem("user"),e.push("/")}).catch(e=>{i(!1),b(e.response.data)}))},children:"Delete Account"})]})]}),f&&(0,r.jsxs)(r.Fragment,{children:[N&&(0,r.jsxs)("div",{id:"InfoBanner",children:[(0,r.jsx)("span",{className:"reversed reversedRight",children:(0,r.jsx)("span",{children:"⚠"})}),(0,r.jsx)("span",{className:"reversed reversedLeft",children:N})]}),(0,r.jsxs)("div",{className:"col-md-12",children:[(0,r.jsx)("p",{style:{marginBottom:"-10px",marginTop:"10px"},children:"Username"}),(0,r.jsx)("input",{className:"form-control",onChange:e=>{o(e.target.value)},type:"text",name:"username",required:!0})]}),(0,r.jsxs)("div",{className:"col-md-12",children:[(0,r.jsx)("p",{style:{marginBottom:"-10px",marginTop:"10px"},children:"Email"}),(0,r.jsx)("input",{className:"form-control",onChange:e=>{u(e.target.value)},type:"email",name:"email",required:!0})]}),(0,r.jsxs)("div",{className:"col-md-12",children:[(0,r.jsx)("p",{style:{marginBottom:"-10px",marginTop:"10px"},children:"Password"}),(0,r.jsx)("input",{className:"form-control",onChange:e=>{h(e.target.value)},type:"password",name:"password",required:!0})]}),(0,r.jsxs)("div",{className:"col-md-12 mt-3",style:{marginTop:"15px",display:"flex",alignItems:"center"},children:[(0,r.jsx)("label",{className:"mb-3 mr-1",for:"gender",children:"Gender: "}),(0,r.jsx)("input",{type:"radio",onClick:k,checked:"Male"===p,value:"Male",className:"btn-check",name:"gender",id:"male"}),(0,r.jsx)("label",{className:"btn btn-sm btn-outline-secondary",for:"male",children:"Male"}),(0,r.jsx)("input",{type:"radio",onClick:k,checked:"Female"===p,value:"Female",className:"btn-check",name:"gender",id:"female"}),(0,r.jsx)("label",{className:"btn btn-sm btn-outline-secondary",for:"female",children:"Female"}),(0,r.jsx)("input",{type:"radio",onClick:k,checked:"Secret"===p,value:"Secret",className:"btn-check",name:"gender",id:"secret"}),(0,r.jsx)("label",{className:"btn btn-sm btn-outline-secondary",for:"secret",children:"Secret"})]}),(0,r.jsx)("div",{className:"btn-container",children:(0,r.jsx)("div",{className:"btn-form",onClick:y,children:"Save"})})]})]})]})})]}),c&&(0,r.jsx)("div",{className:"notice",children:(0,r.jsx)("p",{children:"Sending Request..."})})]})})}},5753:function(e,s,a){"use strict";var r=a(6154);let n="https://uno-game-server.glitch.me/api";s.Z=new class{login(e,s){return r.Z.post(n+"/user/login",{username:e,password:s})}logout(){localStorage.removeItem("user")}register(e,s,a,t,l){return r.Z.post(n+"/user/register",{username:e,email:s,password:a,gender:t,role:l})}getCurrentUser(){return JSON.parse(localStorage.getItem("user"))||null}modifyUser(e,s,a,t,l){return r.Z.patch(n+"/user/modify/"+e,{username:s,email:a,password:t,gender:l})}deleteUser(e){return r.Z.delete(n+"/user/delete/"+e)}getGameData(e){return r.Z.get(n+"/gameData/"+e)}saveGameData(e){let{user:s,index:a,name:t,date:l,currentPlayer:c,currentPlayerQueue:i,isReverse:d,main:o,discard:m,p1:u,p2:_,p3:h,p4:p}=e;return r.Z.post(n+"/gameData/data",{user:s,index:a,name:t,date:l,currentPlayer:c,currentPlayerQueue:i,isReverse:d,main:o,discard:m,p1:u,p2:_,p3:h,p4:p})}deleteGameData(e,s){return r.Z.delete(n+"/gameData/"+e+"/"+s)}deleteGameDataAll(e){return r.Z.delete(n+"/gameData/"+e)}}}},function(e){e.O(0,[827,774,888,179],function(){return e(e.s=9344)}),_N_E=e.O()}]);