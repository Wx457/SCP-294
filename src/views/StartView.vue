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
        router.push('/records');
    }

    function goToExperiment() {
        router.push('/breakRoom');
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
    justify-content: center;
    align-items: center;
    min-height: 100vh;
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
    gap: 10px;
    margin-bottom: 3rem;
}

.centered-image1 {
  width: 50%;
  height: auto;
  display: block;
  margin: 0 auto;
}

.button-section {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
    max-width: 300px;
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