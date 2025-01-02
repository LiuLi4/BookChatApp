<template>
	<view class="root fairy-tale-theme">
		<iheader :showIcon="false" :showSearch="showHeaderSearch"></iheader>
		<view v-if="showSearch" class="base-padding mgb-30">
			<search target="/pages/search/search" />
		</view>

		<!-- 横幅轮播 -->
		<view v-if="banners.length > 0" class="base-padding base-margin-bottom">
			<swiper :style="'height:' + bannerHeight" :autoplay="autoplay" :indicator-dots="indicatorDots"
				:interval="interval" :duration="duration" class="swiper-container">
				<swiper-item v-for="banner in banners" :key="banner.id" class="radius-basic banner-item">
					<image @click="bannerClick" :data-url="banner.link" :src="banner.image"
						:style="'height:' + bannerHeight + ';width:' + bannerWidth + ';min-width:100%;max-width:100%'"
						class="banner-image" />
				</swiper-item>
			</swiper>
		</view>

		<!-- 推荐图书 -->
		<view v-if="recommendBooks.length > 0" class="panel base-padding recommend base-margin-bottom">
			<view class="panel-heading">
				<view class="panel-title font-lv1 strong">
					<text class="title-text">🌟 最新推荐 🌟</text>
					<navigator class="history-link color-grey" url="/pages/history/history">最近阅读</navigator>
				</view>
			</view>
			<view class="panel-body">
				<scroll-book :books="recommendBooks" :width="bannerWidth"></scroll-book>
			</view>
		</view>

		<!-- 各分类书籍 -->
		<block v-for="category in categoryBooks" :key="category.id">
			<view v-if="category.books" class="panel base-padding base-margin-bottom">
				<view class="panel-heading">
					<view class="panel-title font-lv1 strong">
						{{ category.name }}
						<navigator :url="'/pages/list/list?tab=new&cid=' + category.id" class="pull-right color-link font-lv3">
							更多
						</navigator>
					</view>
				</view>
				<view class="panel-body fairy-panel">
					<list-book :books="category.books" />
				</view>
			</view>
		</block>
		<view v-if="platform == 'ios'" class="ios-platform">.</view>
	</view>
</template>

<script>
	import scrollBook from '../../components/scrollBook.vue'
	import search from '../../components/search.vue'
	import listBook from '../../components/listBook.vue'
	import iheader from '../../components/header.vue'

	import api from '../../utils/api.js'
	import util from '../../utils/util.js'
	import config from '../../config.js'

	export default {
		components: {
			scrollBook,
			search,
			listBook,
			iheader,
		},
		data() {
			return {
				bannerRatio: 2.619,
				indicatorDots: true,
				autoplay: true,
				interval: 3000,
				duration: 500,
				bannerWidth: '100%',
				bannerHeight: 'auto',
				showSearch: false, // 内容完全加载完成之后再显示搜索框
				showHeaderSearch: false,
				banners: [],
				categoryBooks: [],
				recommendBooks: [],
				times: 1000, // 当iOS未允许访问网络的时候，每3秒请求一次数据
				platform: '',
				bannerAdUnitId: config.bannerAdUnitId,
				showAd: false,
				adLoaded: false,
				adClosed: false,
			}
		},
		onLoad() {
			util.loading('loading...')
			this.loadData()
		},
		onShareAppMessage: function() {
			uni.showShareMenu({
				withShareTicket: true
			})
		},
		onShow() {
			if (this.categoryBooks.length == 0) {
				this.loadData()
			}
		},
		onPageScroll(options) {
			if (config.debug) console.log("onPageScroll", options)
			if (options.scrollTop > 110) {
				if (this.showHeaderSearch == false) this.showHeaderSearch = true
			} else {
				if (this.showHeaderSearch == true) this.showHeaderSearch = false
			}
		},
		onResize(e) {
			let that = this
			let info = uni.getSystemInfoSync()
			let oriInfo = util.getSysInfo()
			let newInfo = {...oriInfo, ...info}
			util.setSysInfo(newInfo)
			// 重新计算横幅的宽高
			let bannerWidth = parseFloat(that.bannerWidth.split("px")[0])*((e.size.windowWidth-30)/ e.size.windowHeight)
			that.bannerWidth = bannerWidth + 'px'
			that.bannerHeight = (bannerWidth / that.bannerRatio) + 'px'
		},
		methods: {
			adLoad() {
				this.adLoaded = true
			},
			adClose() {
				this.adClosed = true
			},
			loadData() {
				let that = this
				let cids = []
				let categories = []
				let bookLists = []
				api.getCategories().then(function(res) {
					if (res.length > 0) {
						categories = res.filter(function(category) {
							let b = category.id != '' && category.name != ''
							if (b) cids.push(category.id)
							return b
						})
					}
					if (config.debug) console.log(res, categories, cids)
				}).catch(function(e) {
					console.log("api.getCategories()", e)
				}).finally(function() {
					let banners = []
					let recommendBooks = []
					Promise.all([util.request(config.api.banners), util.request(config.api.bookLists, {
						page: 1,
						size: 10,
						sort: 'latest-recommend'
					}, 'POST'), util.request(config.api.bookListsByCids, {
						page: 1,
						size: 5,
						cids: cids
					}, 'POST')]).then(function([resBanners, resRecommendBooks, resBookLists]) {
						if (config.debug) console.log(cids, resBanners, resRecommendBooks, resBookLists)
						if (resBanners.data && resBanners.data.banners) {
							banners = resBanners.data.banners
							// 计算横幅合适的宽高
							// 转成 upx，因为两边边距设置为 30upx
							let bannerRatio = resBanners.data.size || 2.619
							let info = util.getSysInfo()
							let width = info.windowWidth * info.pixelRatio - 30
							let height = width / bannerRatio
							that.platform = info.platform || ''
							that.platform = that.platform.toLowerCase()
							that.bannerWidth = width / info.pixelRatio + "px"
							that.bannerHeight = height / info.pixelRatio + "px"
							that.bannerRatio = bannerRatio
						}
						if (resRecommendBooks.data) recommendBooks =
							resRecommendBooks.data
						if (resBookLists.data) {
							bookLists = resBookLists.data
							categories = categories.map(function(category) {
								let book = bookLists[category.id].books
								if (book != undefined && book.length > 0) {
									category.books = book
								} else {
									category.books = []
								}
								return category
							})
						}
					}).catch(function(e) {
						console.log(e)
						util.toastError(e.data.message || e.errMsg)
					})
					.finally(function() {
						uni.hideLoading()
						if (that.times > 0 && bookLists.length == 0) {
							if (config.debug) console.log("reload")
							let iload = setTimeout(function() {
								clearTimeout(iload)
								that.times = that.times - 1
								that.loadData()
							}, 3000)
						} else {
							that.times = 0
						}
						that.banners = banners
						that.categoryBooks = categories
						that.recommendBooks = recommendBooks
						that.showSearch = true
						that.showAd = that.bannerAdUnitId != ''
					})
				})
			},
			bannerClick(e) {
				if (config.debug) console.log("banner click", e)
				let url = e.target.dataset.url
				if (!url) return

				// #ifdef MP
				uni.navigateTo({
					url
				})
				// #endif

				// APP or H5
				// #ifndef MP
				if (String(url).indexOf("http://") > -1 || String(url).indexOf("https://") > -1) {
					plus.runtime.openURL(url) // 调用外部浏览器打开
					// plus.runtime.openWeb(url) // app 内打开
				} else {
					uni.navigateTo({
						url
					})
				}
				// #endif
			}
		}

	}
</script>

<style>
/* 页面整体背景色调整为渐变色 */
.root.fairy-tale-theme {
	background: linear-gradient(to bottom, #fce8f3, #fff5d1);
	color: #4a4a4a;
	font-family: "Comic Sans MS", cursive, sans-serif; /* 使用手写风格字体 */
}

/* 横幅轮播样式 */
.swiper-container {
	border-radius: 12px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.banner-item {
	position: relative;
}

.banner-image {
	border-radius: 8px;
	animation: fadeIn 1s ease-in-out;
}

/* 推荐图书标题装饰 */
.panel-heading {
	position: relative;
	background: url('/static/images/header-stars.png') no-repeat left center;
	background-size: contain;
	padding: 10px 15px;
}

/* 分类面板装饰 */
.fairy-panel {
	background: url('/static/images/panel-background.png') repeat;
	border-radius: 10px;
	padding: 15px;
	box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

/* 卡通化按钮链接 */
.color-link {
	color: #ff7b9c;
	font-weight: bold;
	text-decoration: underline;
}

/* 轻微动画 */
@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

/* IOS平台标志 */
.ios-platform {
	color: transparent;
	height: 1upx;
	overflow: hidden;
}

/* 最近阅读样式 */
.history-link {
	display: inline-block;
	margin-left: 30px;
	background: #ffdeeb;
	padding: 5px 10px;
	border-radius: 5px;
	font-size: 14px;
	color: #4a4a4a;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>

