<template>
  <div class="order-viewport">
    <div class="image-container" :class="zoomClass" ref="imageContainerRef">
      
      <img :src="orderBgDark" alt="DarkBGI" class="background-image" />

      <img 
        :src="currentBrightBg" 
        alt="BrightBGI" 
        class="background-image" 
        :style="{ clipPath: brightClipPath }"
      />

      <div v-if="zoomTarget === 'keypad'" class="input-display">
        <div class="prompt">Press 'Enter' to submit:</div>
        <textarea v-model="userInput" class="ta" placeholder="A cup of…"></textarea>
        <!-- <p class="preview">
          {{ userInput }}
        </p> -->
      </div>

      <div 
        class="hotspot hotspot-keypad" 
        @click="clickKeypad"
        @mouseover="onHotspotHover('keypad')"
        @mouseleave="onHotspotLeave"
      ></div>

      <div 
        class="hotspot hotspot-coinslot" 
        @click="clickCoinSlot"
        @mouseover="onHotspotHover('coinslot')"
        @mouseleave="onHotspotLeave"
      ></div>

    </div>
  </div>

  <div v-if="narrativeText" class="narrative-box">
    <p>{{ narrativeText }}</p>
  </div>
  
  <button class="leave-button" @click="clickLeave">Back</button>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted  } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useRouter } from 'vue-router'
  import { useMainStore } from '../stores/mainStore'
  import orderBgDark from '../assets/OrderBgDark.png'
  import orderBgBright from '../assets/OrderBgBright.png'
  import orderBgCoin from '../assets/OrderScreen1.png'

  const router = useRouter()
  const narrativeText = ref('')
  const hoveredHotspot = ref(null);
  
  const imageContainerRef = ref(null);
  const userInput = ref('')
  const store = useMainStore()
  const { hasInsertedCoin } = storeToRefs(store)

  // const brightClipPath = ref('inset(0% 100% 100% 0%)')
  const brightClipPath = computed(() => {
    const currentZoom = zoomTarget.value;
    const currentHover = hoveredHotspot.value;
    const activeTarget = currentZoom || currentHover;

    if (!activeTarget || !hotspots[activeTarget]) {
      return 'inset(0% 100% 100% 0%)'; // hide hotspot
    }

    // Get area size
    const h = hotspots[activeTarget];
    
    // Calculate inset() value
    const top = h.top;
    const right = `calc(100% - ${h.left} - ${h.width})`;
    const bottom = `calc(100% - ${h.top} - ${h.height})`;
    const left = h.left;
    
    return `inset(${top} ${right} ${bottom} ${left})`;
  });

  const zoomTarget = ref(null)

  const hotspots = {
    keypad: { top: '3%', left: '12%', width: '65%', height: '50%' },
    coinslot: { top: '23%', left: '79%', width: '20%', height: '19%' },
    dispenser: { top: '55%', left: '15%', width: '30%', height: '35%' }, 
  }
  const zoomClass = computed(() => {
    if (!zoomTarget.value) return '' // If no target is zoomed in, no class is added.
    return `is-zoomed-on-${zoomTarget.value}` 
  })

  // --- Core functions ---
  /**
   * Show text function
   */
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
  async function showNarrative(text, duration) {
    narrativeText.value = text
    await delay(duration)
    narrativeText.value = ''
  }

  /**
   * Hover: show hotspot
   */
  function onHotspotHover(hotspotName) {
    hoveredHotspot.value = hotspotName;
  }

  /**
   * Hover off: hotspot off
   */
  function onHotspotLeave() {
    hoveredHotspot.value = null;
  }

  /**
   * Click coinslot
   */
  const currentBrightBg = computed(() => {
    return hasInsertedCoin.value ? orderBgCoin : orderBgBright;
  });
  function clickCoinSlot() {
    // insert coin for the first time
    if (!hasInsertedCoin.value) {
      store.setCoinInserted(true);
      zoomTarget.value = 'coinslot';

      if (imageContainerRef.value) {
        imageContainerRef.value.addEventListener('transitionend', () => {
          showNarrative('You inserted a 50-cent coin.', 2000);
          
          setTimeout(() => {
            zoomTarget.value = 'keypad'; // Zoom to keypad
          }, 3000);

        }, { once: true });
      }
    } else {
      // If inserted coin before
      //Zoom to coinslot and show text
      zoomTarget.value = 'coinslot';
      showNarrative('SCP-294 receive only one 50-cent coin for one time', 2000);

      setTimeout(() => {
        zoomTarget.value = 'keypad'; // Zoom back to keypad
      }, 2000);
    }
  }

  /**
   * click Keypad
   */
  function clickKeypad() {
    if (!hasInsertedCoin.value) {
      showNarrative('Please insert coins first.', 2000);
    } else {
      zoomTarget.value = 'keypad'
    }
  }

  /**
   * click Leave Button
   */
  function clickLeave() {
    // If the current state is zoomed in, click the "Back" button will zoom out
    if (zoomTarget.value) {
      zoomTarget.value = null;
    } else {
      router.go(-1)
    }
  }

  const MAX_CHARS = 50;
  /**
   * Key Press Input
   * @param {KeyboardEvent} event pass keyboard input to browser
   */
  function handleKeyPress(event) {
    // Respond to input only when zoomed into the keyboard area
    if (zoomTarget.value !== 'keypad') {
      return;
    }

    // Prevent spacebar to scroll the page
    if (event.key === ' ') {
      event.preventDefault();
    }

    if (event.key === 'Backspace') {
      userInput.value = userInput.value.slice(0, -1);
      return;
    }

    if (event.key === 'Enter') {
      submitRequest();
      return;
    }

    // Filter out function keys such as Shift, Ctrl, F5, etc.
    if (event.key.length === 1) {
      // maximum number of characters
      if (userInput.value.length < MAX_CHARS) {
        userInput.value += event.key;
      }
    }
  }

  /**
   * Submit user request
   */
  async function submitRequest() {
    const currentInput = userInput.value.trim();
    if (currentInput.length === 0) {
      showNarrative('Please enter a valid command.', 2000);
      return;
    }

    showNarrative(`Preparing a cup of "${currentInput}"...`, 3000);
    
    try {
      const response = await fetch('/api/getCup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: currentInput }), 
      });

      // If unsuccessful response
      if (!response.ok) {
        console.error("Server response error:", response.status, response.statusText);
        const errorData = await response.json().catch(() => {
          return { error: "Unable to parse error response from server" };
        });
        console.error("Error details returned by the server: ", errorData);

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // unsuccessful response
      const data = await response.json();
      console.log('AI response received from the backend:', data.description);
      store.setResult(data.description);
      zoomTarget.value = 'dispenser';
      if (imageContainerRef.value) {
        imageContainerRef.value.addEventListener('transitionend', () => {
          router.push('/result');
        }, { once: true });
      }

    } catch (error) {
      console.error('Error when calling API:', error.message);
      showNarrative('The request failed, please try again later.');
    }
  }

  // --- Vue lifecycle hooks ---
  // onMounted: executed when the component is loaded onto the page
  onMounted(() => {
    window.addEventListener('keydown', handleKeyPress);
  });

  // onUnmounted: executed before the component is destroyed (the user leaves this page)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress);
  });
</script>

<style scoped>
  /* --- 主容器：负责全屏和居中 --- */
  .order-viewport {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #000;
    overflow: hidden; /* 防止图片过宽时出现滚动条 */
  }

  /* --- 图片容器：热区的定位基准 --- */
  .image-container {
    position: relative;
    /* 它的尺寸由内部的 img 决定 */
    width: auto;
    height: 100vh;
    line-height: 0;
    /* ↓↓↓ 新增这行，让 transform 属性的变化产生0.8秒的平滑动画 ↓↓↓ */
    transition: transform 0.8s ease-in-out;
  }

  /* --- 背景图片样式 (亮/暗) --- */
  .background-image {
    height: 100%; /* 关键：让图片高度填满容器(即100vh) */
    width: auto;  /* 关键：宽度根据高度自动缩放，保持比例 */
    max-width: none; /* 覆盖可能存在的全局 max-width: 100% 样式 */
  }

  /* 亮色图层需要绝对定位，完美覆盖在暗色图层之上 */
  .background-image[alt*="BrightBGI"] {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none; /* 让鼠标可以穿透它 */
    transition: clip-path 0.2s ease-in-out;
  }


  /* --- 热区通用样式 --- */
  .hotspot {
    position: absolute;
    cursor: pointer;
    /* border: 2px dashed cyan; */ /* 需要调试时取消注释这行 */
  }

  /* --- 热区具体位置 --- */
  .hotspot-keypad {
    top: 3%;
    left: 12%;
    width: 65%;
    height: 50%;
  }

  .hotspot-coinslot {
    top: 23%;
    left: 79%;
    width: 20%;
    height: 19%;
  }


  /* --- UI元素样式 --- */
  .narrative-box {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 20vh; /* 高度为视口高度的20% */
    padding: 0 50px;
    box-sizing: border-box;
    background-color: rgba(0, 0, 0, 0.85);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    z-index: 20; /* 确保在图片图层之上 */
  }
  .narrative-box p {
    margin: 0;
    font-size: 1.5em;
    line-height: 1.4;
  }

  .leave-button {
    position: absolute;
    bottom: 40px;
    right: 40px;
    padding: 10px 20px;
    background-color: rgba(0, 0, 0, 0.7);
    color: #ccc;
    border: 1px solid #888;
    cursor: pointer;
    transition: all 0.3s;
    z-index: 10; /* 最高的z-index，确保在所有其他图层之上 */
  }
  .leave-button:hover {
    background-color: #fff;
    color: #000;
  }

  /* --- 【新增】输入显示框 和 闪烁光标的样式 --- */
  .input-display {
    position: absolute;
    top: 8%;
    left: 18%;
    width: 65%;
    height: 30%;
    
    padding: 12px;
    box-sizing: border-box;
    color: #ffffff;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.6em;
    font-weight: 900;
    pointer-events: none;

    display: block; 
  }

  .prompt {
    font-size: 0.6em; /* 字号也小一点 */
    margin-bottom: 2em;
  }
  .ta {
    padding: 8px;

    width: 80%;
    aspect-ratio: 1.5;
    box-sizing: border-box;

    font-size: 0.6em;
    color: #edf4fb;
    line-height: 1.6;
    font-weight: 900;
    font-family: 'Courier New', monospace;

    white-space: pre-wrap; /* \n -> 换行，保留连续空格 */
    word-break: break-word; /* 超长英文/URL 也能断行 */

    background-color: transparent;
    border-radius: 6px;
    border-color: #edf4fb;
  }
  .ta::placeholder {
    color: #edf4fb;
    font-size: 0.6em;
    font-weight: 900;
    font-family: 'Courier New', monospace;
  } 

  .cursor {
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    from, to { opacity: 1; }
    50% { opacity: 0; }
  }

  /* --- 【新增】放大动画的最终状态 --- */
  .image-container.is-zoomed-on-coinslot {
    /* scale(2.5) 表示将图片放大到2.5倍。
      translate(...) 表示移动图片，将你想要看清的区域移动到画面中心。
      负的X值表示向左移动图片（以显示右边的内容）。
      负的Y值表示向上移动图片（以显示下方的内容）。
    */
    transform: scale(3.5) translate(-35%, 15%);
  }

  /* --- 【新增】放大到键盘的动画状态 --- */
  .image-container.is-zoomed-on-keypad {
    /* 根据你的 keypad 热区数据估算：
      - scale(1.5): 键盘区宽度较大(65%)，所以放大倍数较小
      - translate(6%, 20%): 
        - X轴(左右): 键盘区偏左(left:12%)，所以我们需要向右平移(正值)来让它居中
        - Y轴(上下): 键盘区非常靠上(top:3%)，所以我们需要向下平移(正值)很多来让它居中
    */
    transform: scale(1.8) translate(6%, 20%);
  }

  /* --- 【新增】放大到出杯口的动画状态 --- */
  .image-container.is-zoomed-on-dispenser {
    transform: scale(3) translate(20%, -30%);
  }
</style>