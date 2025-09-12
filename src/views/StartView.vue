<template>
  <div class="start-container">
    <h1 class="start-title">SCP-294</h1>

    <div class="image-section">
      <img src="../assets/titleimg1.png" alt="Title image" class="centered-image1">
    </div>

    <div class="button-section">
      <button @click="goToRecords" class="start-button">Records</button>
      <button @click="goToExperiment" class="start-button">New Experiment</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function goToRecords() {
  // 当点击“实验记录”按钮时，跳转到记录列表页面
  router.push('/records');
}

function goToExperiment() {
  // 当点击“进行实验”按钮时，跳转到咖啡机页面
  router.push('/breakroom');
}
</script>

<style scoped>
h1 {
    color: bisque;
    font-family: 'Courier New', Courier, monospace;
}
.start-container {
  display: flex;
  flex-direction: column;
  justify-content: center; /* 垂直居中所有内容 */
  align-items: center;    /* 水平居中所有内容 */
  min-height: 100vh;      /* 确保容器占满整个视口高度 */
  background-color: #000;
  color: bisque;
  text-align: center;
}

.start-title {
  font-size: 3rem;
  margin-bottom: 2rem;
}

.image-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px; /* 图片之间的间距 */
  margin-bottom: 3rem;
}

.centered-image1 {
  width: 50%;
  height: auto;
  display: block; /* 确保图片独占一行 */
  margin: 0 auto;
}

.button-section {
  display: flex;
  flex-direction: column;
  gap: 15px; /* 按钮之间的间距 */
  width: 100%;
  max-width: 300px; /* 限制按钮容器的最大宽度 */
  font-family: 'Courier New', Courier, monospace;
}

.start-button {
    padding: 12px 24px;
    font-size: 1.2rem;
    cursor: pointer;
    background-color: transparent;
    color: white;
    font-weight: 700;
    font-family: 'Courier New', Courier, monospace;
    border: 2px solid darkred;
    border-radius: 5px;
    transition: all 0.3s ease;
}

.start-button:hover {
    border: 2px solid darkred;
    background-color: darkred;
    color: #000;
}
</style>