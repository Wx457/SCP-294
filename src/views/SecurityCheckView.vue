<template>
  <div class="security-container">
    <div class="stage">
      <!-- GUARD：加可切换的平移类 -->
      <img
        class="guard"
        :class="{ shiftLeft: guardShift }"
        src="../assets/Security.png"
        alt="GUARD IMG"
      />

      <!-- 叙述框 -->
      <div v-if="narrativeText" class="narrative-box">
        <p class="dialogue">{{ narrativeText }}</p>
      </div>

      <!-- ID卡：从右侧滑入 + 姓名栏锚点 -->
      <div
        v-if="showIDCard"
        class="id-card-frame"
        :class="{ slideIn: idCardSlideIn }"
      >
        <img class="id-card-img" src="../assets/IDcard.png" alt="ID TEMPLATE" />
        <div class="name-slot">
          <div v-if="showNameInput" class="name-input-inline">
            <input
              id="researcher-name"
              type="text"
              v-model="nameInput"
              placeholder="Press 'Enter' to submit..."
              @keyup.enter="saveNameAndProceed"
            />
          </div>
        </div>
      </div>
    </div>

    <button class="leave-button" @click="clickLeave">Back</button>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'

const router = useRouter()
const store = useMainStore()

const nameInput = ref('')
const narrativeText = ref('')
const showNameInput = ref(false)
const showIDCard = ref(false)
const idCardSlideIn = ref(false)  // 控制ID卡滑入
const guardShift = ref(false)     // 控制GUARD左移

const delay = (ms) => new Promise(r => setTimeout(r, ms))
async function showNarrative(text, duration) {
  narrativeText.value = text
  await delay(duration)
  narrativeText.value = ''
}

onMounted(async () => {
  // 1) 先播台词
  await showNarrative('ID card, please.', 2000)

  // 2) GUARD 左移为 ID 卡让位置
  guardShift.value = true
  await delay(600) // 留点时间完成平移动画

  // 3) 右侧显示 ID 卡，并做滑入动画
  showIDCard.value = true
  await nextTick()
  idCardSlideIn.value = true
  await delay(500) // 等滑入稳定

  // 4) 最后再显示输入框
  showNameInput.value = true
})

async function saveNameAndProceed() {
  if (nameInput.value) {
    store.setResearcherName(nameInput.value)
  }
  store.setIDShown(true)

  // 临时隐藏输入框，播一句感谢
  showNameInput.value = false
  const dialogue = `Thank you for your cooperation, Doctor.${nameInput.value || '[REDACTED]'}.`
  await showNarrative(dialogue, 2000)

  router.push('/breakroom')
}

function clickLeave() {
  router.back()
}
</script>

<style scoped>
/* 布局：中间一块“舞台”，左侧GUARD，右侧ID卡 */
.security-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: #000;
  color: #fff;
  overflow: hidden;
}

.stage {
  position: relative;
  width: min(1100px, 95vw);
  height: min(80vh, 900px);
  margin-top: 2vh;
}

/* GUARD：初始居中偏左；添加平移动画 */
.guard {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);   /* 初始居中 */
  height: 100%;
  object-fit: cover;
  transition: transform .6s ease; /* 平移动画 */
  z-index: 5;
}

/* 平移后往左挪一点（你可以改为 -28vw 或 -22vw 之类微调） */
.guard.shiftLeft {
  transform: translateX(-98%); /* 从居中(-50%)再多左 18% */
}

/* 叙事文本框 */
.narrative-box {
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,.8);
  padding: 15px 30px;
  border-radius: 5px;
  max-width: 80%;
  text-align: center;
  z-index: 30;
}
.narrative-box .dialogue { margin: 0; font-family: monospace; color: #fff;}

/* ID卡：放在舞台右侧，初始在右外侧，slideIn 后进入 */
.id-card-frame {
  position: absolute;
  right: 0;
  bottom: 6%;
  width: min(520px, 45vw);
  transform: translateX(120%);  /* 初始在右侧看不见 */
  opacity: 0;
  transition: transform .5s ease, opacity .5s ease;
  z-index: 10;
}
.id-card-frame.slideIn {
  transform: translateX(0);
  opacity: 1;
}

.id-card-img {
  display: block;
  width: 60%;
  height: 60%;
  border-radius: 10px;
}

/* 姓名栏锚点 */
.name-slot {
  position: absolute;
  top: 40%;
  left: 3%;
  width: 54%;
  height: 20%;

  display: flex;
  align-items: center;
  pointer-events: none; /* 自己不吃事件 */
}

/* 输入框填满姓名栏区域 */
.name-input-inline {
  width: 100%;
  pointer-events: auto; /* 恢复子元素交互 */
}

.name-input-inline input {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(255,255,255,0.55);
  color: #fff;
  padding: 0 10px;
  border-radius: 6px;
  font-size: clamp(14px, 2.2vw, 18px);
  outline: none;
}

/* 返回按钮 */
.leave-button {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 10px 15px;
  background: rgba(0,0,0,.7);
  border: 1px solid #fff;
  color: #fff;
  cursor: pointer;
  z-index: 40;
}
.leave-button:hover { background:#fff; color:#000; }
</style>
