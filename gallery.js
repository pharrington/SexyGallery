Function.prototype.curry = function () {
	var a = arguments, f = this;

	return function (arg) {
		var args = Array.prototype.slice.call(a);
		args.push(arg);

		return f.apply(window, args);
	};
};

YUI.add("gallery", function (Y) {
	Y.namespace("Gallery");

	var flickrKey = "dd8f94de8e3c2a2f76cd087ffc4b6020",
	    flickrApiURL = "http://api.flickr.com/services/rest/",
	    galleryId = "gallery";

	function cycle(value, max) {
		return (value + max) % max;
	}

	function queryString(params) {
		var query = "?";

		for (param in params) {
			if (params.hasOwnProperty(param)) {
				query += param + "=" + params[param] + "&";
			}
		}

		return query;
	}

	function photoURL(photo, size) {
		size = size ? "_" + size : "";
		return "http://farm" + photo.farm +
			".static.flickr.com/" + photo.server + "/" +
			photo.id + "_" +
			photo.secret + 
			size + ".jpg";
	}

	function photoPageURL(photo) {
		return "http://www.flickr.com/photos/" +
			photo.owner + "/" +
			photo.id;
	}

	Y.SexyFrame = Y.Base.create("overlay", Y.Overlay, [], {
		initializer: function () {
			var body = new Y.Node(document.createDocumentFragment()),
			    gallery = this.get("gallery");

			this._left = Y.Node.create("<div class=left>");
			this._right = Y.Node.create("<div class=right>");
			this._image = new Image();

			this._image.onload = Y.bind(this._onImageLoad, this);
			this._left.on("click", Y.bind(gallery.showPrev, gallery));
			this._right.on("click", Y.bind(gallery.showNext, gallery));

			body.append(this._left)
			    .append(this._image)
			    .append(this._right);

			this.set("bodyContent", body);
		},

		_onImageLoad: function () {
			var img = this._image,
			    w = img.width,
			    h = img.height;

			this.set("width", w);
			this.set("height", h);
			this.syncUI();
			this.render();
			this.show();
		}
	}, {
		ATTRS: {
			gallery: {
				value: null
			},

			src: {
				setter: function (val) {
					this._image.src = val;
					return val;
				}
			}
		}
	});
	
	Y.SexyGallery = Y.Base.create("sexygallery", Y.Widget, [Y.WidgetParent, Y.WidgetChild], {
		CONTENT_TEMPLATE: "<ul></ul>",

		_selected: null,

		initializer: function () {
			this._frame = new Y.SexyFrame({
				visible: false,
				centered: true,
				gallery: this,
				zIndex: 1001
			});
		},

		bindUI: function () {
			var that = this;

			this.parentNode().plug(Y.SuperScroll);

			Y.Fade.element().on("click", Y.bind(this._frame.hide, this._frame));

			this.on("sexythumb:click", Y.bind(this._thumbClick, this));

			this._frame.on("visibleChange", function (e) {
				e.newVal ? Y.Fade.show() : Y.Fade.hide();
				that.parentNode().superscroll.set("disabled", e.newVal);
			});
		},

		parentNode: function () {
			return this.get("boundingBox").get("parentNode");
		},

		showNext: function () {
			this._selected = cycle(this._selected + 1, this.size());
			this.show(this._selected);
		},

		showPrev: function () {
			this._selected = cycle(this._selected - 1, this.size());
			this.show(this._selected);
		},

		show: function (idx) {
			var thumb = this.item(idx);

			this._frame.set("src", thumb.get("large"));

			this._selected = idx;
		},

		_thumbClick: function (e) {
			e.stopPropagation();
			this.show(this.indexOf(e.target));
		}
	}, {
		ATTRS: {
			defaultChildType: {
				value: "SexyThumb"
			}
		}
	});

	Y.SexyThumb = Y.Base.create("sexythumb", Y.Widget, [Y.WidgetChild], {
		BOUNDING_TEMPLATE: "<li></li>",
		CONTENT_TEMPLATE: "<a></a>",

		initializer: function () {
			var overlay;

			this._image = new Image();
			this._image.src = this.get("small");

			this._overlay = Y.Node.create("<img>");
			this._overlay.set("src", "glow.png");
			this._overlay.addClass("overlay");

			this._showOverlayAnimation = new Y.Anim({
				node: this._overlay,
				to: {opacity: 0.15},
				duration: 0.1
			});

			overlay = this._overlay;
			this._hideOverlayAnimation = new Y.Anim({
				node: this._overlay,
				to: {opacity: 0},
				duration: 0.5
			});
			
			this._hideOverlayAnimation.on("end", function () { overlay.addClass("hidden"); });
		},

		mouseOver: function (e) {
			this._overlay.removeClass("hidden");
			this._showOverlayAnimation.run();
		},

		mouseOut: function (e) {
			this._hideOverlayAnimation.run();
		},

		renderUI: function () {
			this.get("contentBox").setContent(this._image);
			this.get("boundingBox").append(this._overlay);
		},

		bindUI: function () {
			var b = this.get("boundingBox");

			b.on("mouseenter", Y.bind(this.mouseOver, this));
			b.on("mouseleave", Y.bind(this.mouseOut, this));
		}
	}, {
	    	ATTRS: {
			small: {
				setter: function (val) {
					this._image.src = val;
					return val;
				}
			},

			large: {
				value: null
			}
		}
	});
	
	function loadImages(callback, response) {
		var images = [];

		response.photos.photo.forEach(function (photo) {
			var url = photoURL(photo, "z"),
			    small = photoURL(photo, "m"),
			    id = images.length;

			images.push({small: small, large: url});
		});

		callback(images);
	}

	Y.mix(Y.Gallery, {
		loadRemote: function () {
			var gallery;

			Y.jsonp(flickrApiURL + queryString({
				method: "flickr.interestingness.getList",
				api_key: flickrKey,
				format: "json",
				per_page: 48,
				jsoncallback: "{callback}"
				}), loadImages.curry(function (images) {
					gallery = new Y.SexyGallery({
						children: images
					});
					gallery.render("#gallery");
				}));
		}
	});

}, "1.0", {requires: ["superscroll", "jsonp", "event", "overlay", "fade", "anim", "widget", "widget-parent", "widget-child", "substitute"]});

YUI().use("gallery", function (Y) {
	Y.on("load", Y.Gallery.loadRemote, window);
});
