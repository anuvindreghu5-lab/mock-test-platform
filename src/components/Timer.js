import React, { useEffect, useState } from "react";

const Timer = ({ totalSeconds, onTimeEnd, onWarning }) => {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeEnd();
      return;
    }

    if (timeLeft <= 60) {
      onWarning();
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeEnd, onWarning]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const timeColor =
    timeLeft <= 60 ? "text-red-600" : "text-gray-700";

  return (
    <div className={`text-center ${timeColor}`}>
      <h3 className="text-sm font-semibold mb-2">Time Left</h3>
      <p className="text-3xl font-bold font-mono">
        {hours.toString().padStart(2, "0")}:
        {minutes.toString().padStart(2, "0")}:
        {seconds.toString().padStart(2, "0")}
      </p>
    </div>
  );
};

export default Timer;