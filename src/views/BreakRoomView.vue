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

</template>

<script setup>
    // 1) 资源导入==============================
    import { ref, onMounted, onUnmounted, computed } from 'vue'
    import { useRouter } from 'vue-router'
    import { useMainStore } from '@/stores/mainStore';

    import darkBg from '../assets/BGI.png'
    import brightBg from '../assets/BGI_bright.png'

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

    const narrativeText = ref('')
    const router = useRouter()
    const store = useMainStore();
    const brightClipPath = ref('inset(0% 100% 100% 0%)')


    // 3) 工具函数（封装通用逻辑）==============================
    /**
     * 在 async 函数中可 await delay(ms) 来“暂停”本函数
     */
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

    /**
     * 显示叙述文本 text，并在 duration 毫秒后自动清空。
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

    // 生命周期钩子
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

    // 计算属性，用于动态绑定热区的 style
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
     * 点击警卫：转入ID check页
     */
    async function clickGuard() {
        if (store.hasShownID) {
            // 如果已经验证过，给出提示
            const dialogue = `Your identity has been confirmed, Dr.${store.researcherName || '[REDACTED]'}.`;
            await showNarrative(dialogue, 2000);
            return  
        } else {
            router.push('/security')
        }
    }

    /**
     * 点击咖啡机：
     * - 若已出示 ID：提示后进入点单页
     * - 若未出示 ID：触发“请出示证件”，进入ID check页
     */
    async function clickMachine() {
        //已出示 ID 的场景
        if (store.hasShownID) {
            return router.push('/order') 
        } 
        //未出示 ID 的场景
        return router.push('/security')
    }

    /**
     * 点击离开休息室
     */
    async function clickLeave() {
        return router.push('/')
    }
</script>

<style scoped>
    .break-room-viewport {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #000;    
    }

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
        object-fit: contain; 
    }


    /* --- 热区和高亮的新样式 --- */
    /* 亮色图层的样式 */
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

</style>