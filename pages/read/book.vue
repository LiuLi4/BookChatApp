<template>
	<view class="book">
		<iheader :title="book.name" show-icon="true"></iheader>
		<view :class='"bg-theme"+setting.themeIndex'
			:style='"min-height:"+(sys.screenHeight - sys.statusBarHeight - 205)+"px"'>
			<view id="content-container">
				<!-- 书籍内容 -->
				<view v-if="!isend">
					<view class="books-container" v-if="loadingtype === 'book'">
						<books :booklist="list"></books>
						<!-- 提示滑动 -->
						<view class="zhiyin" v-if="iszhiyin">
							<image
								src="https://naughty-kid-system.oss-cn-beijing.aliyuncs.com/image/public/wxApp/other/shou.png"
								mode="widthFix" />
						</view>
					</view>
					<!-- 加载提示 -->
					<loading-question :type="loadingtype" v-else-if="loadingtype !== 'book'" :end="loadingend"
						:progress="6"></loading-question>

					<!-- 活动结束提示 -->
					<xw-activity-end v-else @again="again" @next="next"></xw-activity-end>
					<view class="dealy" v-if="!loadingend">
						<text>正在疯狂为您加载中，请耐心等待一下哦 ~~</text>
					</view>
				</view>
			</view>

			<!-- 单词滚动区域 -->
			<view class="lyric">
				<smm-lyricBar class="openItem" :lineItem="3" :lyricList='lyricList' :curTime='nowTime'
					:lyricWh='lyricWh' v-show="isOpen" @dblclick='dblclickFn'></smm-lyricBar>
			</view>
			<view class="footer">
				<!-- 播放器控制区域 -->
				<smm-audio ref="audioPlayer" :srcList='arrList' :lastSongIndex='befoIndex' :directory="false" :dirHight="wh" :mask="false"
					@timeupdate='showLyric' @playChangeIndex='storageIndex' @openLyric='openLyricFn'></smm-audio>
			</view>
		</view>
	</view>
</template>

<script setup>
	import books from '@/components/books/books';
	import smmLyricBar from '@/components/smm-lyricBar/smm-lyricBar';
	import smmAudio from '@/components/smm-audio/smm-audio';
	import iheader from '../../components/header.vue'
	import store from '../../store'; // 引入 Vuex store


	import util from '../../utils/util.js'
	import config from '../../config.js'

	export default {
		store,
		components: {
			iheader,
			books,
			smmLyricBar,
			smmAudio
		},
		data() {
			return {
				book: {},
				lyricData: [],
				scrollH: 10,
				listTotal: [],
				currentBook: 0,
				list: [],
				_index: '', // 移到局部状态
				loadingtype: '',
				isend: false,
				showplay: false,
				loadingend: false,
				timer: null,
				audioCurrentTime: 0, // 音频当前播放时间
				audioDuration: 0, // 音频总时长
				lyricList: [],
				arrList: [],
				wh: 0,
				nowTime: 0,
				// 上一个记录
				befoIndex: 0,
				lyricWh: 0,
				isOpen: true,
				setting: {
					themeIndex: 0,
					fontIndex: 0,
				},
				sys: util.getSysInfo(),
			};
		},
		computed: {
			iszhiyin() {
				return this.$store.state.book.iscourse;
			},
			autostatus: {
				get() {
					return this.$store.state.book.auto;
				},
				set(value) {
					this.$store.commit('toggleAuto', value);
				}
			}
		},
		methods: {
			// 获取当前音乐播放的时间段 单位：秒
			showLyric(e) {
				const nowTime = Math.floor(e.detail.currentTime);
				this.nowTime = nowTime;
			},
			// 播放音频
			playAudio(url, duration) {
				this.audioDuration = duration;
				this.audioPlayer = uni.createInnerAudioContext();
				this.audioPlayer.src = url;
				this.audioPlayer.onTimeUpdate(() => {
					this.audioCurrentTime = this.audioPlayer.currentTime;
				});
				this.audioPlayer.onEnded(() => {
					this.end();
				});
				this.audioPlayer.play();
			},

			// 暂停音频
			pauseAudio() {
				if (this.audioPlayer) {
					this.audioPlayer.pause();
				}
			},

			// 切换播放/暂停
			togglePlay() {
				if (this.audioPlayer) {
					if (this.audioPlayer.paused) {
						this.audioPlayer.play();
					} else {
						this.audioPlayer.pause();
					}
				}
			},
			end(reset) {
				setTimeout(() => {
					reset();
				}, 1000);
				this.isend = true;
				this.currentBook = 0;
			},
			next() {
				console.log('下一步');
			},
			again() {
				this.isend = false;
				this.$xw.playAudio(this.list[0].voice_url);
			},
			nextBook(i) {
				if (this._index === i) return;
				this._index = i;
				this.befoIndex = i;
				if (this.listTotal.content_list.length === i + 1) {
					console.log('最后一页了');
					this.currentBook++;
				}
				// 根据新页面的索引找到对应的音频URL
				const newAudioUrl = this.arrList[this._index + 1];
				console.log(newAudioUrl)
				if (newAudioUrl) {
					// 调用 smm-audio 组件的方法来切换音频
					this.$refs.audioPlayer.playAudio(newAudioUrl);
				}
			},
			bookplay() {
				this.$children.forEach(child => {
					if (child && child.bookplay) {
						child.bookplay();
					}
				});
			},
			toggleAutoPlay() {
				this.autostatus = !this.autostatus;
			},
			clear() {
				this.$store.state.book.iscourse = false;
				this.$store.state.book.auto = false;
				this.$xw.playAudio('');
			},
			async getBaseSrc(url) {
				try {
					const res = await uni.getImageInfo({
						src: url
					});
					return {
						basesrc: res.path,
						image_url: url
					};
				} catch (err) {
					this.$xw.Toast('绘本下载失败，正在重新尝试！');
					console.error('Failed to load image:', url, err);
					throw err;
				}
			},
			async getBook_init(data) {
				this.listTotal = data;
				let books = data.content_list;

				try {
					const promises = books.map(async (item) => {
						const result = await this.getBaseSrc(item.image_url);
						return {
							...item,
							basesrc: result.basesrc
						};
					});

					this.list = await Promise.all(promises);
					this.loadingend = true;
					this.arrList = books.map(book => book.voice_url);
					setTimeout(() => {
						this.showplay = true;
						this.loadingtype = 'book';
						this.$store.state.book.auto = true;
					}, 1000);
				} catch (error) {
					console.error('Error loading books:', error);
				}
			},
			updateAudioTime(time) {
				this.audioCurrentTime = time;
			},
			updateAudioDuration(duration) {
				this.audioDuration = duration;
			}
		},
		onLoad: function(options) {

			// 获取设备信息
			const info = uni.getSystemInfoSync();
			// 为当前 可用高度对应变量进行赋值
			this.wh = info.windowHeight - 100;
			this.lyricWh = info.windowHeight - 670;

			// 步骤：
			// 1. 先获取书籍目录
			// 2. 如果没传文档标识参数，则用目录的首个章节作为默认获取的文章
			let that = this;
			let identify = options.identify || 'help'
			let book = {}

			// #ifdef H5
			that.h5 = true
			// #endif

			if (!options.id) {
				uni.redirectTo({
					url: '/pages/notfound/notfound',
				})
				return
			}

			Promise.all([
				util.request(config.api.pages, {
					book_id: options.id
				}, 'POST'),
				util.request(config.api.videoLyric, {
					book_id: options.id
				}, 'POST')
			]).then(function([resBook, resLyric]) {
				if (config.debug) console.log(resBook)
				if (resBook.data) {
					book = resBook.data
					uni.setKeepScreenOn({
						keepScreenOn: true
					});
					that.loadingtype = 'book';
					that.getBook_init(book);
				}
				console.log("resLyric")
				that.lyricList = resLyric.data
				console.log(that.lyricList)
			}).catch(function(e) {
				console.log(e)
			}).finally(function() {
				that.book = book
			})
		},
		watch: {
			isOpen(newVal) {
				if (newVal) {
					uni.showToast({
						title: '双击可关闭字幕滚动',
						icon: 'none'
					})
				}
			}
		},
		onUnload() {
			this.clear();
			clearTimeout(this.timer); // 清理定时器
		}
	};
</script>

<style scoped lang="scss">
	@import url("../../static/css/markdown.css");
	
	.page,
	page {
		min-height: 70%;
	}

	.dealy {
		position: absolute;
		color: #ccc;
		width: 100%;
		height: 100%;
		left: 0;
		top: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.book {
		position: relative;
		width: 100vw;
		height: 673px;
	}

	#content-container {
		display: flex;
		flex-direction: column;
		min-height: 0; // 防止内容溢出
	}

	.books-container {
		position: relative; // 确保 zhiyin 相对于 books 定位
	}

	.play,
	.auto {
		position: absolute;
		color: #fff;
		font-size: r(12);
		right: r(50);
		top: r(10);
		z-index: 10;
		width: r(24);
		height: r(24);
		background-color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;

		image {
			width: r(14);
		}

		&.auto {
			right: r(80);
		}
	}

	@keyframes shou {
		from {
			transform: translateX(0);
		}

		to {
			transform: translateX(-60px); // 调整小手的滑动幅度
		}
	}

	.zhiyin {
		position: absolute;
		right: 10px; // 可以根据需要调整
		bottom: 10px; // 可以根据需要调整
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: shou 2s infinite ease-in-out;

		image {
			width: 30px; // 调整小手的大小
			height: auto;
		}
	}

	.control {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		top: 0;
		margin: auto;
	}

	.play {
		position: absolute;
		color: #fff;
		font-size: r(12);
		right: r(50);
		top: r(10);
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
		height: 200rpx;
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
	
	.bg-theme0 {
		height: 16px;
		background-color: #fff !important;
	}
</style>