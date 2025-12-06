import React, { useEffect, useState } from "react";

export default function Toast({
  message,
  isWarning = false,
  duration = 3000,
  onClose,
}) {
  const [show, setShow] = useState(false);

  const style = {
    backgroundColor: isWarning ? "red" : "#4caf50",
  };

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 500);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast-container ${show ? "show" : ""}`} style={style}>
      {message}
    </div>
  );
}
