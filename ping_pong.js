// select canvas element
const canvas = document.getElementById("pong");

// getContext of canvas = methods and properties to draw and do a lot of thing to the canvas
const ctx = canvas.getContext('2d');

// Variable to track the game state (paused or not)
let isPaused = false;

// Variables for Score Limit and game state
let scoreLimitInput = document.getElementById("scoreLimitInput");
let startGameBtn = document.getElementById("startBtn");
let scoreLimit = 7; // Default score limit
let isGameOver = false;

// load sounds
let hit = new Audio();
let wall = new Audio();
let userScore = new Audio();
let comScore = new Audio();

hit.src = "sounds/hit.mp3";
wall.src = "sounds/wall.mp3";
comScore.src = "sounds/comScore.mp3";
userScore.src = "sounds/userScore.mp3";

// Ball object
const ball = {
    x : canvas.width/2,
    y : canvas.height/2,
    radius : 10,
    velocityX : 5,
    velocityY : 5,
    speed : 7,
    color : "WHITE"
}

// User Paddle
const user = {
    x : 0, // left side of canvas
    y : (canvas.height - 100)/2, // -100 the height of paddle
    width : 10,
    height : 100,
    score : 0,
    color : "WHITE"
}

// COM Paddle
const com = {
    x : canvas.width - 10, // - width of paddle
    y : (canvas.height - 100)/2, // -100 the height of paddle
    width : 10,
    height : 100,
    score : 0,
    color : "WHITE"
}

// NET
const net = {
    x : (canvas.width - 2)/2,
    y : 0,
    height : 10,
    width : 2,
    color : "WHITE"
}

// draw a rectangle, will be used to draw paddles
function drawRect(x, y, w, h, color){
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

// draw circle, will be used to draw the ball
function drawArc(x, y, r, color){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2,true);
    ctx.closePath();
    ctx.fill();
}

// listening to the mouse
canvas.addEventListener("mousemove", getMousePos);

function getMousePos(evt){
    let rect = canvas.getBoundingClientRect();
    
    user.y = evt.clientY - rect.top - user.height/2;
}

// Event listener for the Pause/Resume button
document.getElementById("pauseBtn").addEventListener("click", function () {
    isPaused = !isPaused; // Toggle the game state
    if (isPaused) {
        clearInterval(loop); // Stop the game loop
    } else {
        loop = setInterval(game, 1000 / framePerSecond); // Resume the game loop
    }
});

// Event listener for the Score Limit input
document.getElementById("scoreLimitInput").addEventListener("change", function () {
    scoreLimit = parseInt(this.value) || 1; // Ensure a valid numeric value, default to 1 if invalid
    resetGame(); // Reset the game when the score limit changes
});

// when COM or USER scores, we reset the ball
function resetBall(){
    ball.x = canvas.width/2;
    ball.y = canvas.height/2;
    ball.velocityX = -ball.velocityX;
    ball.speed = 7;
}

// draw the net
function drawNet(){
    for(let i = 0; i <= canvas.height; i+=15){
        drawRect(net.x, net.y + i, net.width, net.height, net.color);
    }
}

// draw text
function drawText(text,x,y){
    ctx.fillStyle = "#FFF";
    ctx.font = "75px fantasy";
    ctx.fillText(text, x, y);
}

// Function to reset the game
function resetGame() {
    user.score = 0;
    com.score = 0;
    ball.speed = 7;
    isGameOver = false;
    resetBall();
    clearDust();
}

function clearDust() {
    dustParticles = []; // Clear the dust particles array
  }

// Function to draw the dust particles
function drawDust(particles) {
    
    if (isPaused) return;

    if (isGameOver){
        clearDust();
        return;
    }

    for (const particle of particles) {
      ctx.beginPath();
      ctx.fillStyle = particle.color;
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
  
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.alpha -= 0.05;
      if (particle.alpha <= 0) {
        particles.splice(particles.indexOf(particle), 1);
      }
    }
  }
  
  // Function to update and render the dust particles
  function updateDust(particles) {

    if(isGameOver) return;

    drawDust(particles);
    requestAnimationFrame(() => updateDust(particles));
  }
  
  // Function to create new dust particles on collision
  function createDust(x, y) {
    const particleCount = Math.floor(Math.random() * 5) + 4;
    const dustParticles = [];
  
    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 2;
      const angle = Math.random() * Math.PI * 2;
      const velocityX = Math.cos(angle) * Math.random() * 2;
      const velocityY = Math.sin(angle) * Math.random() * 2;
      const alpha = 2;
  
      dustParticles.push({ x, y, radius, velocityX, velocityY, alpha });
    }
  
    updateDust(dustParticles);
  }

// collision detection
function collision(b,p){
    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;
    
    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;
    
    return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
}

// Function to hide the restart button
function hideStartButton() {
    startGameBtn.style.display = "none";
}

function hidePauseButton() {
    document.getElementById("pauseBtn").style.display = "none";
}

// Event listener for the Start Game button
startGameBtn.addEventListener("click", function () {
    startGame();
    scoreLimitInput.disabled = true; // Disable the input once the game has started
});


// Function to show the restart button
function showStartButton() {
    startGameBtn.style.display = "block";
}

function showPauseButton() {
    document.getElementById("pauseBtn").style.display = "block";
}

// update function, the function that does all calculations
function update(){
    
    if (isGameOver) {
        showStartButton();
        return;
    }

    if (isPaused) {
        return; // Do nothing if the game is paused
    }

    // change the score of players, if the ball goes to the left "ball.x<0" computer win, else if "ball.x > canvas.width" the user win
    if( ball.x - ball.radius < 0 ){
        com.score++;
        comScore.play();
        resetBall();
    }else if( ball.x + ball.radius > canvas.width){
        user.score++;
        userScore.play();
        resetBall();
    }
    
    // the ball has a velocity
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    
    // computer plays for itself, and we must be able to beat it
    // simple AI
    com.y += ((ball.y - (com.y + com.height/2)))*0.4;
    
    // when the ball collides with bottom and top walls we inverse the y velocity.
    if(ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height){
        ball.velocityY = -ball.velocityY;
        wall.play();
    }
    
    // we check if the paddle hit the user or the com paddle
    let player = (ball.x + ball.radius < canvas.width/2) ? user : com;
    
    // if the ball hits a paddle
    if(collision(ball,player)){
        // play sound
        hit.play();

        // Call the createDust function on collision
        createDust(ball.x, ball.y);

        // we check where the ball hits the paddle
        let collidePoint = (ball.y - (player.y + player.height/2));
        // normalize the value of collidePoint, we need to get numbers between -1 and 1.
        // -player.height/2 < collide Point < player.height/2
        collidePoint = collidePoint / (player.height/2);
        
        // when the ball hits the top of a paddle we want the ball, to take a -45degees angle
        // when the ball hits the center of the paddle we want the ball to take a 0degrees angle
        // when the ball hits the bottom of the paddle we want the ball to take a 45degrees
        // Math.PI/4 = 45degrees
        let angleRad = (Math.PI/4) * collidePoint;
        
        // change the X and Y velocity direction
        let direction = (ball.x + ball.radius < canvas.width/2) ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        
        // speed up the ball everytime a paddle hits it.
        ball.speed += 0.1;
        
        if (user.score >= scoreLimit || com.score >= scoreLimit) {
            isGameOver = true;
            clearInterval(loop); // Stop the game loop
        }
    }
}

// render function, the function that does al the drawing
function render(){
   
    // clear the canvas
    drawRect(0, 0, canvas.width, canvas.height, "#000");
    
    // draw the user score to the left
    drawText(user.score,canvas.width/4,canvas.height/5);
    
    // draw the COM score to the right
    drawText(com.score,3*canvas.width/4,canvas.height/5);
    
    // draw the net
    drawNet();
    
    // draw the user's paddle
    drawRect(user.x, user.y, user.width, user.height, user.color);
    
    // draw the COM's paddle
    drawRect(com.x, com.y, com.width, com.height, com.color);
    
    // draw the ball
    drawArc(ball.x, ball.y, ball.radius, ball.color);

     // Display game over message when the game ends
     if (isGameOver) {
        drawRect(0, 0, canvas.width, canvas.height, "#000");
        drawText("Game Over", canvas.width / 4, canvas.height / 2);
        drawText(`${user.score} - ${com.score}`, canvas.width / 3, canvas.height / 2 + 50);
        showStartButton();
        hidePauseButton();
        scoreLimitInput.disabled = false;    //enable the score limit
    }
}
function game(){
    hideStartButton();
    update();
    render();
}
// number of frames per second
let framePerSecond = 50;


function startGame() {
    scoreLimit = parseInt(scoreLimitInput.value) || 1; // Ensure a valid numeric value, default to 1 if invalid
    resetGame(); // Reset the game when starting
    hideStartButton();
    showPauseButton();
    loop = setInterval(game, 1000 / framePerSecond); // Start the game loop
}
