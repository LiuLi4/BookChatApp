<template>
	<view>
		<iheader title="书架" :showIcon="false" :showBorder='true' :showSearch="true"></iheader>
		<block v-if="books.length>0 && token!=''">
			<view class="fix">
				<block v-if="showLongpressTips">
					<view class="row mgt-15">
						<!-- 35px -->
						<view class="col-12 font-lv4 color-grey longpress-tips">
							<text>分类可左右滑动；长按可操作书架收藏的书籍</text>
							<text @click="closeLongpressTips" class="close-longpress-tips color-info">X</text>
						</view>
					</view>
				</block>
				<view class="row">
					<!-- 45px -->
					<view class="col-12 font-lv3 color-semi tabs">
						<scroll-view @scroll="scroll" scroll-with-animation :scroll-left="scrollLeft" class="hor" scroll-x>
							<view @click="changeCate" :data-cid="cate.id" :class="['scroll-item', cate.id == cid ? 'active': '']" v-for="(cate,idx) in categories"
							 :key="idx">{{cate.title}}</view>
						</scroll-view>
					</view>
				</view>
			</view>
			<view style="height: 45px;">&nbsp;</view>
			<view v-if="showLongpressTips" style="height: 35px;">&nbsp;</view>
		</block>
		<view class='row box'>
			<view v-if="showTips && books.length ==0 " class='tips col-12 font-lv2'>
				<view v-if="token">
					<view>黑夜给了你一双黑色的眼睛</view>
					<view>你用它去寻找光明...</view>
					<view>我们给了你一个华丽的书架</view>
					<view>你却没有一本书籍...</view>
					<view class='action'>
						<search target="/pages/search/search" />
					</view>
				</view>
				<view v-if="!token">
					<view>黑夜给了你一双黑色的眼睛</view>
					<view>你用它去寻找光明...</view>
					<view>我们给了你一个华丽的书架</view>
					<view>你却没登录...</view>
					<view class='action'>
						<button @click='login'>登录</button>
					</view>
				</view>
			</view>

			<block v-if="books.length>0 && token!=''">
				<view v-for="(book, index) in books" :key="index" class='col-4'>
					<navigator @longpress="longpress" :data-book="book.book_name" :data-id="book.book_id" :url='"/pages/read/read?identify="+book.book_id'
					 class='book text-muted'>
						<image class='box-shadow cover' :lazy-load="true" :src='book.cover'></image>
						<view class='font-lv3  ellipsis-2row'>{{book.book_name}}</view>
					</navigator>
				</view>
			</block>
		</view>
		<loading :loading="page>0 && books.length>0" />
	</view>
</template>

<script>
	import config from '../../config.js'
	import util from '../../utils/util.js'
	import api from '../../utils/api.js'

	import loading from '../../components/loading.vue'
	import search from '../../components/search.vue'
	import iheader from '../../components/header.vue'

	export default {
		data() {
			return {
				page: 1,
				size: 24,
				books: [],
				showTips: false,
				categories: [],
				wd: '',
				token: '',
				cid: 0,
				scrollLeft: 0,
				scrollByUser: 0,
				fixHeight: "height: 70px",
				showLongpressTips: false, // 是否显示长按可移除书架收藏书籍的提示
			}
		},
		components: {
			search,
			loading,
			iheader,
		},
		onLoad() {
			let token = util.getToken() || ''
			if (token) util.loading("loading...")
			setTimeout(function(){
				uni.hideLoading()
			},2000)
		},
		onShow: function() {
			this.showLongpressTips = uni.getStorageSync("showLongpressTips") != "false"
			let sysInfo = util.getSysInfo()
			if (config.debug) console.log("onShow", "bookshelfChanged", sysInfo.bookshelfChanged)
			this.loadBooks(sysInfo.bookshelfChanged)
			sysInfo.bookshelfChanged = false
			util.setSysInfo(sysInfo)
			if (parseInt(this.scrollByUser) != parseInt(this.scrollLeft)) {
				let scollLeft = this.scrollLeft - 1
				this.scrollLeft = scollLeft
				this.scrollByUser = scollLeft
			}
		},
		onReachBottom: function() {
			this.loadBooks()
		},
		methods: {
			changeCate: function(e) {
				this.cid = e.currentTarget.dataset.cid
				let scrollLeft = e.currentTarget.offsetLeft - (util.getSysInfo().screenWidth / 2 - 50)
				this.scrollLeft = scrollLeft
				this.scrollByUser = scrollLeft
				this.loadBooks(true)
			},
			scroll: function(e) {
				if (config.debug) console.log(e)
				this.scrollByUser = e.detail.scrollLeft
			},
			longpress: function(e) {
				if (config.debug) console.log("longpress", e)
				let that = this
				let bookName = e.currentTarget.dataset.book
				let bookId = e.currentTarget.dataset.id
				uni.showActionSheet({
					itemList: ['阅读书籍', '查看目录', '从书架移除', '查看书籍信息'],
					success: function(res) {
						switch (res.tapIndex) {
							case 0: // 阅读书籍
								uni.navigateTo({
									url: '/pages/read/read?identify=' + bookId
								})
								break;
							case 1: // 查看目录
								uni.navigateTo({
									url: '/pages/menu/menu?identify=' + bookId
								})
								break;
							case 2: // 从书架移除
								let books = that.books
								uni.showModal({
									title: "温馨提示",
									content: `您是否要将书籍《${bookName}》从书架中移除？`,
									success: (action) => {
										if (action.confirm) {
											if (config.debug) console.log("确定移除")
											util.request(config.api.bookStar, {
												identify: bookId
											}).then(function(res) {
												if (config.debug) console.log(config.api.bookStar, res)
												uni.showToast({
													title: res.data.data && res.data.data.is_cancel ? '移除收藏成功' : '收藏书籍成功',
												})
												// 去除被移除了的书籍
												books = books.filter(function(book) {
													return book.book_id != bookId
												})
												if (books.length > 0) {
													that.books = books
												} else {
													that.cid = 0
													that.scrollLeft = 0
													that.scrollByUser = 0
													that.loadBooks(true)
												}
											}).catch(function(e) {
												if (config.debug) console.log(e)
												util.toastError(e.data.message || e.errMsg)
											})
										}
									}
								})
								break;
							case 3: // 查看书籍信息
								uni.navigateTo({
									url: '/pages/intro/intro?id=' + bookId
								})
								break;

						}
					},
					fail: function(res) {
						console.log(res.errMsg);
					}
				})


			},
			closeLongpressTips: function() {
				this.showLongpressTips = false
				uni.setStorageSync("showLongpressTips", "false")
			},
			loadBooks: function(isClearAll) {

				let that = this
				let token = util.getToken() || ''

				if (config.debug) console.log("token", token)

				if (token == '') {
					that.showTips = true
					that.books = []
					that.token = token
					that.page = 1
					return
				}

				if (that.page == 0 && !isClearAll) return;

				let page = isClearAll ? 1 : that.page
				let size = that.size
				let books = that.books
				let showTips = false

				util.request(config.api.bookshelf, {
					page: page,
					size: size,
					'with-cate': 1,
					cid: that.cid,
				}).then((res) => {
					if (config.debug) console.log(config.api.bookshelf, res)
					if (res.data) {
						if (res.data.books) {
							res.data.books.length >= size ? page++ : page = 0
							books = isClearAll ? res.data.books : that.books.concat(res.data.books)
						} else {
							if (page == 1) books = []
							page = 0
						}
						if (res.data.categories) {
							let categories = [{
								id: 0,
								pid: 0,
								title: '全部'
							}].concat(res.data.categories)
							that.categories = categories.filter(item => {
								if (item.pid > 0 || item.id == 0) return true
							})
						} else {
							that.categories = []
						}
					} else {
						if (page == 1) {
							books = []
							showTips = true
						}
						page = 0
					}

				}).catch(function(e) {
					if (config.debug) console.log("error", e)
					util.toastError(e.data.message || e.errMsg)
				}).finally(function() {
					uni.hideLoading()
					if (that.cid > 0 && books.length == 0) {
						that.cid = 0
						that.scrollLeft = 0
						that.scrollByUser = 0
						that.loadBooks(true)
						return
					}
					that.books = books
					that.showTips = books.length == 0
					that.page = page
					that.token = token
					if (isClearAll) uni.pageScrollTo({
						scrollTop: 0,
					})
				})
			},
			login: function(e) {
				uni.navigateTo({
					url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/bookshelf/bookshelf')
				})
			},
		}
	}
</script>

<style>
	.box {
		padding: 8px;
	}

	.fix {
		position: fixed;
		width: 100%;
		padding: 0 15px;
		box-sizing: border-box;
		border-bottom: 1upx solid #F1F1F1;
		background-color: #FFFFFF;
		z-index: 999;
	}

	.hor {
		display: flex;
		flex-direction: row;
		box-sizing: border-box;
		/* 这行CSS样式很重要，不然里面的元素会出现换行，没法实现水平滚动 */
		white-space: nowrap;
	}

	.scroll-item {
		max-width: 130px;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
		display: inline;
		padding: 0 12px;
		height: 45px;
		line-height: 45px;
	}

	.tabs .active {
		color: red;
	}

	.tips {
		width: 100%;
		box-sizing: border-box;
		padding: 60px 8px 0;
		text-align: center;
		color: #888;
		line-height: 200%;
	}

	.tips .action {
		margin-top: 30px;
	}

	.book {
		width: 103px;
		max-width: 100%;
		display: block;
		margin: 15px auto;
	}

	.book image {
		width: 103px;
		height: 136px;
		max-width: 100%;
		margin-bottom: 8px;
	}

	.longpress-tips {
		border: 1upx dashed #FF6600;
		border-radius: 2px;
		box-sizing: border-box;
		padding: 0 10px;
		line-height: 35px;
		border-radius: 3px;
	}

	.longpress-tips .close-longpress-tips {
		float: right;
	}

	@media (min-width: 768px) {
		.ellipsis-2row {
			line-height: 1.8;
		}

		.col-4 {
			flex: 0 0 25%;
			max-width: 25%;
		}

		.book {
			width: 154.5px;
			display: block;
			margin: 30upx auto;
		}

		.book image {
			width: 154.5px;
			height: 203.7px;
			margin-bottom: 8upx;
		}
	}
	@media (min-width: 1000px) {
		.col-4 {
			flex: 0 0 20%;
			max-width: 20%;
		}
	}
</style>
