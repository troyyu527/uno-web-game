import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AnimatePresence,motion } from "framer-motion";
import AuthService from '@utils/services/auth.service';
//import s from "@styles/menu.module.css";
function Index(){
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [isActive, setIsActive] = useState(false);

  const toggleMenu = () => {
    setIsActive(!isActive);
  };
  
  const handleLogout = () => {
    AuthService.logout();
    window.alert('Logout successfully');
    setCurrentUser(null);
    router.push('/');
  };

  useEffect(() => {
    setCurrentUser(AuthService.getCurrentUser());
  }, []);

  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.div
      initial={{ opacity: 0,y:100 }}
      animate={{ opacity: 1,y:0 }}
    >
      <div className="menu-body">
        <div className={`menu ${isActive ? 'active' : ''}`}>
          {currentUser ? (
            <>
              <p>
                <Link href="/game">
                  Game
                </Link>
              </p>
              <p style={{cursor:"pointer"}} onClick={handleLogout}>
                Logout
              </p>
              <p>
                <Link href="/profile">
                  Account
                </Link>
              </p>
            </>
          ) : (
            <>
              <p>
                <Link href="/register">
                  Register
                </Link>
              </p>
              <p>
                <Link href="/login">
                  Login
                </Link>
              </p>
            </>
          )}
        </div>

        <div className={`menu_toggler ${isActive ? 'active' : ''}`} onClick={toggleMenu}>
          <span></span>
        </div>
        <div className="s-container">
          <h1>UNO Game Place</h1>
          <p>
            This is a personal Next.js project only for Web development Study.
          </p>
          <p>
            Please do not reveal your sensitive information anywhere this website.
          </p>
        </div>
        <div className="footer">
          <p>&copy; 2023 Troy Yu. All rights reserved.</p>
          <p>
            Website created by Troy Yu
          </p>
        </div>
        <a
          className="github"
          title="See Troy Yu on GitHub"
          alt="See Troy Yu on GitHub"
          href="https://github.com/troyyu527"
          target="_blank"
          rel="noopener noreferrer"
        >
          
          <svg viewBox="0 0 20 20" width="20" height="20">
            <g transform= "scale(0.2,0.2)">
              <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="#24292f"/>
            </g>
          </svg>
          <svg 
 width="50" height="20" viewBox="0 -200 1000 0.41"
 preserveAspectRatio="xMidYMid meet">

<g transform="scale(0.1,-0.1)"
fill="#000000" stroke="none">
<path d="M1475 3229 c-432 -59 -678 -318 -767 -809 -29 -160 -31 -545 -4 -695
47 -256 135 -438 276 -569 113 -104 244 -167 432 -207 85 -19 136 -23 293 -23
201 0 259 7 405 51 94 28 224 85 252 110 17 15 18 50 18 578 0 423 -3 564 -12
573 -9 9 -108 12 -384 12 -325 0 -375 -2 -388 -16 -13 -13 -16 -45 -16 -198 0
-128 4 -186 12 -194 8 -8 58 -12 160 -12 l148 0 0 -220 0 -220 -27 -7 c-16 -5
-100 -8 -188 -8 -143 1 -166 3 -218 24 -126 50 -227 184 -267 356 -40 167 -43
458 -6 617 69 297 235 418 573 418 132 0 207 -10 336 -42 68 -18 90 -20 96
-10 4 6 27 94 50 194 l43 182 -22 18 c-30 24 -163 65 -273 84 -111 18 -425 27
-522 13z"/>
<path d="M4512 3148 c-17 -17 -17 -2159 0 -2176 17 -17 429 -17 446 0 9 9 12
128 12 475 l0 463 320 0 320 0 0 -465 c0 -449 1 -465 19 -475 12 -6 102 -10
225 -10 173 0 207 2 220 16 14 14 16 126 16 1084 0 958 -2 1070 -16 1084 -13
14 -47 16 -220 16 -123 0 -213 -4 -225 -10 -18 -10 -19 -25 -19 -410 l0 -400
-320 0 -320 0 0 398 c0 296 -3 401 -12 410 -17 17 -429 17 -446 0z"/>
<path d="M7896 3144 c-14 -14 -16 -126 -16 -1084 0 -958 2 -1070 16 -1084 13
-13 42 -16 164 -16 163 0 180 6 180 58 0 15 4 34 10 42 8 12 11 12 27 -2 33
-30 162 -89 241 -110 106 -28 320 -30 407 -4 262 79 374 284 391 721 20 484
-120 763 -414 824 -141 29 -340 7 -476 -53 -32 -14 -60 -26 -62 -26 -2 0 -4
164 -4 365 0 350 -1 365 -19 375 -12 6 -102 10 -225 10 -173 0 -207 -2 -220
-16z m822 -1053 c92 -47 126 -148 127 -376 0 -317 -51 -405 -235 -405 -80 0
-191 26 -234 54 l-26 16 0 336 0 335 48 20 c121 52 242 60 320 20z"/>
<path d="M2795 3100 c-121 -31 -193 -115 -203 -235 -6 -79 14 -140 66 -197
162 -180 455 -65 454 177 0 46 -7 79 -22 109 -53 111 -183 175 -295 146z"/>
<path d="M3503 2882 c-9 -6 -13 -66 -15 -221 l-3 -214 -113 -27 c-63 -15 -118
-32 -123 -37 -5 -5 -8 -74 -7 -159 l3 -149 120 -5 120 -5 5 -395 c6 -418 6
-425 57 -524 47 -91 163 -172 290 -202 126 -29 401 -13 449 27 19 15 20 324 2
335 -7 4 -49 7 -94 5 -148 -4 -215 30 -234 122 -6 32 -9 162 -8 342 l3 290
160 3 c136 2 162 5 173 19 15 21 17 325 2 354 -10 18 -23 19 -175 19 l-165 0
0 209 c0 181 -2 210 -16 215 -23 9 -417 7 -431 -2z"/>
<path d="M2622 2448 c-9 -9 -12 -186 -12 -734 0 -658 1 -723 17 -735 12 -11
65 -15 219 -17 194 -3 204 -2 223 17 21 21 21 28 21 739 0 545 -3 721 -12 730
-17 17 -439 17 -456 0z"/>
<path d="M6302 2451 c-10 -6 -12 -122 -10 -592 l3 -584 26 -68 c58 -147 139
-219 300 -263 48 -14 101 -18 214 -18 134 1 159 3 240 28 50 15 126 44 170 66
44 21 83 36 87 33 5 -2 8 -17 8 -33 0 -54 17 -60 169 -60 93 0 141 4 149 12 9
9 12 188 12 744 0 658 -2 732 -16 738 -31 12 -429 7 -442 -6 -9 -9 -12 -143
-12 -541 l0 -528 -67 -32 c-62 -29 -76 -32 -170 -32 -87 0 -105 3 -130 21 -64
47 -63 37 -63 591 0 443 -2 503 -16 517 -13 14 -48 16 -227 16 -117 0 -218 -4
-225 -9z"/>
</g>
</svg>
        </a>
      </div>
    </motion.div>
    </AnimatePresence>
  );
}

export default Index;