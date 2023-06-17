import Head from 'next/head';
import "@styles/menu.css";
import "@styles/menuPage.css";
import "@styles/game.css";
import "@styles/gameover.css";


function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/x-icon" href="./img/icons-uno.ico" />
        <title>UNO</title>
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp;