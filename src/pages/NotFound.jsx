import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-orbit not-found-orbit-one" aria-hidden="true" />
      <div className="not-found-orbit not-found-orbit-two" aria-hidden="true" />
      <div className="not-found-content">
        <Link to="/" className="not-found-brand" aria-label="Super Mart home">
          <img src="/img/logo.svg" alt="" />
          <span>Super <b>Mart</b></span>
        </Link>
        <div className="not-found-code" aria-hidden="true">
          <span>4</span><i>0</i><span>4</span>
        </div>
        <p className="not-found-eyebrow">Page not found</p>
        <h1>This page took a wrong turn.</h1>
        <p className="not-found-copy">The link may be broken, or the page has moved. Let us get you back to the latest electronics and accessories.</p>
        <div className="not-found-actions">
          <Link to="/" className="button-primary">Back to home <span aria-hidden="true">&rarr;</span></Link>
          <Link to="/products" className="button-secondary">Browse products</Link>
        </div>
      </div>
    </main>
  );
}

export default NotFound;
