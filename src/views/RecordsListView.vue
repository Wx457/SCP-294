<template>
  <div class="records-container">
    <h2>Documents-Experiment Records</h2>
    <div class="records-list">
      <div v-for="record in records" :key="record._id" class="record-item">
        <div class="record-header" @click="toggleDetails(record._id)">
          <span class="record-key">Key: {{ record.input_key }}</span>
          <span class="record-timestamp">时间: {{ formatDate(record.timestamp) }}</span>
        </div>
        <div v-if="expandedRecordId === record._id" class="record-details">
          <div class="paper-background">
            <pre class="pre-wrap">{{ record.document_text }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>

  <button class="leave-button" @click="clickLeave">Back</button>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const records = ref([]);
const expandedRecordId = ref(null);

onMounted(async () => {
  try {
    const response = await fetch('/api/getRecords');
    const data = await response.json();
    records.value = data.records;
  } catch (error) {
    console.error('Error fetching records:', error);
  }
});

function toggleDetails(id) {
  if (expandedRecordId.value === id) {
    expandedRecordId.value = null; // 折叠
  } else {
    expandedRecordId.value = id; // 展开
  }
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('zh-CN', options);
}

function clickLeave() {
    router.push('/');
}
</script>

<style scoped>
h2{
    color: #f5f5dc;
}
.records-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #000;
  color: #f5f5dc;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-item {
  border: 2px solid darkred;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
}

.record-header {
  display: flex;
  justify-content: space-between;
  font-family: monospace;
}

.pre-wrap {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.record-details {
  margin-top: 10px;
}

.paper-background {
  background-color: #f5f5dc;
  color: #000;
  padding: 20px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  /* white-space: pre-wrap; */
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
</style>