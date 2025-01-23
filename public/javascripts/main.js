let isPopActive = false;
let local_click = 0;
let type = "defense"

let dataSend //Setinterval

let baseImage = null; // 기본 배경
let clickedImage = null; // 클릭 후 배경
let local_data = {}
let animated_data = {}; // 애니메이션용 데이터
let local_data_update = {};

// 클라이언트에서 웹소켓 연결 시도
const socket = new WebSocket('ws://localhost:8080');
socket.binaryType = 'nodebuffer';  // 기본적으로 Buffer로 설정

socket.onopen = () => {
    console.log('WebSocket connected');

    dataSend = setInterval(() => {
        socket.send(JSON.stringify(local_data_update)); //데이터 전송
        console.log(local_data_update);
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
        let class_text = board[rank].children[1];
        let attacked_text = board[rank].children[3];
        let score_text = board[rank].children[4];

        class_text.innerText = sorted_data[rank][0];
        attacked_text.innerText = sorted_data[rank][1];
        score_text.innerText = sorted_data[rank][2];
    }
}


//로컬값 서버값으로 점진적으로 조정하는 함수
function gradualUpdate(data) {
    const animationDuration = 1000; // 애니메이션 지속 시간 (ms)
    const frameRate = 60; // 초당 프레임 수
    const totalFrames = Math.round((animationDuration / 1000) * frameRate);
    const incrementPerFrame = {};

    for (const [key, value] of Object.entries(data)) {
        if (!animated_data[key]) {
            animated_data[key] = { attacked: value.attacked, score: value.score };
        }

        // 증가값 계산
        incrementPerFrame[key] = {
            attacked: (value.attacked - animated_data[key].attacked) / totalFrames,
            score: (value.score - animated_data[key].score) / totalFrames,
        };
    }

    let currentFrame = 0;

    // 애니메이션 실행
    const updateAnimation = () => {
        if (currentFrame >= totalFrames) {
            updateUI(); // UI 업데이트
            clearInterval(interval); // interval 종료
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

    const interval = setInterval(updateAnimation, 1000 / frameRate); // 1초를 60등분하여 주기 설정
}

// attack - defense 변환
function TypeSelect() {
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

    if (!local_data[key]) {
        local_data[key] = { attacked: 0, score: 0 };
    }

    if (!animated_data[key]) {
        animated_data[key] = { attacked: 0, score: 0 };
    }

    if (!local_data_update[key]){
        local_data_update[key] = {attacked: 0, defensed: 0};
    }

    if (type === "defense") {
        local_data[key].score += 1;
        local_data_update[key].defensed += 1;
    } else if (type === "attack") {
        local_data_update[key].attacked += 1;
        if (local_data[key].score >= 1) {
            local_data[key].score -= 1;
        }
    }

    updateUI();

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
    let background = baseImage || "url('../images/popcat.jpg')"; // 기본 배경 설정
    if (isPop) {
        background = clickedImage || "url('../images/popcat2.png')"; // 클릭 후 배경 설정
    }
    document.body.style.backgroundImage = background;
}

// document가 로드 되었을 때
document.addEventListener("DOMContentLoaded", function () {
    // local click load
    local_click = JSON.parse(localStorage.getItem("local_click")) ?? 0;
    document.getElementById("click").innerText = local_click;

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
        if (!isPopActive) {
            pop();
            isPopActive = true;
        }
        setImage(true); // 터치 시작 시
    }, { passive: false });

    document.body.addEventListener("touchend", function (event) {
        isPopActive = false;
        setImage(false); // 터치 끝날 때
    });

    // 키보드 이벤트
    document.body.addEventListener("keydown", function () {
        if (!isPopActive) {
            pop();
            isPopActive = true;
        }
        setImage(true); // 키를 누를 때
    });

    document.body.addEventListener("keyup", function () {
        isPopActive = false;
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
