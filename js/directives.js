angular.module('starter.directives', [])

	.directive('hideTabs', function($rootScope) {
		return {
			restrict: 'A',
			link: function($scope, $el) {
				$rootScope.hideTabs = true;
				$scope.$on('$destroy', function() {
					$rootScope.hideTabs = false;
				});
			}
		};
	})

	.directive('errSrc', function () {
		return {
			link: function (scope, element, attrs) {
				element.bind('error', function () {
					if (attrs.src != attrs.errSrc) {
						attrs.$set('src', attrs.errSrc);
					}
				});
			}
		}
	})

	// 回车触发函数
	.directive('ngEnter', function() {
		return function (scope, element, attrs) {
			element.bind("keydown keypress", function (event) {
				if (event.which === 13) {
					scope.$apply(function () {
						scope.$eval(attrs.ngEnter, {'event': event});
					});

					event.preventDefault();
				}
			});
		}
	})

	// 点击更新图片
	.directive('updateImg', function() {
		return function (scope, element, attrs) {
			element.bind("click", function () {
				element[0].src = attrs.src;
			});
		}
	})

	.directive('onFinishRenderFilters', function ($timeout) {
		return {
			restrict: 'A',
			link: function(scope, element, attr) {
				if (scope.$last === true) {
					$timeout(function() {
						scope.$emit('ngRepeatFinished');
					});
				}
			}
		};
	})

	// 动态设置ion-scroll的高度
	.directive('scrollHeight',function($window){
		return{
			restrict:'AE',
			link:function(scope,element){
				element[0].style.height=($window.innerHeight-44-40-45)+'px';
			}
		}
	})

	.filter('minNum', function () {
		return function (str, num) {
			num = num || 0;
			if(isNaN(str)){
				str = parseInt(str);
			}
			if(parseInt(str) < num){
				str = num;
			}
			return str;
		}
	})
	.directive("ngTouchmove", function () {
		return {
			controller: function ($scope, $element, $attrs) {
				console.log($element);
				$element.bind('touchstart', onTouchStart);

				function onTouchStart(event) {
					event.preventDefault();
					$element.bind('touchmove', onTouchMove);
					$element.bind('touchend', onTouchEnd);
				}

				function onTouchMove(event) {
					var method = $element.attr('ng-touchmove');
					$scope.$event = event;
					$scope.$apply(method);
				}

				function onTouchEnd(event) {
					event.preventDefault();
					$element.unbind('touchmove', onTouchMove);
					$element.unbind('touchend', onTouchEnd);
				}
			}
		};
	})
	.directive("arcChart", function () {
		return {
			restrict: 'C',
			link: function (scope, element, attrs) {
				element[0].width = 180*2;
				element[0].height = 180*2;
				var color = [["#339933", "rgba(51, 153, 51, 0.6)"], ["#0066cc", "rgba(0, 102, 204, 0.6)"], ["#ff0033", "rgba(255, 0, 51, 0.6)"]];
				var ctx = element[0].getContext("2d");

				scope.$on("chart-update", function (event, arcData) {
					// 绘制默认样式
					drawArc("#dddddd", 0, 360);
					var start = 0;
					var end = 0;
					var data = arcData.chart || [];
					var all = arcData.all || 1;
					angular.forEach(data, function (item, i) {
						end = start + (item["loveing"])/all*360;
						drawArc(color[i][0], start, end);
						start = end;
						end = start + (item["love"] - item["loveing"])/all*360;
						drawArc(color[i][1], start, end);
						start = end;
					});
				});

				function drawArc (color, start, end){
					start = Math.min(360, start);
					end = Math.min(360, end);
					ctx.strokeStyle = color || "#dddddd";
					ctx.lineWidth=60;
					ctx.beginPath();
					ctx.arc(180, 180, 150, Math.PI * (1 + start / 180), Math.PI * (1 + end / 180));
					ctx.stroke();
				}
			}
		}
	});

