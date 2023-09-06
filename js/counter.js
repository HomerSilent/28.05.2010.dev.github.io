document.addEventListener("DOMContentLoaded", function () {
  let seconds = 0;
  const counterElement = document.getElementById("counter");

  function updateCounter() {
    counterElement.textContent = seconds;
    seconds++;
  }

  setInterval(updateCounter, 1000); // Cập nhật mỗi 1000 milliseconds (1 giây)
});
