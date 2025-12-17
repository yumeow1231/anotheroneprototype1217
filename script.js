// script.js

// ----- Data -----
const STORAGE_KEY = 'endurance-items-v1';

// 9 个物品的默认数据
const defaultItems = Array.from({ length: 9 }, (_, i) => ({
  id: i,
  name: 'Object ' + (i + 1),
  price: '',
  imageData: '' // base64 image
}));

let items = loadItems();
let currentIndex = 0;

// 读本地存储
function loadItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return defaultItems;
}

// 写本地存储
function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ----- DOM refs -----
const mainPage = document.getElementById('main-page');
const itemPage = document.getElementById('item-page');
const puzzleGrid = document.getElementById('puzzle-grid');
const objectList = document.getElementById('object-list');

const itemTitle = document.getElementById('item-title');
const photoInput = document.getElementById('photo-input');
const photoArea = document.getElementById('photo-area');
const photoPreview = document.getElementById('photo-preview');
const photoPlaceholder = document.getElementById('photo-placeholder');
const priceDisplay = document.getElementById('price-display');
const btnConfirm = document.getElementById('btn-confirm');

// ----- Main page -----
function buildMainPage() {
  puzzleGrid.innerHTML = '';
  objectList.innerHTML = '';

   items.forEach((item, index) => {

    const piece = document.createElement('div');
    piece.className = 'puzzle-piece';
    piece.dataset.index = index;

    // 计算当前拼图在九宫格中的行列（0,1,2）
   const col = index % 3;              // 0,1,2 列
   const gridRow = Math.floor(index / 3);  // 0,1,2 行

   // 换算成 0%、50%、100% 三个位置
   const posX = col * 50;  // 0, 50, 100
   const posY = gridRow * 50;  // 0, 50, 100

   // 写入 CSS 自定义变量，供背景和 mask 一起用
   piece.style.setProperty('--px', posX + '%');
   piece.style.setProperty('--py', posY + '%');


    const img = document.createElement('img');
    img.className = 'puzzle-photo';
    const ph = document.createElement('div');
    ph.className = 'puzzle-placeholder';
    ph.textContent = index + 1;

    // ★ 核心逻辑：如果有图片 → 用图片覆盖拼图碎片
    if (item.imageData) {
      img.src = item.imageData;
      img.style.display = 'block';
      ph.style.display = 'none';
    } else {
      img.style.display = 'none';
      ph.style.display = 'flex';
    }

    piece.appendChild(img);
    piece.appendChild(ph);
    puzzleGrid.appendChild(piece);

    piece.addEventListener('click', () => openItemPage(index));
    

   // Object 列表
    const row = document.createElement('div');
    row.className = 'object-row';
    row.dataset.index = index;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'obj-label';
    nameSpan.textContent = item.name || `Object ${index + 1}`;

    const dotsSpan = document.createElement('span');
    dotsSpan.className = 'dots';

    const priceSpan = document.createElement('span');
    priceSpan.className = 'price';
    priceSpan.textContent = item.price ? `€ ${item.price}` : '€ ?';

    row.append(nameSpan, dotsSpan, priceSpan);
    objectList.appendChild(row);

    row.addEventListener('click', () => openItemPage(index));

  });
}

// ----- Item page -----
function openItemPage(index) {
  currentIndex = index;
  const item = items[index];

  itemTitle.textContent = item.name || 'ANOTHER ONE NAME';

  if (item.imageData) {
    photoPreview.src = item.imageData;
    photoPreview.style.display = 'block';
    photoPlaceholder.style.display = 'none';
  } else {
    photoPreview.style.display = 'none';
    photoPlaceholder.style.display = 'block';
  }

  priceDisplay.textContent = item.price ? '€ ' + item.price : '€ ???';

  mainPage.style.display = 'none';
  itemPage.style.display = 'block';
}

function backToMain() {
  buildMainPage();
  itemPage.style.display = 'none';
  mainPage.style.display = 'block';
}

// 编辑名称
itemTitle.addEventListener('click', () => {
  const item = items[currentIndex];
  const newName = prompt('Name this another one:', item.name);
  if (newName !== null && newName.trim() !== '') {
    item.name = newName.trim();
    itemTitle.textContent = item.name;
    saveItems();
  }
});

// 点击黄色框 → 选择图片 手机显示需要注释掉
//photoArea.addEventListener('click', (e) => {
  //if (e.target === photoInput) return;
  //photoInput.click();
//});

// 处理图片上传（兼容手机）
photoInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const dataUrl = reader.result;

    // 1. 存到当前物品
    items[currentIndex].imageData = dataUrl;
    saveItems();

    // 2. 更新当前物品页预览
    photoPreview.src = dataUrl;
    photoPreview.style.display = 'block';
    photoPlaceholder.style.display = 'none';

    // 3. 刷新主页面拼图（如果你之前有这个函数的话）
    if (typeof buildMainPage === 'function') {
      buildMainPage();
    }
  };

  reader.onerror = () => {
    alert('图片读取失败了，可以再试一次，或者换一张图片试试。');
  };

  reader.readAsDataURL(file);

  // ⭐ 关键：清空 input 的值，避免手机上两次选同一张图不触发 change
  e.target.value = '';
});


// 编辑价格
priceDisplay.addEventListener('click', () => {
  const item = items[currentIndex];
  const current = item.price || '';
  const input = prompt('Set price (€):', current);
  if (input === null) return;
  const trimmed = input.trim();
  if (!trimmed) {
    item.price = '';
  } else {
    item.price = trimmed; // 需要严格数字校验的话可以再加
  }
  saveItems();
  priceDisplay.textContent = item.price ? '€ ' + item.price : '€ ???';
});

// Confirm → 回到主页面
btnConfirm.addEventListener('click', () => {
  backToMain();
});

// ---- URL 参数（配合 NFC 使用） ----
function handleInitialView() {
  const params = new URLSearchParams(window.location.search);

  // 支持 item / id / o 三种参数
  const raw = params.get('item') ?? params.get('id') ?? params.get('o');

  if (raw != null) {
    const n = parseInt(raw, 10);

    if (!isNaN(n)) {
      // 允许 0–8 或 1–9
      const idx = (n >= 1 && n <= 9) ? (n - 1) : n;

      if (idx >= 0 && idx < items.length) {
        openItemPage(idx);
        return;
      }
    }
  }

  // 👇 默认显示主页面（一定要在函数里面）
  buildMainPage();
  mainPage.style.display = 'block';
  itemPage.style.display = 'none';
}



// 初始化
handleInitialView();


document.getElementById('btn-clear').addEventListener('click', () => {
  
  // 清空数据
  items = items.map(() => ({
    name: "",
    price: "",
    imageData: ""
  }));

  // 重新渲染主页
  buildMainPage();

  // 回到主界面（如果你在物品页）
  mainPage.style.display = 'block';
  itemPage.style.display = 'none';
});
