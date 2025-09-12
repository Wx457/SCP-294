<template>
  <div class="break-room-viewport">
    <div class="image-container">
      
      <img :src="darkBg" alt="backgroud img" class="background-image" ref="imageRef"/>

      <img 
        :src="brightBg" 
        alt="bright bgi" 
        class="highlight-image-overlay" 
        :style="{ clipPath: brightClipPath }"
      />

      <div 
        class="hotspot"
        :style="hotspotStyles.guard"
        @click="clickGuard"
        @mouseover="onHotspotHover('guard')"
        @mouseleave="onHotspotLeave"
      ></div>

      <div 
        class="hotspot"
        :style="hotspotStyles.machine"
        @click="clickMachine"
        @mouseover="onHotspotHover('machine')"
        @mouseleave="onHotspotLeave"
      ></div>

    </div>
  </div>

  <button class="leave-button" @click="clickLeave">Leave</button>
  <div v-if="narrativeText" class="narrative-box">
    <p>{{ narrativeText }}</p>
  </div>
  <div v-if="showGuardCloseup" class="guard-closeup-overlay" @click="clickGuard">
    <img :src="guardCloseupImg" alt="Security Img">
  </div>
</template>

<script setup>
    // 1) 资源导入==============================
    import { ref, onMounted, onUnmounted, computed } from 'vue'
    import { useRouter } from 'vue-router'

    import darkBg from '../assets/BGI.png'
    import brightBg from '../assets/BGI_bright.png'
    import guardCloseupImg from '../assets/Security.png'

    // 划定热点对象Hotspots-size & location
    const hotspots = {
        guard: { top: '5%', left: '65%', width: '25%', height: '90%' },
        machine: { top: '5%', left: '33%', width: '33%', height: '95%' },
    }

    // 2) 组件状态（响应式 ref）==============================

    // 新增 ref 用于获取图片 DOM 和存储计算结果
    const imageRef = ref(null) // 对应 template 中的 ref="imageRef"
    const imageRenderInfo = ref({
        width: 0,  // 图片渲染后的实际宽度 (px)
        height: 0, // 图片渲染后的实际高度 (px)
        offsetX: 0, // 图片距离容器左边的偏移 (px)
        offsetY: 0, // 图片距离容器顶部的偏移 (px)
    })

    const hasShownID = ref(false)
    const narrativeText = ref('')
    const showGuardCloseup = ref(false)
    const router = useRouter()
    const brightClipPath = ref('inset(0% 100% 100% 0%)')

    // 3) 工具函数（封装通用逻辑）==============================
    /**
     * delay(ms): Promise 版等待工具
     * 在 async 函数中可 await delay(ms) 来“暂停”本函数，不阻塞其他逻辑
     */
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

    /**
     * showNarrative(text, duration)
     * - 显示叙述文本 text，并在 duration 毫秒后自动清空。
     */
    async function showNarrative(text, duration) {
        narrativeText.value = text
        await delay(duration)
        narrativeText.value = ''
    }

    function updateImageDimensions() {
        const img = imageRef.value
        if (!img) return

        const containerWidth = img.parentElement.clientWidth
        const containerHeight = img.parentElement.clientHeight
        const imageNaturalWidth = img.naturalWidth
        const imageNaturalHeight = img.naturalHeight

        const imageAspectRatio = imageNaturalWidth / imageNaturalHeight
        const containerAspectRatio = containerWidth / containerHeight

        let renderWidth, renderHeight, offsetX, offsetY

        if (imageAspectRatio > containerAspectRatio) {
            // 图片比容器“更宽”，宽度撑满，上下留黑
            renderWidth = containerWidth
            renderHeight = renderWidth / imageAspectRatio
            offsetX = 0
            offsetY = (containerHeight - renderHeight) / 2
        } else {
            // 图片比容器“更高”，高度撑满，左右留黑
            renderHeight = containerHeight
            renderWidth = renderHeight * imageAspectRatio
            offsetY = 0
            offsetX = (containerWidth - renderWidth) / 2
        }

        imageRenderInfo.value = {
            width: renderWidth,
            height: renderHeight,
            offsetX,
            offsetY,
        }
    }

    // 新增：生命周期钩子
    onMounted(() => {
        // 图片加载完成后再计算，否则 naturalWidth/Height 可能为0
        imageRef.value.onload = () => {
            updateImageDimensions()
            window.addEventListener('resize', updateImageDimensions)
        }
        // 如果图片已经缓存，onload 可能不触发，所以也直接调用一次
        if (imageRef.value.complete) {
            updateImageDimensions()
            window.addEventListener('resize', updateImageDimensions)
        }
    })

    onUnmounted(() => {
        window.removeEventListener('resize', updateImageDimensions)
    })

    // 新增：计算属性，用于动态绑定热区的 style
    const hotspotStyles = computed(() => {
        const info = imageRenderInfo.value
        if (!info.width) return {} // 防止初始计算未完成时报错

        const styles = {}
        for (const name in hotspots) {
            const h = hotspots[name]
            styles[name] = {
                top: `${info.offsetY + parseFloat(h.top) / 100 * info.height}px`,
                left: `${info.offsetX + parseFloat(h.left) / 100 * info.width}px`,
                width: `${parseFloat(h.width) / 100 * info.width}px`,
                height: `${parseFloat(h.height) / 100 * info.height}px`,
            }
        }
        return styles
    })
    // 4) 交互 & 事件处理函数==============================

    /**
     * 悬停到某个热点：根据热点的几何区域动态设置 clip-path，显露亮层。
     */
    function onHotspotHover(hotspotName) {
        const h = hotspots[hotspotName];
        if (!h) return;
        
        const info = imageRenderInfo.value
        const container = imageRef.value.parentElement
    
        // Calculate the clipping area based on the location of the hot zone
        const top = info.offsetY + (parseFloat(h.top) / 100) * info.height
        const left = info.offsetX + (parseFloat(h.left) / 100) * info.width
        const right = container.clientWidth - left - (parseFloat(h.width) / 100) * info.width
        const bottom = container.clientHeight - top - (parseFloat(h.height) / 100) * info.height

        brightClipPath.value = `inset(${top}px ${right}px ${bottom}px ${left}px)`
    }

    /**
     * 悬停离开热点：重置为默认的“全部裁切”（不显示亮层）
     */
    function onHotspotLeave() {
        brightClipPath.value = 'inset(0% 100% 100% 0%)';
    }

    /**
     * 点击警卫：展示证件的完整流程（使用 async/await 改写，避免多重 setTimeout）
     */
    async function clickGuard() {
        showGuardCloseup.value = true
        hasShownID.value = true

        await showNarrative('You approach and show him your ID.', 3000)
        await showNarrative('He nodded in response. "Thank you for your cooperation, Doctor."', 3000)
        showGuardCloseup.value = false
    }

    /**
     * 点击咖啡机：
     * - 若已出示 ID：提示后进入点单页
     * - 若未出示 ID：触发“请出示证件 → 确认 → 关闭特写”的完整流程，再进入点单页
     */
    async function clickMachine() {
        //已出示 ID 的场景
        if (hasShownID.value) {
            router.push('/order') 
            return
        } 
        //未出示 ID 的场景
        showGuardCloseup.value = true
        await showNarrative('ID card, please.', 1000)
        await showNarrative('You show him your card, and he nodded in response. "Thank you for your cooperation, Doctor."', 4000);
        hasShownID.value = true;
        showGuardCloseup.value = false
        // 之后进入点单页
        router.push('/order')
        
    }

    /**
     * 点击离开休息室
     */
    async function clickLeave() {
        await showNarrative('You leave the breakroom', 1500)
        console.log('leave')
    }
</script>

<style scoped>
    /* --- 主容器样式 --- */
    .break-room-viewport {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;     /* 垂直居中 */
        justify-content: center; /* 水平居中 (如果图片宽度小于窗口) */
        background-color: #000;  /* 图片未填满时的背景色 */     
    }

    /* 新增：图片容器，热区的定位基准 */
    .image-container {
        position: relative; /* 让容器尺寸等于视口，为 object-fit 提供基准 */
        width: 100vw;
        height: 100vh;
        line-height: 0;
        overflow: hidden;
    }

    /* 新增：真实的图片样式 */
    .background-image, .highlight-image-overlay {
        position: absolute; /* 让两张图完全重叠 */
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        /* 核心修改：让图片保持比例完整显示 */
        object-fit: contain; 
    }


    /* --- 热区和高亮的新样式 --- */

    /* 新增：亮色图层的样式 */
    .highlight-image-overlay {
        pointer-events: none;
        transition: clip-path 0.2s ease-in-out;
    }

    /* 热区 */
    .hotspot {
        position: absolute;
        cursor: pointer;
    }

    /* 当鼠标悬停在热区上时，让内部的高亮背景显示出来 */
    .hotspot:hover > .highlight-image {
        opacity: 1;
    }

    .hotspot:hover {
    transform: scale(1.02); /* 悬停时轻微放大 */
    }


    /* --- 其他UI元素样式 --- */
    .leave-button {
        position: absolute;
        bottom: 40px;
        right: 40px;
        padding: 10px 20px;
        background-color: #888;
        color: #555555;
        border: 1px solid #888;
        border-radius: 20%;
        cursor: pointer;
        transition: all 0.3s;

        z-index: 10;
    }
    .leave-button:hover {
        background-color: #fff;
        color: #000;
    }

    .narrative-box {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        padding: 30px 50px;
        background-color: rgba(0, 0, 0, 0.85);
        color: #fff;
        text-align: center;
        box-sizing: border-box; /* 让padding不影响宽度 */
        z-index: 20;
    }
    .narrative-box p {
        margin: 0;
        font-size: 1.2em;
    }

    .guard-closeup-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }
    .guard-closeup-overlay img {
        max-width: 60%;
        max-height: 80%;
        border: 2px solid #555;
    }
</style>