let isPopActive = false;
let local_click = 0;
let type = "defense"

let dataSend //Setinterval
let animationInProgress = false; // 애니메이션 실행 상태 플래그

//멑티 터치 처리
let touchCount = 0;
let pressedKeys = new Set();

let baseImage = null; // 기본 배경
let clickedImage = null; // 클릭 후 배경
let local_data = {}
let animated_data = {}; // 애니메이션용 데이터
let local_data_update = {};
let pps = {};

//이미지 프리로드
const img1 = new Image();
img1.src = "/images/popcat_cat1.png";
const img2 = new Image();
img2.src = "/images/popcat_cat2.png";

// 클라이언트에서 웹소켓 연결 시도
const socket = new WebSocket('wss://' + window.location.hostname);
//const socket = new WebSocket('ws://localhost:8080');
socket.binaryType = 'nodebuffer';  // 기본적으로 Buffer로 설정

socket.onopen = () => {
    console.log('WebSocket connected');

    dataSend = setInterval(() => {
        socket.send(JSON.stringify(local_data_update)); //데이터 전송
        local_data_update = {};
    }, 1000);

};

//서버에서 메세지를 받았을때
socket.onmessage = (event) => {
    local_data = JSON.parse(event.data); // 서버로부터 받은 JSON 데이터를 파싱
    gradualUpdate(local_data);
};

//에러 로그출력
socket.onerror = (error) => {
    console.error('WebSocket error:', error);
};

//웹소켓이 닫혔을때
socket.onclose = () => {
    console.log('WebSocket closed');
    clearInterval(dataSend);
};

//화면 업데이트
function updateUI() {
    let sorted_data = Object.entries(animated_data)
        .map(([key, value]) => {
            return [
                key,
                Math.round(value.attacked),
                Math.round(value.score)
            ];
        })
        .sort((a, b) => {
            // score 내림차순
            if (b[2] !== a[2]) {
                return b[2] - a[2];
            }
            // attacked 내림차순
            if (b[1] !== a[1]) {
                return b[1] - a[1];
            }
            // key값 오름차순
            return a[0].localeCompare(b[0]);
        });

    // UI 업데이트
    let board = document.getElementById("ranking").children;
    for (let rank = 0; rank < 18; rank++) {
        //html 요소
        let class_text = board[rank].children[1];
        let attacked_text = board[rank].children[3];
        let score_text = board[rank].children[4];
        let pps_text = board[rank].children[2];

        //화면에 표시
        let cl = sorted_data[rank][0]
        let pps_value = pps[cl] ?? 0;
        class_text.innerText = cl;
        attacked_text.innerText = sorted_data[rank][1];
        score_text.innerText = sorted_data[rank][2];
        pps_text.innerText = pps_value + " PPS"

        //pps 클래스 분?배
        let pps_classlist = pps_text.classList;
        if (pps_value == 0){
            if (pps_classlist.contains("pps_visible")) {
                pps_classlist.remove("pps_visible");
            }
        }
        else if (pps_value > 0){
            if (!pps_classlist.contains("pps_visible")){
                pps_classlist.add("pps_visible");
            }
            if (!pps_classlist.contains("plus")){
                pps_classlist.add("plus");
            }
            if (pps_classlist.contains("minus")){
                pps_classlist.remove("minus");
            }
        }
        else{
            if (!pps_classlist.contains("pps_visible")){
                pps_classlist.add("pps_visible");
            }
            if (pps_classlist.contains("plus")){
                pps_classlist.remove("plus");
            }
            if (!pps_classlist.contains("minus")){
                pps_classlist.add("minus");
            }
        }
    }
}


//로컬값 서버값으로 점진적으로 조정하는 함수
let isAnimating = false;  // 애니메이션 진행 여부
let currentInterval = null; // 애니메이션 실행을 위한 interval 저장

function stopAnimation() {
    if (currentInterval) {
        clearInterval(currentInterval);  // 기존 애니메이션 중지
        currentInterval = null;
    }
    isAnimating = false;  // 애니메이션 상태 리셋
}

function gradualUpdate(data) {
    // 기존 애니메이션이 진행 중이면 중지하고 새로 시작
    if (isAnimating) {
        stopAnimation();  // 기존 애니메이션 중지
    }

    // 애니메이션 시작
    isAnimating = true;

    const animationDuration = 1000;  // 애니메이션 지속 시간 (ms)
    const frameRate = 60;  // 초당 프레임 수
    const totalFrames = Math.round((animationDuration / 1000) * frameRate);

    const incrementPerFrame = {};

    // 값 증가 비율 계산
    for (const [key, value] of Object.entries(data)) {
        if (!animated_data[key]) {
            animated_data[key] = { attacked: value.attacked, score: value.score };
        }

        incrementPerFrame[key] = {
            attacked: (value.attacked - animated_data[key].attacked) / totalFrames,
            score: (value.score - animated_data[key].score) / totalFrames,
        };

        pps[key] = Math.round(value.score - animated_data[key].score);
    }

    let currentFrame = 0;

    // 애니메이션 실행 함수
    const updateAnimation = () => {
        if (currentFrame >= totalFrames) {
            updateUI(); // UI 업데이트
            isAnimating = false; // 애니메이션 종료
            return;
        }

        // 각 프레임마다 값 증가
        for (const [key, increment] of Object.entries(incrementPerFrame)) {
            animated_data[key].attacked += increment.attacked;
            animated_data[key].score += increment.score;
        }

        updateUI(); // UI 업데이트
        currentFrame++;
    };

    // 새로운 애니메이션 시작
    currentInterval = setInterval(() => {
        updateAnimation();
        if (!isAnimating) clearInterval(currentInterval); // 애니메이션 종료 시 interval 삭제
    }, 1000 / frameRate);
}

// attack - defense 변환
function typeSelect() {
    let btn = document.getElementById("typeSelectBTN");

    if (type == "defense") { // defense에서 attack으로 변경
        btn.classList.remove("defense")
        btn.classList.add("attack");
        btn.innerText = "Attack";
        type = "attack";
    } else { // attack에서 defense로 변경
        btn.classList.remove("attack")
        btn.classList.add("defense");
        btn.innerText = "Defense";
        type = "defense"
    }
}

// pop!
function pop() {
    let grade = document.getElementById("grade").value;
    let Class = document.getElementById("class").value;
    if (grade == "-" || Class == "-") { //학년과 반 선택 확인
        alert("학년과 반을 선택해주세요!");
        isPopActive = false;
        setImage(false);
        document.body.removeEventListener("mousedown");
        document.body.removeEventListener("touchstart");
        return;
    }

    // 학년-반 key 생성
    let key = grade.toString() + "-" + Class.toString();


    if (!local_data_update[key]){
        local_data_update[key] = {attacked: 0, defensed: 0};
    }

    if (type === "defense") {
        local_data[key].score += 1;
        if (local_data_update[key].defensed < 50){ //pps 50으로 제한
            local_data_update[key].defensed += 1;
        }
    } else if (type === "attack") {
        if (local_data_update[key].attacked < 50){ //pps 50으로 제한
            local_data_update[key].attacked += 1;
        }
        if (local_data[key].score >= 1) {
            local_data[key].score -= 1;
        }
    }

    var audio = new Audio('/audios/popcat_sound.mp3');
    audio.play();
    audio.loop = false;
    audio.volume = 1.0;
    local_click++;
    localStorage.setItem("local_click", JSON.stringify(local_click));
    document.getElementById("click").innerText = local_click;
}

// 파일 입력창을 트리거
function triggerFileInput(type) {
    if (type === 1) {
        document.getElementById('fileInput1').click(); // 기본 배경 업로드
    } else if (type === 2) {
        document.getElementById('fileInput2').click(); // 클릭 후 배경 업로드
    }
}

//스킨 업데이트
function updateImage(type, event) {
    const file = event.currentTarget.files[0];
    const reader = new FileReader();
    reader.onload = ({ target }) => {
        if (type == 1) {
            baseImage = `url('${target.result}')`;
            setImage(false);
        } else {
            clickedImage = `url('${target.result}')`;
        }
    };
    reader.readAsDataURL(file);
}

// 이미지 변경 함수
function setImage(isPop) {
    let popcat = document.getElementById("popcat")
    let background = baseImage || "/images/popcat_cat1.png"; // 기본 배경 설정
    if (isPop) {
        background = clickedImage || "/images/popcat_cat2.png"; // 클릭 후 배경 설정
    }
    if (!isPop && baseImage){
        document.body.style.backgroundImage = baseImage;
        if (!popcat.classList.contains("popcat_invisible")){
            popcat.classList.add("popcat_invisible");
        }
    }
    else if (isPop && clickedImage){
        document.body.style.backgroundImage = clickedImage;
        if (!popcat.classList.contains("popcat_invisible")){
            popcat.classList.add("popcat_invisible");
        }
    }
    else{
        document.getElementById("popcat").src = background;
        document.body.style.backgroundImage = "url('../images/background.jpg')"
        if (popcat.classList.contains("popcat_invisible")){
            popcat.classList.remove("popcat_invisible");
        }
    }
}

// document가 로드 되었을 때
document.addEventListener("DOMContentLoaded", function () {
    //반 선택 정보 저장
    let grade_selectBox = document.getElementById("grade");
    let class_selectBox = document.getElementById("class");
    grade_selectBox.addEventListener('change', function () {
        if (grade_selectBox.value != "-"){
            localStorage.setItem("selected_grade", grade_selectBox.value)
        }
    })
    class_selectBox.addEventListener('change',function () {
        if (class_selectBox.value != "-"){
            localStorage.setItem("selected_class", class_selectBox.value)
        }
    })

    // local click load
    local_click = JSON.parse(localStorage.getItem("local_click")) ?? 0;
    document.getElementById("click").innerText = local_click;

    // 반 선택 정보 불러오기
    let selected_grade = localStorage.getItem('selected_grade') ?? "-";
    let selected_class = localStorage.getItem('selected_class') ?? "-";
    grade_selectBox.value = selected_grade;
    class_selectBox.value = selected_class;

    function check(target) {
        return target.tagName === "SELECT" || target.tagName === "BUTTON" || document.getElementById("popup").contains(target);
    }

    // 배경 클릭 이벤트
    document.body.addEventListener("mousedown", function (event) {
        // 드롭다운과 버튼을 클릭했을 때는 실행하지 않음
        if (check(event.target)) {
            return;
        }

        if (!isPopActive) {
            pop();
            isPopActive = true;
        }
        setImage(true); // 클릭 중일 때
    });

    document.body.addEventListener("mouseup", function (event) {
        // 드롭다운과 버튼을 클릭했을 때는 실행하지 않음
        if (check(event.target)) {
            return;
        }

        isPopActive = false;
        setImage(false); // 클릭을 놓았을 때
    });

    // 모바일 이벤트 처리
    document.body.addEventListener("touchstart", function (event) {
        // 드롭다운 메뉴나 버튼이 클릭되었을 때는 preventDefault를 호출하지 않음
        if (check(event.target)) {
            return;
        }
        event.preventDefault();

        touchLength = event.touches.length;
        if (touchCount < touchLength) {
            pop();
        }
        touchCount = touchLength;
        setImage(true); // 터치 시작 시
    }, { passive: false });

    document.body.addEventListener("touchend", function (event) {
        touchCount = 0
        setImage(false); // 터치 끝날 때
    });

    // 키보드 이벤트
    document.body.addEventListener("keydown", function (event) {
        if (!pressedKeys.has(event.key)) {
            pop();
            pressedKeys.add(event.key);
        }
        setImage(true); // 키를 누를 때
    });

    document.body.addEventListener("keyup", function (event) {
        pressedKeys.delete(event.key);
        setImage(false); // 키를 뗄 때
    });

    const bar = document.getElementById("bar");
    bar.addEventListener("click", barClick);
    bar.addEventListener("touchstart", barClick);
});

//leaderboard
// bar 클릭 시 리더보드 토글 처리
function barClick() {
    let popup = document.getElementById("popup");
    let main = document.getElementById("main");

    //애니메이션중?
    if (popup.classList.contains("animating")) return;
    popup.classList.add("animating");

    if (!popup.classList.contains("visible")) {
        popup.classList.add("visible");
        main.style.display = "flex";
        let w1 = document.getElementById("col").offsetWidth
        let w2 = document.getElementById("row").offsetWidth
        document.getElementById("col").style.paddingRight = (w1 - w2 + 4) + "px";
    } else {
        popup.classList.remove("visible");

        setTimeout(() => {
            main.style.display = "none";
        }, 450);
    }

    setTimeout(() => {
        popup.classList.remove("animating");
    }, 450);
}
