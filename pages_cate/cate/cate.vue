<template>
	<view>
		<iheader title="看书" :showIcon="false" :showBorder="true" :showSearch="true"></iheader>
		<view class='base-padding layout-grid' v-if="grid">
			<block v-for="category in categories" :key='category.id'>
				<view class='panel' v-if="category.cnt >0 && category.status">
					<view class='panel-heading'>
						<view class='font-lv1 strong'>{{category.name}}</view>
					</view>
					<view class='row'>
						<block v-for="child in category.children" :key='child.id'>
							<navigator :url="'/pages/list/list?cid='+child.id" class='col-6 item' v-if="child.cnt>0 && child.class_id==category.id && child.status > 0">
								<view class='row'>
									<view class='col-4'>
										<image :lazy-load='true' v-if="child.icon" class='img-responsive' :src='child.icon'></image>
										<image v-else class='img-responsive' src='/static/images/cate-default.png'></image>
									</view>
									<view class='col-8'>
										<view class='ellipsis-1row font-lv2'>{{child.name}}</view>
										<view class='text-muted font-lv3'>{{child.cnt}} 本</view>
									</view>
								</view>
							</navigator>
						</block>
					</view>
				</view>
			</block>
		</view>
		<view class='layout-list' v-else>
			<block v-for="(category, idx) in categories" :key='category.id'>
				<view class='panel' v-if="category.cnt >0 && category.status">
					<view class='panel-heading' :id="'index'+idx">
						<view class='font-lv2 strong'>{{category.name}}</view>
					</view>
					<view class='row'>
						<block v-for="child in category.children" :key='child.id'>
							<navigator :url="'/pages/list/list?cid='+child.id" class='col-12 item' v-if="child.cnt>0 && child.pid==category.id && child.status">
								<view class='row'>
									<view class='col-4'>
										<image :lazy-load='true' v-if="child.icon" class='img-responsive' :src='child.icon'></image>
										<image v-else class='img-responsive' src='/static/images/cate-default.png'></image>
									</view>
									<view class='col-8'>
										<view class='ellipsis-1row font-lv3'>{{child.title}}</view>
									</view>
								</view>
							</navigator>
						</block>
					</view>
				</view>
			</block>
			<view class="fix-right" :style="'top:'+fixTop">
				<block v-for="(category, idx) in categories" :key='category.id'>
					<view v-if="category.cnt >0 && category.status && category.pid == 0" @touchend="scrollCate" :data-index="idx"
					 :data-title="category.firstWord">{{category.firstWord}}</view>
				</block>
			</view>
		</view>
	</view>
</template>

<script>
	import util from '../../utils/util.js'
	import api from '../../utils/api.js'
	import config from '../../config.js'

	import iheader from '../../components/header.vue'

	export default {
		components: {
			iheader
		},
		data() {
			return {
				// grid表示是否是格子布局。
				// 	true表示分类使用格子布局
				// 	false则表示使用类似通讯录的页面布局，这时请把下方CSS中的 page 被注释掉的样式打开
				grid: true,
				categories: [],
				fixTop: '0px',
				currentScrollTop: 0,
			}
		},
		onLoad() {
			util.loading("loading...")
			let sysInfo = util.getSysInfo()
			this.fixTop = (sysInfo.statusBarHeight + sysInfo.titleBarHeight) + "px"
			api.getAllCategories().then((categories) => {
				if (config.debug) console.log('api.getAllCategories: ', categories);
				categories.map(item => {
					item.firstWord = String(item.name).substr(0, 1)
					item.status = item.status > 0
					item.children = item.series
					return item
				})
				this.categories = categories
			}).catch((e) => {
				console.log(e)
			}).finally(function() {
				uni.hideLoading()
			})
		},
		onPageScroll(e) {
			this.currentScrollTop = e.scrollTop
		},
		onShareAppMessage: function() {
			uni.showShareMenu({
				withShareTicket: true
			})
		},
		methods: {
			scrollCate(e) {
				let that = this
				let sysInfo = util.getSysInfo()
				if (config.debug) console.log('scrollCate', e)
				const query = uni.createSelectorQuery().in(this);
				let to = '';
				query.select('#index' + e.currentTarget.dataset.index).boundingClientRect(info => {
					if (config.debug) console.log("位置信息", that.currentScrollTop, info)
					clearTimeout(to)
					to = setTimeout(function() {
						uni.hideLoading()
					}, 500)
					uni.showLoading({
						title: '  ' + e.currentTarget.dataset.title + '  ',
						icon: 'none',
					})
					uni.pageScrollTo({
						scrollTop: this.currentScrollTop + info.top - (sysInfo.statusBarHeight + sysInfo.titleBarHeight) - 14
					})
				}).exec();
			}
		}
	}
</script>

<style>
	/* 采用类似通讯录布局方式的时候，把下面的page注释掉的样式打开 */
	/* page {
		background-color: #F1F1F1;
	} */
	
	.layout-grid {
		background-color: #FFFFFF;
		padding-top: 15px;
	}

	.item {
		margin-bottom: 15px;
	}

	.item>.row {
		border: 1px solid #efefef;
		border-radius: 3px;
		box-sizing: border-box;
		padding: 8px;
		padding-bottom: 3px;
	}

	.item:nth-of-type(2n)>.row {
		margin-left: 8px;
	}


	.img-responsive {
		/* border-radius: 6upx; */
		border-radius: 50%;
		border: 1px solid #efefef;
		max-width: 45px;
		height: 45px;
	}

	.img-responsive image {
		width: 45px;
		height: 45px;
	}

	.item>.row .col-8 {
		padding-left: 8px;
		box-sizing: border-box;
	}

	.text-muted {
		margin-top: 5px;
	}

	.layout-list .img-responsive {
		border-radius: 50%;
		border: 0;
		max-width: 38px;
		height: 38px;
	}

	.layout-list .img-responsive image {
		width: 38px;
		height: 38px;
	}

	.layout-list .panel-heading {
		margin: 10px 0;
		box-sizing: border-box;
		padding-left: 15px;
	}

	.layout-list .item {
		background-color: #FFFFFF;
		margin: 0;
		box-sizing: border-box;
	}

	.layout-list .item .row {
		border: 0;
		border-bottom: 1upx solid #F1F1F1;
		padding: 10px 15px;
	}

	.layout-list .item:nth-of-type(2n)>.row {
		margin-left: 0;
	}

	.layout-list .item .row .col-4 {
		width: 53px;
		max-width: 53px;
	}

	.layout-list .item .row .col-8 {
		line-height: 38px;
	}

	.layout-list .item:nth-of-type(2n+1)>.row {
		margin-right: 0;
	}

	.fix-right {
		position: fixed;
		right: 0;
		bottom: 0;
		width: 25px;
		background-color: #FFFFFF;
		text-align: center;
		font-size: 12px;
	}

	.fix-right {
		padding-top: 4px;
	}

	.fix-right>view {
		padding: 4px 0;
		color: #4c9af6;
		white-space: nowrap;
		overflow: hidden;
	}

	@media (min-width: 768px) {
		.img-responsive {
			width: 80px;
			height: 80px;
			max-width: 80px;
			max-height: 80px;
		}
	
		.img-responsive image {
			width: 80px;
			height: 80px;
			max-width: 80px;
			max-height: 80px;
		}
		
		.layout-list .img-responsive {
			width: 65px;
			height: 65px;
		}

		.layout-list .img-responsive image {
			width: 65px;
			height: 65px;
		}
	}
</style>
