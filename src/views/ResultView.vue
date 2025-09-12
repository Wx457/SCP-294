<template>
  <div class="result-viewport">
    <div class="animation-container" @click="revealDocument">
      <img 
        :src="currentFrame" 
        alt="出杯动画"
        class="dispense-image"
        :class="{ clickable: isAnimationComplete }"
      />
    </div>

    <div v-if="showDocument" class="document-overlay">
      <pre class="document-content">{{ resultStore.resultDocument }}</pre>
    </div>
  </div>

  <button class="leave-button" @click="clickLeave">Back</button>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useResultStore } from '@/stores/resultStore'
import { useRouter } from 'vue-router';

// --- 导入你的动画帧图片 ---
import frame1 from '@/assets/result00.png'
import frame2 from '@/assets/result01.png'
import frame3 from '@/assets/result02ice.png'
import frame4 from '@/assets/result02hot.png' 
import frame5 from '@/assets/result03.png'

const router = useRouter();
const resultStore = useResultStore()

// 动画帧数组
const animationFrames = [frame1, frame2, frame3, frame4, frame5]
const frameInterval = 500 // 每帧之间的间隔时间 (毫秒)

// --- 状态管理 ---
const currentFrame = ref(animationFrames[0]) // 当前显示的图片
const isAnimationComplete = ref(false)     // 动画是否播放完毕
const showDocument = ref(false)              // 是否显示文档

// --- 动画逻辑 ---
// 当组件加载后，开始播放动画序列
onMounted(() => {
  playAnimation();
})

function playAnimation() {
  let frameIndex = 0;
  isAnimationComplete.value = false;

  const nextFrame = () => {
    frameIndex++;
    if (frameIndex < animationFrames.length) {
      currentFrame.value = animationFrames[frameIndex];
      setTimeout(nextFrame, frameInterval);
    } else {
      // 动画播放完毕
      isAnimationComplete.value = true;
    }
  };

  // 启动第一帧之后的动画
  setTimeout(nextFrame, frameInterval);
}

// 点击杯子后显示文档
function revealDocument() {
  if (isAnimationComplete.value) {
    showDocument.value = true;
  }
}

function clickLeave() {
    router.push('/')
}
</script>

<style scoped>
.result-viewport {
  width: 100vw;
  height: 100vh;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.animation-container {
  width: auto;
  height: 100%;
}

.dispense-image {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 保证图片比例正确，完整显示 */
  transition: filter 0.3s;
}

.dispense-image.clickable {
  cursor: pointer;
  filter: brightness(1.1); /* 动画结束后给一个可点击的亮度提示 */
}
.dispense-image.clickable:hover {
  filter: brightness(1.3);
}


/* 文档覆盖层 */
.document-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.5s ease-in-out;
}

.document-content {
  color: #eee;
  font-family: 'Courier New', Courier, monospace;
  font-size: 1em;
  white-space: pre-wrap; /* 保证文档内的换行和空格被正确显示 */
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 20px;
  border: 1px solid #555;
  line-height: 1.6;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>