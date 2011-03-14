YUI.add("fade", function (Y) {
	var el = null,
	    body,
	    resizeTimer,
	    resizeThrottle = 250,
	    css = {
	    position: "fixed",
	    display: "none",
	    backgroundColor: "#000",
	    opacity: 0.9,
	    top: 0,
	    left: 0,
	    width: 0,
	    height: 0,
	    zIndex: 1000,
	};

	Y.Fade = {
		element: element,

		show: function() {
			var el = element();

			css.display = "block";
			resize();
			el.setStyles(css);

			body.addClass("scrollable");
		},

		hide: function() {
			css.display = "none";
			element().setStyles(css);

			body.removeClass("scrollable");
		}
	};

	function element() {
		if (el === null) {
			el = Y.Node.create("<div>");
			el.setStyles(css);
			body = Y.one("body").append(el);
		}
		return el;
	};

	function resize() {
		css.width = el.get("winWidth");
		css.height = el.get("winHeight");
		if (css.display === "block") {
			el.setStyles(css);
		}
	}

	Y.on("resize", function () {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(resize, resizeThrottle);
	}, window);
}, "1.0.0", {requires: ["node"]});
