import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* Add your stylesheet link tags here */}
          {/* <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css"
          /> */}
          {/* <link rel="stylesheet" href="/style.css" />
          <link rel="stylesheet" href="/slider.css" />
          <link rel="stylesheet" href="/menu.css" />
          <link rel="stylesheet" href="/form.css" />
          <link rel="stylesheet" href="/gameover.css" /> */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;