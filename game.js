const wordMap = {
    "能": "can/able to", "病": "illness", "感冒": "cold",
    "头疼": "headache", "发烧": "fever", "咳嗽": "cough",
    "前天": "the day before yesterday", "场": "field",
    "足球": "football", "比赛": "match", "回来": "come back",
    "带": "bring", "伞": "umbrella", "看病": "see doctor",
    "开": "open/start", "打针": "get injection",
    "最好": "had better", "休息": "rest",
    "请假条": "leave note", "请假": "ask for leave",
    "希望": "hope", "批准": "approve", "月": "month", "日": "day"
  };
  
  const words = Object.keys(wordMap);
  const total = words.length;
  const sliceAngle = 2 * Math.PI / total;
  
  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");
  const spinBtn = document.getElementById("spinBtn");
  const quizModeBtn = document.getElementById("quizModeBtn");
  const result = document.getElementById("result");
  const wheelMode = document.getElementById("wheel-mode");
  
  const quizContainer = document.getElementById("quiz-container");
  const quizQuestion = document.getElementById("quiz-question");
  const quizOptions = document.getElementById("quiz-options");
  const quizFeedback = document.getElementById("quiz-feedback");
  const backToWheel = document.getElementById("backToWheel");
  const quizScore = document.getElementById("quiz-score");
  const quizTimer = document.getElementById("quiz-timer");
  const timeLeftEl = document.getElementById("time-left");
  const downloadCertBtn = document.getElementById("downloadCert");
  
  let angle = 0;
  let spinning = false;
  let correctCount = 0;
  let totalCount = 0;
  let timeLeft = 60;
  let timerInterval = null;
  
  // 🎵 TICK sound during spin
  function playSpinTickSound() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }
  
  // 🎵 Quiz correct/wrong beep
  function playBeep(success = true) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = success ? 880 : 240;
    oscillator.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
  }
  
  // 🌀 Wheel drawing
  function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < total; i++) {
      const start = angle + i * sliceAngle;
      const end = start + sliceAngle;
  
      ctx.beginPath();
      ctx.moveTo(200, 200);
      ctx.arc(200, 200, 180, start, end);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? "#3498db" : "#f1c40f";
      ctx.fill();
  
      ctx.save();
      ctx.translate(
        200 + Math.cos(start + sliceAngle / 2) * 130,
        200 + Math.sin(start + sliceAngle / 2) * 130
      );
      ctx.rotate(start + sliceAngle / 2 + Math.PI / 2);
      ctx.fillStyle = "#fff";
      ctx.font = "18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(words[i], 0, 0);
      ctx.restore();
    }
  
    ctx.beginPath();
    ctx.arc(200, 200, 40, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.fillStyle = "#3051c7";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GO", 200, 207);
  }
  
  // 🎡 Wheel spin animation
  function spinWheel() {
    if (spinning) return;
    spinning = true;
    result.textContent = "🎲 正在转动...";
    const targetRotation = angle + Math.PI * (4 + Math.random() * 2);
    const duration = 4000;
    const start = performance.now();
  
    function animate(t) {
      const elapsed = Math.min((t - start) / duration, 1);
      const easeOut = 1 - Math.pow(1 - elapsed, 4);
      angle += (targetRotation - angle) * easeOut;
      drawWheel();
      playSpinTickSound();
      if (elapsed < 1) requestAnimationFrame(animate);
      else {
        const idx = Math.floor(((2 * Math.PI - angle % (2 * Math.PI)) / sliceAngle) % total);
        result.textContent = `🎉 抽中：${words[idx]}`;
        spinning = false;
      }
    }
  
    requestAnimationFrame(animate);
  }
  
  // 🧠 Quiz logic
  function startQuizRound() {
    quizFeedback.textContent = "";
    const entries = Object.entries(wordMap);
    const [correctChar, meaning] = entries[Math.floor(Math.random() * entries.length)];
  
    quizQuestion.innerHTML = `📘 What is the Chinese for:<br><strong>“${meaning}”</strong><br><small>Hint: 我${correctChar}去医院。</small>`;
  
    const options = [correctChar];
    while (options.length < 4) {
      const rand = entries[Math.floor(Math.random() * entries.length)][0];
      if (!options.includes(rand)) options.push(rand);
    }
  
    options.sort(() => Math.random() - 0.5);
    quizOptions.innerHTML = "";
    options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
      btn.onclick = () => {
        totalCount++;
        if (opt === correctChar) {
          correctCount++;
          playBeep(true);
          quizFeedback.textContent = "✅ 正确！";
          quizFeedback.style.color = "#2ecc71";
        } else {
          playBeep(false);
          quizFeedback.textContent = `❌ 错了！答案是：${correctChar}`;
          quizFeedback.style.color = "#e74c3c";
        }
        quizScore.textContent = `🔢 Score: ${correctCount} / ${totalCount}`;
        setTimeout(startQuizRound, 1200);
      };
      quizOptions.appendChild(btn);
    });
  }
  
  // ⏱️ Timer
  function startTimer() {
    timeLeft = 60;
    timeLeftEl.textContent = timeLeft;
    timerInterval = setInterval(() => {
      timeLeft--;
      timeLeftEl.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endQuizAndShowCertificate();
      }
    }, 1000);
  }
  
  // 📄 Show certificate
  function endQuizAndShowCertificate() {
    quizQuestion.textContent = `🎓 时间到！你答对了 ${correctCount} / ${totalCount}。`;
    quizOptions.innerHTML = "";
    quizFeedback.textContent = "";
    downloadCertBtn.style.display = "inline-block";
  }
  
  downloadCertBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });
  
    // Frame border
    doc.setDrawColor(60, 90, 180);
    doc.setLineWidth(3);
    doc.rect(10, 10, 277, 190, "S");
  
    // Title
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(26);
    doc.text("汉字学习优异证书", 148, 40, { align: "center" });
  
    // Subtitle
    doc.setFontSize(16);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(52, 73, 94);
    doc.text("兹证明您在汉字学习小测中表现优异，成绩如下：", 148, 55, { align: "center" });
  
    // Score
    doc.setFontSize(18);
    doc.setTextColor(34, 139, 34);
    doc.text(`得分：${correctCount} / ${totalCount}`, 148, 75, { align: "center" });
  
    // Info section
    const date = new Date().toLocaleDateString();
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`学生姓名：____________________`, 50, 110);
    doc.text(`颁发日期：${date}`, 50, 125);
    doc.text(`教师签名：____________________`, 50, 150);
  
    // Badge
    doc.setFontSize(40);
    doc.setTextColor(192, 57, 43);
    doc.text("🏅", 240, 135);
  
    // Footer with school name
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("此证书由 北京理工大学 汉字幸运轮盘 学习系统自动生成。", 148, 190, { align: "center" });
  
    doc.save("汉字学习优异证书.pdf");
  });
  
  // 🎮 Event Listeners
  spinBtn.addEventListener("click", spinWheel);
  quizModeBtn.addEventListener("click", () => {
    wheelMode.style.display = "none";
    quizContainer.style.display = "block";
    correctCount = 0;
    totalCount = 0;
    downloadCertBtn.style.display = "none";
    quizScore.textContent = `🔢 Score: 0 / 0`;
    startQuizRound();
    startTimer();
  });
  backToWheel.addEventListener("click", () => {
    wheelMode.style.display = "block";
    quizContainer.style.display = "none";
    quizFeedback.textContent = "";
    clearInterval(timerInterval);
  });
  
  drawWheel();
  