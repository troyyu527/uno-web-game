import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from "framer-motion";
import AuthService from '@utils/services/auth.service';
export default function Login() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleChangeUser = (e) => {
    setUser(e.target.value);
  };

  const handleChangePassword = (e) => {
    setPassword(e.target.value);
  };

  const handleLogin = () => {
    setSending(true)
    AuthService.login(user, password)
      .then((res) => {
        if (typeof window !== 'undefined' && res.data.token) {
          localStorage.setItem('user', JSON.stringify(res.data));
          setSending(false)
          window.alert('Login successfully. You are redirected to the home page.');
          setCurrentUser(AuthService.getCurrentUser());
          router.push('/');
        }
      })
      .catch((error) => {
        setSending(false)
        setMessage(error.response.data);
      });
  };
  const backHome = () =>{
    router.push('/');
  }
  return (
    <motion.div initial={{opacity:0, y:-200}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
      <div className='form-body'>
        <div className="form-holder">
        <div className="back" onClick={backHome}>Back</div>
          <div className="form-content">
            <div className="form-items">
              <h3>Login</h3>
              <p>Remember to register first before login.</p>
              <div className="form" >
              {message && 
                <div id="InfoBanner">
                  <span className="reversed reversedRight">
                    <span>
                      &#9888;
                    </span>
                  </span>
                  <span className="reversed reversedLeft">
                  {message}
                  </span> 
                </div>
              }
                <div className="col-md-12">
                    <input className="form-control" onChange={handleChangeUser} type="text" name="username" placeholder="Username" required/>
                </div>
                <div className="col-md-12">
                  <input className="form-control" onChange={handleChangePassword} type="password" name="password" placeholder="Password" required/>
                </div>
                
                <div className="form-button mt-3"style={{display:"flex",justifyContent:"center"}}>
                  <button id="submit" onClick={handleLogin} className="btn btn-primary">Login</button>
                </div>
              </div>
            </div>
          </div>
        </div>  
        {sending &&
          <div className='notice'><p>Sending Request...</p></div>
        }
      </div>  
    </motion.div>
    
  );
}