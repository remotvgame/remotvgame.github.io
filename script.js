const ball = document.getElementById("ball");
let isJumping = false;

document.addEventListener("keydown", (event) => {
    if (event.code === "Space" && !isJumping) {
        isJumping = true;
        jump();
    }
});

function jump() {
    let position = 100;
    const jumpInterval = setInterval(() => {
        if (position >= 250) {
            clearInterval(jumpInterval);
            fall();
        }
        position += 5;
        ball.style.bottom = position + "px";
    }, 20);
}

function fall() {
    let position = 250;
    const fallInterval = setInterval(() => {
        if (position <= 100) {
            clearInterval(fallInterval);
            isJumping = false;
        }
        position -= 5;
        ball.style.bottom = position + "px";
    }, 20);
}
