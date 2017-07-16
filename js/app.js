angular.module('starter', ['ionic', 'starter.controllers', 'starter.routes', 'starter.services', 'starter.directives', 'ngCordova', 'ngResource', 'ngTouch', 'angular-md5'])
	.run(function ($rootScope, $ionicPlatform, $ionicLoading, $location, $ionicHistory, $state, $interval, $cordovaSplashscreen, Message, Storage, User, System, Jpush, Notice) {
		$ionicPlatform.ready(function () {
			if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
				cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
				cordova.plugins.Keyboard.disableScroll(true);
			}
			if (window.StatusBar) {
				StatusBar.backgroundColorByHexString("#ff5b1f");
				StatusBar.styleDefault();
			}

			// 获取服务器上的消息通知
			//  $interval(Notice.getNotice, 5000);
		});

		// 初始化全局变量
		$rootScope.globalInfo = {
			user: (function () {
				return Storage.get('user') || { uid: '', isShop: 0 }
			})(),
			//    user: {uid:'123'
			//    }, 全局user的数据
			lngLat: {
				lng: '',
				lat: ''
			},
			noticeNum: ''
		};



		/*        $rootScope.$on('监控事件',
		
					function(event, toState, toParams, fromState, fromParams){ ... }
		
			}]);*/


		// 监听路由变化
		// $rootScope.$on('$stateChangeStart', function (event, toState){
		// 	 var noNeedLogin = ['auth.login', 'auth.register', 'auth.resetPsd', 'oneLogin','tab.home','shops.shopsList','shops.shopsCategory'];
		// 	 if (noNeedLogin.indexOf(toState.name) < 0 && !User.checkAuth()) {
		// 	 	$state.go("auth.login");//跳转到登录页
		// 	 	event.preventDefault(); //阻止默认事件，即原本页面的加载
		// 	 }
		// });
		$rootScope.$on('$stateChangeStart', function (event, toState) {
			var noNeedLogin = ['tab.ordertc', 'tab.tcmytc'];
			if (noNeedLogin.indexOf(toState.name) >= 0 && !User.checkAuth()) {
				$state.go("auth.login");//跳转到登录页
				event.preventDefault(); //阻止默认事件，即原本页面的加载
			}
		});

		// cordova初始化后的操作
		document.addEventListener("deviceready", function () {
			//退出启动画面
			setTimeout(function () {
				try {
					$cordovaSplashscreen.hide();
				} catch (e) {
					console.info(e);
				}
			}, 700);
			// Jpush.init();// 极光推送
			System.checkUpdate();//检查更新
		}, false);

		//退出
		var exit = false;
		$ionicPlatform.registerBackButtonAction(function (e) {
			if ($location.path() == '/tab/home') {
				if (exit) {
					ionic.Platform.exitApp();
				} else {
					exit = true;
					Message.show('再按一次退出系统', "1000");
					setTimeout(function () {
						exit = false;
					}, 3000);
				}
			} else if ($ionicHistory.backView()) {
				$ionicHistory.goBack();
			} else {
				exit = true;
				Message.show('再按一次退出系统', "1000");
				setTimeout(function () {
					exit = false;
				}, 3000);
			}
			e.preventDefault();
			return false;
		}, 101);
	})

	.constant('ENV', {
		'REGULAR_MONEY': /^\d*(\.\d{1,2}){0,1}$/,
		'REGULAR_MOBILE': /^1\d{10}$/,
		'REGULAR_IDCARD': /(^\d{15}$)|(^\d{17}(\d|[X,x])$)/,
		'BANK_CARD': /^(\d{16}|\d{19})$/,
		// 'YD_URL': 'http://192.168.0.122/app/index.php?i=1&c=entry&m=dgmc',
		'YD_URL': 'http://zhsc.weishang6688.com/app/index.php?i=1&c=entry&m=dgmc',
		'default_avatar': 'img/nav.png'
	})

	.config(function ($ionicConfigProvider) {
		$ionicConfigProvider.platform.ios.tabs.style('standard');
		$ionicConfigProvider.platform.ios.tabs.position('bottom');
		$ionicConfigProvider.platform.android.tabs.style('standard');
		$ionicConfigProvider.platform.android.tabs.position('bottom');
		$ionicConfigProvider.platform.ios.navBar.alignTitle('center');
		$ionicConfigProvider.platform.android.navBar.alignTitle('center');
		$ionicConfigProvider.platform.ios.backButton.previousTitleText('').icon('ion-ios-arrow-thin-left');
		$ionicConfigProvider.platform.android.backButton.previousTitleText('').icon('ion-android-arrow-back');
		$ionicConfigProvider.platform.ios.views.transition('ios');
		$ionicConfigProvider.platform.android.views.transition('android');
		$ionicConfigProvider.views.swipeBackEnabled(false);
		$ionicConfigProvider.views.transition('no')
	})

	.config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider, $httpProvider) {
		$httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
		$httpProvider.defaults.headers.put['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
		$httpProvider.defaults.withCredentials = true;
		var param = function (obj) {
			var query = '', name, value, fullSubName, subName, subValue, innerObj, i;
			for (name in obj) {
				value = obj[name];
				if (value instanceof Array) {
					for (i = 0; i < value.length; ++i) {
						subValue = value[i];
						fullSubName = name + '[' + i + ']';
						innerObj = {};
						innerObj[fullSubName] = subValue;
						query += param(innerObj) + '&';
					}
				}
				else if (value instanceof Object) {
					for (subName in value) {
						subValue = value[subName];
						fullSubName = name + '[' + subName + ']';
						innerObj = {};
						innerObj[fullSubName] = subValue;
						query += param(innerObj) + '&';
					}
				}
				else if (value !== undefined && value !== null)
					query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
			}
			return query.length ? query.substr(0, query.length - 1) : query;
		};
		$httpProvider.defaults.transformRequest = [function (data) {
			return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
		}];
		/*$httpProvider.defaults.headers.post['X-CSRFToken'] = 11;*/
		$httpProvider.interceptors.push('TokenAuth');
	});

