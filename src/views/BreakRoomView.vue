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

    import { ref, onMounted, onUnmounted, computed } from 'vue'
    import { useRouter } from 'vue-router'
    import { useMainStore } from '@/stores/mainStore';

    import darkBg from '../assets/BGI.png'
    import brightBg from '../assets/BGI_bright.png'

    // --- Hotspots-size & location ---
    const hotspots = {
        guard: { top: '5%', left: '65%', width: '25%', height: '90%' },
        machine: { top: '5%', left: '33%', width: '33%', height: '95%' },
    }

    // --- Responsive refs ---

    const imageRef = ref(null)
    const imageRenderInfo = ref({
        width: 0,
        height: 0,
        offsetX: 0,
        offsetY: 0,
    })

    const narrativeText = ref('')
    const router = useRouter()
    const store = useMainStore();
    const brightClipPath = ref('inset(0% 100% 100% 0%)')


    // --- Utils ---
    /**
     * Show narrative text
     */
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
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

    // life cycle hooks
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

    // Computed properties
    const hotspotStyles = computed(() => {
        const info = imageRenderInfo.value
        if (!info.width) return {}

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



    // --- Interaction & Event Handlers ---
    /**
     * Hover: set clip-path to show hotspot
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
     * Hover off: hotspot off
     */
    function onHotspotLeave() {
        brightClipPath.value = 'inset(0% 100% 100% 0%)';
    }

    /**
     * Click Guard
     */
    async function clickGuard() {
        if (store.hasShownID) {
            const dialogue = `Your identity has been confirmed, Dr.${store.researcherName || '[REDACTED]'}.`;
            await showNarrative(dialogue, 2000);
            return  
        } else {
            router.push('/security')
        }
    }

    /**
     * Click Coffee Machine
     * - Has shown ID -> order view
     * - Has not shown ID -> security view
     */
    async function clickMachine() {
        if (store.hasShownID) {
            return router.push('/order') 
        } 
        return router.push('/security')
    }

    /**
     * Leave Breakroom -> start view
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
        position: relative;
        width: 100vw;
        height: 100vh;
        line-height: 0;
        overflow: hidden;
    }

    .background-image, .highlight-image-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: contain; 
    }


    .highlight-image-overlay {
        pointer-events: none;
        transition: clip-path 0.2s ease-in-out;
    }

    .hotspot {
        position: absolute;
        cursor: pointer;
    }

    .hotspot:hover > .highlight-image {
        opacity: 1;
    }

    .hotspot:hover {
    transform: scale(1.02);
    }

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
        box-sizing: border-box;
        z-index: 20;
    }

    .narrative-box p {
        margin: 0;
        font-size: 1.2em;
    }

</style>