import { createRouter, createWebHistory } from 'vue-router'

// 我们将把页面级的大组件放在 src/views 文件夹下
// 使用 () => import(...) 是一种“懒加载”技术，性能更好
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/', // 根路径，显示开始界面
      name: 'Start',
      component: () => import('../views/StartView.vue')
    },
    {
      path: '/breakRoom', // 显示茶水间
      name: 'BreakRoom',
      component: () => import('../views/BreakRoomView.vue')
    },
    {
      path: '/records', // 实验记录文档列表
      name: 'RecordsList',
      component: () => import('../views/RecordsListView.vue')
    },
    {
      path: '/order', // 点单路径，显示咖啡机特写
      name: 'Ordering',
      component: () => import('../views/OrderingView.vue')
    },
    {
      path: '/result', // 测试结果
      name: 'Result',
      component: () => import('../views/ResultView.vue')
    }
  ]
})

export default router