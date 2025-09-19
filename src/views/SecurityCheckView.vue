<template>
  <div class="security-container">
    <div class="stage">
      <!-- GUARD IMG -->
      <img
        class="guard"
        :class="{ shiftLeft: guardShift }"
        src="../assets/Security.png"
        alt="GUARD IMG"
      />

      <!-- narrativeText -->
      <div v-if="narrativeText" class="narrative-box">
        <p class="dialogue">{{ narrativeText }}</p>
      </div>

      <!-- ID card & input text -->
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
const idCardSlideIn = ref(false)
const guardShift = ref(false)

const delay = (ms) => new Promise(r => setTimeout(r, ms))
async function showNarrative(text, duration) {
  narrativeText.value = text
  await delay(duration)
  narrativeText.value = ''
}

onMounted(async () => {
  await showNarrative('ID card, please.', 2000)
  guardShift.value = true
  await delay(600)
  showIDCard.value = true
  await nextTick()
  idCardSlideIn.value = true
  await delay(500)

  showNameInput.value = true
})

async function saveNameAndProceed() {
  if (nameInput.value) {
    store.setResearcherName(nameInput.value)
  }
  store.setIDShown(true)

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


.guard {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  height: 100%;
  object-fit: cover;
  transition: transform .6s ease;
  z-index: 5;
}

.guard.shiftLeft {
  transform: translateX(-98%);
}

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

.id-card-frame {
  position: absolute;
  right: 0;
  bottom: 6%;
  width: min(520px, 45vw);
  transform: translateX(120%);
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

.name-slot {
  position: absolute;
  top: 40%;
  left: 3%;
  width: 54%;
  height: 20%;

  display: flex;
  align-items: center;
  pointer-events: none;
}


.name-input-inline {
  width: 100%;
  pointer-events: auto;
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
