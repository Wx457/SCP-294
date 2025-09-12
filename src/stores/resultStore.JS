// src/stores/resultStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useResultStore = defineStore('result', () => {
  const resultDocument = ref(null)

  function setResult(documentText) {
    resultDocument.value = documentText
  }

  function clearResult() {
    resultDocument.value = null
  }

  return { resultDocument, setResult, clearResult }
})