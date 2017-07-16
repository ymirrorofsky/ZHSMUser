angular.module('starter.controllers', [])
	//惠众商盟
	.controller('homeCtrl', function ($rootScope, $scope, $cordovaGeolocation, $cordovaBarcodeScanner, $ionicSlideBoxDelegate, $ionicLoading, $timeout, $ionicModal, $state, $http, Home, Message, $location, $anchorScroll, $ionicScrollDelegate, Lbs, $ionicPopup, Storage, $cordovaInAppBrowser) {
		// 初始化页面数据
		$scope.pageData = {
			focusListData: [],
			navList: [],
			shopsList: [],
			featuredList: []
		};
		$scope.shops = {
			shopsList: ''
		};
		$scope.keywords = '';

		//获取首页商家
		Message.loading('加载中……');
		Home.fetchShops(1, 0, 0).then(function (response) {
			if (response.code == 1) {
				Message.show(response.msg);
				return;
			}
			$scope.shops.shopsList = response.data;
		});

		//抓取首页banner和分类
		Home.fetch().then(function (data) {
			$scope.pageData = {
				focusListData: data.slide,
				navList: data.navList,
				featuredList: data.featured
			};
			if ($scope.pageData.focusListData) {
				$timeout(function () {
					var swiper = new Swiper('.swiper-container', {
						autoplay: 4000,
						loop: true,
						pagination: '.swiper-pagination',
						paginationClickable: true
					});
				}, 0)
			}
			Message.hidden();
		});
		// 首页搜索功能
		$scope.search = function () {
			Home.goCategory($scope.keywords);
		};
		//扫描处理
		$scope.scan = function () {
			document.addEventListener("deviceready", function () {
				$cordovaBarcodeScanner.scan({
					prompt: "请保持手机或二维码稳定"
				}).then(function (barcodeData) {
					if (barcodeData.cancelled) {
						return false;
					}
					$scope.qr = barcodeData;
					var preg = /^http:\/\/.*\/yd\/\d+\/(\d+)$/;
					if (preg.test($scope.qr.text)) {
						var spid = $scope.qr.text.match(preg)[1];
						$state.go('user.pay', {
							'spid': spid
						});
					} else {
						Message.show('二维码不是平台专用，请核对后再扫！', 2000);
					}
				}, function (error) {
					console.log(error);
					Message.show('扫码失败，请尝试重新扫码！', 2000);
				});
			});
		};
		// 分类跳转
		$scope.toUrl = function (id) {
			console.log(id)
			$state.go('shops.shopsList', {
				cid: id
			});
		};

		$scope.curPosition = {
			"status": 1   //当前位置状态：1：定位失败，2：定位中，3：定位成功, 4：并获取到更新
		};
		// 获取首页商家
		$scope.$on('shops.list.update', function (event, data) {
			Home.fetchShops(data.page, data.lat, data.lng).then(function (response) {
				$scope.curPosition.status = 4;
				if (response.code == 1) {
					Message.show(response.msg);
					return;
				}
				$scope.shops.shopsList = response.data;
			});
		});
		// 列表下拉刷新
		$scope.doRefresh = function () {
			Home.fetch().then(function (data) {
				$scope.pageData = {
					focusListData: data.slide,
					navList: data.navList
				};
				$scope.$broadcast('scroll.refreshComplete');
				$scope.$broadcast('shops.list.update', $scope.curPosition);
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1200'
				});
			});
		};
		// 下拉加载更多商家
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMoreGoods = function () {
			Home.fetchShops($scope.page, $scope.curPosition.lat, $scope.curPosition.lng).then(function (response) {
				$scope.page++;
				$scope.pageData.shopsList = $scope.pageData.shopsList.concat(response.data);
				$scope.$broadcast('scroll.infiniteScrollComplete');
				if (response.code != 0) {
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多商家了！',
						duration: '1200'
					});
					$scope.noMore = false;
				}
			});
		};

		// 选择城市modal
		$http.get('data/city.json').success(function (data) {
			$scope.cityList = data;

		});
		$ionicModal.fromTemplateUrl('templates/modal/location.html', {
			scope: $scope,
			animation: 'slide-in-left'
		}).then(function (modal) {
			$scope.citySelectModal = modal;
		});
		$scope.openModal = function () {
			$scope.citySelectModal.show();
		};
		// 锚点跳转
		$scope.quickSelect = function (x) {
			$location.hash(x);
			$anchorScroll();
			$ionicScrollDelegate.$getByHandle('citySelectScroll').resize();
		};
		// 选择市
		$scope.selectCity = function (city) {
			Home.getSearchCity(city).then(function (response) {
				Message.hidden();
				if (response.code == 1) {
					Message.show(response.msg);
					return;
				}
				$scope.pageData.shopsList = response.data;
				$scope.curPosition.status = 3;
				$scope.curPosition.city = city;
				//noinspection JSUnresolvedVariable
				$scope.curPosition.lat = response.data.latlng.lat;
				$scope.curPosition.lng = response.data.latlng.lng;
				Storage.set("curPosition", $scope.curPosition);
				$scope.$broadcast('shops.list.update', $scope.curPosition);
				$ionicSlideBoxDelegate.$getByHandle("slideimgs").loop(true);
				$ionicSlideBoxDelegate.update();
			});
			$scope.citySelectModal.hide();
		};

		// 定位//定位插件参数


		document.addEventListener('deviceready', function () {
			if (Storage.get("curPosition") === null) {
				var geolocationOption = {
					timeout: 3000,
					maximumAge: 5000,
					enableHighAccuracy: false
				};
				$scope.curPosition.status = 2;
				// Message.loading("定位中……");
				$cordovaGeolocation.getCurrentPosition(geolocationOption).then(function (position) {
					$scope.curPosition.lat = position.coords.latitude;
					$scope.curPosition.lng = position.coords.longitude;

					Lbs.getCity(function (respond) {
						if (respond.code == 0) {
							$scope.curPosition.city = respond.data;
							$scope.curPosition.status = 3;
							Storage.set("curPosition", $scope.curPosition);
							$scope.$broadcast('shops.list.update', $scope.curPosition);
						} else {
							$scope.curPosition.status = 1;
							Message.show(respond.msg);
						}
					}, function () {
						$scope.curPosition.status = 1;
						Message.show("定位失败，请手动选择当前城市");
					}, $scope.curPosition);
				}, function (err) {
					$scope.curPosition.status = 1;
					//Message.show('定位失败，请在左上角手动选择当前城市！', 1000);
					return false;
				})
			} else {
				$scope.curPosition.status = 3;
				$scope.curPosition.city = Storage.get("curPosition").city;
				$scope.curPosition.lat = Storage.get("curPosition").lat;
				$scope.curPosition.lng = Storage.get("curPosition").lng;
				$scope.$broadcast('shops.list.update', $scope.curPosition);
				//校正历史定位
				$cordovaGeolocation.getCurrentPosition(geolocationOption).then(function (position) {
					var newPosition = {};
					newPosition.lat = position.coords.latitude;
					newPosition.lng = position.coords.longitude;
					Lbs.getCity(function (respond) {
						if (respond.code == 0) {
							newPosition.city = respond.data;
							if (newPosition.city !== "" && newPosition.city != $scope.curPosition.city) {
								//提示切换位置  弹窗
								$ionicPopup.confirm({
									template: '当前城市为：' + newPosition.city + '是否切换？',
									buttons: [{
										text: '取消',
										onTap: function () {
											return false;
										}
									}, {
											text: '确定',
											type: 'button-calm',
											onTap: function () {
												$scope.curPosition.status = 3;
												$scope.curPosition.city = newPosition.city;
												$scope.curPosition.lat = newPosition.lat;
												$scope.curPosition.lng = newPosition.lng;
												Storage.set("curPosition", $scope.curPosition);
												$scope.$broadcast('shops.list.update', $scope.curPosition);
												return true;
											}
										}]
								});
							}
							$scope.curPosition.status = 3;
							$scope.curPosition.city = newPosition.city;
							$scope.curPosition.lat = newPosition.lat;
							$scope.curPosition.lng = newPosition.lng;
							Storage.set("curPosition", $scope.curPosition);
							$scope.$broadcast('shops.list.update', $scope.curPosition);
							//						if (Lbs.calcDistance($scope.curPosition, newPosition) > 500) {
							//							$scope.curPosition.status = 3;
							//							$scope.curPosition.city = newPosition.city;
							//							$scope.curPosition.lat = newPosition.lat;
							//							$scope.curPosition.lng = newPosition.lng;
							//							Storage.set("curPosition", $scope.curPosition);
							//							$scope.$broadcast('shops.list.update', $scope.curPosition);
							//						}
						}
					}, function () {
						console.info(err);
					}, newPosition);
				}, function (err) {
					console.info(err);
					return false;
				});
			}
		}, false)



	})
	// 商家搜索列表
	.controller('shopsCategoryCtrl', function ($scope, Home, $stateParams, Message, $ionicLoading) {
		$scope.keywords = $stateParams.keywords;
		$scope.pageData = {
			shopsList: ''
		};
		Home.categoryList($scope.keywords).then(function (data) {
			Message.hidden();
			$scope.pageData.shopsList = data;
		});
		$scope.searchShop = function () {
			Home.goCategory($scope.keywords);
		}
		// 下拉刷新
		$scope.doRefresh = function () {
			$scope.refreshing = true;
			Home.categoryList($scope.keywords).then(function (data) {
				$scope.pageData.shopsList = data;
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1000'
				});
			})
		};
		// 上拉加载更多
		$scope.page = 2;
		$scope.noMore = true;
		$scope.loadMoreGoods = function () {
			$scope.refreshing = false;
			Home.categoryList($scope.keywords, $scope.page).then(function (data) {
				$scope.page++;
				$scope.pageData.shopsList = $scope.pageData.shopsList.concat(data);
				$scope.$broadcast('scroll.infiniteScrollComplete');
				if (data.code != 0) {
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多商家了！',
						duration: '1200'
					});
					$scope.noMore = false;
				}
			})
		}
	})
	.controller('locationCtrl', function ($rootScope, $scope, $stateParams, $cordovaGeolocation, $ionicScrollDelegate, Home, Shop, Message, $timeout) {
		console.log($stateParams);
		$scope.shops = {
			shopsList: ''
		};
		//$scope.pageMsg.titleArr._class={featuredList:''};
		Home.fetchnav().then(function (response) {
			$scope.pageMsg.titleArr._class = response.data; //分类
			//$scope.featureds.featuredList=response.data;
			console.log($scope.pageMsg.titleArr._class);
			Message.hidden();
		});
		if ($stateParams.cid) {
			$scope.y = $stateParams;
			console.log($scope.y);
		};
		Home.fetchShops(1, 0, 0, $stateParams.cid).then(function (response) {
			console.log(response.data);
			// console.log("更新商家", data);
			// $scope.curPosition.status = 4;
			if (response.code == 1) {
				Message.show(response.msg);
				return;
			}
			$scope.shops.shopsList = response.data;
		});

		$scope.pageInfo = {
			data: {}
		};

		$scope.method = {
			show: {},
			get: {},
			back: null, //返回按钮
			goIndex: null,
			loadMore: null,
			reLoad: null
		}; //页面方法

		/*页面中需要的值*/
		$scope.pageMsg = {
			titleShow: {
				_sort: '排序',
				_class: '全部',
				_city: '城市'
			},
			titleArr: {
				_sort: [{
					id: 1,
					title: '距离排序'
				}, {
						id: 2,
						title: '最新更新'
					}, {
						id: 3,
						title: '关注度排序'
					}],
				_class: {},
				_city: [{
					id: 0,
					title: '城市'
				}]
			},
			titleId: {
				_sort: 0,
				_class: 0,
				_city: ''
			},
			bool: {
				_content: true,
				_sort: false,
				_class: false,
				_city: {
					_s: false,
					_c: false,
					_x: false
				}
			},
			loadMore: true, //下拉请求开关
			loadPage: 1,
			thisPage: -1,
			cityMsg: {},
			cityList: {
				sheng: {},
				shi: {},
				xian: {}
			},
			cityId: {
				sheng: 0,
				shi: 0,
				xian: 0
			},
			cityTitle: {
				sheng: '',
				shi: '',
				xian: ''
			}
		};
		var latLng = {};
		/*获取城市数据*/
		Shop.getAllCity(function (response) {
			$scope.pageMsg.cityMsg = response;
			$scope.pageMsg.cityList.sheng = response;
		}, function (error) {
			Message.show('通信错误，请检查网络', 2000);
		});

		/*首页初始加载*/
		// Shops.shopsList(function (response) {
		//   Message.hidden();
		//   if (response.code != 0) {
		//     Message.show(response.msg);
		//   }
		//   $scope.pageMsg.titleArr._class = response.data.category; //分类
		//   $scope.pageInfo.data = response.data.shop; //列表
		// }, function (error) {
		//   Message.show('通信错误，请检查网络', 2000);
		// }); //申请数据页面加载

		function attrBool(key2, key3) { //循环遍历变成false
			angular.forEach($scope.pageMsg.bool, function (v, k) {
				if ((typeof v).toLowerCase() == 'object') {
					angular.forEach($scope.pageMsg.bool[k], function (val, key) {
						if (key3) {
							if (key == key3) {
								$scope.pageMsg.bool[k][key] = !$scope.pageMsg.bool[k][key];
							} else {
								$scope.pageMsg.bool[k][key] = false;
							}
						} else {
							$scope.pageMsg.bool[k][key] = false;
						}
					})
				} else {
					if ((typeof v).toLowerCase() == 'boolean') {
						if (k == key2) {
							$scope.pageMsg.bool[k] = !$scope.pageMsg.bool[k];
						} else {
							$scope.pageMsg.bool[k] = false;
						}
					}
					if (!key3) {
						$scope.pageMsg.bool['_content'] = true;
					}
				}
			});
		}

		$scope.method.back = function (para) {
			switch (para) {
				case 1:
					attrBool('_content');
					break;
				case 2:
					attrBool('_city', '_s');
					break;
				case 3:
					attrBool('_city', '_c');
					break;
			}
		};

		document.addEventListener("deviceready", function () {
			var posOptions = {
				timeout: 3000,
				enableHighAccuracy: false
			};
			$cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {

				latLng.lat = position.coords.latitude;
				latLng.lng = position.coords.longitude;

				getList(); //请求 
				$rootScope.globalInfo.lngLat.lng = position.coords.longitude;
				$rootScope.globalInfo.lngLat.lat = position.coords.latitude;

			}, function () {
				Message.show('定位失败，请开启位置信息');
			});
		});

		/*请求公用方法*/
		function getList(type) {
			$scope.pageMsg.loadMore = false;
			if (type == 1) {
				$scope.pageMsg.loadPage++;
			} else if (type == 77) {

			} else {
				$ionicScrollDelegate.scrollTop(); //返回顶部(取消加载)
			}
			if ($scope.pageMsg.titleShow._city == '城市') {
				$scope.pageMsg.titleId._city = '';
			} else {
				$scope.pageMsg.titleId._city = $scope.pageMsg.titleShow._city;
			}

			var _json = {
				lat: latLng.lat,
				lng: latLng.lng,
				page: $scope.pageMsg.loadPage,
				sort: $scope.pageMsg.titleId._sort,
				cid: $scope.pageMsg.titleId._class,
				province: $scope.pageMsg.cityTitle.sheng,
				city: $scope.pageMsg.cityTitle.shi,
				district: $scope.pageMsg.titleShow._city
			};
			if (type == 77) { //为77时代表下拉刷新
				_json.page = 1;
			}
			Home.fetchShops(1, 0, 0, $stateParams.cid).then(function (response) {
				console.log(response.data);
				//			// console.log("更新商家", data);
				//			// $scope.curPosition.status = 4;
				//			if(response.code == 1) {
				//				Message.show(response.msg);
				//				return;
				//			}
				//			$scope.shops.shopsList = response.data;
				//		});
				//			 Shop.shopsList(function (response) {
				Message.hidden();
				if (response.code != 0) {

					$scope.pageMsg.loadPage--;
					if (type) {
						Message.show(response.msg);
						return;
					}
				}

				$scope.$broadcast('scroll.refreshComplete');
				if (type) {
					$scope.$broadcast('scroll.infiniteScrollComplete');
					$scope.shops.shopsList = response.data;
					//    $scope.pageInfo.data = $scope.pageInfo.data.concat(response.data.shop);
				} else {
					$scope.shops.shopsList = response.data;
					//$scope.pageInfo.data = response.data.shop;
				}

				$timeout(function () {
					$scope.pageMsg.loadMore = true;
				}, 1500);

			}, function (error) {
				Message.show('通信错误，请检查网络', 2000);
			}, _json); //申请数据页面加载
		}

		/*下拉加载*/
		$scope.method.loadMore = function () {
			getList(1);
		};

		/*上拉加载*/
		$scope.method.reLoad = function () {
			getList(77);
		};

		/*点击显示隐藏*/
		$scope.method.show._sort = function () {
			attrBool('_sort');
		};

		$scope.method.show._class = function () {
			attrBool('_class');
		};

		/*判断显示省市县页面*/
		$scope.method.show._city = function () {
			if ($scope.pageMsg.thisPage == -1) {
				attrBool('_city', '_s');
			} else if ($scope.pageMsg.thisPage == 1) {
				attrBool('_city', '_c');
			} else if ($scope.pageMsg.thisPage == 2) {
				attrBool('_city', '_x');
			}
		};

		/*点击获取数据并且标题改变*/
		$scope.method.get._sort = function (id, title) {
			$scope.pageMsg.titleShow._sort = title;
			attrBool('_sort');
			$scope.pageMsg.loadPage = 1; //刷新重置成1页
			$scope.pageMsg.titleId._sort = id; //数据排序
			getList();
		};

		$scope.method.get._class = function (id, title) {
			$scope.pageMsg.titleShow._class = title;
			attrBool('_class');
			$scope.pageMsg.loadPage = 1; //刷新重置成1页
			$scope.pageMsg.titleId._class = id; //数据排序
			//			getList();
			$timeout(function () {
				Home.fetchShops(1, 0, 0, id).then(function (response) {
					console.log(response.data);
					// $scope.curPosition.status = 4;
					if (response.code == 1) {
						Message.show('该分类下暂无商家');
						return;
					}
					$scope.shops.shopsList = response.data;
				});
			}, 500);
		};

		/*点击确定时去首页的操作*/
		$scope.method.goIndex = function (para) {
			switch (para) {
				case 1:
					$scope.pageMsg.titleShow._city = $scope.pageMsg.cityTitle.sheng;
					$scope.pageMsg.thisPage = -1;
					attrBool('_content');
					break;
				case 2:
					$scope.pageMsg.titleShow._city = $scope.pageMsg.cityTitle.shi;
					$scope.pageMsg.thisPage = 1;
					attrBool('_content');
					break;
			}
			$scope.pageMsg.loadPage = 1; //刷新重置成1页
			getList();
		};

		/*获取城市*/
		$scope.method.get._shi = function (id, title) {
			$scope.pageMsg.thisPage = 1;
			$scope.pageMsg.titleShow._city = title;
			attrBool('_city', '_c');
			if (id) {
				$scope.pageMsg.cityId.sheng = id;
			}
			if (title) {
				$scope.pageMsg.cityTitle.sheng = title;
			}
			$scope.pageMsg.cityList.shi = $scope.pageMsg.cityList.sheng[$scope.pageMsg.cityId.sheng].cities;
		};

		/*获取县区*/
		$scope.method.get._xian = function (id, title) {
			$scope.pageMsg.thisPage = 2;
			$scope.pageMsg.titleShow._city = title;
			attrBool('_city', '_x');
			if (id) {
				$scope.pageMsg.cityId.shi = id;
			}
			if (title) {
				$scope.pageMsg.cityTitle.shi = title;
			}
			$scope.pageMsg.cityList.xian = $scope.pageMsg.cityList.sheng[$scope.pageMsg.cityId.sheng].cities[$scope.pageMsg.cityId.shi].counties;
		};

		/*去首页*/
		$scope.method.get._index = function (id, title) {
			$scope.pageMsg.titleShow._city = title;
			attrBool('_content');
			if (id) {
				$scope.pageMsg.cityId.xian = id;
			}
			if (title) {
				$scope.pageMsg.cityTitle.xian = title;
			}
			$scope.pageMsg.loadPage = 1; //刷新重置成1页
			getList();
		};

	})
	.controller('noticeCtrl', function ($rootScope, $scope, $ionicSlideBoxDelegate, $ionicLoading, $ionicModal, $state, $http, Home, Article, Message, $location, $anchorScroll, $ionicScrollDelegate, Lbs, $ionicPopup, Storage, $cordovaGeolocation, $cordovaInAppBrowser) {
		// $scope.$on("$ionicView.beforeEnter", function(){
		// 	if(!$rootScope.globalInfo.user.uid){
		// 		$state.go('auth.login');
		// 	}
		// });
		$scope.pageData = {
			focusListData: [],
			navList: [],
			shopsList: []
		}; // 初始化页面数据
		// $scope.shops = {shopsList: ''};
		// $scope.keywords = '';
		$scope.articles = {
			articlesList: ''
		};
		// Article.fetch().then(function (response) {
		// 	console.log(response);
		// 	// console.log("更新商家", data);
		// 	// $scope.curPosition.status = 4;
		// 	$scope.articles.articlesList = response.data;
		// });

		// Home.fetch().then(function (data) {
		// 	$scope.pageData = {
		// 		focusListData: data.slide,
		// 		navList: data.navList
		// 	};
		// 	if ($scope.pageData.focusListData) {
		// 		$ionicSlideBoxDelegate.$getByHandle("slideimgs").update();
		// 	}
		// 	Message.hidden();
		// });

		// $http.get('data/slide.json').success(function (data) {
		// 	$scope.pageData = {focusListData: data.data.slide, navList: data.data.nav};
		// 	if($scope.pageData.focusListData){
		// 		$ionicSlideBoxDelegate.$getByHandle("slideimgs").update();
		// 	}
		// 	Message.hidden();
		// });
		// $http.get('data/goods.json').success(function (data) {
		// 	console.log(data);
		// 	$scope.shops.shopsList = data.shops.shopsList;
		// });

	})
	.controller('ordertcCtrl', function ($scope, $rootScope, Order, $ionicLoading, $state, $stateParams, Storage) {
		$scope.type = $stateParams.type;
		console.log($scope.type);
		$scope.orderList = [];
		$scope.orderEmpty = false;
		$scope.orderStatus = '-3'
		$scope.hasMore = 'true';
		$scope.statusName = {
			'-3': '待交易',
			'0': '已交易',
			'1': '商家已确认',
			'2': '已完成'
		};
		Order.getList($scope.type, $scope.orderStatus).then(function (response) {

			if (response.data == '' || response.data.length == 0) {
				$scope.orderEmpty = true;
			} else {
				$scope.orderEmpty = false;
				$scope.orderList = response.data;
			}
		});
		$scope.select = function (status) {
			$scope.orderStatus = status;
			Order.getList($scope.type, $scope.orderStatus).then(function (response) {
				if (response.data == '' || response.data.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderEmpty = false;
					$scope.orderList = response.data;
				}
			});
		}
		// 下拉刷新
		$scope.doRefresh = function () {
			console.log('orderTeat')
			Order.getList($scope.type, $scope.orderStatus).then(function (response) {
				if (response.data == '' || response.data.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderEmpty = false;
					$scope.orderList = response.data;
				}
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1200'
				});
			});
		};
		// 下拉加载
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			Order.getList($scope.select, $scope.page).then(function (response) {
				$scope.page++;
				$scope.orderList = $scope.orderList.concat(response.data);
				$scope.$broadcast('scroll.infiniteScrollComplete');
				if (response.data.length == 0) {
					$scope.noMore = true;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多了！',
						duration: '1200'
					});
				}
				// if (response.code != 0) {
				// 	$scope.noMore = false;
				// 	$ionicLoading.show({
				// 		noBackdrop: true,
				// 		template: '没有更多消息了！',
				// 		duration: '1200'
				// 	});
				// }
			});
		};


	})
	.controller('tcmytcCtrl', function ($scope, User) {

	})
	.controller('mySuperiorCtrl', function ($scope, User, Message, $stateParams, Consumer) {

		Consumer.getIntro().then(function (data) {
			$scope.info = [];
			$scope.orderEmpty = false;
			if (data == '' || data.length == 0) {
				$scope.orderEmpty = true;
			} else {
				$scope.orderEmpty = false;
				$scope.info = data;
			}
		})

	})
	.controller('myorderlistCtrl', function ($scope, User, Order, $ionicLoading, $state, $stateParams, Storage) {
		$scope.orderList = [];
		$scope.orderEmpty = false;
		var userInfo = Storage.get('user');
		console.log(userInfo.token);
		//		$scope.type='user';
		Order.getList($scope.type).then(function (response) {
			if (response.data == '' || response.data.length == 0) {
				$scope.orderEmpty = true;
			} else {
				console.log(response);
				$scope.orderList = response.data;
			}
		});
		if ($scope.type == 'shops') {
			$scope.statusName = {
				'0': '待付款',
				'1': '待核销',
				'2': '已完成',
				'-1': '已取消',
				'-2': '已删除',
				'-3': '申请退款',
				'-4': '已退款'
			};
		} else if ($scope.type == 'user') {
			$scope.statusName = {
				'0': '待付款',
				'1': '待核销',
				'2': '已完成',
				'-1': '已取消',
				'-2': '已删除',
				'-3': '申请退款',
				'-4': '已退款'
			};
		};
		if ($scope.type == 'shops') {
			$scope.orderAct = {
				'0': '付款',
				'1': '评价'
			};
		} else if ($scope.type == 'user') {
			$scope.orderAct = {
				'0': '付款',
				'1': '评价'
			};
		};
		// 列表下拉刷新
		//		$scope.doRefresh = function() {
		//			Order.getList($scope.type).then(function(response) {
		//				if(response.data == '' || response.data.length == 0) {
		//					$scope.orderEmpty = true;
		//				} else {
		//					$scope.orderList = response.data;
		//				}
		//				$scope.$broadcast('scroll.refreshComplete');
		//				$ionicLoading.show({
		//					noBackdrop: true,
		//					template: '刷新成功！',
		//					duration: '3000'
		//				});
		//			});
		//		};

		// 下拉加载更多列表
		//		$scope.noMore = false;
		//		$scope.page = 2;
		//		$scope.loadMore = function() {
		//			Order.getList($scope.type, $scope.page).then(function(response) {
		//				$scope.page += 1;
		//				$scope.orderList = $scope.orderList.concat(response.data);
		//				if(response.code == 0) {
		//					if(response.data.length == 0) {
		//						$scope.noMore = true;
		//						$ionicLoading.show({
		//							noBackdrop: true,
		//							template: '没有更多订单了！',
		//							duration: '1200'
		//						});
		//					}
		//				}
		//				$scope.$broadcast('scroll.infiniteScrollComplete');
		//			})
		//		};

	})
	.controller('abouttcbjCtrl', function ($scope, User, aboutUs, $ionicLoading, $state, $stateParams, Storage, Consumer) {
		//  Shop.getShopsDetail($stateParams.spid).then(function (data) {
		//    Message.hidden();
		//    $scope.shopsdetail = data;
		//    $scope.shopsdetail.slide = data.thumbs;
		//    $ionicSlideBoxDelegate.$getByHandle("slideimgs").update();
		//  });
		Consumer.usInfo().then(function (response) {
			console.log(response);
			$scope.getInfo = response.data;
			//		$scope.shopsdetail.list.length = 3;
		});
		// Consumer.serveInfo().then(function (response) {
		// 	console.log(response);
		// 	$scope.serveInfo = response.data;
		// 	//			console.log(getInfo);
		// 	//				$scope.shopsdetail.list.length = 3;
		// });

	})
	.controller('profitCtrl', function ($scope, User) {

	})
	.controller('browsedCtrl', function ($scope, User, Order, Home, Message) {
		Home.getGoodsList().then(function (data) {
			Message.hidden();
			console.log(data);
			$scope.browsegoodsinfo = data;
		});
	})
	.controller('collectionCtrl', function ($scope, User) {

	})
	.controller('invitationCtrl', function ($scope, User, aboutUs, $ionicLoading, $state, $stateParams, Storage) {

		User.getinvitainfo().then(function (response) {
			$scope.invitaer = response;
			console.log(response);

		});
		//		Order.getList($scope.type).then(function(response) {
		//			if(response.data == '' || response.data.length == 0) {
		//				$scope.orderEmpty = true;
		//			} else {
		//				console.log(response);
		//				$scope.orderList = response.data;
		//			}
		//		});

	})
	.controller('recommendCtrl', function ($scope, User) {

	})
	.controller('bussapplyCtrl', function ($scope, $state, Message, $ionicModal) {
		$scope.agree = true;
		$scope.authAgree = function () {
			$scope.agree = !$scope.agree;
		};
		if (!$scope.agree) {
			Message.show('请勾选会员注册协议');
			return false;
		}
		$ionicModal.fromTemplateUrl('templates/modal/single-page.html', {
			scope: $scope,
			animation: 'slide-in-right'
		}).then(function (modal) {
			$scope.modal = modal;
			Auth.fetchAgreement().then(function (data) {
				console.log(data)
				$scope.spTitle = data.info.title;
				$scope.spContent = data.info.content;
			});
		});

		$scope.showAgreement = function ($event) {
			$scope.modal.show();
			$event.stopPropagation(); // 阻止冒泡
		};
	})
	.controller('busscenterCtrl', function ($scope, User) {

	})

	.controller('listCtrl', function ($scope, User, Order, $stateParams, $ionicModal, $ionicSlideBoxDelegate, Message, $cordovaInAppBrowser, ENV, $q, $timeout) {
		$scope.totalInfo = {
			count: '',
			list: '',
			roleInfo: '',
			rebateInfo: '',
			arcData: {}
		};
		$scope.type = $stateParams.type;
		$scope.role = 1;
		//		User.getLove($scope.role).then(function (data) {
		//			$scope.totalInfo = data;
		//			$scope.$broadcast("chart-update", $scope.totalInfo.arcData);
		//		});
		//		Order.getList($scope.type).then(function(data){
		//			console.log(data);
		//			$scope.totalInfo.list=data;
		//			console.log(data);
		//		});
		$scope.selectRole = function (role) {
			$scope.myVar = !$scope.myVar;
			$scope.role = role;
			User.getLove($scope.role).then(function (data) {
				$scope.totalInfo = data;
				$scope.$broadcast("chart-update", $scope.totalInfo.arcData);
			});
		};

	})

	.controller('myCtrl', function ($scope, $cordovaBarcodeScanner, User, $state, Message, Mc, Apply, $rootScope, Storage, Consumer) {
		$scope.myInfo = {};
		Consumer.getMyInfo().then(function (data) {
			$scope.info = data
		})

		$scope.msgNum = false;
		// console.log($rootScope.globalInfo.noticeNum);
		if ($rootScope.globalInfo.noticeNum > 0) {
			$scope.msgNum = true;
		} else {
			$scope.msgNum = false;
		}
		$scope.showMsg = function () {
			$rootScope.globalInfo.noticeNum = 0;
			// Storage.set("noticeNum", $rootScope.globalInfo);
			$scope.msgNum = false;
			$state.go('user.myMessage');
		};
	})

	.controller('userPayCtrl', function ($scope, $ionicPlatform, $cordovaCamera, Message, $ionicActionSheet, ENV, Order, Shop, $stateParams) {
		$scope.id = $stateParams.spid;
		$scope.shopsName = {};
		// 获取商家基本信息
		Shop.getShops($scope.id).then(function (data) {
			$scope.shopsName = data;
		});
		/*上传支付凭证*/
		$scope.payInfo = {
			money: '',
			img: '',
			remark: ''
		};
		var selectImages = function (from) {
			var options = {
				quality: 80,
				destinationType: Camera.DestinationType.DATA_URL,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
				allowEdit: false,
				targetWidth: 1000,
				targetHeight: 1000,
				correctOrientation: true,
				cameraDirection: 0
			};
			if (from == 'camera') {
				options.sourceType = Camera.PictureSourceType.CAMERA;
			}
			document.addEventListener("deviceready", function () {
				$cordovaCamera.getPicture(options).then(function (imageURI) {
					$scope.payInfo.img = "data:image/jpeg;base64," + imageURI;
					var image = document.getElementById('divImg');
					image.style.backgroundImage = "url(data:image/jpeg;base64," + imageURI + ")";
				}, function (error) {
					console.log('失败原因：' + error);
					Message.show('选择失败,请重试.', 1000);
				});
			}, false);
		};
		// 弹出选择图片
		$scope.uploadAvatar = function () {
			var buttons = [];
			buttons = [{
				text: "拍一张照片"
			}, {
					text: "从相册选一张"
				}]
			$ionicActionSheet.show({
				buttons: buttons,
				titleText: '请选择',
				cancelText: '取消',
				buttonClicked: function (index) {
					if (index == 0) {
						selectImages("camera");
					} else if (index == 1) {
						selectImages();
					}
					return true;
				}
			})
		};
		// 提交
		$scope.sureSubmit = function () {
			if (!$scope.payInfo.money || !ENV.REGULAR_MONEY.test($scope.payInfo.money)) {
				Message.show('请输入正确的金额！');
				return;
			}
			if (!$scope.payInfo.img) {
				Message.show('请上传支付凭证！');
				return;
			}
			if (!$scope.payInfo.remark) {
				Message.show('请输入备注信息！');
				return;
			}
			Order.create($scope.payInfo.money, $scope.payInfo.img, $scope.payInfo.remark, $scope.id);
		}
	})

	.controller('countCtrl', function ($scope, $ionicSlideBoxDelegate, System) {
		$scope.countInfo = {
			settled: '',
			shopsLove: '',
			userLove: '',
			yesterday: '',
			shopsList: ''
		};
		$scope.curTab = 0;
		$scope.selectTab = function (index) {
			$scope.slectIndex = index;
			$ionicSlideBoxDelegate.slide(index);
		};
		$scope.slideHasChanged = function (index) {
			$scope.curTab = index;
		};
		System.fetchCount().then(function (data) {
			$scope.countInfo = data;
		});
	})

	.controller('shopsListCtrl', function ($scope, Home, $stateParams, $ionicLoading) {
		$scope.cid = $stateParams.cid;
		$scope.categoryName = ''
		Home.categoryName($scope.cid).then(function (data) {
			$scope.categoryName = data
		})
		$scope.pageData = {
			shopsList: ''
		};
		Home.shopsList($scope.cid).then(function (response) {
			$scope.pageData.shopsList = response.data;
		});

		// 列表下拉刷新
		$scope.doRefresh = function () {
			Home.shopsList($scope.cid).then(function (response) {
				$scope.refreshing = true; //下拉加载时避免上拉触发
				$scope.pageData.shopsList = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1200'
				});
			});
		};
		// 下拉加载更多商家
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMoreGoods = function () {
			Home.shopsList($scope.cid, $scope.page).then(function (response) {
				$scope.page++;
				$scope.pageData.shopsList = $scope.pageData.shopsList.concat(response.data);
				$scope.$broadcast('scroll.refreshComplete');
				if (response.code != 0) {
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多商家了！',
						duration: '1200'
					});
					$scope.noMore = false;
				}
			});
		};
	})

	.controller('shopsInfoCtrl', function ($scope, $rootScope, Shop, Home, Good, $stateParams, $ionicSlideBoxDelegate, Message, $cordovaInAppBrowser, $timeout, $state) {
		//$scope.type = 'user';
		$scope.shopsdetail = {
			slide: '',
			locationUrl: '',
			isFollow: 0,
			followNum: 0,
			goods: ''
		};
		Shop.getShopsDetail($stateParams.spid).then(function (data) {
			//获取商家详情  do=shops&op=shopsInfo （params:(1)spid）
			Message.hidden();
			$scope.shopsdetail = data;
			$scope.shopsdetail.slide = data.thumbs;
			$ionicSlideBoxDelegate.$getByHandle("slideimgs").update();
		});

		$timeout(function () {
			Home.getGoodsList($stateParams.spid).then(function (data) {
				Message.hidden();
				$scope.shopsdetail.goods = data;
				// console.log($scope.shopsdetail.goods);
			});

		}, 500);
		$scope.praise = function () {
			if ($scope.shopsdetail.isFollow == 0) {
				Shop.praise($scope.shopsdetail.id).then(function (response) {
					if (response.code == 0) {
						$scope.shopsdetail.followNum++;
						Message.show(response.msg);
					} else {
						Message.show('您已经赞过');
					}
				});
			} else {
				Message.show('您已经赞过');
			}
		};

		$scope.showAddress = function (url) {
			console.log(url);
			document.addEventListener("deviceready", function () {
				var options = {
					location: 'yes',
					clearcache: 'yes',
					toolbar: 'yes',
					toolbarposition: 'top'

				};
				$cordovaInAppBrowser.open(url, '_system', options)
					.then(function (event) {
						console.log(event)
					})
					.catch(function (event) {
						// error
						console.log(event)
					});
			}, false);
		}
	})

	.controller('shopsOrderInfoCtrl', function ($scope, Shop, $stateParams, $ionicModal, Message, Order, $state, $timeout, $resource, ENV) {
		// orderStatus -2: 代表平台拒绝, -1: 商家拒绝， 0： 待商家确认， 1： 商家已确认待平台确认， 2： 平台已确认订单完成
		$scope.statusName = {
			'-3': '待交易',
			'0': '已交易',
			'1': '商家已确认',
			'2': '已完成'
		};
		Order.getInfo($stateParams.id, $stateParams.type).then(function (data) {
			$scope.orderInfo = data;
		});


		var resource = $resource(ENV.YD_URL, {
			do: 'order',
			op: '@op'
		});
		//购买跳转
		$scope.goodsPay = function () {
			console.log($scope.orderInfo);
			var orderid = $scope.orderInfo.orderId;
			var factprice = $scope.baInfo.factMoney;
			console.log(factprice);
			var _json = {
				op: 'update',
				orderId: $scope.orderInfo.orderId,
				balanceAll: $scope.baInfo.welBalance,
				balanceUse: $scope.baInfo.balanceUse,
				payPrice: factprice
			};
			//不判断余额
			//			$state.go('shops.pay',{
			//				orderId: orderid,
			//				payPrice: $scope.orderInfo.orderPrice,
			//				spid:$scope.orderInfo.spid
			//			});
			console.log(factprice);
			if (factprice == '0') {
				resource.save(_json, function (response) {
					console.log(response);
					//			$state.go('shops.credit');
					if (response.code == '0') {
						console.log(response.code);
						$('#showchange').hide();
						$('.order-noshow').show();
						//				$timeout(function() {
						//					Message.show(response.msg);
						//				}, 1200);
					} else {
						Message.show(response.msg);
					}
				}, function () {
					Message.show('通信错误，请检查网络!', 1500);
				});
				//$state.go('shops.credit');
			} else {
				resource.save(_json, function (response) {
					console.log(response);
					var paybefore = response.data;
					if (response.code == 0) {
						$state.go('shops.pay', {
							orderId: paybefore.orderId,
							payPrice: paybefore.payPrice,
							spid: paybefore.spid
						});
						//				$timeout(function() {
						//					Message.show(response.msg);
						//				}, 1200);
					} else {
						Message.show(response.msg);
					}
				}, function () {
					Message.show('通信错误，请检查网络!', 1500);
				});
			}
		};
		//余额支付
		$scope.checkbal = function (paybal) {
			console.log($scope.orderInfo);
			var orderid = $scope.orderInfo.orderId;
			console.log(orderid);
			var reso = $resource(ENV.YD_URL, {
				do: 'users',
				op: 'checkPayPassword'
			});
			var _json = {
				//			op: 'checkPayPassword',
				orderId: orderid,
				userPassword: paybal.passWord
			};
			reso.save(_json, function (response) {
				console.log(response);
				if (response.code == 0) {
					$state.go('shops.orderList')
					//				$timeout(function() {
					//					Message.show(response.msg);
					//				}, 1200);
					$('#showchange').show();
					$('.order-noshow').hide();
				} else {
					Message.show(response.msg);
				}
			}, function (data) {
				console.log(data);
				Message.show('通信错误，请检查网络!', 1500);
			});
		};

		//去核销
		$scope.godel = function (code) {
			console.log($scope.orderInfo);
			var order = $scope.orderInfo.orderId;
			console.log(code);
			var _json = {
				op: 'bdel',
				orderId: order,
				code: code.code
			};
			resource.save(_json, function (response) {
				console.log(response);
				if (response.code == 0) {
					$state.go('my.myorderlist');
					$timeout(function () {
						Message.show(response.msg);
					}, 1200);
				} else if (response.code == 1) {
					Message.show(response.msg);
				}
			}, function () {
				Message.show('通信错误，请检查网络!', 1500);
			});
		};

		//	//拨打电话
		//	$scope.callPhone = function(mobilePhone) {
		//		console.log("拨打:" + mobilePhone);
		//		$window.location.href = "tel:" + mobilePhone;
		//	};
		// 支付凭证modal
		$ionicModal.fromTemplateUrl('templates/modal/payVoucher.html', {
			scope: $scope,
			animation: 'slide-in-left'
		}).then(function (modal) {
			$scope.payVoucher = modal;
		});
		$scope.showVoucher = function () {
			$scope.payVoucher.show()
		};
		// 拒绝原因modal
		$ionicModal.fromTemplateUrl('templates/modal/reject.html', {
			scope: $scope,
			animation: 'slide-in-left'
		}).then(function (modal) {
			$scope.reject = modal;
		});
		$scope.rejectContent = function () {
			$scope.reject.show()
		};
		// 拒绝订单
		$scope.refuse = function () {
			if (!$scope.orderInfo.refuseCont) {
				Message.show('请输入拒绝原因！');
				return;
			}
			Order.refuse($scope.orderInfo.refuseCont, $stateParams.id).then(function (response) {
				Message.hidden();
				if (response.code == 0) {
					$scope.reject.hide();
					$state.go('shops.orderList', {
						'type': 'shops'
					});
					$timeout(function () {
						Message.show('订单拒绝成功！');
					}, 1000);
				} else if (response.code == 1) {
					Message.show(response.msg);
				}
			});
		};

	})

	.controller('articlesInfoCtrl', function ($scope, Shop, $stateParams, $ionicSlideBoxDelegate, Article, Message, $cordovaInAppBrowser) {
		$scope.articlesdetail = {
			article: ''
		};
		Article.getArticlesDetail($stateParams.id).then(function (data) {
			Message.hidden();
			console.log(data);
			$scope.articlesdetail.article = data;
		});
	})

	.controller('goodsInfoCtrl', function ($rootScope, $scope, $state, $http, Shop, Order, Home, $stateParams, Storage, $sanitize, $ionicSlideBoxDelegate, Good, ENV, Message, $cordovaInAppBrowser) {
		$scope.applyBol = true;
		$scope.showShopDesc = function () {
			$scope.applyBol = !$scope.applyBol;
		};
		console.log($stateParams)
		$scope.goodsdetail = {
			slide: '',
			locationUrl: '',
			isFollow: 0,
			followNum: 0,
			goods: ''
		};
		Home.getGoodsList($stateParams.spid).then(function (data) {

			angular.forEach(data, function (obj) {
				if (obj.goodsNo == $stateParams.goodsNo) {
					$scope.goodsdetail = obj;
				}
			});
			// $scope.model=$scope.goodsdetail.info;
			//console.log($scope.goodsdetail);
			Message.hidden();
			$scope.goodsdetail.slide = angular.fromJson($scope.goodsdetail.thumbs);
			$("#goodsinfo-info").html($scope.goodsdetail.info);
			//$scope.goodsdetail.slide = angular.fromJson((data[0].thumbs));

			$ionicSlideBoxDelegate.$getByHandle("slideimgs").update();
			//存值
			// Storage.set('subinfo',$scope.goodsdetail);
		});
		$scope.buyNum = 1;
		$scope.addNum = function () {
			$scope.buyNum++;
		};
		$scope.minusNum = function () {
			if ($scope.buyNum > 1) {
				$scope.buyNum--;
			}
		};
		$scope.contact = {};
		$scope.buyGoods = function () {
			if (!$rootScope.globalInfo.user.uid) {
				$state.go('auth.login');
				return false;
			}
			if ($scope.contact.name && $scope.contact.phone) {
				if (!ENV.REGULAR_MOBILE.test($scope.contact.phone)) {
					Message.show("请输入正确的联系方式！");
					return false;
				}
				Storage.set('contactinfo', $scope.contact);
				Storage.set('subinfo', $scope.goodsdetail);
				$scope.totNum = $scope.buyNum;
				Storage.set('subnum', $scope.totNum);
				console.log(Storage.get('subnum'))
				Message.show('订单提交成功！', 1500, function () {
					console.log('nihao')
					$scope.applyBol = !$scope.applyBol;
				});
				Order.create($scope.goodsdetail.goodsNo);
			} else {
				if (!$scope.applyBol) {
					if (!$scope.contact.name) {
						Message.show("联系人姓名不能为空");
						return false;
					}
					if (!$scope.contact.phone) {
						Message.show("联系人电话不能为空");
						return false;
					}
				}
				$scope.applyBol = !$scope.applyBol;
			}


		};

	})
	.controller('loginCtrl', function ($rootScope, $scope, $ionicModal, Auth, $state, Message, $http, $ionicHistory) {
		// $scope.$on("$ionicView.beforeEnter", function () {
		// 	if ($rootScope.globalInfo.user.uid) {
		// 		$state.go('tab.home');
		// 	}
		// });

		$scope.spContent = {
			headimg: '',
			info: ''
		};
		$scope.agree = true;
		$scope.authAgree = function () {
			$scope.agree = !$scope.agree;
		};
		$scope.login = {
			mobile: '',
			password: ''
		};
		$ionicModal.fromTemplateUrl('templates/modal/single-page.html', {
			scope: $scope,
			animation: 'slide-in-right'
		}).then(function (modal) {
			$scope.modal = modal;
			$scope.spTitle = '用户注册协议';
			Auth.fetchAgreement().then(function (data) {
				$scope.spTitle = data.info.title;
				$scope.spContent = data.info.content;
			});
		});

		$scope.showAgreement = function ($event) {
			console.log($scope.modal);
			$scope.modal.show();
			$event.stopPropagation(); // 阻止冒泡
		};
		//		 $scope.closeModal = function() {
		//  $scope.modal.hide();
		//};
		$scope.$on('$destroy', function () {
			$scope.modal.remove();
		});

		// 登陆业务逻辑
		$scope.login = function () {
			if (!$scope.agree) {
				Message.show('请勾选会员注册协议');
				return false;
			}
			Auth.login($scope.login.mobile, $scope.login.password);
		}
	})
	.controller('shopOrderListCtrl', function ($scope, $rootScope, Order, $ionicLoading, $state, $stateParams, Storage) {
		$scope.type = 'user';
		console.log($stateParams);
		$rootScope.shortpayStatus = $stateParams.payStatus;
		$rootScope.shortisComment = $stateParams.isComment;
		Storage.set('shortStatus', $stateParams.orderStatus);
		$scope.orderList = [];
		$scope.orderEmpty = false;

		Order.getList($scope.type).then(function (response) {
			if (response.data == '' || response.data.length == 0) {
				$scope.orderEmpty = true;
			} else {
				$scope.orderList = response.data;
				console.log(response);

			}
			if ($stateParams.orderStatus == '0') {
				$('#needmoney').find('span').addClass('blue');
				$('#needmoney').siblings().find('span').removeClass('blue');
			} else if ($stateParams.orderStatus == '1') {
				$('#neednone').find('span').addClass('blue');
				$('#neednone').siblings().find('span').removeClass('blue');
			} else if ($stateParams.orderStatus == '2' & $stateParams.payStatus == '2') {
				$('#needeval').find('span').addClass('blue');
				$('#needeval').siblings().find('span').removeClass('blue');
			} else {
				$('#needzero').find('span').addClass('blue');
				$('#needzero').siblings().find('span').removeClass('blue');
			}
			//			 if($stateParams.orderStatus=='2' & $stateParams.payStatus=='2'){
			//			$('#needeval').find('span').addClass('blue');
			//			$('#needeval').siblings().find('span').removeClass('blue');
			//		}else if($stateParams.orderStatus=='2'){
			//			$('#needzero').find('span').addClass('blue');
			//			$('#needzero').siblings().find('span').removeClass('blue');
			//		}
		});

		//遍历
		//		angular.forEach(data, function(obj) {
		//				if(obj.id == $stateParams.id) {
		//					$scope.goodsdetail = obj;
		//					console.log($scope.goodsdetail);
		//				}
		//			});
		$scope.getNew = function () {
			$('#needall').find('span').addClass('blue');
			$('#needall').siblings().find('span').removeClass('blue');
			console.log(this);
			$('#needall').find('span').addClass('blue').siblings().removeClass('blue');
			$scope.orderList = [];
			$scope.orderEmpty = false;
			//				Storage.set('shortisComment',$stateParams.isCommentStatus);
			Order.getList($scope.type).then(function (response) {
				console.log(response);
				if (response.data == '' || response.data.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderList = response.data;
					//console.log($scope.orderList.length);
				}
			});
			//			
		};
		$scope.getNew0 = function () {
			$('#needmoney').find('span').addClass('blue');
			$('#needmoney').siblings().find('span').removeClass('blue');
			//				document.getElementById('#needmoney').setAttribute('style','border:solid 1px blue;margin: 15px');
			Storage.set('shortStatus', 0);
			$scope.orderList = [];
			$scope.orderEmpty = false;
			//				Storage.set('shortisComment',$stateParams.isCommentStatus);
			Order.getList($scope.type).then(function (response) {
				console.log(response);
				if (response.data == '' || response.data.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderList = response.data;
					//console.log($scope.orderList.length);
				}
			});
			//			
		};
		$scope.getNew1 = function () {
			$('#neednone').find('span').addClass('blue');
			$('#neednone').siblings().find('span').removeClass('blue');
			Storage.set('shortStatus', 1);
			$scope.orderList = [];
			$scope.orderEmpty = false;
			//				Storage.set('shortisComment',$stateParams.isCommentStatus);
			Order.getList($scope.type).then(function (response) {
				console.log(response);
				if (response.data == '' || response.data.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderList = response.data;
					//console.log($scope.orderList.length);
				}
			});
			//			
		};
		$scope.getNew2 = function () {
			$('#needzero').find('span').addClass('blue');
			$('#needzero').siblings().find('span').removeClass('blue');
			Storage.set('shortStatus', 2);
			$scope.orderList = [];
			$scope.orderEmpty = false;
			//				Storage.set('shortisComment',$stateParams.isCommentStatus);
			Order.getList($scope.type).then(function (response) {
				console.log(response);
				if (response.data == '' || response.data.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderList = response.data;
					//console.log($scope.orderList.length);
				}
			});
		};
		$scope.getNeww = function () {
			$('#needeval').find('span').addClass('blue');
			$('#needeval').siblings().find('span').removeClass('blue');
			$scope.orderList = [];
			$scope.orderEmpty = false;
			$rootScope.shortpayStatus = 2;
			$rootScope.shortisComment = 0;
			Storage.set('shortStatus', 2);

			//				Storage.set('shortisComment',$stateParams.isCommentStatus);
			Order.getList($scope.type).then(function (response) {
				console.log(response);
				if (response.data == '' || response.data.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderList = response.data;
					//console.log($scope.orderList.length);
				}
			});
			//			
		};
		$scope.toBack = function () {
			$state.go('tab.ordertc', {
				type: 'user'
			});
		};
		if ($scope.type == 'shops') {
			$scope.statusName = {
				'0': '未付款',
				'1': '未核销',
				'2': '已完成',
				'-1': '已取消',
				'-2': '已删除',
				'-3': '申请退款',
				'-4': '已退款'
				//				'0' : '已确认',
				//				'1' : '待平台确认',
				//				'2' : '已完成',
				//				'-1' : '商家已拒绝',
				//				'-2' : '平台已拒绝'
			};
		} else if ($scope.type == 'user') {
			$scope.statusName = {
				'0': '未付款',
				'1': '未核销',
				'2': '已完成',
				'-1': '已取消',
				'-2': '已删除',
				'-3': '申请退款',
				'-4': '已退款'
				//				'0' : '待商家确认',
				//				'1' : '待平台确认',
				//				'2' : '已完成',
				//				'-1' : '商家已拒绝',
				//				'-2' : '平台已拒绝'
			};
		};
		if ($scope.type == 'shops') {
			$scope.orderAct = {
				'0': '付款',
				'1': '评价'
			};
		} else if ($scope.type == 'user') {
			$scope.orderAct = {
				'0': '付款',
				'1': '评价'
			};
		};
		// 列表下拉刷新
		$scope.doRefresh = function () {
			Order.getList($scope.type).then(function (response) {
				if (response.data == '' || response.data.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderList = response.data;
				}
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '3000'
				});
			});
		};

		// 下拉加载更多列表
		$scope.noMore = false;
		$scope.page = 2;
		$scope.loadMore = function () {
			Order.getList($scope.type, $scope.page).then(function (response) {
				$scope.page += 1;
				$scope.orderList = $scope.orderList.concat(response.data);
				if (response.code == 0) {
					if (response.data.length == 0) {
						$scope.noMore = true;
						$ionicLoading.show({
							noBackdrop: true,
							template: '没有更多订单了！',
							duration: '1200'
						});
					}
				}
				$scope.$broadcast('scroll.infiniteScrollComplete');
			})
		};
	})

	.controller('shopQrcodeCtrl', function ($scope, Shop, $rootScope) {
		$scope.shopQrcode = {
			shopInfo: '',
			status: ''
		};
		Shop.shopQrcode($rootScope.globalInfo.user.isShop).then(function (data) {
			$scope.shopQrcode = data;
		})
	})

	.controller('shopCenterCtrl', function ($scope, Shop, $rootScope) {
		$scope.shopsInfo = {};
		Shop.getShops($rootScope.globalInfo.user.isShop).then(function (data) {
			$scope.shopsInfo = data;
		})
	})

	.controller('shopPayCtrl', function ($scope, $stateParams, $ionicPlatform, $ionicModal, Shop, $ionicActionSheet, $cordovaCamera, Message, Payment, $state, $timeout) {
		$scope.orderInfo = {
			orderId: '',
			spid: '',
			payPrice: '',
			voucher: ''
		};
		$scope.orderInfo.orderId = $stateParams.orderId;
		$scope.orderInfo.spid = $stateParams.spid;
		$scope.orderInfo.payPrice = $stateParams.payPrice;
		// 选择支付类型
		$scope.payType = 'wechat';
		$scope.selectPayType = function (type) {
			$scope.payType = type;
		};

		Shop.getShops($scope.orderInfo.spid).then(function (data) {
			$scope.shopsInfo = data;
		});

		$ionicModal.fromTemplateUrl('templates/modal/shopsVoucher.html', {
			scope: $scope,
			animation: 'slide-in-left'
		}).then(function (modal) {
			$scope.shopsVoucher = modal;
		});

		$scope.orderConfirm = function () {
			if ($scope.payType == 'wechat') {
				//noinspection JSUnresolvedVariable
				// if (!window.Wechat) {
				// 	alert("暂不支持微信支付！");
				// 	return false;
				// }
				console.log(Payment);
				Payment.wechatPay('welfare', 'orderInfo');
			} else if ($scope.payType == 'alipay') {
				Payment.alipay('welfare', $scope.orderInfo);
				//alert("支付宝！");
			}
			//		else if($scope.payType == 'credit') {
			//			$scope.shopsVoucher.show();
			//		}
		};

		$scope.uploadAvatar = function (type) {
			var buttons = [];
			buttons = [{
				text: "拍一张照片"
			}, {
					text: "从相册选一张"
				}];
			$ionicActionSheet.show({
				buttons: buttons,
				titleText: '请选择',
				cancelText: '取消',
				buttonClicked: function (index) {
					if (index == 0) {
						$scope.selectImages("camera", type);
					} else if (index == 1) {
						$scope.selectImages('', type);
					}
					return true;
				}
			})

		};
		/*上传凭证*/
		$scope.selectImages = function (from) {
			var options = {
				quality: 80,
				destinationType: Camera.DestinationType.DATA_URL,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
				allowEdit: false,
				encodingType: Camera.EncodingType.JPEG,
				targetWidth: 1000,
				targetHeight: 1000,
				correctOrientation: true,
				cameraDirection: 0
			};

			if (from == 'camera') {
				options.sourceType = Camera.PictureSourceType.CAMERA;
			}
			document.addEventListener("deviceready", function () {
				$cordovaCamera.getPicture(options).then(function (imageURI) {
					var image = document.getElementById('divImg');
					$scope.orderInfo.voucher = "data:image/jpeg;base64," + imageURI;
					image.style.backgroundImage = "url(data:image/jpeg;base64," + imageURI + ")";
				}, function () {
					Message.show('选择失败,请重试.', 1000);
				});
			}, false);
		};
		// 提交
		$scope.sureSubmit = function () {
			if (!$scope.orderInfo.voucher) {
				Message.show('请上传支付凭证！');
				return;
			}
			Payment.getOffline($scope.orderInfo.orderId, $scope.orderInfo.voucher).then(function (response) {
				Message.hidden();
				if (response.code == 0) {
					$scope.shopsVoucher.hide();
					$state.go('shops.orderList', {
						'type': 'shops'
					});
					$timeout(function () {
						Message.show('提交成功，请耐心等待');
					}, 1500);
				} else if (response.code == 1) {
					Message.show(response.msg);
				}
			});
		}
	})

	.controller('registerCtrl', function ($scope, $ionicModal, Message, ENV, Auth, $interval) {
		$scope.reg = {
			step: 1,
			tMobile: '',
			mobile: '',
			pictureCaptcha: '',
			captcha: '',
			agree: true,
			password: '',
			rePassword: '',
			number: 60,
			bol: false
			// IDCard: '',
			// realname: ''
		};
		// 会员注册协议
		$ionicModal.fromTemplateUrl('templates/modal/single-page.html', {
			scope: $scope,
			animation: 'slide-in-right'
		}).then(function (modal) {
			$scope.modal = modal;
			$scope.spTitle = '用户注册协议';
			Auth.fetchAgreement().then(function (data) {
				$scope.spContent = data;
			});
		});
		$scope.showAgreement = function ($event) {
			$scope.modal.show();
			$event.stopPropagation(); // 阻止冒泡
		};

		//获取短信验证码
		$scope.pictureCaptchaUrl = ENV.YD_URL + '&do=utility&op=getPictureCaptcha';
		$scope.getSmsCaptcha = function () {
			if ($scope.reg.tMobile) {
				if (!ENV.REGULAR_MOBILE.test($scope.reg.tMobile)) {
					Message.show('请输入正确的推荐人手机号');
					return;
				}
			}
			if (!$scope.reg.mobile || !ENV.REGULAR_MOBILE.test($scope.reg.mobile)) {
				Message.show('请输入正确的手机号');
				return;
			}
			if (!$scope.reg.pictureCaptcha) {
				Message.show('请输入验证码');
				return;
			}
			Auth.getSmsCaptcha('send', $scope.reg.tMobile, $scope.reg.mobile, $scope.reg.pictureCaptcha).then(function () {
				$scope.reg.step = 2;
				$scope.countDown();
			}, function () {
				document.querySelector('img[update-img]').src = $scope.pictureCaptchaUrl; // 更新图片验证码
			});
		};

		// 验证验证码，设置密码
		$scope.next = function () {
			if ($scope.reg.step == 2) {
				Auth.checkCaptain($scope.reg.mobile, $scope.reg.captcha);
			} else if ($scope.reg.step == 3) {
				if (!$scope.reg.realname || $scope.reg.realname.length <= 1) {
					Message.show('请输入真实姓名dd！');
					return false;
				}
				if (!$scope.reg.IDCard || !ENV.REGULAR_IDCARD.test($scope.reg.IDCard)) {
					Message.show('请输入正确的身份证号码！');
					return false;
				}
				Auth.setPassword($scope.reg);
			}
		};
		//验证成功后
		$scope.$on("Captcha.success", function () {
			$scope.reg.step = 3;
		});
		//发送验证后倒计时
		$scope.countDown = function () {
			$scope.reg.step = 2;
			$scope.reg.bol = true;
			$scope.reg.number = 60;
			var timer = $interval(function () {
				if ($scope.reg.number <= 1) {
					$interval.cancel(timer);
					$scope.reg.bol = false;
					$scope.reg.number = 60;
				} else {
					$scope.reg.number--;
				}
			}, 1000)
		};
	})

	.controller('resetPsdCtrl', function ($scope, Auth, $interval, Message, $rootScope) {
		$scope.reg = {
			captcha: null,
			mobile: null,
			password: null,
			repassword: null,
			number: 60,
			bol: false
		};
		$scope.showNext = 1;
		//获取短信验证码
		$scope.getCaptcha = function () {
			Auth.getCaptcha(function (response) {
				if (response.code !== 0) {
					Message.show(response.msg);
					return false;
				}
				$rootScope.$broadcast('Captcha.send');
				Message.show(response.msg, 1000);
			}, function () {
				Message.show('通信错误，请检查网络!', 1500);
			}, $scope.reg.mobile);
		};
		// 验证验证码
		$scope.next = function () {
			if ($scope.showNext == 3) {
				Auth.setPassword($scope.reg, 1);
			} else if ($scope.showNext == 1) {
				Auth.checkCaptain($scope.reg.mobile, $scope.reg.captcha, 1);
			}
		};
		//验证成功后
		$scope.$on("Captcha.success", function () {
			$scope.showNext = 3;
		});
		//发送验证后倒计时
		$scope.$on("Captcha.send", function () {
			$scope.reg.bol = true;
			$scope.reg.number = 60;
			var timer = $interval(function () {
				if ($scope.reg.number <= 1) {
					$interval.cancel(timer);
					$scope.reg.bol = false;
					$scope.reg.number = 60;
				} else {
					$scope.reg.number--;
				}
			}, 1000)
		});
	})

	.controller('userCenterCtrl', function ($scope, $ionicActionSheet, $ionicLoading, $ionicHistory, $timeout, $state, User, $ionicModal, System, Message) {
		// 退出登录
		$scope.logout = function () {
			$ionicActionSheet.show({
				destructiveText: '退出登录',
				titleText: '确定退出当前登录账号吗？',
				cancelText: '取消',
				cancel: function () {
					return true;
				},
				destructiveButtonClicked: function () {
					User.logout();
					$ionicHistory.clearCache();
					$ionicHistory.clearHistory();
					$ionicHistory.nextViewOptions({ //退出后清除导航的返回
						disableBack: true
					});
					$ionicLoading.show({
						noBackdrop: true,
						template: '退出成功！',
						duration: '1500'
					});
					$timeout(function () {
						$state.go('tab.home');
					}, 1200);
					return true;
				}
			});
		};
		$scope.update = function () {
			var res = System.checkUpdate();
			if (res === true) {
				Message.show("已经是最新版本！", 1500);
			}
		}

		// 关于我们modal
		$ionicModal.fromTemplateUrl('templates/modal/aboutUs.html', {
			scope: $scope,
			animation: 'slide-in-left'
		}).then(function (modal) {
			$scope.aboutUs = modal;
		});
		$scope.openModal = function () {
			$scope.aboutUs.show()
		}
	})

	.controller('userRealNameCtrl', function ($scope, User, Message, ENV, $interval, Consumer) {
		$scope.info = {
			realname: '',
			gender: 1,
		};
		// $scope.getCaptchaSuccess = false;
		$scope.personalSuccess = true;
		$scope.select = function (type) {
			$scope.info.gender = type;
		};
		$scope.sex = {
			1: '男',
			2: '女'
		}
		Consumer.getSettingInfo().then(function (data) {
			if (data.realname == '') {
				$scope.info = {
					realname: '',
					gender: 1,
				};
				return false;
			}
			$scope.personalSuccess = true;
			$scope.info = data
		})
		$scope.submit = function () {
			var info = {
				realname: $scope.info.realname,
				gender: $scope.info.gender,
			};
			if (!$scope.info.realname || $scope.info.realname.length <= 1) {
				Message.show('请输入真实姓名！');
				return false;
			}
			Consumer.settingInfo(info).then(function (data) {

			})
		}
		// $scope.getRealName = function () {
		// 	var info = {
		// 		realname: $scope.pageData.realname,
		// 		gender: $scope.pageData.gender,
		// 	};
		// 	if (!info.realname || info.realname.length <= 1) {
		// 		Message.show('请输入真实姓名！');
		// 		return false;
		// 	}
		// 	Consumer.settingInfo(info).then(function (data) {

		// 		console.log($scope.info)
		// 	})
		// 	// User.realNamePwd(_param).then(function () {
		// 	// 	$scope.getCaptchaSuccess = true;
		// 	// 	var timer = $interval(function () {
		// 	// 		if ($scope.reg.number <= 1) {
		// 	// 			$interval.cancel(timer);
		// 	// 			$scope.getCaptchaSuccess = false;
		// 	// 			$scope.reg.number = 60;
		// 	// 		} else {
		// 	// 			$scope.reg.number--;
		// 	// 		}
		// 	// 	}, 1000)
		// 	// });
		// };

		// User.getRealName().then(function (data) {
		// 	$scope.pageData = data;
		// 	if ($scope.pageData.realname && $scope.pageData.gender && $scope.pageData.idcard) {
		// 		$scope.personalSuccess = true;
		// 	}
		// });


	})

	// 关于我们
	.controller('userAboutUsCtrl', function ($scope, System, Message) {
		System.aboutUs(function (response) {
			Message.hidden();
			$scope.version = response.data;
			console.log($scope.version)
		}, function (err) {
			Message.show(err.msg);
		});
		$scope.getUpdate = (function () {
			var res = System.checkUpdate();
			if (res === true) {
				Message.show("已经是最新版本！", 1500);
			}
		})
	})

	.controller('userLoginPswCtrl', function ($scope, $stateParams, Message, User, $interval) {
		$scope.type = $stateParams.type;
		$scope.getCaptchaSuccess = false;
		$scope.pageData = {
			oldpsd: '',
			code: '',
			newpsd: '',
			respsd: ''
		};
		$scope.reg = {
			number: 60
		};
		// 获取修改登录或支付验证码
		$scope.getCode = function (oldpsd, newpsd, respsd, type) {
			if (oldpsd.length < 6 || newpsd.length < 6 || respsd.length < 6) {
				Message.show('请输入至少6位的密码');
				return;
			} else if (newpsd != respsd) {
				Message.show('两次密码不一致');
				return;
			}
			User.getCaptcha(oldpsd, newpsd, respsd, type).then(function (data) {
				$scope.getCaptchaSuccess = true;
				var timer = $interval(function () {
					if ($scope.reg.number <= 1) {
						$interval.cancel(timer);
						$scope.getCaptchaSuccess = false;
						$scope.reg.number = 60;
					} else {
						$scope.reg.number--;
					}
				}, 1000)
			})
		};
		$scope.savePsd = function (oldpsd, code, newpsd, respsd) {
			if (oldpsd.length < 6 || newpsd.length < 6 || respsd.length < 6) {
				Message.show('请输入至少6位的密码');
				return;
			} else if (newpsd != respsd) {
				Message.show('两次密码不一致');
				return;
			}
			else if (code.length < 4) {
				Message.show('请输入正确的验证码');
				return;
			}
			if ($scope.type == 1) {
				User.changeLoginPsd(oldpsd, code, newpsd, respsd);
			} else if ($scope.type == 2) {
				User.changePayPsd(oldpsd, code, newpsd, respsd);
			}
		}

	})

	// 忘记支付密码
	.controller('userResetPayWordCtrl', function ($scope, User, ENV, Message, $interval) {
		$scope.getPsd = true;
		$scope.getCaptchaSuccess = false;
		$scope.pay = {
			mobile: '',
			code: '',
			newpsd: '',
			respsd: '',
			number: 60
		};
		$scope.getCode = function (newpsd, respsd) {
			if (newpsd.length < 6 || respsd.length < 6) {
				Message.show('请输入至少6位的密码');
				return;
			} else if (newpsd != respsd) {
				Message.show('两次密码不一致');
				return;
			}
			User.resetPwd(newpsd, respsd).then(function (data) {
				$scope.getCaptchaSuccess = true;
				var timer = $interval(function () {
					if ($scope.pay.number <= 1) {
						$interval.cancel(timer);
						$scope.getCaptchaSuccess = false;
						$scope.pay.number = 60;
					} else {
						$scope.pay.number--;
					}
				}, 1000)
			})
		};

		$scope.savePsd = function (newpsd, respsd, code) {
			User.resetPayPsd(newpsd, respsd, code);
		}

	})
	.controller('userNewsCtrl', function ($scope) {

	})
	// 用户帮助列表详情
	.controller('userNewsDetailsCtrl', function ($scope, User, $stateParams) {
		$scope.boll = false;
		$scope.helpDetail = {
			title: '',
			createtime: '',
			content: ''
		};
		$scope.id = $stateParams.id;
		User.helpInfo($scope.id).then(function (data) {
			$scope.boll = true;
			$scope.helpDetail = data;
		})
	})
	// 用户帮助列表
	.controller('userHelpCtrl', function ($scope, User, $ionicLoading) {
		console.log('nihao')
		$scope.userList = '';
		User.useHelp().then(function (data) {
			$scope.userList = data;
		});

		$scope.doRefresh = function () {
			User.useHelp().then(function (data) {
				$scope.userList = data;
				$scope.$broadcast("scroll.refreshComplete");
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '1500'
				});
			})
		}
	})

	.controller('userDonateCtrl', function ($scope, User, Message, ENV, $ionicPopup) {
		$scope.donateInfo = {
			donateNum: '',
			password: '',
			beanNum: ''
		};
		$scope.showDrop = false;
		$scope.showDropType = "普通信使豆";
		$scope.beanType = function (num, title) {
			$scope.showDropType = title;
			$scope.showDrop = false;
		};

		User.getDonate().then(function (data) {
			$scope.donateInfo = data;
		});

		$scope.submit = function () {
			if (!$scope.donateInfo.donateNum || !ENV.REGULAR_MONEY.test($scope.donateInfo.donateNum)) {
				Message.show('请输入捐赠数量');
				return;
			}
			if ($scope.donateInfo.donateNum > $scope.donateInfo.beanNum) {
				Message.show('信使豆不足');
				return;
			}
			if (!$scope.donateInfo.password) {
				Message.show('请输入支付密码');
				return;
			}
			$ionicPopup.confirm({
				title: '直捐提示',
				template: '您是否选择捐赠？一点公益基金会将会感谢您的每一份爱心捐赠！',
				buttons: [{
					text: '取消',
					onTap: function () {
						return false;
					}
				}, {
						text: '确定',
						type: 'button-assertive',
						onTap: function () {
							User.getDonate('type', $scope.donateInfo);
						}
					}]
			});
		}
	})

	.controller('userDonateListCtrl', function ($scope, Message, User, $ionicLoading) {
		$scope.donateList = {
			list: '',
			countDonate: ''
		};
		$scope.orderEmpty = false;
		User.donateList().then(function (response) {
			if (response.data == '' || response.data.length == 0) {
				$scope.orderEmpty = true;
			} else {
				console.log('con1833');
				$scope.donateList.countDonate = response.data.countDonate;
				$scope.donateList.list = response.data.list;
			}
		});

		// 下拉刷新
		$scope.doRefresh = function () {
			User.donateList().then(function (response) {
				$scope.donateList.list = response.data.list;
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '3000'
				});
			});
		};
		// 下拉加载
		$scope.noMore = false;
		$scope.page = 2;
		$scope.loadMore = function () {
			User.donateList($scope.page).then(function (response) {
				$scope.page++;
				if (response.code == 0) {
					$scope.donateList.list = $scope.donateList.list.concat(response.data.list);
					$scope.$broadcast('scroll.infiniteScrollComplete');
				} else if (response.code != 0) {
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多记录了！',
						duration: '1200'
					});
					$scope.noMore = true;
				}
			});
		};
	})

	.controller('userRepoCtrl', function ($scope, Message, User) {
		$scope.showDrop = false;
		$scope.showDropType = "普通信使豆";
		$scope.beanType = function (num, title) {
			$scope.showDropType = title;
			$scope.showDrop = false;
		};
		$scope.repoInfo = {
			bean: '',
			password: ''
		};
		User.getRepo().then(function (data) {
			$scope.repoInfo = data;
		});

		var r = /^[1-9]\d*00$/;
		$scope.submit = function () {
			if (!$scope.repoInfo.bank) {
				Message.show('请添加银行卡！');
				return;
			}
			if (!$scope.repoInfo.bean) {
				Message.show('请输入回购信使豆的数量！');
				return;
			}
			if (!r.test($scope.repoInfo.bean)) {
				Message.show('请输入100的整数倍！');
				return;
			}
			if ($scope.repoInfo.bean > $scope.repoInfo.beanNum) {
				Message.show('信使豆数量不足！');
				return;
			}
			if (!$scope.repoInfo.password) {
				Message.show('请输入支付密码！');
				return;
			}
			User.getRepo('type', $scope.repoInfo);
		}
	})

	.controller('userRepoListCtrl', function ($scope, User, $ionicLoading, $stateParams) {
		$scope.type = $stateParams.type;
		$scope.repoList = {};
		$scope.orderEmpty = false;
		$scope.select = $scope.type || 1;
		User.getRepoList($scope.select).then(function (response) {
			if (response.data == '' || response.data.length == 0) {
				$scope.orderEmpty = true;
			} else {
				$scope.orderEmpty = false;
				$scope.repoList = response.data
			}
		});

		$scope.active = function (id) {
			$scope.select = id;
			$scope.noMore = false;
			User.getRepoList(id).then(function (response) {
				if (response.data == '' || response.data.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderEmpty = false;
					$scope.repoList = response.data
				}
			});
		};

		// 下拉刷新
		$scope.doRefresh = function () {
			User.getRepoList($scope.select).then(function (response) {
				$scope.repoList = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '3000'
				});
			});
		};
		// 下拉加载
		$scope.noMore = false;
		$scope.page = 2;
		$scope.loadMore = function () {
			User.getRepoList($scope.select, $scope.page).then(function (response) {
				$scope.page++;
				$scope.repoList = $scope.repoList.concat(response.data);
				$scope.$broadcast('scroll.infiniteScrollComplete');
				if (response.code != 0) {
					$scope.noMore = true;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多记录了！',
						duration: '1200'
					});
				}
			});
		};
	})

	.controller('userRepoInfoCtrl', function ($scope, Message, User, $stateParams) {
		$scope.id = $stateParams.id;
		$scope.repoInfo = {};
		$scope.orderEmpty = false;
		User.getRepoInfo($scope.id).then(function (response) {
			if (response.data == '' || response.data.length == 0) {
				$scope.orderEmpty = true;
			} else {
				$scope.repoInfo = response.data;
			}
		});
	})

	.controller('userMyBankCtrl', function ($scope, $ionicModal, Message, $ionicListDelegate, User, ENV, $timeout) {
		$scope.bankList = {};
		$scope.isDefault = '';
		$scope.bankInfo = {
			userName: '',
			bankName: '',
			idCard: '',
			bankCard: '',
			mobile: ''
		};
		$scope.showBank = false;
		$scope.bankType = function (num, title) {
			$scope.bankInfo.bankName = title;
			$scope.showBank = false;
		};

		User.getBank().then(function (data) {
			angular.forEach(data, function (x, y) {
				if (x.isDefault == 1) {
					$scope.isDefault = x.id;
				}
			});
			$scope.bankList = data;
		});
		// 提交添加银行卡资料
		$scope.submitData = function () {
			if (!$scope.bankInfo.userName) {
				Message.show('请输入开户姓名！');
				return;
			}
			if (!$scope.bankInfo.bankName) {
				Message.show('请选择转入银行的名称！');
				return;
			}
			if (!$scope.bankInfo.idCard || !ENV.REGULAR_IDCARD.test($scope.bankInfo.idCard)) {
				Message.show('请输入正确的身份证号！');
				return;
			}
			if (!$scope.bankInfo.bankCard || $scope.bankInfo.bankCard.length <= 5) {
				Message.show('请输入正确的银行卡号！');
				return;
			}
			if (!$scope.bankInfo.mobile || !ENV.REGULAR_MOBILE.test($scope.bankInfo.mobile)) {
				Message.show('请输入正确的手机号！');
				return;
			}
			User.getBankInfo('type', $scope.bankInfo).then(function (response) {
				if (response.code == 0) {
					$scope.addBank.hide();
					$scope.bankInfo = {
						userName: '',
						bankName: '',
						idCard: '',
						bankCard: '',
						mobile: ''
					};
					$timeout(function () {
						Message.show('添加成功！');
					}, 1000);
					User.getBank().then(function (data) {
						angular.forEach(data, function (x, y) {
							if (x.isDefault == 1) {
								$scope.isDefault = x.id;
							}
						});
						$scope.bankList = data;
					});
				} else if (response.code == 1) {
					Message.show(response.msg);
				}
			});
		};
		// 添加银行卡号
		$ionicModal.fromTemplateUrl('templates/modal/addBank.html', {
			scope: $scope,
			animation: 'slide-in-left'
		}).then(function (modal) {
			$scope.addBank = modal;
		});
		$scope.openModal = function () {
			$scope.addBank.show();
			User.getBankInfo().then(function (response) {
				$scope.bankInfo = response.data;
			});
		};
		// 选择银行卡
		$scope.selectBank = function (id) {
			$scope.isDefault = id;
		};
		//删除银行卡
		$scope.removeBank = function (id) {
			User.getBank('delete', id).then(function (response) {
				if (response.code == 0) {
					$timeout(function () {
						Message.show('删除成功！');
					}, 1000);
					$scope.isDefault = '';
					User.getBank().then(function (data) {
						angular.forEach(data, function (x) {
							if (x.isDefault == 1) {
								$scope.isDefault = x.id;
							}
						});
						$scope.bankList = data;
					});
				}
			})
		};
		$scope.submitBankType = function () {
			if (!$scope.isDefault) {
				Message.show('请先添加银行卡！');
				return;
			}
			User.getBank('select', $scope.isDefault);
		}

	})

	.controller('userGiveCtrl', function ($scope, User, Message, ENV) {
		$scope.giveInfo = {
			userId: '',
			giveBeanNum: '',
			payPassword: '',
			beanNum: ''
		};
		User.getGive().then(function (data) {
			$scope.giveInfo = data;
		});
		$scope.submit = function () {
			if (!$scope.giveInfo.userId) {
				Message.show('请输入获赠人ID');
				return;
			}
			if (!$scope.giveInfo.giveBeanNum || !ENV.REGULAR_MONEY.test($scope.giveInfo.giveBeanNum)) {
				Message.show('请输入转赠信使豆数量');
				return;
			}
			if ($scope.giveInfo.giveBeanNum > $scope.giveInfo.beanNum) {
				Message.show('信使豆数量不足');
				return;
			}
			if (!$scope.giveInfo.payPassword) {
				Message.show('请输入支付密码');
				return;
			}
			User.getGive('type', $scope.giveInfo);
		}
	})

	.controller('userRecommendCtrl', function ($scope, User, Message) {
		$scope.myQrcode = {};
		User.recomCode().then(function (data) {
			$scope.myQrcode = data;
			console.log($scope.myQrcode);
		});
		$scope.developing = function () {
			Message.show('开发中...');
		}
	})

	.controller('userRecommendHistoryCtrl', function ($scope, User, $ionicLoading) {
		$scope.recommendList = {};
		$scope.orderEmpty = false;
		$scope.select = 1;
		User.recommendList($scope.select).then(function (response) {
			$scope.recommendList = response.data;
			if (response.data == '' || response.data.length == 0) {
				$scope.orderEmpty = true;
			} else {
				$scope.orderEmpty = false;
				$scope.recommendList = response.data
			}
		});

		$scope.active = function (id) {
			$scope.select = id;
			$scope.noMore = false;
			User.recommendList(id).then(function (response) {
				if (response.data == '' || response.data.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderEmpty = false;
					$scope.recommendList = response.data
				}
			});
		};

		// 下拉刷新
		$scope.doRefresh = function () {
			User.recommendList().then(function (response) {
				$scope.recommendList = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '3000'
				});
			});
		};
		// 下拉加载
		$scope.noMore = false;
		$scope.page = 2;
		$scope.loadMore = function () {
			User.recommendList($scope.page).then(function (response) {
				$scope.page++;
				$scope.recommendList = $scope.recommendList.concat(response.data);
				$scope.$broadcast('scroll.infiniteScrollComplete');
				if (response.code != 0) {
					$scope.noMore = true;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多记录了！',
						duration: '1200'
					});
				}
			});
		};
	})

	.controller('userMyMessageCtrl', function ($scope, Notice, $ionicModal, $state, $ionicLoading) {
		$scope.select = 1;
		$scope.orderEmpty = false;
		$scope.active = function (id) {
			$scope.select = id;
			$scope.noMore = true;
			Notice.getList(id).then(function (response) {
				if (response.data == '' || response.data.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderEmpty = false;
					$scope.allNotice = response.data;
				}
			});
		};
		$scope.onSwipe = function (a) {
			if (a == 'l') {
				$scope.select++;
				if ($scope.select <= 4) {
					Notice.getList($scope.select).then(function (response) {
						if (response.data == '' || response.data.length == 0) {
							$scope.orderEmpty = true;
						} else {
							$scope.orderEmpty = false;
							$scope.allNotice = response.data;
						}
					});
				}
				$scope.select = Math.min(4, $scope.select);
			} else {
				$scope.select--;
				if ($scope.select > 0) {
					Notice.getList($scope.select).then(function (response) {
						if (response.data == '' || response.data.length == 0) {
							$scope.orderEmpty = true;
						} else {
							$scope.orderEmpty = false;
							$scope.allNotice = response.data;
						}
					});
				}
				$scope.select = Math.max(1, $scope.select);
			}
		}
		$scope.statusName = {
			'1': '未读',
			'2': '已读'
		};
		$scope.allNotice = {};
		Notice.getList().then(function (response) {
			if (response.data == '' || response.data.length == 0) {
				$scope.orderEmpty = true;
			} else {
				$scope.allNotice = response.data;
			}
		});
		// 跳转
		$scope.toUrl = function (id, type) {
			Notice.getInfo(id, type).then(function (data) {
				if (data.linkUrl.url == 'shops.orderInfo') {
					$state.go(data.linkUrl.url, {
						id: data.linkUrl.param.id,
						type: data.linkUrl.param.type
					});
				} else if (data.linkUrl.url == 'user.notice') {
					$state.go(data.linkUrl.url, {
						id: data.linkUrl.param.id
					});
				}
			});
		};
		// 下拉刷新
		$scope.doRefresh = function () {
			Notice.getList($scope.select).then(function (response) {
				$scope.allNotice = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '3000'
				});
			});
		};
		// 下拉加载
		$scope.noMore = true;
		$scope.page = 2;
		$scope.loadMore = function () {
			Notice.getList($scope.select, $scope.page).then(function (response) {
				$scope.page++;
				$scope.allNotice = $scope.allNotice.concat(response.data);
				$scope.$broadcast('scroll.infiniteScrollComplete');
				if (response.code != 0) {
					$scope.noMore = false;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多消息了！',
						duration: '1200'
					});
				}
			});
		};
	})

	.controller('userApplyCtrl', function ($scope, $ionicModal, Area, Apply, $state, ENV, $ionicScrollDelegate, $cordovaCamera, $ionicActionSheet, Message) {
		$scope.applyInfo = {
			userName: '',
			shopName: '',
			cName: '',
			shopPer: '',
			address: '',
			mobile: '',
			shopDescrip: '',
			selecedType: '',
			selectedBili: '',
			corrImg: '',
			falImg: '',
			businessImg: '',
			shopsImg: ''
		};
		$scope.selectType = {};
		$scope.applyBol = true;
		$scope.showShopDesc = function () {
			$scope.applyBol = !$scope.applyBol;
		};
		// 商家协议
		$ionicModal.fromTemplateUrl('templates/modal/shopAgreement.html', {
			scope: $scope,
			animation: 'slide-in-left'
		}).then(function (modal) {
			$scope.shopAgreement = modal;
		});
		$scope.showShopAgreement = function () {
			$scope.shopAgreement.show()
		};
		// 我的地址
		$scope.areaList = {};
		$scope.up = {};
		$scope.up.userInfo = {};
		$ionicModal.fromTemplateUrl('templates/modal/area.html', {
			scope: $scope,
			animation: 'slide-in-left'
		}).then(function (modal) {
			$scope.area = modal;
		});
		$scope.areaShow = function () {
			Area.getList(function (data) {
				$scope.areaList = $scope.areaData = data;
			});
			$scope.area.show();
		};
		$scope.selectArea = function (id) {
			$ionicScrollDelegate.scrollTop();
			var pid = id.substr(0, 2) + "0000";
			var cid = id.substr(0, 4) + "00";
			if (id.substr(0, 2) != "00" && id.substr(2, 2) != "00" && id.substr(4, 2) != "00") {
				$scope.up.userInfo.area = $scope.areaData[pid].title + " " + $scope.areaData[pid]['cities'][cid].title + " " + $scope.areaData[pid]['cities'][cid]['districts'][id];
				$scope.area.hide();
				return true;
			}
			if (id.substr(0, 2) != "00" && id.substr(2, 2) != "00") {
				$scope.areaList = $scope.areaData[pid]['cities'][id]['districts'];
				if ($scope.areaList.length <= 0) {
					$scope.up.userInfo.area = $scope.areaData[pid].title + " " + $scope.areaData[pid]['cities'][cid].title + " " + "其他（县/区）";
					$scope.area.hide();
				}
				return true;
			}
			if (id.substr(0, 2) != "00") {
				$scope.areaList = $scope.areaData[pid]['cities'];
				return true;
			}
		};

		/*上传证件照*/
		$scope.uploadAvatar = function (type) {
			var buttons = [{
				text: "拍一张照片"
			}, {
					text: "从相册选一张"
				}];
			$ionicActionSheet.show({
				buttons: buttons,
				titleText: '请选择',
				cancelText: '取消',
				buttonClicked: function (index) {
					if (index == 0) {
						selectImages("camera", type);
					} else if (index == 1) {
						selectImages("", type);
					}
					return true;
				}
			})
		};

		var selectImages = function (from, type) {
			var options = {
				quality: 100,
				destinationType: Camera.DestinationType.DATA_URL,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
				allowEdit: false,
				targetWidth: 1000,
				targetHeight: 1000,
				correctOrientation: true,
				cameraDirection: 0
			};
			if (from == 'camera') {
				options.sourceType = Camera.PictureSourceType.CAMERA;
			}
			document.addEventListener("deviceready", function () {
				$cordovaCamera.getPicture(options).then(function (imageURI) {
					if (type == 1) { //身份证正面照
						$scope.applyInfo.corrImg = "data:image/jpeg;base64," + imageURI;
						var image1 = document.getElementById('divImg01');
						image1.style.backgroundImage = "url(data:image/jpeg;base64," + imageURI + ")";
					} else if (type == 2) { //身份证反面照
						$scope.applyInfo.falImg = "data:image/jpeg;base64," + imageURI;
						var image2 = document.getElementById('divImg02');
						image2.style.backgroundImage = "url(data:image/jpeg;base64," + imageURI + ")";
					} else if (type == 3) { //营业执照
						$scope.applyInfo.businessImg = "data:image/jpeg;base64," + imageURI;
						var image3 = document.getElementById('divImg03');
						image3.style.backgroundImage = "url(data:image/jpeg;base64," + imageURI + ")";
					} else if (type == 4) { //商铺封面照
						$scope.applyInfo.shopsImg = "data:image/jpeg;base64," + imageURI;
						var image4 = document.getElementById('divImg04');
						image4.style.backgroundImage = "url(data:image/jpeg;base64," + imageURI + ")";
					}
				}, function (error) {
					Message.show('选择失败,请重试.', 1000);
				});
			}, false);
		};
		// 获取商家经营类型
		Apply.getApplyType().then(function (data) {
			$scope.selectType = data;
		});
		$scope.selectType = {};
		// 提交商家申请信息
		$scope.apply = function () {
			if (!$scope.applyInfo.userName) {
				Message.show("商家账号不能为空！");
				return false;
			}
			if (!$scope.applyInfo.shopName) {
				Message.show("商户名称不能为空！");
				return false;
			}
			if (!$scope.applyInfo.cName) {
				Message.show("请输入商家负责人名字！");
				return false;
			}
			if (!$scope.applyInfo.shopPer) {
				Message.show("请输入商家推荐人名字！");
				return false;
			}
			if (!$scope.up.userInfo.area) {
				Message.show("请选择地址！");
				return false;
			}
			if (!$scope.applyInfo.address) {
				Message.show("请输入您的详细地址！");
				return false;
			}
			if (!$scope.applyInfo.mobile || !ENV.REGULAR_MOBILE.test($scope.applyInfo.mobile)) {
				Message.show("请输入正确的联系方式！");
				return false;
			}
			if (!$scope.applyInfo.shopDescrip) {
				Message.show("请输入您的商家描述信息！");
				return false;
			}
			if (!$scope.applyInfo.selecedType) {
				Message.show("请选择商户经营类型！");
				return false;
			}
			if (!$scope.applyInfo.selectedBili) {
				Message.show("请选择商户让利类型！");
				return false;
			}
			if (!$scope.applyInfo.corrImg) {
				Message.show("请上传您的法人身份证正面照！");
				return false;
			}
			if (!$scope.applyInfo.falImg) {
				Message.show("请上传您的法人身份证反面照！");
				return false;
			}
			if (!$scope.applyInfo.businessImg) {
				Message.show("请上传您的营业执照！");
				return false;
			}
			if (!$scope.applyInfo.shopsImg) {
				Message.show("请上传您的商铺封面照！");
				return false;
			}
			Apply.subApply($scope.applyInfo, $scope.up.userInfo.area).then(function (data) {
				$state.go('tab.my');
			});
		}
	})
	// 商家申请审核等待提示页
	.controller('shopsWaitCtrl', function ($scope, Apply) {
		$scope.checks = function () {
			Apply.refreshApply();
		}
	})
	.controller('userNoticeCtrl', function ($scope, $stateParams, Notice, $ionicLoading) {
		$scope.orderInfo = {};
		Notice.getInfo($stateParams.id).then(function (data) {
			$scope.orderInfo = data;
			console.log($scope.orderInfo);
		})

		$scope.doRefresh = function () {
			Notice.getInfo($stateParams.id).then(function (data) {
				$scope.orderInfo = data;
				$scope.$broadcast("scroll.refreshComplete");
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '3000'
				});
			})
		}
	})

	.controller('userMyBeanCtrl', function ($scope, User) {
		$scope.myBean = {};
		User.myBean().then(function (data) {
			$scope.myBean = data;
		})
	})

	.controller('userGiveListCtrl', function ($scope, User, $ionicLoading, $stateParams) {
		$scope.type = $stateParams.type;
		$scope.giveList = {};
		$scope.orderEmpty = false;
		$scope.select = $scope.type || 1;
		User.giveList($scope.select).then(function (response) {
			if (response.data == '' || response.data.length == 0) {
				$scope.orderEmpty = true;
			} else {
				$scope.orderEmpty = false;
				$scope.giveList = response.data
			}
		});

		$scope.active = function (id) {
			$scope.select = id;
			$scope.noMore = false;
			User.giveList(id).then(function (response) {
				if (response.data == '' || response.data.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderEmpty = false;
					$scope.giveList = response.data
				}
			});
		};

		// 下拉刷新
		$scope.doRefresh = function () {
			User.giveList($scope.select).then(function (response) {
				$scope.giveList = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '3000'
				});
			});
		};
		// 下拉加载
		$scope.noMore = false;
		$scope.page = 2;
		$scope.loadMore = function () {
			User.giveList($scope.select, $scope.page).then(function (response) {
				$scope.page++;
				$scope.giveList = $scope.giveList.concat(response.data);
				$scope.$broadcast('scroll.infiniteScrollComplete');
				if (response.code != 0) {
					$scope.noMore = true;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多记录了！',
						duration: '1200'
					});
				}
			});
		};
	})

	.controller('userTotalBeanCtrl', function ($scope, User, $stateParams, $ionicLoading) {
		$scope.type = $stateParams.type;
		$scope.orderEmpty = false;
		$scope.selected = 1; //比例
		$scope.role = 1; //角色
		$scope.myVar = false;
		$scope.totalBean = {
			all_price: '',
			list: '',
			rebateInfo: ''
		};
		User.recommendBean($scope.type, $scope.selected, 1, $scope.role).then(function (response) {
			$scope.totalBean = response.data;
			if (response.data.list == '' || response.data.list.length == 0) {
				$scope.orderEmpty = true;
			} else {
				$scope.orderEmpty = false;
			}
		});
		$scope.toggle = function () {
			$scope.myVar = !$scope.myVar;
		};

		$scope.selectRole = function (role) {
			$scope.myVar = !$scope.myVar;
			$scope.role = role;
			User.recommendBean($scope.type, $scope.selected, 1, $scope.role).then(function (response) {
				$scope.totalBean = response.data;
				if (response.data.list == '' || response.data.list.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderEmpty = false;
				}
			});
		};

		$scope.selectBili = function (id) {
			$scope.selected = id;
			$scope.noMore = false;
			User.recommendBean($scope.type, id, 1, $scope.role).then(function (response) {
				$scope.totalBean = response.data;
				if (response.data.list == '' || response.data.list.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderEmpty = false;
				}
			});
		};

		// 下拉刷新
		$scope.doRefresh = function () {
			User.recommendBean($scope.type, $scope.selected, $scope.page, $scope.role).then(function (response) {
				$scope.totalBean.list = response.data.list;
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '3000'
				});
			});
		};
		// 下拉加载
		$scope.noMore = false;
		$scope.page = 2;
		$scope.loadMore = function () {
			User.recommendBean($scope.type, $scope.selected, $scope.page, $scope.role).then(function (response) {
				$scope.page++;
				$scope.totalBean.list = $scope.totalBean.list.concat(response.data.list);
				$scope.$broadcast('scroll.infiniteScrollComplete');
				if (response.data.list.length == 0) {
					$scope.noMore = true;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多记录了！',
						duration: '1200'
					});
				}
			});
		};
	})

	.controller('userExcitationCtrl', function ($scope, User) {
		$scope.excitation = {
			user: '',
			userNum: '',
			userTitle: '',
			shop: '',
			shopsNum: '',
			shopsTitle: ''
		};
		User.getExcitation().then(function (data) {
			$scope.excitation = data;
		});

	})

	.controller('userLoveInfoCtrl', function ($scope, User, $ionicLoading, $ionicSlideBoxDelegate) {
		$scope.myVar = false;
		$scope.orderEmpty = false;
		$scope.role = 1;
		$scope.type = 1;
		$scope.loveInfo = {
			list: '',
			rebateInfo: '',
			roleInfo: '',
			loveNum: ''
		};
		User.loveInfo($scope.role, $scope.type).then(function (response) {
			$scope.loveInfo = response.data;
			if (response.data.list == '' || response.data.list.length == 0) {
				$scope.orderEmpty = true;
			} else {
				$scope.orderEmpty = false;
			}
		});
		$scope.select = function (role) {
			$scope.myVar = !$scope.myVar;
			$scope.role = role;
			User.loveInfo($scope.role, $scope.type).then(function (response) {
				$scope.loveInfo = response.data;
				if (response.data.list == '' || response.data.list.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderEmpty = false;
				}
			});
		};

		$scope.selectTab = function (type) {
			$scope.type = type;
			$scope.noMore = false;
			User.loveInfo($scope.role, $scope.type).then(function (response) {
				$scope.loveInfo = response.data;
				if (response.data.list == '' || response.data.list.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderEmpty = false;
				}
			});
			$ionicSlideBoxDelegate.slide(type);
		};
		// 侧滑
		$scope.onSwipe = function (a) {
			if (a == 'r') {
				$scope.type++;
				if ($scope.type <= 3) {
					User.loveInfo($scope.role, $scope.type).then(function (response) {
						$scope.loveInfo = response.data;
						if (response.data.list == '' || response.data.list.length == 0) {
							$scope.orderEmpty = true;
						} else {
							$scope.orderEmpty = false;
						}
					});
				}
				$scope.type = Math.min(3, $scope.type);
			} else {
				$scope.type--;
				if ($scope.type > 0) {
					User.loveInfo($scope.role, $scope.type).then(function (response) {
						$scope.loveInfo = response.data;
						if (response.data.list == '' || response.data.list.length == 0) {
							$scope.orderEmpty = true;
						} else {
							$scope.orderEmpty = false;
						}
					});
				}
				$scope.type = Math.max(1, $scope.type);
			}
		};

		// 下拉刷新
		$scope.doRefresh = function () {
			User.loveInfo($scope.role, $scope.type).then(function (response) {
				$scope.loveInfo.list = response.data.list;
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '3000'
				});
			});
		};
		// 下拉加载
		$scope.noMore = false;
		$scope.page = 2;
		$scope.loadMore = function () {
			User.loveInfo($scope.role, $scope.type, $scope.page).then(function (response) {
				$scope.page++;
				$scope.loveInfo.list = $scope.loveInfo.list.concat(response.data.list);
				$scope.$broadcast('scroll.infiniteScrollComplete');
				if (response.data.list.length == 0) {
					$scope.noMore = true;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多记录了！',
						duration: '1200'
					});
				}
			});
		};

	})
	.controller('myProfitCtrl', function ($scope, $rootScope, Consumer, $ionicPopup, $state, $ionicLoading, $filter) {
		$scope.orderEmpty = true;
		var date = new Date()
		var fullYear = date.getFullYear()
		var Month = date.getMonth() + 1
		var day = date.getDate()
		Month = Month < 10 ? '0' + Month : Month;
		console.log(Month)
		day = day < 10 ? '0' + day : day;
		$scope.today = fullYear + '-' + Month + '-' + day;
		$scope.moneyBack = {}
		$scope.moneyBack.date = $scope.today;
		Consumer.getMoneyBack($scope.moneyBack.date).then(function (response) {
			$scope.moneyBackInfo = response.data;
			if ($scope.moneyBackInfo.every) {
				$scope.orderEmpty = false;
			}

		})
		//切换日期
		$scope.test = function () {
			console.log($scope.moneyBack.date)
			var date = new Date($scope.moneyBack.date);
			var fullYear = date.getFullYear()
			var Month = date.getMonth() + 1
			var day = date.getDate();
			Month = Month < 10 ? '0' + Month : Month;
			day = day < 10 ? '0' + day : day;
			$scope.moneyBack.date = fullYear + '-' + Month + '-' + day;
			Consumer.getMoneyBack($scope.moneyBack.date).then(function (response) {
				$scope.moneyBackInfo = response.data;
				if ($scope.moneyBackInfo.every) {
					$scope.orderEmpty = false;
				}
			})
		}
		//下拉刷新
		$scope.doRefresh = function () {
			Consumer.getMoneyBack($scope.moneyBack.date).then(function (response) {
				console.log('nihao')
				$scope.moneyBackInfo = response.data;
				if ($scope.moneyBackInfo.every) {
					$scope.orderEmpty = false;
				}
			})
			$scope.$broadcast('scroll.refreshComplete');
			$ionicLoading.show({
				noBackdrop: true,
				template: '刷新成功！',
				duration: '2000'
			});
		};
		//上拉加载  我的收益中一天只有一条数据  不需要上拉加载
		// $scope.noMore = false;
		// $scope.page = 2;
		// $scope.loadMore = function () {
		// 	Order.Consumer($scope.moneyBack.date, page).then(function (response) {
		// 		$scope.page += 1;
		// 		$scope.moneyBackInfo.every = $scope.moneyBackInfo.every.concat(response.data.every);
		// 		if (response.code == 0) {
		// 			if (response.data.every.length == 0) {
		// 				$scope.noMore = true;
		// 				$ionicLoading.show({
		// 					noBackdrop: true,
		// 					template: '没有更多了！',
		// 					duration: '1200'
		// 				});
		// 			}
		// 		}
		// 		$scope.$broadcast('scroll.infiniteScrollComplete');
		// 	})
		// }
	})
	.controller('recommendProfitCtrl', function ($scope, $rootScope, Consumer, $ionicPopup, $state, $timeout) {
		$scope.info = {};
		$scope.orderEmpty = false;
		//请求
		Consumer.getRecProfit().then(function (data) {
			$scope.info = data;
			if (data.tuijian == '' || data.tuijian.length == 0) {
				$scope.orderEmpty = true;
			} else {
				$scope.orderEmpty = false;
				$scope.info = data;
			}
		})
		// 下拉刷新  等待修改
		$scope.doRefresh = function () {
			$scope.noMore = true;
			Consumer.getRecProfit().then(function (data) {
				$scope.info = data;
				if (data.tuijian == '' || data.tuijian.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderEmpty = false;
					$scope.info = data;
				}
				$scope.$broadcast('scroll.refreshComplete');
				$timeout(function () {
					$scope.noMore = false;
				}, 1000)
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '3000'
				});
			});
		};
		// 下拉加载  等待修改
		$scope.noMore = false;
		$scope.page = 2;
		$scope.loadMore = function () {
			Consumer.getRecProfit($scope.page).then(function (data) {
				$scope.page++;
				$scope.info.tuijian = $scope.info.tuijian.concat(data.tuijian);
				$scope.$broadcast('scroll.infiniteScrollComplete');
				if (data.tuijian.length == 0) {
					$scope.noMore = true;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多了！',
						duration: '1200'
					});
				}
			});
		};
	})
	.controller('sendRecProfitCtrl', function ($scope, $rootScope, Consumer, ENV, Message) {
		$scope.giveInfo = {}
		//获取可转增的积分
		Consumer.getSendRecMoney().then(function (data) {
			$scope.giveInfo.sum = data
		})
		//提交转增申请
		$scope.submit = function () {
			if (!$scope.giveInfo.userId) {
				Message.show('请输入获赠人ID');
				return;
			}
			if (!$scope.giveInfo.giveNum || !ENV.REGULAR_MONEY.test($scope.giveInfo.giveNum)) {
				Message.show('请输入转赠金额');
				return;
			}
			if ($scope.giveInfo.giveNum > $scope.giveInfo.sum) {
				Message.show('金额不足');
				return;
			}
			if (!$scope.giveInfo.payPassword) {
				Message.show('请输入支付密码');
				return;
			}
			Consumer.sendRecProfit($scope.giveInfo).then(function (data) {
				console.log('nihao')
				window.location.reload()
			})
		}
	})
	.controller('myIntroCtrl', function ($scope, $rootScope, Consumer, $timeout) {
		$scope.info = [];
		$scope.orderEmpty = false;
		// 请求我的推荐人
		Consumer.getIntro().then(function (data) {
			if (data == '' || data.length == 0) {
				$scope.orderEmpty = true;
			} else {
				$scope.orderEmpty = false;
				$scope.info = data;
			}
		})
		// 下拉刷新  等待修改
		$scope.doRefresh = function () {
			$scope.noMore = true;
			Consumer.getIntro().then(function (data) {
				if (data == '' || data.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderEmpty = false;
					$scope.info = data;
				}
				$scope.$broadcast('scroll.refreshComplete');
				$timeout(function () {
					$scope.noMore = false;
				}, 1000)
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '3000'
				});
			});
		};
		// 下拉加载  等待修改
		$scope.noMore = false;
		$scope.page = 2;
		$scope.loadMore = function () {
			Consumer.getIntro($scope.page).then(function (data) {
				$scope.page++;
				$scope.info = $scope.info.concat(data);
				$scope.$broadcast('scroll.infiniteScrollComplete');
				if (data.length == 0) {
					$scope.noMore = true;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多了！',
						duration: '1200'
					});
				}
			});
		};


	})
	.controller('totalCostCtrl', function ($scope, $rootScope, Consumer, $timeout) {
		var date = new Date()
		var fullYear = date.getFullYear()
		var Month = date.getMonth() + 1
		var day = date.getDate()
		Month = Month < 10 ? '0' + Month : Month;
		console.log(Month)
		day = day < 10 ? '0' + day : day;
		$scope.today = fullYear + '-' + Month + '-' + day;
		console.log($scope.today)
		$scope.finance = {}
		$scope.finance.date = $scope.today;
		// $scope.finance.date = '2017-04-25'
		$scope.orderEmpty = false;
		Consumer.getTotalCost($scope.finance.date).then(function (data) {
			$scope.financeInfo = data;
			$scope.orderEmpty = false;
			if (data.list == '' || data.list.length == 0) {
				$scope.orderEmpty = true;
			}

		})
		$scope.test = function () {
			var date = new Date($scope.finance.date);
			var fullYear = date.getFullYear()
			var Month = date.getMonth() + 1
			var day = date.getDate();
			Month = Month < 10 ? '0' + Month : Month;
			day = day < 10 ? '0' + day : day;
			$scope.finance.date = fullYear + '-' + Month + '-' + day;
			Consumer.getTotalCost($scope.finance.date).then(function (data) {
				$scope.financeInfo = data;
				$scope.orderEmpty = false;
				if (data.list == '' || data.list.length == 0) {
					$scope.orderEmpty = true;
				}
			})
		}

		//下拉刷新
		$scope.doRefresh = function () {
			$scope.noMore = true;
			Consumer.getTotalCost($scope.finance.date).then(function (data) {
				$scope.financeInfo = data;
				$scope.orderEmpty = false;
				if (data.list == '' || data.list.length == 0) {
					$scope.orderEmpty = true;
				}
				$scope.$broadcast('scroll.refreshComplete');
				$timeout(function () {
					$scope.noMore = false;
				}, 1000)
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '2000'
				});
			})

		};
		//上拉加载
		$scope.noMore = false;
		$scope.page = 2;
		$scope.loadMore = function () {
			Consumer.getTotalCost($scope.finance.date, $scope.page).then(function (response) {
				$scope.page += 1;
				$scope.financeInfo.list = $scope.financeInfo.list.concat(data.list);
				if (response.code == 0) {
					if (data.list.length == 0) {
						$scope.noMore = true;
						$ionicLoading.show({
							noBackdrop: true,
							template: '没有更多了！',
							duration: '1200'
						});
					}
				}
				$scope.$broadcast('scroll.infiniteScrollComplete');
			})
		}
	})
	.controller('sendRecProfitHistoryCtrl', function ($scope, $rootScope, Consumer) {
		$scope.info = {};
		$scope.orderEmpty = false;
		//请求
		Consumer.getsendRecHistory().then(function (data) {
			$scope.info = data;
			if (data == '' || data.length == 0) {
				$scope.orderEmpty = true;
			}
		})
		// 下拉刷新 //等待更待
		$scope.doRefresh = function () {
			Consumer.getsendRecHistory().then(function (data) {
				$scope.info = data;
				if (data == '' || data.length == 0) {
					$scope.orderEmpty = true;
				}
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '3000'
				});
			});
		};
		// 下拉加载  等待更改
		$scope.noMore = false;
		$scope.page = 2;
		$scope.loadMore = function () {
			User.loveInfo($scope.page).then(function (data) {
				$scope.page++;
				$scope.info = $scope.info.concat(data);
				$scope.$broadcast('scroll.infiniteScrollComplete');
				if (data.length == 0) {
					$scope.noMore = true;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多了！',
						duration: '1200'
					});
				}
			});
		};

	})
	.controller('getRealMoneyCtrl', function ($scope, $rootScope, Consumer, Message, ENV, $ionicPopup, $state) {
		// console.log($scope.info.cost.cash_less)
		$scope.info = {};
		//请求提现余额及其他
		Consumer.getRealMoneytotal().then(function (data) {
			$scope.info = data;
			$scope.info.bankName = data.bank.bankName || '中国建设银行';
			$scope.info.bankCard = data.bank.bankCard || '';
			$scope.info.bankMobile = data.bank.bankMobile || '';
			$scope.info.bankUserName = data.bank.bankUserName || '';
			$scope.info.takeMoney = ''
			if ($scope.info.money == 0) {
				$scope.allow = true;
			} else {
				$scope.allow = false;
			}

		})
		$scope.submit = function () {
			if (!$scope.info.bankName) {
				Message.show('请输入银行全称');
				return;
			}
			if (!$scope.info.bankCard || !ENV.BANK_CARD.test($scope.info.bankCard)) {
				Message.show('请输入正确的银行卡号');
				return;
			}
			if (!$scope.info.bankUserName) {
				Message.show('请输入银行开户姓名');
				return;
			}
			if (!$scope.info.bankMobile) {
				Message.show('请输入银行预留手机号');
				return;
			}
			if (!$scope.info.takeMoney || !ENV.REGULAR_MONEY.test($scope.info.takeMoney)) {
				Message.show('请输入提现金额');
				return;
			}
			if ($scope.info.takeMoney > $scope.info.money) {
				Message.show('提现余额不足');
				return;
			}
			if ($scope.info.takeMoney < $scope.info.cost.cash_less) {
				console.log('yanby')
				Message.show('单次提现金额最低为' + $scope.info.cost.cash_less + '元');
				return false;
			}
			if ($scope.info.takeMoney > $scope.info.cost.cash_most) {
				Message.show('单日提现金额最高为' + $scope.info.cost.cash_most + '元');
				return false;
			}

			Consumer.applyRealMoney($scope.info).then(function (data) {
				var alertPopup = $ionicPopup.alert({
					title: '申请已提交',
				});
				alertPopup.then(function (res) {
					$state.go('my.repoList')
				});
			})

		}
	})
	.controller('RepoListCtrl', function ($scope, $rootScope, Consumer, Message, ENV, $ionicPopup, $state, $stateParams, $timeout) {
		$scope.type = $stateParams.type;
		$scope.repoList = {};
		$scope.orderEmpty = false;
		$scope.select = $scope.type || 1;
		Consumer.getRepoList($scope.select).then(function (response) {
			if (response.data == '' || response.data.length == 0) {
				$scope.orderEmpty = true;
			} else {
				$scope.orderEmpty = false;
				$scope.repoList = response.data
			}
		});

		$scope.active = function (id) {
			$scope.select = id;
			$scope.noMore = false;
			Consumer.getRepoList(id).then(function (response) {
				if (response.data == '' || response.data.length == 0) {
					$scope.orderEmpty = true;
				} else {
					$scope.orderEmpty = false;
					$scope.repoList = response.data
				}
			});
		};

		// 下拉刷新
		$scope.doRefresh = function () {
			$scope.noMore = true;
			Consumer.getRepoList($scope.select).then(function (response) {
				$scope.repoList = response.data;
				$scope.$broadcast('scroll.refreshComplete');
				$timeout(function () {
					$scope.noMore = false;
				}, 1000)
				$ionicLoading.show({
					noBackdrop: true,
					template: '刷新成功！',
					duration: '3000'
				});
			});
		};
		// 下拉加载
		$scope.noMore = false;
		$scope.page = 2;
		$scope.loadMore = function () {
			Consumer.getRepoList($scope.select, $scope.page).then(function (response) {
				$scope.page++;
				$scope.repoList = $scope.repoList.concat(response.data);
				$scope.$broadcast('scroll.infiniteScrollComplete');
				if (response.code != 0) {
					$scope.noMore = true;
					$ionicLoading.show({
						noBackdrop: true,
						template: '没有更多了！',
						duration: '1200'
					});
				}
			});
		};
	})
	.controller('RepoInfoCtrl', function ($scope, Message, Consumer, $stateParams) {
		$scope.id = $stateParams.id;
		$scope.repoInfo = {};
		$scope.orderEmpty = false;
		Consumer.getRepoInfo($scope.id).then(function (response) {
			if (response.data == '' || response.data.length == 0) {
				$scope.orderEmpty = true;
			} else {
				$scope.repoInfo = response.data;
			}
		});
	})
	;