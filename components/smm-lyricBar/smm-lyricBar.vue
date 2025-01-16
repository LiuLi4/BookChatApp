<template>
	<view>
		<view class="lyricBox" :style="{background:bgColor,height:lyricWh+'px'}" @click="dblclickFn"
			@touchmove="touchmoveFn" @touchstart="touchstartFn" @touchcancel="touchcancelFn" @touchend="touchendFn">
			<div class="sliderBar" @click.stop @mousedown.stop @touchmove.stop @touchmove.stop>
				<!-- <view class="sliderItem"> -->
					<!-- <slider block-size="12" :max="fullTimer" :value="curTime" @change="sliderSeekFn"></slider> -->
				<!-- </view> -->
				<!-- <view class="timer">
					{{curTime | timeFormat}} / {{fullTimer | timeFormat}}
				</view> -->
			</div>
			<view class="seekDataBar" :style="{display:moveY==0?'none':'block'}">
			<!-- <view class="seekDataBar"> -->
				{{seekPointer}}
			</view>
			<!-- <view class="mask" v-show="mask"
				:style="{backgroundImage:'linear-gradient('+bgColor+',transparent,transparent,transparent,'+bgColor+')'}">
			</view> -->
			<view class="lyricCol" ref="lyficCol" :style="{top:lyricX+'px'}">
				<view class="see" v-if="!lyricList.length" style="background-color: transparent;">
					暂无字幕
				</view>
				<view v-for="(item,index) in lyricList" :key="index" :style="{height:itemHeight+'px'}"
					:class="{see:index===nowIndex}">
					{{item.ylc}}
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	/*
	该组件为歌词组件 适用于搭配 smm-audio 组件
	
	注意传入的歌词数据格式应该为 (例子)：
	---------------------------------------------- 如有不同请自行转换 -----------------------------------------------------
	[{ time: '0:00:05.22', ylc: '全名制作人大家好\r' }, { time: '0:00:08.78', ylc: '我是练习时常两年半的个人练习生\r' } ... ]
	----------------------------------------------------------------------------------------------------------------------
	
	接收的参数介绍
	
	|参数                 |说明                       |默认值                |
	|:-|:-:|-:|
	|lyricList |歌词列表，传入对应歌词数组对象  | []     |
	|curTime   |播放歌曲的时间戳 (单位：秒)     |0        |
	|lineItem  |歌词显示的行数                 |15          |
	|mask      |幕布上下两侧是否使用遮罩       |true     |
	|bgColor   |幕布背景颜色                  |#66ccff     |
	|lyricWh   |幕布区域整体高度               |400      |
	
	
	事件向外传递
	|参数                 |说明                       |
	|:-|-:|
	|click                |单击事件  一般用于暂停 / 播放       |
	|dblclick             |双击事件 一般用于关闭页面           |
	|SeekDataUp           |触摸滑动事件 会返回滑动的距离 整数参数 |
	*/
	export default {
		name: "smm-lyricBar",
		data() {
			return {
				nowLyric: '',
				lyricX: Math.floor(this.lyricWh / 2) || 0,
				moveHeight: Math.floor(this.lyricWh / this.lineItem),
				offset: Math.floor(this.lyricWh / 2) || 0,
				timerArr: [],
				nowIndex: 0,
				// befoIndex: 0,
				lastTapTimeoutFunc: null,
				lastTapDiffTime: 0,
				befoY: 0,
				afterY: 0,
				moveY: 0,
			};
		},
		filters: {
			timeFormat(value) {
				var result = typeof value === "string" ? parseFloat(value) : value;
				if (isNaN(result))
					return "";
				let h = Math.floor(result / 3600) < 10 ?
					"0" + Math.floor(result / 3600) :
					Math.floor(result / 3600);
				let m = Math.floor((result / 60) % 60) < 10 ?
					"0" + Math.floor((result / 60) % 60) :
					Math.floor((result / 60) % 60) + h * 60;
				let s = Math.floor(result % 60) < 10 ?
					"0" + Math.floor(result % 60) :
					Math.floor(result % 60);

				return h == '00' ? `${m}:${s}` : `${h}:${m}:${s}`;
			}
		},
		created(){
			// 即使没发生变化 也尝试改变歌词内容
			this.timerArr = this.playChange();
		},
		props: {
			// 歌词显示的行数
			lineItem: {
				type: Number,
				default: 15
			},
			lyricList: {
				type: Array,
				default: () => []
			},
			curTime: {
				type: Number,
				default: 0
			},
			// 歌词幕布
			bgColor: {
				type: String,
				default: '#66ccff'
			},
			// 歌词幕高度
			lyricWh: {
				type: Number,
				default: 400
			},
			// 是否使用遮罩
			mask: {
				type: Boolean,
				default: true
			},
			fullTimer: {
				type: Number,
				default: 0
			}
		},
		watch: {
			// 监听音频变动事件
			curTime(num) {
				if (this.lyricList.length) {
					// findIndex 只会返回一个值，因此可以采用 大于 的方式返回下一个下标
					let index = this.timerArr.findIndex(item => {
						return item >= num + 1;
					});
					console.log('播放的时间:'+num);
				    console.log(index);
					if (index !== -1) {
						this.nowIndex = index - 1;
						this.lyricX = -(this.nowIndex * this.moveHeight - this.offset);
					} else {
						// 当得到的结果为 -1 时，表示没有比当前时段更大下标的值 因此返回数组中最末尾的下标
						this.nowIndex = this.lyricList.length - 1;
						this.lyricX = -(this.nowIndex * this.moveHeight - this.offset);
					}
				}
			},
			// 监听传入歌词变化
			lyricList(newVal) {
				this.timerArr = [];
				this.timerArr = this.playChange();
				// console.log(this.timerArr);
			}
		},
		computed: {
			itemHeight() {
				return Math.floor(this.lyricWh / this.lineItem);
			},
			seekPointer() {
				if (this.moveY == 0) return ''

				return this.moveY > 0 ? '后退 ' + Math.abs(this.moveY) + ' 秒' : '前进 ' + Math.abs(this.moveY) + ' 秒';
			}
		},
		methods: {
			playChange() {
				let lyricObj = [];
				if(!this.lyricList) return
				this.lyricList.forEach((item) => {
					// 0:00:05.22
					let time = item.time.split(':');
					let h = time[0] * 3600;
					let mm = time[1] * 60;
					let ss = time[2].split('.')[0] - 0;

					// 秒数作为key, 对应歌词作为value
					lyricObj.push(h + mm + ss);
				});
				return lyricObj;
			},
			dblclickFn(index) {
				let _this = this;
				let curTime = new Date().getTime();
				let lastTime = _this.lastTapDiffTime;
				_this.lastTapDiffTime = curTime;
				let diff = curTime - lastTime;
				if (diff < 300) {
					this.$emit('dblclick');
					clearTimeout(_this.lastTapTimeoutFunc);
				} else {

					// 单击事件延时300毫秒执行
					_this.lastTapTimeoutFunc = setTimeout(() => {
						this.$emit('click');
					}, 300);
				}
			},

			// 实现触摸下拉快进
			touchmoveFn(e) {
				this.moveY = Math.floor(e.changedTouches[0].clientY / 10 - this.befoY);
			},
			touchstartFn(e) {
				this.befoY = Math.floor(e.changedTouches[0].clientY / 10);

			},
			touchcancelFn(e) {
				this.move = 0;
			},
			touchendFn(e) {
				const timer = Math.floor(this.moveY);
				// 发给父级页面对应跳转信息
				this.$emit('SeekDataUp', -timer);
				this.moveY = 0;
			}
			// sliderSeekFn(e){
			// 	this.$emit('SeekDataUp', e.detail.value);
			// }
		}
	}
</script>

<style lang="scss">
	.lyricBox {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 50%;
		background-position: center center;
		background-size: 100% 100%;
		background-repeat: no-repeat;
		justify-content: start;
		align-items: center;
		overflow: hidden;

		.sliderBar {
			position: absolute;
			// overflow: hidden;
			top: 2%;
			// height: 20rpx;
			display: flex;
			justify-content: space-between;
			left: 50%;
			z-index: 1000;
			width: 88%;
			transform: translate(-50%, -50%);

			.sliderItem {
				width: 70%;
				transform: translateY(-15rpx);
			}

			.timer {
				display: inline-block;
				// flex: 1;
				color: #765a60;
				border-bottom:2rpx solid #bdf9f7;
				border-top: 2rpx solid #bdf9f7;
				border-radius: 12rpx;
				padding: 10rpx 20rpx;
			}
		}

		.seekDataBar {
			position: absolute;
			top: 50%;
			right: 5%;
			width: 100%;
			transition: all .3s;
			color: green;
			font-size: 28rpx;
			text-align: right;
			// height: 20rpx;
			z-index: 1001;

			&:before {
				position: absolute;
				top: 50%;
				left: 10%;
				content: '';
				transform: translate(0,-50%);
				display: block;
				width: 68%;
				height: 1px;
				border-bottom: 2px dashed green;
			}
		}

		.mask {
			position: absolute;
			top: 0;
			left: 0;
			z-index: 1;
			width: 100%;
			height: 100%;
			// background-image: linear-gradient(#66ccff,transparent,transparent,transparent,#66ccff);
		}

		.lyricCol {
			position: absolute;
			z-index: 998;
			display: flex;
			flex-direction: column;
			align-items: center;
			flex-wrap: wrap;
			width: 100%;
			padding: 0;
			margin: 0;
			text-align: center;
			transition: all .3s;

			view {
				font-size: 30rpx;
				width: 90%;
				display: flex;
				justify-content: center;
				align-items: center;
				white-space: nowrap;
				text-overflow: ellipsis;
				overflow: hidden;
				transition: all .3s;
				opacity: .9;
				font-weight: 800;
				color: #fff;

				// background-color: #66cc;
				&.see {
					opacity: 1;
					transform: scale(1.1);
					color: brown;
				}
			}
		}
	}
</style>