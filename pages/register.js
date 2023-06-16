import React,{ useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from "framer-motion";
import AuthService from '@utils/services/auth.service';
function Register() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [role, setRole] = useState('Member');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false)
  let selectGender
  const handleChangeUsername = (e) => {
    setUsername(e.target.value);
  };

  const handleChangeEmail = (e) => {
    setEmail(e.target.value);
  };

  const handleChangePassword = (e) => {
    setPassword(e.target.value);
  };
  const handleChangeGender = (e) => {
    setGender(e.target.value);
  };
  const handleChangeRole = (e) => {
    setRole(e.target.value);
  };

  const handleRegister = () => {
    setIsSending(true)
    AuthService
      .register(username, email, password, gender, role)
      .then(() => {
        setIsSending(false)
        window.alert('Registration succeeded. You are redirected to the home page.');
        router.push('/');
      })
      .catch((error) => {
        setIsSending(false)
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
              <h3>Register Now</h3>
              <p>This is for recording the game data. Don't put your real personal information.</p>
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
                    <input className="form-control" onChange={handleChangeUsername} type="text" name="username" placeholder="Username" required/>
                </div>
                <div className="col-md-12">
                  <input className="form-control" onChange={handleChangeEmail} type="email" name="email" placeholder="E-mail Address" required/>
                </div>
                <div className="col-md-12">
                  <input className="form-control" onChange={handleChangePassword} type="password" name="password" placeholder="Password" required/>
                </div>
                <div className="col-md-12 mt-3" style={{marginTop:"15px",display:"flex",alignItems:"center"}}>
                  <label className="mb-3 mr-1" for="gender">Gender: </label>

                  <input type="radio" onClick={handleChangeGender} value="Male" className="btn-check" name="gender" id="male"  />
                  <label className="btn btn-sm btn-outline-secondary" for="male">Male</label>

                  <input type="radio" onClick={handleChangeGender} value="Female" className="btn-check" name="gender" id="female"  />
                  <label className="btn btn-sm btn-outline-secondary" for="female">Female</label>

                  <input type="radio" onClick={handleChangeGender} value="Secret" className="btn-check" name="gender" id="secret"  />
                  <label className="btn btn-sm btn-outline-secondary" for="secret">Secret</label>
                </div>
                <div className="col-md-12">
                  <select className="form-select mt-3" value={role} onChange={handleChangeRole}>
                    <option selected value="Member">Member</option>
                    <option disabled value="Admin">Admin (Not Available)</option>
                    <option disabled value="Visitor">Visitor (Not Available)</option>
                  </select>
                </div>
                <div className="form-check" style={{margin:"15px 0",display:"flex",alignItems:"center"}}>
                  <input className="form-check-input" type="checkbox" value="" id="invalidCheck" required/>
                  <label className="form-check-label">I consent to the data use for this website</label>
                </div>

                <div className="form-button mt-3"style={{display:"flex",justifyContent:"center"}}>
                  <button id="submit" onClick={handleRegister} className="btn btn-primary">Register</button>
                </div>
              </div>
            </div>
          </div>
        </div>  
        {isSending &&
          <div className='notice'><p>Sending Request...</p></div>
        }
      </div>  
    </motion.div>
    
  );
}

export default Register