import Vue from 'vue'
import App from './App'
import xwutlis from './utils'
//将方法引入到Vue原型上用来全局访问
Vue.prototype.$xw = {}
for (let fn in xwutlis) {
	Vue.prototype.$xw[fn] = xwutlis[fn]
}

Vue.config.productionTip = false

App.mpType = 'app'

const app = new Vue({
	...App
})
app.$mount()