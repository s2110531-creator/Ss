import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// Firebase Setup
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'dse-practice-app';

// 題庫資料
const quizData = {
  chinese: {
    title: '中國語文',
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    textColor: 'text-red-700',
    questions: [
      {
        question: '在韓愈《師說》中，作者認為當時社會存在甚麼不良風氣？',
        options: ['士大夫之族恥學於師', '學生不尊師重道', '老師不願傳授真學問', '學校制度崩壞'],
        correctAnswer: 0,
        explanation: '正確答案是 A。《師說》指出「士大夫之族，曰師、曰弟子云者，則羣聚而笑之」，批評當時士大夫因地位和年齡而恥於從師的社會風氣。'
      },
      {
        question: '蘇洵《六國論》指出六國破滅的根本原因是甚麼？',
        options: ['兵不利，戰不善', '弊在賂秦', '齊人未嘗賂秦', '燕趙之君失策'],
        correctAnswer: 1,
        explanation: '正確答案是 B。文章開首即點明主旨：「六國破滅，非兵不利，戰不善，弊在賂秦。」指出了割地賂秦是六國滅亡的主因。'
      },
      {
        question: '柳宗元《始得西山宴遊記》中，作者登上西山後達到甚麼精神境界？',
        options: ['孤寂落寞，思念故鄉', '覺得自己如井底之蛙', '感歎人生短促', '心凝形釋，與萬化冥合'],
        correctAnswer: 3,
        explanation: '正確答案是 D。作者登西山後，感到與自然大化融為一體，達到「心凝形釋，與萬化冥合」的境界，從而解開了被貶謫以來的恆惴慄。'
      },
      {
        question: '司馬遷《廉頗藺相如列傳》中，藺相如為什麼對廉頗一再退讓（引車避匿）？',
        options: ['生性懦弱怕事', '以先國家之急而後私讎也', '懼怕廉頗的軍事勢力', '趙王暗中下令他必須忍讓'],
        correctAnswer: 1,
        explanation: '正確答案是 B。藺相如對門客解釋：「吾所以為此者，以先國家之急而後私讎也。」展現其顧全大局、公忠體國的情操。'
      },
      {
        question: '蘇軾《念奴嬌·赤壁懷古》中「羽扇綸巾，談笑間，____」？',
        options: ['檣櫓灰飛煙滅', '煙火灰飛煙滅', '船艦灰飛煙滅', '曹操灰飛煙滅'],
        correctAnswer: 0,
        explanation: '正確答案是 A。原句為「羽扇綸巾，談笑間，檣櫓灰飛煙滅。」借描寫周瑜在赤壁之戰中的從容不迫，反襯自己早生華髮、功業未成。'
      }
    ]
  },
  english: {
    title: '英國語文 (English)',
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-700',
    questions: [
      {
        question: 'Choose the grammatically correct sentence:',
        options: [
          'He do not likes apples.',
          'He doesn\'t likes apples.',
          'He doesn\'t like apples.',
          'He don\'t like apples.'
        ],
        correctAnswer: 2,
        explanation: 'Correct answer is C. After "doesn\'t" (does not), the base form of the verb "like" must be used.'
      },
      {
        question: 'The sports day was called ____ due to the heavy rain.',
        options: ['off', 'up', 'out', 'down'],
        correctAnswer: 0,
        explanation: 'Correct answer is A. "Call off" is a phrasal verb meaning to cancel an event.'
      },
      {
        question: 'Which of the following is the closest synonym for "meticulous"?',
        options: ['Careless', 'Careful', 'Enormous', 'Tiny'],
        correctAnswer: 1,
        explanation: 'Correct answer is B. "Meticulous" means showing great attention to detail; very careful and precise.'
      }
    ]
  },
  maths: {
    title: '數學 (Mathematics)',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    topics: [
      {
        title: '一元二次方程 (Quadratic Equations) [中四]',
        notes: '📌 重點筆記：\n1. 標準式：ax² + bx + c = 0\n2. 判別式 (Δ) = b² - 4ac\n  - Δ > 0：兩個不相等的實根\n  - Δ = 0：兩個相等的實根 (重根)\n  - Δ < 0：沒有實根\n3. 根的總和 (α+β) = -b/a\n4. 根的積 (αβ) = c/a',
        questions: [
          {
            question: '若方程 x² - 6x + k = 0 有兩個相等的實根，求 k 的值。',
            options: ['-9', '9', '36', '-36'],
            correctAnswer: 1,
            explanation: '正確答案是 B。有兩個相等的實根代表判別式 Δ = 0。Δ = (-6)² - 4(1)(k) = 0 ➔ 36 - 4k = 0 ➔ k = 9。'
          },
          {
            question: '已知 α 和 β 為方程 2x² + 5x - 3 = 0 的兩根，求 αβ 的值。',
            options: ['5/2', '-5/2', '3/2', '-3/2'],
            correctAnswer: 3,
            explanation: '正確答案是 D。根據根與係數的關係，根的積 αβ = c/a = -3 / 2 = -3/2。'
          }
        ]
      },
      {
        title: '指數及對數 (Indices and Logarithms) [中四/五]',
        notes: '📌 重點筆記：\n1. 指數定律：aᵐ × aⁿ = aᵐ⁺ⁿ, aᵐ ÷ aⁿ = aᵐ⁻ⁿ, (aᵐ)ⁿ = aᵐⁿ\n2. 對數定義：若 aˣ = y，則 x = logₐ y\n3. 對數定律：log(xy) = log x + log y\n4. 對數定律：log(x/y) = log x - log y\n5. 對數定律：log(xⁿ) = n log x\n6. 換底公式：logₐ b = (log b) / (log a)',
        questions: [
          {
            question: '化簡 (x³)² / x⁻²，並以正指數表示答案。',
            options: ['x⁴', 'x⁷', 'x⁸', 'x¹²'],
            correctAnswer: 2,
            explanation: '正確答案是 C。(x³)² = x⁶。x⁶ / x⁻² = x⁶⁻⁽⁻²⁾ = x⁶⁺² = x⁸。'
          },
          {
            question: '已知 log 2 = a 及 log 3 = b，以 a 和 b 表示 log 12。',
            options: ['a + 2b', '2a + b', 'a²b', 'ab²'],
            correctAnswer: 1,
            explanation: '正確答案是 B。log 12 = log(2² × 3) = log(2²) + log 3 = 2 log 2 + log 3 = 2a + b。'
          }
        ]
      },
      {
        title: '變分 (Variations) [中四/五]',
        notes: '📌 重點筆記：\n1. 正變 (Direct Variation)：y ∝ x ➔ y = kx\n2. 反變 (Inverse Variation)：y ∝ 1/x ➔ y = k/x\n3. 聯變 (Joint Variation)：y ∝ xz ➔ y = kxz\n4. 部分變 (Partial Variation)：例如 y 的一部分不變，另一部分隨 x 正變 ➔ y = k₁ + k₂x',
        questions: [
          {
            question: '已知 y 隨 x 正變。當 x = 4 時，y = 12。當 x = 6 時，y 的值是？',
            options: ['16', '18', '24', '36'],
            correctAnswer: 1,
            explanation: '正確答案是 B。設 y = kx。代入 x=4, y=12，得 12 = 4k，k = 3。所以方程式為 y = 3x。當 x = 6 時，y = 3(6) = 18。'
          },
          {
            question: '設 z 隨 x 正變且隨 y 的平方反變。下列哪一項必為常數？',
            options: ['z / (xy²)', '(zy²) / x', '(zx) / y²', 'zxy²'],
            correctAnswer: 1,
            explanation: '正確答案是 B。z ∝ x/y² ➔ z = k(x/y²) ➔ (zy²)/x = k。因此 (zy²)/x 為常數。'
          }
        ]
      },
      {
        title: '等差及等比數列 (AS & GS) [中五]',
        notes: '📌 重點筆記：\n1. 等差數列 (AS)：通項 T(n) = a + (n-1)d\n2. 等差求和：S(n) = (n/2)[2a + (n-1)d] = (n/2)(a + l)\n3. 等比數列 (GS)：通項 T(n) = a rⁿ⁻¹\n4. 等比求和：S(n) = a(1-rⁿ)/(1-r) 或 a(rⁿ-1)/(r-1)\n5. 無限項之和 (GS, |r| < 1)：S(∞) = a / (1-r)',
        questions: [
          {
            question: '一個等差數列的第 3 項為 11，第 8 項為 31。求公差 (d)。',
            options: ['3', '4', '5', '6'],
            correctAnswer: 1,
            explanation: '正確答案是 B。a + 2d = 11 ...(1)；a + 7d = 31 ...(2)。(2) - (1) 得到 5d = 20，因此 d = 4。'
          },
          {
            question: '求無限等比數列 18, 6, 2, ... 的無限項之和。',
            options: ['24', '26', '27', '36'],
            correctAnswer: 2,
            explanation: '正確答案是 C。首項 a = 18，公比 r = 6/18 = 1/3。無限項之和 S(∞) = a / (1-r) = 18 / (1 - 1/3) = 18 / (2/3) = 27。'
          }
        ]
      },
      {
        title: '三角學 (Trigonometry) [中四/五]',
        notes: '📌 重點筆記：\n1. 正弦公式 (Sine Formula)：a / sin A = b / sin B = c / sin C\n2. 餘弦公式 (Cosine Formula)：c² = a² + b² - 2ab cos C\n3. 三角形面積 = (1/2) ab sin C\n\n📐 3D立體圖形概念 (3D Geometry)：\n4. 直線與平面的交角 (Angle between Line & Plane)：\n   - 找投影點：由線上一點「垂直跌落」平面，該點即為投影點。\n   - 找投影線：連接投影點與直線穿過平面的交點。\n   - 交角：原直線與其「投影線」的夾角。\n5. 面與面的交角 (Angle between 2 Planes)：\n   - 找交線：找出兩個平面相交的「交線」 (Line of intersection)。\n   - 畫垂直線：在兩個平面上，分別從交線上同一點畫出與交線「互相垂直」的線。\n   - 交角：該兩條垂直線所形成的夾角。',
        questions: [
          {
            question: '在 ∆ABC 中，a = 5, b = 7, ∠C = 60°。求 c 的長度。',
            options: ['39', '√39', '109', '√109'],
            correctAnswer: 1,
            explanation: '正確答案是 B。利用餘弦公式：c² = 5² + 7² - 2(5)(7)cos(60°) = 25 + 49 - 70(0.5) = 74 - 35 = 39。因此 c = √39。'
          },
          {
            question: '在 ∆PQR 中，p = 8, ∠P = 30°, ∠Q = 45°。求 q 的長度。',
            options: ['8√2', '4√2', '8√3', '16/√3'],
            correctAnswer: 0,
            explanation: '正確答案是 A。利用正弦公式：8 / sin 30° = q / sin 45° ➔ 8 / (1/2) = q / (√2/2) ➔ 16 = q / (√2/2) ➔ q = 16 × (√2/2) = 8√2。'
          },
          {
            question: '在正方體 ABCD-EFGH 中 (頂部面為 EFGH，底部面為 ABCD)，對角線 CE 與底面 ABCD 的交角是以下哪一個？',
            options: ['∠CED', '∠CAE', '∠ECA', '∠CEB'],
            correctAnswer: 2,
            explanation: '正確答案是 C。點 E 在底面 ABCD 的垂直投影點是 A。連接 C 到投影點 A，得到投影線 CA。因此直線 CE 與底面 ABCD 的交角，就是原直線 CE 與投影線 CA 的夾角，即 ∠ECA。'
          }
        ]
      },
      {
        title: '圓的幾何性質 (Geometry of Circles) [中五]',
        notes: '📌 重點筆記：\n1. 圓心角兩倍於圓周角 (∠ at centre = 2 × ∠ at circum.)\n2. 同弓形內的圓周角相等 (∠s in the same segment)\n3. 圓內接四邊形對角互補 (Opp. ∠s, cyclic quad.)\n4. 圓的切線垂直於半徑 (Tangent ⊥ radius)\n5. 交錯弓形的圓周角 (∠ in alt. segment)',
        questions: [
          {
            question: '已知 O 為圓心，A、B、C 為圓上的點。若 ∠AOB = 100°，求 ∠ACB (其中 C 位於優弧上)。',
            options: ['40°', '50°', '100°', '130°'],
            correctAnswer: 1,
            explanation: '正確答案是 B。根據圓心角兩倍於圓周角性質，∠ACB = ∠AOB / 2 = 100° / 2 = 50°。'
          },
          {
            question: 'ABCD 為圓內接四邊形。若 ∠A = 85°，求 ∠C。',
            options: ['85°', '95°', '105°', '無法確定'],
            correctAnswer: 1,
            explanation: '正確答案是 B。圓內接四邊形的對角互補，因此 ∠C = 180° - ∠A = 180° - 85° = 95°。'
          }
        ]
      },
      {
        title: '圓的方程 (Equations of Circles) [中五/六]',
        notes: '📌 重點筆記：\n1. 圓的標準式：(x - h)² + (y - k)² = r² (圓心為 (h, k)，半徑為 r)\n2. 圓的一般式：x² + y² + Dx + Ey + F = 0\n3. 由一般式求圓心：(-D/2, -E/2)\n4. 由一般式求半徑：r = √[(D/2)² + (E/2)² - F]',
        questions: [
          {
            question: '圓的方程為 x² + y² - 6x + 8y - 11 = 0。求該圓的圓心坐標。',
            options: ['(-3, 4)', '(3, -4)', '(-6, 8)', '(6, -8)'],
            correctAnswer: 1,
            explanation: '正確答案是 B。圓心坐標 = (-D/2, -E/2) = (-(-6)/2, -8/2) = (3, -4)。'
          },
          {
            question: '已知一個圓的圓心為 (0, 0)，並穿過點 (3, 4)。求該圓的方程。',
            options: ['x² + y² = 5', 'x² + y² = 7', 'x² + y² = 12', 'x² + y² = 25'],
            correctAnswer: 3,
            explanation: '正確答案是 D。半徑 r = √[(3-0)² + (4-0)²] = √[9+16] = 5。圓方程為 x² + y² = 5²，即 x² + y² = 25。'
          }
        ]
      },
      {
        title: '排列、組合與概率 (P&C & Probability) [中六]',
        notes: '📌 重點筆記：\n1. 排列 (Permutation)：nPr (考慮次序，如排隊、密碼)\n2. 組合 (Combination)：nCr (不考慮次序，如選出委員會)\n3. 加法法則 (互斥事件)：P(A 或 B) = P(A) + P(B)\n4. 乘法法則 (獨立事件)：P(A 且 B) = P(A) × P(B)',
        questions: [
          {
            question: '從 8 名學生中選出 3 名組成委員會，共有多少種選法？',
            options: ['24', '56', '336', '512'],
            correctAnswer: 1,
            explanation: '正確答案是 B。組成委員會不考慮次序，使用組合：8C3 = 8! / (3!5!) = 56。'
          },
          {
            question: '擲兩枚均勻的六面骰子，點數總和為 7 的概率是多少？',
            options: ['1/6', '1/7', '1/12', '1/36'],
            correctAnswer: 0,
            explanation: '正確答案是 A。總可能結果有 6×6=36 個。和為 7 的組合有：(1,6), (2,5), (3,4), (4,3), (5,2), (6,1) 共 6 個。概率 = 6/36 = 1/6。'
          }
        ]
      },
      {
        title: '統計學與正態分佈 (Statistics & Normal Dist.) [中五/六]',
        notes: '📌 重點筆記：\n1. 標準差 (SD, σ)：反映數據的離散程度。方差 = σ²。\n2. 數據變換：加減不影響SD；乘除會改變SD (新SD = 舊SD × |k|)。\n3. 標準分 (z-score) = (x - μ) / σ\n4. 正態分佈經驗法則：68% (±1σ), 95% (±2σ), 99.7% (±3σ)。',
        questions: [
          {
            question: '一組數據的平均值為 50，標準差為 4。若將每個數據都乘以 3，然後減 2。新數據的標準差是多少？',
            options: ['4', '10', '12', '148'],
            correctAnswer: 2,
            explanation: '正確答案是 C。標準差不受加減影響，只受乘除影響。新標準差 = 原標準差 × 3 = 4 × 3 = 12。'
          },
          {
            question: '某次考試的成績呈正態分佈，平均分為 65，標準差為 10。大明考獲 85 分，他的標準分 (z-score) 是多少？',
            options: ['1', '1.5', '2', '2.5'],
            correctAnswer: 2,
            explanation: '正確答案是 C。標準分 z = (x - μ) / σ = (85 - 65) / 10 = 20 / 10 = 2。'
          }
        ]
      }
    ]
  },
  csd: {
    title: '公民與社會發展',
    color: 'bg-yellow-500',
    lightColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    questions: [
      {
        question: '《基本法》的最終解釋權屬於哪個機構？',
        options: [
          '香港特別行政區終審法院',
          '全國人民代表大會常務委員會 (全國人大常委會)',
          '香港特別行政區立法會',
          '香港特別行政區行政長官'
        ],
        correctAnswer: 1,
        explanation: '正確答案是 B。根據《基本法》第158條，本法的解釋權屬於全國人民代表大會常務委員會。'
      },
      {
        question: '下列哪一項是香港特別行政區的憲制基礎？',
        options: [
          '《中英聯合聲明》',
          '《中華人民共和國憲法》和《基本法》',
          '香港普通法',
          '國際法'
        ],
        correctAnswer: 1,
        explanation: '正確答案是 B。國家憲法與《基本法》共同構成香港特區的憲制基礎。'
      },
      {
        question: '「粵港澳大灣區」發展規劃中，包含多少個內地城市？',
        options: ['7個', '8個', '9個', '10個'],
        correctAnswer: 2,
        explanation: '正確答案是 C。大灣區包括廣東省九個城市（廣州、深圳、珠海、佛山、惠州、東莞、中山、江門、肇慶）以及香港和澳門兩個特別行政區。'
      }
    ]
  }
};

// 圖標組件 (Inline SVG 以確保環境兼容)
const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const RotateCcwIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;

const Trigo3DViewer = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let renderer, scene, camera, reqId;

    const initThree = () => {
      if (!window.THREE || !mountRef.current) {
        if (mountRef.current) setTimeout(initThree, 100);
        return;
      }
      const THREE = window.THREE;
      const width = mountRef.current.clientWidth;
      const height = 350;

      // Scene & Camera setup
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      camera.position.set(6, 4, 7);
      camera.lookAt(0, 0, 0);

      // Renderer setup
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      
      if (mountRef.current.childNodes.length === 0) {
        mountRef.current.appendChild(renderer.domElement);
      }

      const group = new THREE.Group();
      scene.add(group);

      // Materials
      const boxMat = new THREE.LineBasicMaterial({ color: 0x9ca3af, transparent: true, opacity: 0.5 });
      const planeMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
      const planeEdgeMat = new THREE.LineBasicMaterial({ color: 0x3b82f6 });
      const lineCEMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 3 }); 
      const lineCAMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 }); 
      const lineEAMat = new THREE.LineDashedMaterial({ color: 0xf59e0b, dashSize: 0.2, gapSize: 0.2 });

      // Geometries
      const boxGeo = new THREE.BoxGeometry(4, 4, 4);
      const boxEdge = new THREE.EdgesGeometry(boxGeo);
      const box = new THREE.LineSegments(boxEdge, boxMat);
      group.add(box);

      // Base Plane ABCD
      const planeGeo = new THREE.PlaneGeometry(4, 4);
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.rotation.x = Math.PI / 2;
      plane.position.y = -2;
      group.add(plane);
      
      const planeEdge = new THREE.LineSegments(new THREE.EdgesGeometry(planeGeo), planeEdgeMat);
      planeEdge.rotation.x = Math.PI / 2;
      planeEdge.position.y = -2;
      group.add(planeEdge);

      // CE (Diagonal)
      const ceGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(2, -2, 2), // C
        new THREE.Vector3(-2, 2, -2) // E
      ]);
      group.add(new THREE.Line(ceGeo, lineCEMat));

      // CA (Projection)
      const caGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(2, -2, 2), // C
        new THREE.Vector3(-2, -2, -2) // A
      ]);
      group.add(new THREE.Line(caGeo, lineCAMat));

      // EA (Vertical drop)
      const eaGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-2, 2, -2), // E
        new THREE.Vector3(-2, -2, -2) // A
      ]);
      const lineEA = new THREE.Line(eaGeo, lineEAMat);
      lineEA.computeLineDistances();
      group.add(lineEA);

      // Mouse & Touch Interaction
      let isDragging = false;
      let prevPos = { x: 0, y: 0 };

      const canvas = renderer.domElement;
      
      const onMouseDown = (e) => {
        isDragging = true;
        prevPos = { x: e.offsetX, y: e.offsetY };
      };
      
      const onMouseMove = (e) => {
        if (isDragging) {
          group.rotation.y += (e.offsetX - prevPos.x) * 0.01;
          group.rotation.x += (e.offsetY - prevPos.y) * 0.01;
          prevPos = { x: e.offsetX, y: e.offsetY };
        }
      };

      const onTouchStart = (e) => {
        isDragging = true;
        prevPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        e.preventDefault(); // Prevent scrolling while rotating
      };

      const onTouchMove = (e) => {
        if (isDragging) {
          group.rotation.y += (e.touches[0].clientX - prevPos.x) * 0.01;
          group.rotation.x += (e.touches[0].clientY - prevPos.y) * 0.01;
          prevPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          e.preventDefault();
        }
      };

      const onPointerUp = () => { isDragging = false; };

      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchend', onPointerUp);

      // Animation Loop
      const animate = () => {
        reqId = requestAnimationFrame(animate);
        if (!isDragging) {
          group.rotation.y += 0.003; // Gentle auto-rotate
        }
        renderer.render(scene, camera);
      };
      animate();

      return () => {
        window.removeEventListener('mouseup', onPointerUp);
        window.removeEventListener('touchend', onPointerUp);
      };
    };

    let cleanupListeners = () => {};

    if (!document.getElementById('threejs-script')) {
      const script = document.createElement('script');
      script.id = 'threejs-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => { cleanupListeners = initThree() || (() => {}); };
      document.head.appendChild(script);
    } else {
      cleanupListeners = initThree() || (() => {});
    }

    return () => {
      cleanupListeners();
      if (reqId) cancelAnimationFrame(reqId);
      if (renderer && mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden relative shadow-inner mb-6 border border-slate-800">
      <div className="absolute top-4 left-4 text-white text-sm font-medium z-10 pointer-events-none bg-black/60 px-4 py-3 rounded-lg backdrop-blur-sm border border-white/10">
        <div className="mb-2 font-bold text-slate-100 border-b border-slate-600 pb-2 flex items-center gap-2">
          <span>📐</span> 尋找線與平面的交角
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-6 h-1 bg-red-500 rounded"></div> 
          <span>原直線 (CE)</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-6 h-1 bg-yellow-500 rounded border-t-2 border-yellow-500 border-dashed bg-transparent"></div> 
          <span>找垂直投影點 (E ➔ A)</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-6 h-1 bg-green-500 rounded"></div> 
          <span>畫出投影線 (CA)</span>
        </div>
        <div className="mt-3 pt-2 text-xs text-blue-300 font-bold border-t border-slate-600/50">
          💡 交角 = 紅線與綠線的夾角 (∠ECA)
        </div>
      </div>
      <div className="absolute bottom-4 right-4 text-white/50 text-xs z-10 pointer-events-none bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
        🖱️ 滑鼠拖曳旋轉立體圖形
      </div>
      <div ref={mountRef} className="w-full h-[350px] cursor-move" />
    </div>
  );
};

export default function App() {
  const [currentSubject, setCurrentSubject] = useState(null);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(null);
  const [isReadingNotes, setIsReadingNotes] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  // Firebase & Leaderboard States
  const [user, setUser] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [viewingGlobalLeaderboard, setViewingGlobalLeaderboard] = useState(false);

  // Auth & Fetch Data Effects
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error('Auth Error:', error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const scoresRef = collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard');
    const unsubscribe = onSnapshot(scoresRef, (snapshot) => {
      const scores = [];
      snapshot.forEach((doc) => {
        scores.push({ id: doc.id, ...doc.data() });
      });
      // Sort in memory: highest percentage first, then timestamp
      scores.sort((a, b) => {
        if (b.percentage !== a.percentage) {
          return b.percentage - a.percentage;
        }
        return (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0);
      });
      setLeaderboardData(scores);
    }, (error) => {
      console.error('Fetch Error:', error);
    });
    return () => unsubscribe();
  }, [user]);

  // Handle submitting score
  const handleSubmitScore = async () => {
    if (!user || !playerName.trim() || hasSubmittedScore) return;
    
    const activeData = getActiveData();
    const totalQuestions = activeData.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    try {
      const scoresRef = collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard');
      await addDoc(scoresRef, {
        name: playerName.trim(),
        subject: currentSubject,
        topic: currentTopicIndex !== null ? quizData[currentSubject].topics[currentTopicIndex].title : '',
        score,
        total: totalQuestions,
        percentage,
        timestamp: serverTimestamp()
      });
      setHasSubmittedScore(true);
      setShowLeaderboard(true);
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  const getActiveData = () => {
    if (!currentSubject) return null;
    const subject = quizData[currentSubject];
    if (subject.topics && currentTopicIndex !== null) {
      return {
        ...subject,
        title: `${subject.title} - ${subject.topics[currentTopicIndex].title}`,
        questions: subject.topics[currentTopicIndex].questions,
      };
    }
    return subject;
  };

  const handleSubjectSelect = (subjectKey) => {
    setCurrentSubject(subjectKey);
    setCurrentTopicIndex(null);
    setIsReadingNotes(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsQuizFinished(false);
    setHasSubmittedScore(false);
    setShowLeaderboard(false);
    setPlayerName('');
    setViewingGlobalLeaderboard(false);
  };

  const handleTopicSelect = (index) => {
    setCurrentTopicIndex(index);
    setIsReadingNotes(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsQuizFinished(false);
    setHasSubmittedScore(false);
    setShowLeaderboard(false);
    setPlayerName('');
  };

  const handleOptionSelect = (index) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);
    
    const activeData = getActiveData();
    if (index === activeData.questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    const activeData = getActiveData();
    if (currentQuestionIndex + 1 < activeData.questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsQuizFinished(true);
    }
  };

  const renderSubjectSelector = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(quizData).map(([key, data]) => (
        <button
          key={key}
          onClick={() => handleSubjectSelect(key)}
          className={`flex flex-col items-center justify-center p-8 rounded-xl shadow-sm border-2 border-transparent hover:shadow-md transition-all duration-200 group ${data.lightColor}`}
        >
          <div className={`p-4 rounded-full mb-4 ${data.color} text-white group-hover:scale-110 transition-transform`}>
            <BookIcon />
          </div>
          <h2 className={`text-xl font-bold ${data.textColor}`}>{data.title}</h2>
          <p className="text-gray-600 mt-2 text-sm">點擊開始練習</p>
        </button>
      ))}
    </div>
  );

  const renderGlobalLeaderboard = () => {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrophyIcon /> 全科真實排行榜
          </h2>
          <button onClick={() => setViewingGlobalLeaderboard(false)} className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
            返回主頁
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(quizData).map(([key, data]) => {
            const subjectScores = leaderboardData.filter(s => s.subject === key).slice(0, 5);
            return (
              <div key={key} className={`p-4 rounded-xl border-2 border-transparent hover:shadow-sm transition-all ${data.lightColor}`}>
                <h3 className={`font-bold mb-3 flex items-center gap-2 ${data.textColor}`}>
                  <BookIcon /> {data.title} (Top 5)
                </h3>
                {subjectScores.length > 0 ? (
                  <div className="space-y-2">
                    {subjectScores.map((entry, idx) => (
                      <div key={entry.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-white">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className={`font-black w-5 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-gray-300'}`}>
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-gray-800 truncate max-w-[100px]" title={entry.name}>{entry.name}</span>
                          {entry.topic && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 truncate max-w-[70px]">{entry.topic}</span>}
                        </div>
                        <span className="font-black text-gray-800">{entry.percentage}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-6 bg-white/50 rounded-lg">暫無記錄，快來挑戰！</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTopicSelector = () => {
    const subject = quizData[currentSubject];
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h2 className={`text-xl font-bold ${subject.textColor}`}>{subject.title} - 選擇單元</h2>
        </div>
        <div className="grid gap-4">
          {subject.topics.map((topic, index) => (
            <button
              key={index}
              onClick={() => handleTopicSelect(index)}
              className={`text-left p-6 rounded-xl border-2 border-transparent hover:border-gray-200 hover:shadow-sm transition-all duration-200 ${subject.lightColor}`}
            >
              <h3 className={`text-xl font-bold ${subject.textColor}`}>{topic.title}</h3>
              <p className="text-gray-600 mt-2">包含重點練習筆記及 {topic.questions.length} 條題目</p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderNotes = () => {
    const subject = quizData[currentSubject];
    const topic = subject.topics[currentTopicIndex];
    const isTrigo = topic.title.includes('三角學');

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h2 className={`text-xl font-bold ${subject.textColor}`}>{topic.title} - 練習筆記</h2>
        </div>
        
        {isTrigo && <Trigo3DViewer />}
        
        <div className={`${subject.lightColor} p-6 rounded-xl mb-8 whitespace-pre-line text-gray-800 leading-relaxed font-medium text-lg`}>
          {topic.notes}
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setCurrentTopicIndex(null)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            返回單元
          </button>
          <button
            onClick={() => setIsReadingNotes(false)}
            className={`flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-colors ${subject.color} hover:opacity-90`}
          >
            開始測驗
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    const activeData = getActiveData();
    const question = activeData.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === activeData.questions.length - 1;

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h2 className={`text-xl font-bold ${activeData.textColor}`}>{activeData.title}</h2>
          <div className="text-sm font-medium bg-gray-100 py-1 px-3 rounded-full text-gray-600">
            題號 {currentQuestionIndex + 1} / {activeData.questions.length}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 leading-relaxed">
            {question.question}
          </h3>
          <div className="space-y-3">
            {question.options.map((option, index) => {
              let buttonStyle = "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300";
              let icon = null;

              if (isAnswered) {
                if (index === question.correctAnswer) {
                  buttonStyle = "bg-green-50 border-green-500 text-green-700";
                  icon = <CheckCircleIcon />;
                } else if (index === selectedOption) {
                  buttonStyle = "bg-red-50 border-red-500 text-red-700";
                  icon = <XCircleIcon />;
                } else {
                  buttonStyle = "bg-gray-50 border-gray-200 text-gray-400 opacity-50";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 rounded-xl border-2 flex items-center justify-between transition-colors ${buttonStyle}`}
                >
                  <span className="font-medium">
                    <span className="mr-3 text-gray-500">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </span>
                  {icon && <span>{icon}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {isAnswered && (
          <div className="mt-6 animate-fade-in-up">
            <div className={`p-4 rounded-xl mb-6 flex gap-3 ${
              selectedOption === question.correctAnswer ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <div className="mt-1">
                {selectedOption === question.correctAnswer ? <CheckCircleIcon /> : <XCircleIcon />}
              </div>
              <div>
                <p className="font-bold mb-1">
                  {selectedOption === question.correctAnswer ? '答對了！' : '答錯了！'}
                </p>
                <p className="opacity-90">{question.explanation}</p>
              </div>
            </div>

            <button
              onClick={handleNextQuestion}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-colors ${activeData.color} hover:opacity-90`}
            >
              {isLastQuestion ? '查看成績' : '下一題'}
              <ArrowRightIcon />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderResult = () => {
    const activeData = getActiveData();
    const totalQuestions = activeData.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    let feedback = "";
    if (percentage === 100) feedback = "表現完美！保持水準，5** 指日可待！";
    else if (percentage >= 60) feedback = "表現不錯，繼續努力溫習！";
    else feedback = "革命尚未成功，同學仍須努力！";

    const currentTopicTitle = currentTopicIndex !== null ? quizData[currentSubject].topics[currentTopicIndex].title : '';
    const filteredLeaderboard = leaderboardData
      .filter(entry => entry.subject === currentSubject && (currentTopicTitle === '' || entry.topic === currentTopicTitle))
      .slice(0, 10);

    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h2 className="text-3xl font-bold mb-2">完成練習！</h2>
        <p className="text-gray-500 mb-8">{activeData.title}</p>
        
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-gray-100 mb-4 relative">
            <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
              <circle
                cx="60" cy="60" r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className={`${activeData.textColor}`}
                strokeDasharray={`${(percentage / 100) * 351} 351`}
              />
            </svg>
            <span className="text-4xl font-bold">{score}/{totalQuestions}</span>
          </div>
          <p className="text-xl font-semibold text-gray-800">{feedback}</p>
        </div>

        {!showLeaderboard ? (
          <div className="max-w-md mx-auto mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="font-bold text-lg mb-4 flex items-center justify-center gap-2 text-gray-800">
              <TrophyIcon /> 記錄你的成績到排行榜
            </h3>
            {!hasSubmittedScore ? (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="輸入你的名字 (例如: DSE戰士)"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full text-center font-medium"
                  maxLength={15}
                />
                <button
                  onClick={handleSubmitScore}
                  disabled={!playerName.trim()}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${playerName.trim() ? activeData.color + ' hover:opacity-90' : 'bg-gray-300 cursor-not-allowed'}`}
                >
                  提交並查看排行榜
                </button>
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="text-sm text-gray-500 hover:text-gray-700 mt-2 underline"
                >
                  跳過，直接查看排行榜
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLeaderboard(true)}
                className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${activeData.color} hover:opacity-90`}
              >
                查看真實排行榜
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto mb-8 text-left animate-fade-in-up">
            <h3 className="font-bold text-xl mb-4 flex items-center justify-center gap-2 text-yellow-600">
              <TrophyIcon /> {activeData.title} 排行榜 (Top 10)
            </h3>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {filteredLeaderboard.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredLeaderboard.map((entry, idx) => (
                    <div key={entry.id} className={`flex items-center justify-between p-4 ${idx < 3 ? 'bg-yellow-50/30' : ''}`}>
                      <div className="flex items-center gap-4">
                        <span className={`font-black text-lg w-6 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-gray-300'}`}>
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-gray-800 truncate max-w-[120px]" title={entry.name}>{entry.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-gray-800">{entry.percentage}%</div>
                        <div className="text-xs text-gray-500">{entry.score}/{entry.total} 題</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  暫時沒有記錄，成為第一個上榜的人吧！
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => {
              if (quizData[currentSubject].topics) {
                setCurrentTopicIndex(null);
                setIsQuizFinished(false);
              } else {
                handleSubjectSelect(currentSubject);
              }
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RotateCcwIcon />
            {quizData[currentSubject].topics ? '選擇其他單元' : '重新挑戰'}
          </button>
          <button
            onClick={() => setCurrentSubject(null)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-colors ${activeData.color} hover:opacity-90`}
          >
            <BookIcon />
            選擇其他科目
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-12 selection:bg-blue-200">
      <header className="bg-white shadow-sm mb-8">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-gray-800 flex items-center gap-2">
            <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-sm">DSE</span>
            四科主科練習區
          </h1>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => {
                setViewingGlobalLeaderboard(true);
                setCurrentSubject(null);
                setCurrentTopicIndex(null);
                setIsQuizFinished(false);
              }}
              className="text-sm font-bold text-yellow-600 hover:text-yellow-700 flex items-center gap-1 transition-colors bg-yellow-50 px-3 py-1.5 rounded-full"
            >
              <TrophyIcon /> 排行榜
            </button>
            {currentSubject && !isQuizFinished && !viewingGlobalLeaderboard && (
              <button 
                onClick={() => setCurrentSubject(null)}
                className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
              >
                返回主頁
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4">
        {!currentSubject && !viewingGlobalLeaderboard && (
          <div className="mb-8 text-center animate-fade-in-up">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">準備好挑戰了嗎？</h2>
            <p className="text-gray-600">請選擇下方其中一個核心科目開始進行隨堂小測，測試你的基礎概念。</p>
          </div>
        )}

        <div className="animate-fade-in-up">
          {viewingGlobalLeaderboard && renderGlobalLeaderboard()}
          {!currentSubject && !viewingGlobalLeaderboard && renderSubjectSelector()}
          {currentSubject && quizData[currentSubject].topics && currentTopicIndex === null && !viewingGlobalLeaderboard && renderTopicSelector()}
          {currentSubject && currentTopicIndex !== null && isReadingNotes && !viewingGlobalLeaderboard && renderNotes()}
          {currentSubject && (!quizData[currentSubject].topics || (!isReadingNotes && currentTopicIndex !== null)) && !isQuizFinished && !viewingGlobalLeaderboard && renderQuiz()}
          {currentSubject && (!quizData[currentSubject].topics || (!isReadingNotes && currentTopicIndex !== null)) && isQuizFinished && !viewingGlobalLeaderboard && renderResult()}
        </div>
      </main>
      
      {/* 簡單的自定義動畫 CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
}
