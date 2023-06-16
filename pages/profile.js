import React,{ useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AuthService from '@utils/services/auth.service';

function Profile() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser()||{})
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState(currentUser?.user||"");
  const [email, setEmail] = useState(currentUser?.email||"");
  const [password, setPassword] = useState(currentUser?.password||"");
  const [gender, setGender] = useState(currentUser?.gender||"");
  const [isModify,setIsModify] = useState(false)
  const [message, setMessage] = useState('');
  
  const backHome = () =>{
    router.push('/');
  }
  const handleModify = (e) => {
    if(isModify){
      setSending(true)
      AuthService
        .modifyUser(currentUser._id,user,email,password,gender)
        .then(()=>{
          let newData = currentUser
          newData.user = user
          newData.email = email
          newData.password = password
          newData.gender = gender
          localStorage.setItem('user', JSON.stringify(newData));
          setSending(false)
          setIsModify(false)
        })
        .catch((error) => {
          setSending(false)
          setMessage(error.response.data);
        });
    }else{
      setIsModify(!isModify)
    }
  };

  const handleDelete = (e) => {
    const result = confirm("Are You Sure To Delete This Account?");
    if (result) {
      setSending(true)
      AuthService
      .deleteUser(currentUser._id)
      .then(()=>{
        setSending(false)
        localStorage.removeItem("user")
        router.push('/');
      })
      .catch((error)=>{
        setSending(false)
        setMessage(error.response.data);
      })
  
    }
  };
  const handleChangeUsername = (e) => {
    setUser(e.target.value);
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
  useEffect(()=>{
    if(!currentUser) backHome()
  },[currentUser])
 
  return (
    <>
      <div className='form-body'>
        <div className="form-holder">
        <div className="back" onClick={backHome}>Back</div>
          <div className="form-content">
            <div className="form-items">
              <h3>Account Info</h3>
              {!isModify?<p>Here Is Your Account Information.</p>:<p>Please Fill Your New Information.</p> }
              <p style={{marginTop:"-20px"}}>_________________________________________________________________</p>
              <div className="form" >
              {!isModify &&
                <div className='account'>
                  <div className='account-info'>
                    <p>User: {user}</p>
                    <p>Email: {email}</p>
                    <p>Password: (Hidden)</p>
                    <p>Gender: {gender}</p>
                    <p>Role: {currentUser?.role||"Member"}</p>
                  </div>
                  <div className='btn-container'>
                    <div className='btn-form' onClick={handleModify}>Modify</div>
                    <div className='btn-form'onClick={handleDelete}>Delete</div>
                  </div>
                </div>
              }
              {isModify &&
                <>
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
                  <div className="col-md-12" >
                    <p style={{marginBottom:"-10px",marginTop:"10px"}}>Username</p>
                    <input className="form-control" onChange={handleChangeUsername} type="text" name="username"  required/>
                  </div>
                  <div className="col-md-12">
                  <p style={{marginBottom:"-10px",marginTop:"10px"}}>Email</p>
                    <input className="form-control" onChange={handleChangeEmail} type="email" name="email"  required/>
                  </div>
                  <div className="col-md-12">
                  <p style={{marginBottom:"-10px",marginTop:"10px"}}>Password</p>
                    <input className="form-control" onChange={handleChangePassword} type="password" name="password" required/>
                  </div>
                  <div className="col-md-12 mt-3" style={{marginTop:"15px",display:"flex",alignItems:"center"}}>
                    <label className="mb-3 mr-1" for="gender">Gender: </label>

                    <input type="radio" onClick={handleChangeGender} checked={gender==="Male"} value="Male" className="btn-check" name="gender" id="male"  />
                    <label className="btn btn-sm btn-outline-secondary" for="male">Male</label>

                    <input type="radio" onClick={handleChangeGender} checked={gender==="Female"} value="Female" className="btn-check" name="gender" id="female"  />
                    <label className="btn btn-sm btn-outline-secondary" for="female">Female</label>

                    <input type="radio" onClick={handleChangeGender} checked={gender==="Secret"} value="Secret" className="btn-check" name="gender" id="secret"  />
                    <label className="btn btn-sm btn-outline-secondary" for="secret">Secret</label>
                  </div>
                  <div className='btn-container'>
                    <div className='btn-form' onClick={handleModify}>Save</div>
                  </div>
                </>
                
              }
                
              </div>
            </div>
          </div>
        </div>  
        {sending &&
          <div className='notice'><p>Sending Request...</p></div>
        }
      </div>  
    </>
    
  )
}

export default Profile