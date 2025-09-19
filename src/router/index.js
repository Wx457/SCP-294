import { createRouter, createWebHistory } from 'vue-router'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Start',
      component: () => import('../views/StartView.vue')
    },
    {
      path: '/breakRoom',
      name: 'BreakRoom',
      component: () => import('../views/BreakRoomView.vue')
    },
    {
      path: '/security',
      name: 'SecurityCheck',
      component: ()=> import('../views/SecurityCheckView.vue')
    },
    {
      path: '/records',
      name: 'RecordsList',
      component: () => import('../views/RecordsListView.vue')
    },
    {
      path: '/order',
      name: 'Ordering',
      component: () => import('../views/OrderingView.vue')
    },
    {
      path: '/result',
      name: 'Result',
      component: () => import('../views/ResultView.vue')
    }
  ]
})

export default router