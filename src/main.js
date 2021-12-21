import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
// https://github.com/aesoper101/vue3-storage
import Vue3Storage from "vue3-storage";

createApp(App).use(Vue3Storage).mount('#app')
