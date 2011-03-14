YUI.add("superscroll", function (Y) {
	var easing = Y.Easing.backOut;

	var requestAnimFrame = (function () {
		var rate = 16;

		return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function (callback) {
				setTimeout(callback, rate);
			}
	})();

	function constrain(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}

	function SuperScroll(config) {
		var xy;

		this._node = config.host;
		this._boundScroll = Y.bind(this._scroll, this);

		xy = this._node.getXY();

		this._offsetX = xy[0];
		this._offsetY = xy[1];

		Y.on("mousemove", Y.bind(this._defMouseMove, this), document);
		SuperScroll.superclass.constructor.apply(this, arguments);
	}

	SuperScroll.NAME = "superScroll";
	SuperScroll.NS = "superscroll";

	SuperScroll.ATTRS = {
		_nodeWidth: {
			getter: function () {
				if (!this._nodeWidth) {
					this._nodeWidth = parseInt(this._node.getComputedStyle("width"), 10);
				}

				return this._nodeWidth;
			}
		},

		_nodeHeight: {
			getter: function () {
				if (!this._nodeHeight) {
					this._nodeHeight = parseInt(this._node.getComputedStyle("height"), 10);
				}

				return this._nodeHeight;
			}
		},

		width: { value: 720 },
		height: { value: 480 },

		duration: { value: 1500 },

		mouseMoveThrottle: { value: 100 },

		disabled: { value: false }
	};

	Y.extend(SuperScroll, Y.Plugin.Base, {
		x: null,
		y: null,

		_captureX: null,
		_captureY: null,

		_initialX: 0,
		_initialY: 0,

		_offsetX: null,
		_offsetY: null,

		_mouseX: null,
		_mouseY: null,

		_beginX: null,
		_beginY: null,

		_distanceX: null,
		_distanceY: null,

		_lastUpdate: null,

		_boundScroll: null,

		_startTime: null,

		_nodeWidth: null,
		_nodeHeight: null,

		_defMouseMove: function (e) {
			if (this.get("disabled")) { return; }
			if (this._mouseX === e.pageX && this._mouseY === e.pageY) { return; }

			var vx = this._offsetX, vy = this._offsetY,
			    now = new Date().getTime();

			if (!this._lastUpdate) { this._lastUpdate = now; }
			if (this._lastUpdate + this.get("mouseMoveThrottle") > now) { return; }

			this._lastUpdate = now;

			this._captureX = constrain(e.pageX, vx, vx + this.get("width")) - vx;
			this._captureY = constrain(e.pageY, vy, vy + this.get("height")) - vy;

			this._mouseX = e.pageX;
			this._mouseY = e.pageY;

			this._startScroll();
		},

		_startScroll: function () {
			var x = this._captureX, y = this._captureY,
			    cw = this.get("width"), ch = this.get("height"),
			    vw = this.get("_nodeWidth"),
			    vh = this.get("_nodeHeight"),
			    dw, dh;

			this._startTime = new Date().getTime();
			this._initialX = this.x;
			this._initialY = this.y;

			dw = Math.max(vw - cw, 0);
			dh = Math.max(vh - ch, 0);

			this._distanceX = x / cw * dw;
			this._distanceY = y / ch * dh;

			requestAnimFrame(this._boundScroll);
		},

		_scroll: function (now) {
			var elapsed,
			    duration = this.get("duration"),
			    dx, dy,
			    ix = this._initialX, iy = this._initialY;

			now = now || new Date().getTime();
			elapsed = now - this._startTime;

			if (elapsed > duration) {
				return;
			}

			dx = easing(elapsed, ix, this._distanceX - ix, duration, 1),
			dy = easing(elapsed, iy, this._distanceY - iy, duration, 1);

			requestAnimFrame(this._boundScroll);
			this.scrollTo(dx, dy);
		},

		scrollTo: function (x, y) {
			this.x = x;
			this.y = y;

			this._node.setStyles({left: -~~x, top: -~~y});
		}
	});

	Y.SuperScroll = SuperScroll;
}, "1.0.0", {requires: ["plugin", "anim"]});
