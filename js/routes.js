angular.module('starter.routes', [])
	.config(function ($stateProvider, $urlRouterProvider) {
		// Ionic uses AngularUI Router which uses the concept of states
		// Learn more here: https://github.com/angular-ui/ui-router
		// Set up the various states which the app can be in.
		// Each state's controller can be found in controllers.js
		$stateProvider
			// setup an abstract state for the tabs directive
			.state('tab', {
				url: '/tab',
				abstract: true,
				templateUrl: 'templates/tabs.html'
			})

			.state('tab.home', {
				url: '/home',
				// cache: false,
				views: {
					'tab-home': {
						templateUrl: 'templates/tab/tab-home.html',
						controller: 'homeCtrl'
					}
				}
			})
			.state('tab.location', {
				url: '/location',
				params: {
					"cid": null,
					"title": 'null'
				},
				cache: false,
				views: {
					'tab-location': {
						templateUrl: 'templates/tab/tab-location.html',
						controller: 'locationCtrl'
					}
				}
			})
			.state('tab.notice', {
				url: '/notice',
				// cache: false,
				views: {
					'tab-notice': {
						templateUrl: 'templates/tab/tab-notice.html',
						controller: 'userHelpCtrl'
					}
				}
			})
			.state('tab.ordertc', {
				url: '/ordertc',
				params: {
					type: 'user'
				},
				// cache: false,
				views: {
					'tab-ordertc': {
						templateUrl: 'templates/tab/tab-ordertc.html',
						controller: 'ordertcCtrl'
					}
				}
			})
			.state('tab.tcmytc', {
				url: '/tcmytc',
				// cache: false,
				views: {
					'tab-tcmytc': {
						templateUrl: 'templates/tab/tab-tcmytc.html',
						controller: 'myCtrl'
					}
				}
			})
			.state('tab.list', {
				url: '/list',
				cache: false,
				views: {
					'tab-list': {
						templateUrl: 'templates/tab/tab-list.html',
						controller: 'listCtrl'
					}
				}
			})

			.state('tab.my', {
				url: '/my',
				cache: false,
				views: {
					'tab-my': {
						templateUrl: 'templates/tab/tab-my.html',
						controller: 'myCtrl'
					}
				}
			})

			.state('tab.count', {
				url: '/count',
				cache: false,
				views: {
					'tab-count': {
						templateUrl: 'templates/tab/tab-count.html',
						controller: 'countCtrl'
					}
				}
			})
			.state('articles', {
				url: '/articles',
				abstract: true,
				template: '<ion-nav-view></ion-nav-view>'
			})
			.state('articles.articlesInfo', {
				url: '/articlesInfo/:id',
				params: {
					id: null
				},
				templateUrl: 'templates/article/articlesInfo.html',
				controller: 'articlesInfoCtrl'
			})
			.state('goods', {
				url: '/goods',
				abstract: true,
				template: '<ion-nav-view></ion-nav-view>'
			})
			.state('goods.goodsInfo', {
				url: '/goodsInfo/:goodsNo',
				params: {
					goodsNo: null,
					spid: null
				},
				templateUrl: 'templates/good/goodsInfo.html',
				controller: 'goodsInfoCtrl'
			})
			.state('modals', {
				url: '/modals',
				abstract: true,
				template: '<ion-nav-view></ion-nav-view>'
			})
			.state('modals.location', {
				url: '/location',
				params: {
					id: null
				},
				templateUrl: 'templates/modal/location.html',
				controller: 'homeCtrl'
			})
			.state('shops', {
				url: '/shop',
				abstract: true,
				template: '<ion-nav-view></ion-nav-view>'
			})
			.state('shops.shopsList', {
				url: '/shopsList/:cid',
				// cache: false,
				params: {
					cid: null
				},
				templateUrl: 'templates/shop/shopsList.html',
				controller: 'shopsListCtrl'
			})
			.state('shops.shopsCategory', {
				url: '/shopsCategory/:keywords',
				templateUrl: 'templates/shop/shopsCategory.html',
				controller: 'shopsCategoryCtrl'
			})
			.state('shops.shopsInfo', {
				url: '/shopsInfo/:spid',
				params: {
					type: null,
					spid: null
				},
				cache: false,
				templateUrl: 'templates/shop/shopsInfo.html',
				controller: 'shopsInfoCtrl'
			})

			.state('shops.orderInfo', {
				url: '/orderInfo/:id/:type',
				params: {
					id: null,
					type: null
				},
				cache: false,
				templateUrl: 'templates/shop/orderInfo.html',
				controller: 'shopsOrderInfoCtrl'
			})
			.state('shops.ordersubInfo', {
				url: '/ordersubInfo/:id/:type',
				params: {
					id: null,
					type: null,
					orderId: null
				},
				cache: false,
				templateUrl: 'templates/shop/ordersubInfo.html',
				controller: 'shopsOrderInfoCtrl'
			})
			.state('shops.payorderInfo', {
				url: '/payorderInfo/:id/:type',
				params: {
					id: null,
					type: null
				},
				cache: false,
				templateUrl: 'templates/shop/payorderInfo.html',
				controller: 'shopsOrderInfoCtrl'
			})
			.state('shops.evaluate', {
				url: '/evaluate/:id/:type',
				params: {
					id: null,
					type: null
				},
				cache: false,
				templateUrl: 'templates/shop/evaluate.html',
				controller: 'evaluateCtrl'
			})
			.state('shops.wait', {
				url: '/wait',
				templateUrl: 'templates/shop/waiting.html',
				controller: 'shopsWaitCtrl'
			})
			.state('shops.orderList', {
				url: '/orderList/:type',
				params: {
					type: '',
					orderStatus: null,
					payStatus: null,
					isComment: null
				},
				cache: false,
				templateUrl: 'templates/shop/orderList.html',
				controller: 'shopOrderListCtrl'
			})

			.state('shops.qrcode', {
				url: '/qrcode',
				templateUrl: 'templates/shop/qrcode.html',
				controller: 'shopQrcodeCtrl'
			})

			.state('shops.center', {
				url: '/center',
				templateUrl: 'templates/shop/center.html',
				controller: 'shopCenterCtrl'
			})

			.state('shops.pay', {
				url: '/pay/:orderId/:spid/:payPrice',
				params: {
					orderId: '',
					spid: '',
					payPrice: ''
				},
				templateUrl: 'templates/shop/pay.html',
				controller: 'shopPayCtrl'
			})
			.state('shops.credit', {
				url: '/pay/:orderId/:spid/:payPrice',
				params: {
					orderId: '',
					spid: '',
					payPrice: ''
				},
				templateUrl: 'templates/shop/credit.html',
				controller: 'shopPayCtrl'
			})
			.state('auth', {
				url: '/auth',
				abstract: true,
				template: '<ion-nav-view></ion-nav-view>'
			})

			.state('auth.login', {
				url: '/login',
				cache: false,
				templateUrl: 'templates/auth/login.html',
				controller: 'loginCtrl'
			})

			.state('auth.register', {
				url: '/register',
				cache: false,
				templateUrl: 'templates/auth/register.html',
				controller: 'registerCtrl'
			})

			.state('auth.resetPsd', {
				url: '/resetPsd',
				cache: false,
				templateUrl: 'templates/auth/resetPsd.html',
				controller: 'resetPsdCtrl'
			})
			.state('my', {
				url: '/my',
				abstract: true,
				template: '<ion-nav-view></ion-nav-view>'
			})
			.state('my.consume', {
				url: '/consume',
				cache: false,
				templateUrl: 'templates/my/consume.html',
				controller: 'consumeCtrl'
			})
			.state('my.myProfit', {
				url: '/myProfit',
				cache: false,
				templateUrl: 'templates/my/myProfit.html',
				controller: 'myProfitCtrl'
			})
			.state('my.eval', {
				url: '/eval',
				templateUrl: 'templates/my/eval.html',
				controller: 'consumeCtrl'
			})
			.state('my.profit', {
				url: '/profit',
				cache: false,
				templateUrl: 'templates/my/profit.html',
				controller: 'profitCtrl'
			})
			.state('my.recommendProfit', {
				url: '/recommendProfit',
				cache: false,
				templateUrl: 'templates/my/recommendProfit.html',
				controller: 'recommendProfitCtrl'
			})
			.state('my.sendRecProfit', {
				url: '/sendRecProfit',
				cache: false,
				templateUrl: 'templates/my/sendRecProfit.html',
				controller: 'sendRecProfitCtrl'
			})
			.state('my.sendRecProfitHistory', {
				url: '/sendRecProfitHistory',
				cache: false,
				templateUrl: 'templates/my/sendRecProfitHistory.html',
				controller: 'sendRecProfitHistoryCtrl'
			})
			.state('my.myIntro', {
				url: '/myIntro',
				cache: false,
				templateUrl: 'templates/my/myIntro.html',
				controller: 'myIntroCtrl'
			})
			.state('my.totalCost', {
				url: '/totalCost',
				cache: false,
				templateUrl: 'templates/my/totalCost.html',
				controller: 'totalCostCtrl'
			})
			.state('my.getRealMoney', {
				url: '/getRealMoney',
				cache: false,
				templateUrl: 'templates/my/getRealMoney.html',
				controller: 'getRealMoneyCtrl'
			})
			.state('my.repoList', {
				url: '/repoList/:type',
				params: {
					type: null
				},
				cache: false,
				templateUrl: 'templates/my/repoList.html',
				controller: 'RepoListCtrl'
			})
			.state('my.repoInfo', {
                url: '/repoInfo/:id',
                params: {
                    id: null
                },
                templateUrl: 'templates/my/repoInfo.html',
                controller: 'RepoInfoCtrl'
            })
			.state('my.mySuperior', {
				url: '/mySuperior',
				cache: false,
				templateUrl: 'templates/my/mySuperior.html',
				controller: 'mySuperiorCtrl'
			})
			.state('my.shopprofit', {
				url: '/shopprofit',
				templateUrl: 'templates/my/shopprofit.html',
				controller: 'consumeCtrl'
			})

			.state('my.browsed', {
				url: '/browsed',
				templateUrl: 'templates/my/browsed.html',
				controller: 'browsedCtrl'
			})
			.state('my.servercenter', {
				url: '/servercenter',
				templateUrl: 'templates/my/servercenter.html',
				controller: 'abouttcbjCtrl'
			})
			.state('my.abouttcbj', {
				url: '/abouttcbj',
				templateUrl: 'templates/my/abouttcbj.html',
				controller: 'abouttcbjCtrl'
			})
			.state('my.collection', {
				url: '/collection',
				templateUrl: 'templates/my/collection.html',
				controller: 'collectionCtrl'
			})
			.state('my.invitation', {
				url: '/invitation',
				cache: false,
				templateUrl: 'templates/my/invitation.html',
				controller: 'invitationCtrl'
			})
			.state('my.recommend', {
				url: '/recommend',
				cache: false,
				templateUrl: 'templates/my/recommend.html',
				controller: 'userRecommendCtrl'
			})
			.state('my.bussapply', {
				url: '/bussapply',
				templateUrl: 'templates/my/bussapply.html',
				controller: 'bussapplyCtrl'
			})
			.state('my.busscenter', {
				url: '/busscenter',
				templateUrl: 'templates/my/busscenter.html',
				controller: 'busscenterCtrl'
			})
			.state('my.myorderlist', {
				url: '/myorderlist/:type',
				params: {
					type: '',
					page: null
				},
				cache: false,
				templateUrl: 'templates/my/myorderlist.html',
				controller: 'myorderlistCtrl'
			})
			.state('my.myorderinfo', {
				url: '/myorderinfo/:type',
				params: {
					type: '',
					id: null
				},
				cache: false,
				templateUrl: 'templates/my/myorderinfo.html',
				controller: 'shopsOrderInfoCtrl'
			})
			.state('my.account', {
				url: '/account/:type',
				params: {
					type: ''
				},
				cache: false,
				templateUrl: 'templates/my/account.html',
				controller: 'myorderlistCtrl'
			})
			.state('my.getcashinfo', {
				url: '/getcashinfo/:type',
				params: {
					type: ''
				},
				cache: false,
				templateUrl: 'templates/my/getcashinfo.html',
				controller: 'myorderlistCtrl'
			})
			.state('my.accountinfo', {
				url: '/accountinfo/:type',
				params: {
					type: ''
				},
				cache: false,
				templateUrl: 'templates/my/accountinfo.html',
				controller: 'myorderlistCtrl'
			})
			.state('user', {
				url: '/user',
				abstract: true,
				template: '<ion-nav-view></ion-nav-view>'
			})

			.state('user.center', {
				url: '/center',
				templateUrl: 'templates/user/center.html',
				controller: 'userCenterCtrl'
			})

			.state('user.realName', {
				url: '/realName',
				// cache: false,
				templateUrl: 'templates/user/realName.html',
				controller: 'userRealNameCtrl'
			})

			.state('user.aboutUs', {
				url: '/aboutUs',
				cache: false,
				templateUrl: 'templates/user/aboutUs.html',
				controller: 'userAboutUsCtrl'
			})

			.state('user.loginPsw', {
				url: '/loginPsw/:type',
				params: {
					type: null
				},
				cache: false,
				templateUrl: 'templates/user/loginPsw.html',
				controller: 'userLoginPswCtrl'
			})
			.state('user.resetPayWord', {
				url: '/resetPayWord',
				params: {
					type: null
				},
				cache: false,
				templateUrl: 'templates/user/resetPayWord.html',
				controller: 'userResetPayWordCtrl'
			})
			.state('user.news', {
				url: '/news',
				templateUrl: 'templates/user/news.html',
				controller: 'userNewsCtrl'
			})

			.state('user.newsDetails', {
				url: '/newsDetails/:id',
				templateUrl: 'templates/user/newsDetails.html',
				controller: 'userNewsDetailsCtrl'
			})

			.state('user.userHelp', {
				url: '/userHelp',
				cache: false,
				templateUrl: 'templates/user/userHelp.html',
				controller: 'userHelpCtrl'
			})

			.state('user.donate', {
				url: '/donate',
				cache: false,
				templateUrl: 'templates/user/donate.html',
				controller: 'userDonateCtrl'
			})

			.state('user.donateList', {
				url: '/donateList',
				cache: false,
				templateUrl: 'templates/user/donateList.html',
				controller: 'userDonateListCtrl'
			})

			.state('user.repo', {
				url: '/repo',
				cache: false,
				templateUrl: 'templates/user/repo.html',
				controller: 'userRepoCtrl'
			})

			.state('user.repoList', {
				url: '/repoList/:type',
				params: {
					type: null
				},
				cache: false,
				templateUrl: 'templates/user/repoList.html',
				controller: 'userRepoListCtrl'
			})

			.state('user.repoInfo', {
				url: '/repoInfo/:id',
				params: {
					id: null
				},
				templateUrl: 'templates/user/repoInfo.html',
				controller: 'userRepoInfoCtrl'
			})

			.state('user.myBank', {
				url: '/myBank',
				cache: false,
				templateUrl: 'templates/user/myBank.html',
				controller: 'userMyBankCtrl'
			})

			.state('user.give', {
				url: '/give',
				cache: false,
				templateUrl: 'templates/user/give.html',
				controller: 'userGiveCtrl'
			})

			.state('user.recommend', {
				url: '/recommend',
				templateUrl: 'templates/user/recommend.html',
				controller: 'userRecommendCtrl'
			})

			.state('user.recommendHistory', {
				url: '/recommendHistory',
				templateUrl: 'templates/user/recommendHistory.html',
				controller: 'userRecommendHistoryCtrl'
			})

			.state('user.myMessage', {
				url: '/myMessage',
				cache: false,
				templateUrl: 'templates/user/myMessage.html',
				controller: 'userMyMessageCtrl'
			})

			.state('user.pay', {
				url: '/pay/:spid',
				params: {
					spid: null
				},
				cache: false,
				templateUrl: 'templates/user/pay.html',
				controller: 'userPayCtrl'
			})

			.state('user.apply', {
				url: '/apply',
				cache: false,
				templateUrl: 'templates/user/apply.html',
				controller: 'userApplyCtrl'
			})

			.state('user.notice', {
				url: '/notice/:id',
				params: {
					id: null
				},
				templateUrl: 'templates/user/notice.html',
				controller: 'userNoticeCtrl'
			})

			.state('user.myBean', {
				url: '/myBean',
				cache: false,
				templateUrl: 'templates/user/myBean.html',
				controller: 'userMyBeanCtrl'
			})

			.state('user.giveList', {
				url: '/giveList/:type',
				params: {
					type: null
				},
				cache: false,
				templateUrl: 'templates/user/giveList.html',
				controller: 'userGiveListCtrl'
			})

			.state('user.totalBean', {
				url: '/totalBean/:type',
				params: {
					type: null
				},
				cache: false,
				templateUrl: 'templates/user/totalBean.html',
				controller: 'userTotalBeanCtrl'
			})

			.state('user.excitation', {
				url: '/excitation',
				templateUrl: 'templates/user/excitation.html',
				controller: 'userExcitationCtrl'
			})

			.state('user.loveInfo', {
				url: '/loveInfo',
				cache: false,
				templateUrl: 'templates/user/loveInfo.html',
				controller: 'userLoveInfoCtrl'
			});

		$urlRouterProvider.otherwise('tab/home');
		// $urlRouterProvider.otherwise('tab/home');
	});