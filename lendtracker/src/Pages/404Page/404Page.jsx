import React from "react";
import { useNavigate } from "react-router-dom";
import "./404Page.css";
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <>
      <div className="nf-root" role="main" aria-labelledby="nf-heading">
        <div className="nf-card" role="region" aria-label="404 Not Found">
          <div className="nf-left">
            <div className="nf-code" aria-hidden>
              404
            </div>
            <div id="nf-heading" className="nf-title">
              Oops — page not found
            </div>
            <p className="nf-desc">
              We couldn't find the page you're looking for. It might have been
              removed, had its name changed, or is temporarily unavailable. Try
              going back or head to the home page.
            </p>

            <div className="nf-actions" aria-hidden={false}>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/")}
                aria-label="Go to Home"
                title="Go to Home"
              >
                Home
              </button>

              <button
                className="btn btn-ghost"
                onClick={() => navigate(-1)}
                aria-label="Go back"
                title="Go back"
              >
                Go back
              </button>

              <button
                className="btn"
                onClick={() => window.location.reload()}
                aria-label="Reload page"
                title="Reload page"
                style={{
                  border: "1px dashed rgba(15,23,42,0.06)",
                  background: "transparent",
                }}
              >
                Reload
              </button>
            </div>

            <div className="nf-meta" aria-hidden>
              Tip: Check the URL for typos or use the search in the header.
            </div>
          </div>

          <div className="nf-illustration" aria-hidden>
            <div className="dot one" />
            <div className="dot two" />
            <div className="dot three" />

            <div
              className="nf-screen"
              role="img"
              aria-label="magnifying glass looking at missing item"
            >
              <div className="magnifier">404</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
