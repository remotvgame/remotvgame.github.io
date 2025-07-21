document.addEventListener('DOMContentLoaded', () => {
    const player1 = document.getElementById('player1');
    const player2 = document.getElementById('player2');
    const rollDiceBtn = document.getElementById('rollDice');
    const diceResult = document.getElementById('diceResult');
    const gameStatus = document.getElementById('gameStatus');

    let currentPlayer = 1;
    let player1Position = 1;
    let player2Position = 1;

    // إحداثيات الخلايا على اللوحة (مثال مبسط)
    const cellPositions = {
        1: { x: 10, y: 450 }, 2: { x: 60, y: 450 }, /* ... أكمل الباقي حسب تصميم اللوحة */
        100: { x: 460, y: 10 } // الخلية الأخيرة
    };

    // الثعابين والسلالم (من خلية إلى خلية)
    const snakesAndLadders = {
        5: 16,  // سلم من 5 إلى 16
        17: 7,  // ثعبان من 17 إلى 7
        // ... أضف المزيد حسب التصميم
    };

    rollDiceBtn.addEventListener('click', () => {
        const dice = Math.floor(Math.random() * 6) + 1;
        diceResult.textContent = `النرد: ${dice}`;

        if (currentPlayer === 1) {
            player1Position = updatePlayerPosition(player1, player1Position, dice);
            if (player1Position >= 100) {
                gameStatus.textContent = "اللاعب 1 فاز! 🎉";
                rollDiceBtn.disabled = true;
            }
            currentPlayer = 2;
        } else {
            player2Position = updatePlayerPosition(player2, player2Position, dice);
            if (player2Position >= 100) {
                gameStatus.textContent = "اللاعب 2 فاز! 🎉";
                rollDiceBtn.disabled = true;
            }
            currentPlayer = 1;
        }
    });

    function updatePlayerPosition(player, position, dice) {
        const newPosition = position + dice;
        const finalPosition = snakesAndLadders[newPosition] || newPosition;

        if (cellPositions[finalPosition]) {
            const { x, y } = cellPositions[finalPosition];
            player.style.left = `${x}px`;
            player.style.top = `${y}px`;
        }

        return finalPosition;
    }
});
