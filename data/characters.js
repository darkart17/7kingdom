import { isabellaData } from './isabella.js';
import { lilithData } from './lilith.js';
import { mayaData } from './maya.js';
import { charlotteData } from './charlotte.js';
import { seraphinaData } from './seraphina.js';
import { lilyData } from './lily.js';
import { mioData } from './mio.js';
import { elysiaData } from './elysia.js';
import { yunaData } from './yuna.js';// 이 파일이 없으면 에러 납니다!

export const characterList = [
    // 1. 마을 & 초반 모험 (일상/성장)
    {
        id: "seria",
        name: "서윤 (세리아)",
        title: "길드 'STAY' 접수원",
        desc: "냉소적이지만 당신의 생환을 간절히 바라는 조력자",
        image: "", 
        data: null
    },
    {
       id: "lily", 
        name: "릴리", 
        title: "울보 메이드", 
        image: "assets/images/lily/lily_icon.png", // 경로 업데이트
        data: lilyData // 데이터 연결
    },
    {
        id: "mio", 
        name: "미오", 
        title: "길드 주점 알바 (고양이 수인)", 
        image: "", // 경로 업데이트
        data: null // 데이터 연결
    },
    {
        id: "chloe",
        name: "클로이",
        title: "초보 모험가",
        desc: "당신을 '선배님'이라 부르며 동경하는 열혈 소녀",
        image: "",
        data: null
    },

    // 2. 숲 & 뒷골목 (이종족/아웃로)
    {
        id: "elysia", 
        name: "엘리시아", 
        title: "국경지대 순찰대장 (하이 엘프)", 
        image: "", // 이미지 경로
        data: null // 데이터 연결
    },
    {
      id: "yuna", 
        name: "유나", 
        title: "숲 속 성역의 무녀 (여우 수인)", 
        image: "", // 이미지 경로 설정
        data: null // 데이터 연결
    },
    {
        id: "raven",
        name: "레이븐",
        title: "뒷골목 조직 간부 (도적)",
        desc: "돈과 실력만 믿다 마음까지 털려버린 냉소적인 도둑",
        image: "",
        data: null
    },
   {
        id: "maya",
        name: "마야",
        title: "상처 입은 은빛 꽃",
        image: "",
        data: null
    },

    // 3. 왕궁 & 귀족 (권력/금기)
    {
     id: "seraphina", 
        name: "세라피나", 
        title: "펠루안 백작 영애", 
        image: "", 
        data: null // 연결됨
    },
    {
        id: "iris",
        name: "아이리스",
        title: "왕실 근위대 부대장",
        desc: "강직한 원칙주의자이나 당신 앞에선 무장해제",
        image: "",
        data: null
    },
    {
       id: "charlotte",
        name: "샤를로트",
        title: "베리디안의 공주",
        image: "", // 경로 업데이트
        data: null // 데이터 연결
    },
    {
        id: "isabella",
        name: "이사벨라",
        title: "베리디안의 왕비",
        desc: "고독한 권력자, 밤에는 정복당하길 원하는 여왕",
        image: "", 
        data: null
    },

    // 4. 성역 & 심연 (초월적 존재)
    {
        id: "lilith",
        name: "리리스",
        title: "밤의 여왕 (서큐버스)",
        desc: "포식자였으나 역으로 당신에게 압도당한 마족",
        image: "", // [중요] 이미지가 없다면 빈칸("")으로 두세요
        data: null
    },
    {
        id: "twins",
        name: "이드나 & 엘루나",
        title: "성녀의 수호자 (쌍둥이 자매)",
        desc: "하나의 영혼을 공유하며 동시에 당신을 느끼는 자매",
        image: "",
        data: null
    },
    {
        id: "merques",
        name: "메르케스",
        title: "신안의 성녀",
        desc: "운명을 꿰뚫어 보며 성녀의 금기를 깬 초월자",
        image: "",
        data: null
    }
];