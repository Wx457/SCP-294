// src/stores/mainStore.js
import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

const SESSION_KEY = 'scp_session_main'

export const useMainStore = defineStore('main', () => {
  // --- STATE ---
  const resultDocument = ref(null);
  const researcherName = ref('');
  const hasShownID = ref(false);
  const hasInsertedCoin = ref(false)

  // 从 sessionStorage 水合（若不需要刷新保留，可整段删除）
  try {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved) {
      const s = JSON.parse(saved)
      if (typeof s.researcherName === 'string') researcherName.value = s.researcherName
      if (typeof s.hasShownID === 'boolean')    hasShownID.value     = s.hasShownID
      if (typeof s.hasInsertedCoin === 'boolean') hasInsertedCoin.value = s.hasInsertedCoin
    }
  } catch {}

  // --- ACTIONS ---
  function setResult(documentText) {
    resultDocument.value = documentText;
  }

  function clearResult() {
    resultDocument.value = null;
  }
  
  function setResearcherName(name) {
    researcherName.value = name;
  }
  
  function setIDShown(value) {
    hasShownID.value = value;
  }

  function setCoinInserted(value) {
    hasInsertedCoin.value = value
  }

  function resetSession() {
    resultDocument.value  = null
    researcherName.value  = ''
    hasShownID.value      = false
    hasInsertedCoin.value = false
    sessionStorage.removeItem(SESSION_KEY)
  }

  // ✅ 可选：会话级持久化（刷新不丢；关标签页就清）
  watch([researcherName, hasShownID, hasInsertedCoin], ([name, idShown, coin]) => {
    const payload = { researcherName: name, hasShownID: idShown, hasInsertedCoin: coin }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload))
  })

  // --- RETURN ---
  return { 
    resultDocument, 
    researcherName, 
    hasShownID,
    hasInsertedCoin,
    setResult, 
    clearResult,
    setResearcherName,
    setIDShown,
    setCoinInserted
  };
});