<template>
  <div class="order-viewport">
    <div class="image-container" :class="zoomClass" ref="imageContainerRef">
      
      <img :src="orderBgDark" alt="咖啡机特写-暗" class="background-image" />

      <img 
        :src="currentBrightBg" 
        alt="咖啡机特写-亮" 
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
  import { useRouter } from 'vue-router'
  import { useResultStore } from '@/stores/resultStore'
  import orderBgDark from '../assets/OrderBgDark.png'
  import orderBgBright from '../assets/OrderBgBright.png'
  import orderBgCoin from '../assets/OrderScreen1.png'

  const router = useRouter()
  const narrativeText = ref('')
  const hoveredHotspot = ref(null);
  const coinInserted = ref(false)
  const imageContainerRef = ref(null);
  const userInput = ref('')
  const resultStore = useResultStore() // 2. 获取 store 实例

  // const brightClipPath = ref('inset(0% 100% 100% 0%)')
  const brightClipPath = computed(() => {
    const currentZoom = zoomTarget.value;
    const currentHover = hoveredHotspot.value;

    // 决定当前应该高亮哪个目标
    const activeTarget = currentZoom || currentHover;

    // 如果没有任何目标 (既没放大也没悬停)，则完全不显示高亮
    if (!activeTarget || !hotspots[activeTarget]) {
      return 'inset(0% 100% 100% 0%)'; // 完全裁剪
    }

    // 根据当前的目标 (无论是放大还是悬停)，获取其几何信息
    const h = hotspots[activeTarget];
    
    // 动态计算出对应这个热区的 inset() 值
    const top = h.top;
    const right = `calc(100% - ${h.left} - ${h.width})`;
    const bottom = `calc(100% - ${h.top} - ${h.height})`;
    const left = h.left;
    
    return `inset(${top} ${right} ${bottom} ${left})`;
  });

  //追踪当前的放大目标 ↓↓↓
  const zoomTarget = ref(null)

  const hotspots = {
    keypad: { top: '3%', left: '12%', width: '65%', height: '50%' },
    coinslot: { top: '23%', left: '79%', width: '20%', height: '19%' },
    dispenser: { top: '55%', left: '15%', width: '30%', height: '35%' }, 
  }
  const zoomClass = computed(() => {
    if (!zoomTarget.value) return '' // 如果没有放大目标，则不添加任何类
    // 否则，返回一个类似 'is-zoomed-on-coinslot' 的类名
    return `is-zoomed-on-${zoomTarget.value}` 
  })

  // --- 核心功能函数 ---

  /**
   * 一个用于显示叙事文本，并在指定时间后自动清除的函数
   */
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
  async function showNarrative(text, duration) {
    narrativeText.value = text
    await delay(duration)
    narrativeText.value = ''
  }

  /**
   * 悬停到某个热点：根据热点的几何区域动态设置 clip-path，显露亮层。
   */
  function onHotspotHover(hotspotName) {
    hoveredHotspot.value = hotspotName;
  }

  /**
   * 悬停离开热点：重置为默认的“全部裁切”（不显示亮层）
   */
  function onHotspotLeave() {
    hoveredHotspot.value = null;
  }

  /**
   * 点击投币区域的事件处理
   */
  const currentBrightBg = computed(() => {
    return coinInserted.value ? orderBgCoin : orderBgBright;
  });
  /**
   * 点击投币区域的事件处理
   */
  function clickCoinSlot() {
    // 如果是首次投币
    if (!coinInserted.value) {
      coinInserted.value = true;
      
      // 1. 开始放大到投币口 (这将自动触发 brightClipPath 只高亮投币区)
      zoomTarget.value = 'coinslot';

      // 2. 监听第一次放大动画的结束
      if (imageContainerRef.value) {
        imageContainerRef.value.addEventListener('transitionend', () => {
          // 3. 动画结束后，显示提示文字，持续3秒
          showNarrative('你投入了一枚50美分硬币', 3000);
          
          // 4. 设置一个3秒的延时，在文字消失的同时，开始移动到键盘
          setTimeout(() => {
            zoomTarget.value = 'keypad'; // 改变状态，触发到键盘的平移动画 (同时自动切换高亮)
          }, 3000);

        }, { once: true });
      }
    } else {
      // 如果已经投过币了（无论当前在看哪里），再点投币口
      // 1. 镜头移回投币口
      zoomTarget.value = 'coinslot';
      // 2. 显示提示文字
      showNarrative('SCP-294接受且只接受一枚50美分硬币', 3000);

      setTimeout(() => {
        zoomTarget.value = 'keypad'; // 改变状态，触发到键盘的平移动画 (同时自动切换高亮)
      }, 3000);
    }
  }

  /**
   * 点击键盘/屏幕区域的事件处理
   */
  function clickKeypad() {
    if (coinInserted.value) {
      // 投币后才能交互，未来会弹出键盘输入界面
      showNarrative('放大并可输入指令');
      // 这里将是导航到键盘输入组件的逻辑
    } else {
      // 投币前点击无效
      showNarrative('请先投币。', 2000);
    }
  }

  /**
   * 点击离开按钮
   */
  function clickLeave() {
    // 如果当前是放大状态，则第一次点击“Back”按钮时先缩小
    if (zoomTarget.value) {
      zoomTarget.value = null; // 设置放大目标为null，触发缩小动画
    } else {
      // 如果已经是缩小状态，则第二次点击时才真正返回上一页
      router.go(-1)
    }
  }

  const MAX_CHARS = 50; // 设置最大字符数
  /**
   * 处理键盘按键的核心函数
   * @param {KeyboardEvent} event 浏览器传递的键盘事件对象
   */
  function handleKeyPress(event) {
    // 只有在放大到键盘区域时才响应输入
    if (zoomTarget.value !== 'keypad') {
      return;
    }

    // 阻止某些按键的默认浏览器行为，例如按空格滚动页面
    if (event.key === ' ') {
      event.preventDefault();
    }

    // 处理“退格键”
    if (event.key === 'Backspace') {
      userInput.value = userInput.value.slice(0, -1);
      return;
    }

    // 处理“回车键”
    if (event.key === 'Enter') {
      // 触发提交逻辑
      submitRequest();
      return;
    }

    // 只处理单个字符的输入 (过滤掉 Shift, Ctrl, F5 等功能键)
    if (event.key.length === 1) {
      // 检查是否达到最大字符数
      if (userInput.value.length < MAX_CHARS) {
        userInput.value += event.key;
      }
    }
  }

  /**
   * 提交用户输入的请求
   */
  async function submitRequest() {
    const currentInput = userInput.value.trim();
    if (currentInput.length === 0) {
      showNarrative('请输入有效指令。', 3000);
      return;
    }
    //TODO: 屏幕显示‘Order Received!’，然后开始转圈
    showNarrative('请求已发送: "${currentInput}"', 3000);
    
    try {
      const response = await fetch('/api/getCup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: currentInput }), 
      });

      // 如果响应不成功，我们在这里深入挖掘原因
      if (!response.ok) {
        // 打印出具体的状态码和状态文本
        console.error("服务器响应错误:", response.status, response.statusText);
        
        // 尝试解析后端返回的JSON错误体，里面可能包含有用的信息
        const errorData = await response.json().catch(() => {
          // 如果后端返回的不是JSON，就返回一个空对象
          return { error: "无法解析服务器的错误响应" };
        });
        console.error("服务器返回的错误详情:", errorData);

        // 最后再抛出错误，让下面的catch块捕获
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 如果成功，则继续
      const data = await response.json();
      console.log('从后端收到的AI回复:', data.description);
      resultStore.setResult(data.description);
      zoomTarget.value = 'dispenser';
      if (imageContainerRef.value) {
        imageContainerRef.value.addEventListener('transitionend', () => {
          router.push('/result');
        }, { once: true });
      }

    } catch (error) {
      console.error('调用API时出错:', error.message);
      showNarrative('请求失败，请稍后再试。');
    }
  }

  // --- 【新增】Vue生命周期钩子 ---

  // onMounted: 当组件被加载到页面上后执行
  onMounted(() => {
    // 开始监听全局的键盘按下事件
    window.addEventListener('keydown', handleKeyPress);
  });

  // onUnmounted: 当组件被销毁 (用户离开这个页面) 前执行
  onUnmounted(() => {
    // 停止监听，防止在其他页面也触发这个键盘事件
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
  .background-image[alt*="亮"] {
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

  /* .preview {
    white-space: pre-wrap; \n -> 换行，保留连续空格
    word-break: break-word; /* 超长英文/URL 也能断行 */
  /* } */ 

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