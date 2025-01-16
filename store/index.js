import Vuex from 'vuex'
import Vue from 'vue'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    visableNoCourse: false,
    loading: false,
	playAudio: false,
    // 平台
    platform: uni.getSystemInfoSync().platform,
    // 绘本相关
    book: {
      // 多少秒出现小手
      coursetime: 1000,
      iscourse: false,
      auto: false,
      src: ''
    }
  },
  mutations: {
    setVisableNoCourse(state, value) {
      state.visableNoCourse = value
    },
    setLoading(state, value) {
      state.loading = value
    },
    setBookAuto(state, value) {
      state.book.auto = value
    },
    setBookSrc(state, value) {
      state.book.src = value
    },
    setBookIscourse(state, value) {
      state.book.iscourse = value
    },
    setBookMakequesing(state, value) {
      state.book.makequesing = value
    }
  },
  actions: {
    updateBookAuto({ commit }, value) {
      commit('setBookAuto', value)
    },
    updateBookSrc({ commit }, value) {
      commit('setBookSrc', value)
    }
  }
})

export default store