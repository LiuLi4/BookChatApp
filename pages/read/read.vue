<template>
	<view class="page">
		<iheader :title="book.name"></iheader>
		<view @click='pageClick' :class='"bg-theme"+setting.themeIndex'
			:style='"min-height:"+(sys.screenHeight - sys.statusBarHeight - 55)+"px"'>
			<view :class='"markdown-body editormd-preview-container bg-theme"+setting.themeIndex'
				:style='"line-height:1.8;font-size:"+fontIndexs[setting.fontIndex]'>
				<view class='title font-lv1 text-center'>{{article.title}}</view>
				<!-- <books :booklist="list" v-show="loadingtype === ''"></books> -->
				<books :booklist="list"></books>
				<block v-for="(node, idx) of nodes" :key='idx'>
					<block v-if="node.type == 'img'">
						<image @click="imgPreview" :src="node['src']" :data-src="node['src']" mode="aspectFit"></image>
					</block>
					<block v-else-if="node.type == 'audio'">
						<!-- #ifdef MP-WEIXIN -->
						<imt-audio :src="node['src']" :title="node['text']"></imt-audio>
						<!-- #endif -->
						<!-- #ifndef MP-WEIXIN -->
						<audio :src="node['src']" :poster="node['poster']" :name="node['text']" controls></audio>
						<!-- #endif -->
					</block>
					<block v-else-if="node.type == 'video'">
						<video :src="node['src']" :poster="node['poster']" :name="node['text']" controls></video>
					</block>
					<block v-else-if="node.type == 'iframe'">
						<web-view :src="node['src']"></web-view>
					</block>
					<block v-else-if="node.type == 'richtext'">
						<rich-text :nodes="node.data"></rich-text>
					</block>
				</block>
			</view>
		</view>

		<view :class='"drawer drawer-left " + [showMenu ? "show":""]'>
			<view class='drawer-content' :style="'padding-bottom: 70px;'+menuStyle">
				<imenu :book="book" :currentDocId="article.id" :wd="wd" :menu="menuTree" :result="result" :tips="tips"
					@search="search" @clear="clear" @itemClick="itemClick" />
			</view>
		</view>

		<view :class='"drawer drawer-right "+[showMore ? "show":""]'>
			<view class='drawer-content'>
				<view class='more-setting' style='bottom: 70px'>
					<block v-if="!h5">
						<view class='row setting-tips'>
							<text class='color-grey font-lv4'>屏幕亮度</text>
						</view>
						<view class='row setting-screen setting-item '>
							<slider min='0' max='1' step='0.1' block-size='18' @change="setBrightnessScreen"
								:value='screenBrightness' show-value></slider>
						</view>
					</block>

					<view class='row setting-tips'>
						<text class='color-grey font-lv4'>字体大小</text>
					</view>
					<view class='row setting-font setting-item'>
						<view class='col' @click='setFont' data-action="minus">
							<image src='/static/images/font-minus.png'></image>
						</view>
						<view class='col'>{{setting.fontIndex + 1}}</view>
						<view class='col' @click='setFont' data-action="plus">
							<image src='/static/images/font-plus.png'></image>
						</view>
					</view>
					<view class='row setting-tips'>
						<text class='color-grey font-lv4'>阅读背景</text>
					</view>
					<view class='row setting-bg setting-item'>
						<view class='col bg-theme0' @click='setTheme' data-theme="0">
							<image v-if="setting.themeIndex == 0" src='/static/images/checked.png'></image>
						</view>
						<view class='col bg-theme1' @click='setTheme' data-theme="1">
							<image v-if="setting.themeIndex == 1" src='/static/images/checked.png'></image>
						</view>
						<view class='col  bg-theme2' @click='setTheme' data-theme="2">
							<image v-if="setting.themeIndex == 2" src='/static/images/checked.png'></image>
						</view>
						<view class='col  bg-theme3' @click='setTheme' data-theme="3">
							<image v-if="setting.themeIndex == 3" src='/static/images/checked.png'></image>
						</view>
						<view class='col  bg-theme4' @click='setTheme' data-theme="4">
							<image v-if="setting.themeIndex == 4" src='/static/images/checked.png'></image>
						</view>
					</view>

					<view class='row setting-btn setting-item color-grey font-lv3'>
						<view class='col' @click='resetSetting'>
							<text>恢复默认值</text>
						</view>
						<navigator :url='"/pages/bookmarks/bookmarks?identify="+book.book_id' class='col'>
							<text>查看书签</text>
						</navigator>
					</view>
				</view>
			</view>
		</view>
		<view class="footer">
			<view class='row font-lv3'>
				<view v-if="article.bookmark" class='col' @click='clickBookmark' data-action="cancel">
					<image src='../../static/images/bookmark-added.png'></image>
				</view>
				<view v-else class='col' @click='clickBookmark' data-action="add">
					<image src='../../static/images/bookmark-add.png'></image>
				</view>
				<view class='col' v-if="preDisable">
					<image src='../../static/images/pre-disable.png'></image>
				</view>
				<view class='col' v-else @click='clickPrev'>
					<image src='../../static/images/pre.png'></image>
				</view>
				<view class='col' @click='clickMenu'>
					<image src='../../static/images/menu.png'></image>
				</view>
				<view class='col' v-if="nextDisable">
					<image src='../../static/images/next-disable.png'></image>
				</view>
				<view class='col' v-else @click='clickNext'>
					<image src='../../static/images/next.png'></image>
				</view>
				<view class='col' @click='clickMore'>
					<image src='../../static/images/more.png'></image>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import util from '../../utils/util.js'
	import api from '../../utils/api.js'
	import config from '../../config.js'

	import imenu from '../../components/menu.vue'
	import iheader from '../../components/header.vue'
	import imtAudio from '../../components/imt-audio.vue'
	import books from '../../components/books/books.vue'

	export default {
		components: {
			imenu,
			iheader,
			imtAudio,
			books
		},
		data() {
			return {
				list: [],
				book: {},
				book_id: {},
				article: {},
				menuSortIds: [],
				nodes: [],
				menuTree: [],
				menuIndex: 0,
				bookmark: [], //书签
				showMenu: false,
				showMore: false,
				preDisable: false,
				nextDisable: false,
				identify: '',
				menuStyle: '',
				wd: '', //搜索关键字
				audios: [],
				setting: {
					themeIndex: 0,
					fontIndex: 0,
				},
				defautScreenBrightness: 0,
				screenBrightness: 0,
				fontIndexs: util.getSysInfo().windowWidth >= 768 ? ['15px', '16px', '17px', '18px', '19px', '20px',
					'21px'
				] : [
					'14px', '15px', '16px', '17px', '18px', '19px', '20px'
				],
				tips: '',
				result: [],
				h5: false,
				sys: util.getSysInfo(),
			}
		},
		onLoad: function(options) {
			this.init()
			// 步骤：
			// 1. 先获取书籍目录
			// 2. 如果没传文档标识参数，则用目录的首个章节作为默认获取的文章
			let that = this;
			let identify = options.identify || 'help'
			let arr = String(identify).split("/")
			let book = {}
			let menu = []

			// #ifdef H5
			that.h5 = true
			// #endif


			if (options.identify) {
				uni.redirectTo({
					url: '/pages/notfound/notfound',
				})
				return
			}

			that.initReaderSetting()
			let latestReadId = 0
			Promise.all([
				util.request(config.api.bookInfo, {
					book_id: options.id
				}, 'POST')
			]).then(function([resBook]) {
				if (config.debug) console.log(resBook)
				if (resBook.data) {
					book = resBook.data
					console.log(book)
					// book.score_float = Number(book.score / 10).toFixed(1)
					// book.is_read = 1
					// book.percent = Number(book.cnt_readed / book.cnt_doc * 100).toFixed(2)
				}
			}).catch(function(e) {
				console.log(e)
			}).finally(function() {
				// if (menu.length == 0) {
				// 	uni.redirectTo({
				// 		url: '/pages/notfound/notfound',
				// 	})
				// 	return
				// }

				let menuTree = util.menuToTree(menu)
				let sysInfo = util.getSysInfo()
				let paddingTop = sysInfo.titleBarHeight + sysInfo.statusBarHeight
				that.menuStyle = `padding-top: ${paddingTop}px;`
				that.menuSortIds = util.menuSortIds(menuTree)
				that.menuTree = menuTree
				that.book = book
				// if (arr.length != 2) {
				// 	if (latestReadId > 0) {
				// 		identify = book.book_id + "/" + latestReadId
				// 	} else {
				// 		identify = book.book_id + "/" + menuTree[0].id
				// 	}
				// }

				if (config.debug) console.log("sys info", util.getSysInfo())

				that.getArticle(identify)
			})
		},
		onUnload() {
			uni.hideLoading()
		},
		onShareAppMessage: function() {
			uni.showShareMenu({
				withShareTicket: true
			})
		},
		methods: {
			getBaseSrc(imageUrl) {
				return new Promise((resolve, reject) => {
					try {
						// 创建一个 Image 对象
						const img = {};
						img.crossOrigin = 'Anonymous'; // 允许跨域加载图片
						img.src = imageUrl;

						// 图片加载完成后执行
						img.onload = () => {
							try {
								// 创建一个 Canvas 元素
								const canvas = document.createElement('canvas');
								const context = canvas.getContext('2d');

								// 设置 Canvas 的宽度和高度与图片一致
								canvas.width = img.width;
								canvas.height = img.height;

								// 将图片绘制到 Canvas 上
								context.drawImage(img, 0, 0, img.width, img.height);

								// 将 Canvas 的内容转为 Base64
								const base64Data = canvas.toDataURL('image/jpeg');

								// 返回原始 URL 和 Base64 数据
								resolve({
									image_url: imageUrl,
									basesrc: base64Data
								});
							} catch (error) {
								reject(error); // 捕获绘制或转换错误
							}
						};

						// 图片加载错误时执行
						img.onerror = (error) => {
							reject(error); // 捕获加载错误
						};
					} catch (error) {
						reject(error); // 捕获其他潜在错误
					}
				});
			},
			getBook_init(data) {
				this.listTotal = data
				let books = []
				data.forEach(item => {
					books.push(...item.content_list)
				})
				let that = this
				let arr = []
				books.forEach(item => {
					that.getBaseSrc(item.image_url).then(data => {
						const {
							image_url,
							basesrc
						} = data
						arr.push({
							image_url,
							basesrc
						})
					})
					return item
				})

				let timer = () => {
					setTimeout(() => {
						if (arr.length !== books.length) {
							timer()
						} else {
							// this.$xw.Toast('温馨提示：未加载出来请退出重试下哦')
							this.list = books.map(item => {
								arr.forEach(ar => {
									if (ar.image_url === item.image_url) {
										item.image_url = ar.basesrc
									}
								})
								return item
							})
							console.log('计算完毕')
							this.loadingend = true
							setTimeout(() => {
								this.showplay = true
								this.loadingtype = ''
								// 打开自动播放
								this.$store.state.book.auto = true
							}, 1000)
						}
					}, 100)
				}
				timer()
			},
			init() {
				// 保持亮屏
				uni.setKeepScreenOn({
					keepScreenOn: true
				})
				this.clear()
				// ajax返回数据
				this.loadingtype = 'book'
				let data = [{
					content_list: [{
							image_url: 'https://ysys-assets.oss-cn-beijing.aliyuncs.com/public/17223344579147616172233445791481615_1.jpg',
							voice_url: 'https://ysys-assets.oss-cn-beijing.aliyuncs.com/public/17223347561254e8e17223347561263856_sample-3s.mp3'
						},
						{
							image_url: 'https://ysys-assets.oss-cn-beijing.aliyuncs.com/public/17223346407579889172233464075786259_7.jpg',
							voice_url: 'https://ysys-assets.oss-cn-beijing.aliyuncs.com/public/172233479775248d917223347977528717_sample-15s.mp3'
						},
						{
							image_url: 'https://ysys-assets.oss-cn-beijing.aliyuncs.com/public/17223345236471907172233452364819194_3.jpeg',
							voice_url: 'https://ysys-assets.oss-cn-beijing.aliyuncs.com/public/17223347561254e8e17223347561263856_sample-3s.mp3'
						},
						{
							image_url: 'https://ysys-assets.oss-cn-beijing.aliyuncs.com/public/17223345534553e29172233455345554395_4.jpeg',
							voice_url: 'https://ysys-assets.oss-cn-beijing.aliyuncs.com/public/172233479775248d917223347977528717_sample-15s.mp3'
						},
						{
							image_url: 'https://ysys-assets.oss-cn-beijing.aliyuncs.com/public/17223345819354ab2172233458193526264_5.jpeg',
							voice_url: 'https://ysys-assets.oss-cn-beijing.aliyuncs.com/public/17223347561254e8e17223347561263856_sample-3s.mp3'
						},
						{
							image_url: 'https://ysys-assets.oss-cn-beijing.aliyuncs.com/public/17223346238908522172233462389072678_6.jpeg',
							voice_url: 'https://ysys-assets.oss-cn-beijing.aliyuncs.com/public/172233479775248d917223347977528717_sample-15s.mp3'
						},
						{
							image_url: 'https://ysys-assets.oss-cn-beijing.aliyuncs.com/public/17223346407579889172233464075786259_7.jpg',
							voice_url: 'https://ysys-assets.oss-cn-beijing.aliyuncs.com/public/172233479775248d917223347977528717_sample-15s.mp3'
						}
					],
					create_time: 1606550952,
					describe: 'C版5-6岁体验课第4节',
					picture_book_id: 'F436q2EXGc',
					state: 1,
					title: '吨吨号上丢失的货箱',
					update_time: 1608198299
				}]
				this.getBook_init(data)
			},
			getArticle: function(identify) {
				util.loading("loading...")
				let article = {}
				let that = this
				let params = {
					identify: identify,
					// 'from-app': true,
					'enhance-richtext': true,
				}

				util.request(config.api.read, params).then(function(res) {
					if (res.data && res.data.article) {
						article = res.data.article
					}
				}).catch(function(e) {
					let message = e.data.message || e.errMsg
					util.toastError(message)
				}).finally(function() {
					let nextDisable = that.menuSortIds.indexOf(article.id) + 1 == that.menuSortIds.length
					let preDisable = that.menuSortIds.indexOf(article.id) == 0
					if (!article.content) article.content = []
					that.nodes = []
					that.article = article
					that.identify = identify
					that.showMenu = false
					that.showMore = false
					that.nextDisable = nextDisable
					that.preDisable = preDisable
					that.menuTree = util.menuTreeReaded(that.menuTree, article.id)

					setTimeout(function() {
						that.nodes = article.content.filter((node, idx) => {
							if (node.type == "img" || node.type == "iframe") {
								try {
									node["src"] = node.data[0].attrs['src']
								} catch (e) {
									console.log(e)
									return false
								}
							} else if (node.type == "audio" || node.type == "video") {
								try {
									node["src"] = node.data[0].attrs['src']
									node["poster"] = node.data[0].attrs['poster']
									node["text"] = node.data[0].children[0]['text']
									node["id"] = "id" + idx
								} catch (e) {
									console.log(e)
									return false
								}
							}
							return true
						})
						uni.pageScrollTo({
							scrollTop: 0,
							duration: 100
						});
						uni.hideLoading()
					}, 10)
				})
			},
			pageClick: function(e) {
				if (config.debug) console.log('contentClick', e)
				this.showMenu = false
				this.showMore = false
			},
			clickMenu: function(e) {
				this.showMenu = !this.showMenu
				this.showMore = false
			},
			clickMore: function(e) {
				this.showMore = !this.showMore
				this.showMenu = false
			},
			imgPreview: function(e) {
				if (config.debug) console.log("imgPreview", e)
				uni.previewImage({
					urls: [e.currentTarget.dataset.src]
				})
			},
			clickNext: function() {
				let that = this
				let idx = that.menuSortIds.indexOf(that.article.id)
				idx++
				that.nextDisable = true
				if (idx < that.menuSortIds.length) {
					that.getArticle(that.book.book_id + "/" + that.menuSortIds[idx])
				} else {
					uni.showToast({
						title: '没有下一章节了',
						mask: true,
						image: '/static/images/error.png'
					})
				}
			},
			clickPrev: function() {
				let that = this
				let idx = that.menuSortIds.indexOf(that.article.id)
				that.preDisable = true
				idx--
				if (idx > -1) {
					that.getArticle(that.book.book_id + "/" + that.menuSortIds[idx])
				} else {
					uni.showToast({
						title: '没有上一章节了',
						mask: true,
						image: '/static/images/error.png'
					})
				}
			},
			itemClick: function(e) {
				this.getArticle(e.identify)
			},
			search: function(e) {
				if (config.debug) console.log("search", e)

				let that = this
				let result = []

				util.loading("玩命搜索中...")
				util.request(config.api.searchDoc, {
					identify: that.book.book_id,
					wd: e.wd
				}).then(function(res) {
					if (config.debug) console.log(config.api.searchDoc, res)
					if (res.data && res.data.result) {
						result = res.data.result
					}
				}).catch(function(e) {
					console.log(e)
				}).finally(function() {
					uni.hideLoading()
					that.result = result
					that.wd = e.wd
					if (result.length == 0) {
						util.toastError("没有搜索到结果")
					}
				})
			},
			clear: function(e) {
				this.result = []
			},
			clickBookmark: function(e) {
				let that = this

				if (util.getToken() == '') {
					uni.showModal({
						title: '温馨提示',
						content: '您当前未登录，无法添加书签，是否要跳转登录？',
						success: function(res) {
							if (res.confirm) {
								uni.navigateTo({
									url: '/pages/login/login?redirect=' + encodeURIComponent(
										'/pages/read/read?identify=' + that.book.book_id +
										'/' + that.article.id),
								})
							}
						}
					})
				} else {
					if (e.currentTarget.dataset.action == "cancel") {
						uni.showModal({
							title: '温馨提示',
							content: '您确定要取消该书签吗？',
							success: function(res) {
								if (res.confirm) {
									that._clickBookmark('cancel')
								}
							}
						})
					} else {
						that._clickBookmark('add')
					}
				}
			},
			renderContent: function(nodes) {
				let that = this
				let t = setTimeout(function() {
					that.nodes = nodes
					clearTimeout(t)
				}, 300) // 让用户视觉上认为有个渲染过程，避免内容渲染过快，避免页面从空白到出现内容的过程中有些突兀
			},
			setFont: function(e) {
				// 0 ~ 6
				if (config.debug) console.log(e)
				let that = this
				let setting = that.setting
				if (e.currentTarget.dataset.action == 'minus') {
					if (setting.fontIndex > 0) setting.fontIndex = setting.fontIndex - 1
				} else {
					if (setting.fontIndex < 6) setting.fontIndex = setting.fontIndex + 1
				}
				that.setting = setting
				util.setReaderSetting(Object(setting))
			},
			setTheme: function(e) {
				if (config.debug) console.log(e)
				// 0 ~ 4
				let that = this
				let setting = that.setting
				if (e.currentTarget.dataset.theme >= 0 && e.currentTarget.dataset.theme < 5) {
					setting.themeIndex = e.currentTarget.dataset.theme
				} else {
					setting.themeIndex = 0
				}
				that.setting = setting
				util.setReaderSetting(Object(setting))
			},
			setBrightnessScreen: function(e) {
				if (config.debug) console.log(e)
				let screenBrightness = parseFloat(e.detail.value).toFixed(1)
				this.screenBrightness = screenBrightness
				uni.setScreenBrightness({
					value: screenBrightness,
				})
			},
			initReaderSetting: function() {
				let setting = util.getReaderSetting()
				let screenBrightness = 0

				// #ifndef H5
				uni.getScreenBrightness({
					success: function(res) {
						screenBrightness = res.value
					}
				})
				// #endif

				this.setting = setting
				this.defautScreenBrightness = screenBrightness
				this.screenBrightness = screenBrightness
			},
			resetSetting: function() {
				let setting = {
					fontIndex: 0,
					themeIndex: 0,
				}
				this.setting = setting
				this.screenBrightness = this.defautScreenBrightness
				uni.setScreenBrightness({
					value: this.defautScreenBrightness
				})
				util.setReaderSetting(setting)
			},
			_clickBookmark: function(action) {
				let that = this
				let article = this.article
				let method = action == "cancel" ? 'DELETE' : 'PUT'

				util.request(config.api.bookmark + "?doc_id=" + article.id, {}, method).then(function(res) {
					if (config.debug) console.log(config.api.bookmark + "?doc_id=" + article.id, res)
					article.bookmark = !article.bookmark
					that.article = article
					uni.showToast({
						title: action == "cancel" ? '移除书签成功' : '添加书签成功'
					})
				}).catch(function(e) {
					util.toastError(e.data.message || e.errMsg)
				})
			}
		}
	}
</script>

<style>
	@import url("../../static/css/markdown.css");

	.page,
	page {
		min-height: 100%;
	}

	.title {
		line-height: 1.6;
		border-bottom: 1px solid #efefef;
		padding: 0 0 15px;
		margin-bottom: 15px;
	}

	.markdown-body {
		transition: all 0.5s;
		padding: 15px 15px 60px;
		box-sizing: border-box;
	}

	/* footer */

	.footer {
		/* box-shadow: 0 0 5px #efefef; */
		border-top: 1px solid rgb(213, 213, 213);
		position: fixed;
		height: 48px;
		line-height: 48px;
		bottom: 0;
		left: 0;
		width: 100%;
		text-align: center;
		z-index: 100;
		box-sizing: border-box;
		background-color: #fff;
		transition: all 0.5s;
	}

	.footer.hide {
		bottom: -60px;
	}

	.footer image {
		margin-top: 11px;
		width: 25px;
		height: 25px;
	}

	/* 抽屉 */

	.drawer {
		width: 80%;
		position: fixed;
		z-index: 99;
		height: 100%;
		overflow-y: scroll;
		top: 0;
		transition: all 0.5s;
		-webkit-overflow-scrolling: touch;
		background-color: #fff;
	}

	.drawer .drawer-content {
		width: 100%;
		box-sizing: border-box;
		padding-bottom: 60px;
	}

	.drawer-left {
		right: 100%;
		border-right: 1upx solid #efefef;
	}

	.drawer-right {
		left: 100%;
		border-left: 1upx solid #efefef;
	}

	.drawer-left.show {
		right: 20%;
		border-right: 1px solid #efefef;
	}

	.drawer-right.show {
		left: 20%;
		border-left: 1px solid #efefef;
	}

	.more-setting {
		position: absolute;
		width: 100%;
	}

	.setting-tips {
		padding: 8px 8px;
	}

	.setting-item {
		text-align: center;
		font-size: 16px;
		line-height: 16px;
		border: 1upx solid #efefef;
		border-left: 0;
		border-right: 0;
		margin-bottom: 22px;
	}

	.more-setting .col {
		padding: 15px 0;
	}

	.setting-btn {
		margin-bottom: 0;
		background-color: transparent;
	}

	.setting-btn navigator {
		border-left: 1upx solid #efefef;
	}

	.more-setting .col:nth-of-type(2) {
		border-right: 1upx solid #efefef;
		border-left: 1upx solid #efefef;
	}

	.more-setting .setting-bg .col:nth-of-type(2) {
		border: 0;
	}

	.more-setting image {
		width: 16px;
		height: 16px;
	}

	slider {
		width: 100%;
	}

	.bg-theme0 {
		height: 16px;
		background-color: #fff !important;
	}

	.bg-theme1 {
		background-color: rgb(232, 232, 232) !important;
	}

	.bg-theme2 {
		background-color: rgb(223, 214, 198) !important;
	}

	.bg-theme3 {
		background-color: rgb(208, 189, 138) !important;
	}

	.bg-theme4 {
		background-color: rgb(207, 231, 207) !important;
	}

	.cont-box {
		overflow-y: scroll;
	}

	@media (min-width:768px) {
		.drawer {
			width: 65%;
		}

		.drawer-left.show {
			right: 35%;
		}

		.drawer-right.show {
			left: 35%;
		}
	}

	.markdown-body image {
		max-width: 100% !important;
	}

	.markdown-body audio,
	.markdown-body video {
		max-width: 100%;
	}
</style>