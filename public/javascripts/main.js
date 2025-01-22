let isPopActive = false;
let local_click = 0;

let baseImage = null; // 기본 배경
let clickedImage = null; // 클릭 후 배경

// attack - defense 변환
function TypeSelect() {
    let btn = document.getElementById("typeSelectBTN");

    if (btn.classList.contains("defense")) { // defense에서 attack으로 변경
        btn.classList.remove("defense")
        btn.classList.add("attack");
        btn.innerText = "Attack";
    } else { // attack에서 defense로 변경
        btn.classList.remove("attack")
        btn.classList.add("defense");
        btn.innerText = "Defense";
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

    //팝 함수 실행 영역
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
        console.log(w1 - w2)
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
