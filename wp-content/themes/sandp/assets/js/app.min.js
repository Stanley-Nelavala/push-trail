(function(window, document, undefined) {
    "use strict";
    var docEl = document.documentElement;
    var util = {
        create: function(el) {
            return document.createElement(el);
        },
        old: !!/(Android\s(1.|2.))|(Silk\/1.)/i.test(navigator.userAgent),
        pfx: function() {
            var style = document.createElement("dummy").style;
            var prefixes = [ "Webkit", "Moz", "O", "ms" ];
            var memory = {};
            return function(prop) {
                if (typeof memory[prop] === "undefined") {
                    var ucProp = prop.charAt(0).toUpperCase() + prop.substr(1), props = (prop + " " + prefixes.join(ucProp + " ") + ucProp).split(" ");
                    memory[prop] = null;
                    for (var i in props) {
                        if (style[props[i]] !== undefined) {
                            memory[prop] = props[i];
                            break;
                        }
                    }
                }
                return memory[prop];
            };
        }()
    };
    var Feature = {
        css3Dtransform: function() {
            var test = !util.old && util.pfx("perspective") !== null;
            return !!test;
        }(),
        cssTransform: function() {
            var test = !util.old && util.pfx("transformOrigin") !== null;
            return !!test;
        }(),
        cssTransition: function() {
            var test = util.pfx("transition") !== null;
            return !!test;
        }(),
        cssFlexbox: function() {
            var test = util.pfx("flexBasis") !== null;
            return !!test;
        }(),
        addEventListener: !!window.addEventListener,
        querySelectorAll: !!document.querySelectorAll,
        matchMedia: !!window.matchMedia,
        deviceMotion: "DeviceMotionEvent" in window,
        deviceOrientation: "DeviceOrientationEvent" in window,
        contextMenu: "contextMenu" in docEl && "HTMLMenuItemElement" in window,
        classList: "classList" in docEl,
        placeholder: "placeholder" in util.create("input"),
        localStorage: function() {
            var test = "x";
            try {
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (err) {
                return false;
            }
        }(),
        historyAPI: window.history && "pushState" in window.history,
        serviceWorker: "serviceWorker" in navigator,
        viewportUnit: function(el) {
            try {
                el.style.width = "1vw";
                var test = el.style.width !== "";
                return !!test;
            } catch (err) {
                return false;
            }
        }(util.create("dummy")),
        remUnit: function(el) {
            try {
                el.style.width = "1rem";
                var test = el.style.width !== "";
                return !!test;
            } catch (err) {
                return false;
            }
        }(util.create("dummy")),
        canvas: function(el) {
            return !!(el.getContext && el.getContext("2d"));
        }(util.create("canvas")),
        svg: !!document.createElementNS && !!document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect,
        webGL: function(el) {
            try {
                return !!(window.WebGLRenderingContext && (el.getContext("webgl") || el.getContext("experimental-webgl")));
            } catch (err) {
                return false;
            }
        }(util.create("canvas")),
        cors: "XMLHttpRequest" in window && "withCredentials" in new XMLHttpRequest(),
        touch: !!("ontouchstart" in window || window.navigator && window.navigator.msPointerEnabled && window.MSGesture || window.DocumentTouch && document instanceof DocumentTouch),
        async: "async" in util.create("script"),
        defer: "defer" in util.create("script"),
        geolocation: "geolocation" in navigator,
        srcset: "srcset" in util.create("img"),
        sizes: "sizes" in util.create("img"),
        pictureElement: "HTMLPictureElement" in window,
        testAll: function() {
            var classes = " js";
            for (var test in this) {
                if (test !== "testAll" && test !== "constructor" && this[test]) {
                    classes += " " + test;
                }
            }
            docEl.className += classes.toLowerCase();
        }
    };
    window.feature = Feature;
})(window, document);

(function() {
    var __indexOf = [].indexOf || function(item) {
        for (var i = 0, l = this.length; i < l; i++) {
            if (i in this && this[i] === item) return i;
        }
        return -1;
    }, __slice = [].slice;
    (function(root, factory) {
        if (typeof define === "function" && define.amd) {
            return define("waypoints", [ "jquery" ], function($) {
                return factory($, root);
            });
        } else {
            return factory(root.jQuery, root);
        }
    })(window, function($, window) {
        var $w, Context, Waypoint, allWaypoints, contextCounter, contextKey, contexts, isTouch, jQMethods, methods, resizeEvent, scrollEvent, waypointCounter, waypointKey, wp, wps;
        $w = $(window);
        isTouch = __indexOf.call(window, "ontouchstart") >= 0;
        allWaypoints = {
            horizontal: {},
            vertical: {}
        };
        contextCounter = 1;
        contexts = {};
        contextKey = "waypoints-context-id";
        resizeEvent = "resize.waypoints";
        scrollEvent = "scroll.waypoints";
        waypointCounter = 1;
        waypointKey = "waypoints-waypoint-ids";
        wp = "waypoint";
        wps = "waypoints";
        Context = function() {
            function Context($element) {
                var _this = this;
                this.$element = $element;
                this.element = $element[0];
                this.didResize = false;
                this.didScroll = false;
                this.id = "context" + contextCounter++;
                this.oldScroll = {
                    x: $element.scrollLeft(),
                    y: $element.scrollTop()
                };
                this.waypoints = {
                    horizontal: {},
                    vertical: {}
                };
                this.element[contextKey] = this.id;
                contexts[this.id] = this;
                $element.bind(scrollEvent, function() {
                    var scrollHandler;
                    if (!(_this.didScroll || isTouch)) {
                        _this.didScroll = true;
                        scrollHandler = function() {
                            _this.doScroll();
                            return _this.didScroll = false;
                        };
                        return window.setTimeout(scrollHandler, $[wps].settings.scrollThrottle);
                    }
                });
                $element.bind(resizeEvent, function() {
                    var resizeHandler;
                    if (!_this.didResize) {
                        _this.didResize = true;
                        resizeHandler = function() {
                            $[wps]("refresh");
                            return _this.didResize = false;
                        };
                        return window.setTimeout(resizeHandler, $[wps].settings.resizeThrottle);
                    }
                });
            }
            Context.prototype.doScroll = function() {
                var axes, _this = this;
                axes = {
                    horizontal: {
                        newScroll: this.$element.scrollLeft(),
                        oldScroll: this.oldScroll.x,
                        forward: "right",
                        backward: "left"
                    },
                    vertical: {
                        newScroll: this.$element.scrollTop(),
                        oldScroll: this.oldScroll.y,
                        forward: "down",
                        backward: "up"
                    }
                };
                if (isTouch && (!axes.vertical.oldScroll || !axes.vertical.newScroll)) {
                    $[wps]("refresh");
                }
                $.each(axes, function(aKey, axis) {
                    var direction, isForward, triggered;
                    triggered = [];
                    isForward = axis.newScroll > axis.oldScroll;
                    direction = isForward ? axis.forward : axis.backward;
                    $.each(_this.waypoints[aKey], function(wKey, waypoint) {
                        var _ref, _ref1;
                        if (axis.oldScroll < (_ref = waypoint.offset) && _ref <= axis.newScroll) {
                            return triggered.push(waypoint);
                        } else if (axis.newScroll < (_ref1 = waypoint.offset) && _ref1 <= axis.oldScroll) {
                            return triggered.push(waypoint);
                        }
                    });
                    triggered.sort(function(a, b) {
                        return a.offset - b.offset;
                    });
                    if (!isForward) {
                        triggered.reverse();
                    }
                    return $.each(triggered, function(i, waypoint) {
                        if (waypoint.options.continuous || i === triggered.length - 1) {
                            return waypoint.trigger([ direction ]);
                        }
                    });
                });
                return this.oldScroll = {
                    x: axes.horizontal.newScroll,
                    y: axes.vertical.newScroll
                };
            };
            Context.prototype.refresh = function() {
                var axes, cOffset, isWin, _this = this;
                isWin = $.isWindow(this.element);
                cOffset = this.$element.offset();
                this.doScroll();
                axes = {
                    horizontal: {
                        contextOffset: isWin ? 0 : cOffset.left,
                        contextScroll: isWin ? 0 : this.oldScroll.x,
                        contextDimension: this.$element.width(),
                        oldScroll: this.oldScroll.x,
                        forward: "right",
                        backward: "left",
                        offsetProp: "left"
                    },
                    vertical: {
                        contextOffset: isWin ? 0 : cOffset.top,
                        contextScroll: isWin ? 0 : this.oldScroll.y,
                        contextDimension: isWin ? $[wps]("viewportHeight") : this.$element.height(),
                        oldScroll: this.oldScroll.y,
                        forward: "down",
                        backward: "up",
                        offsetProp: "top"
                    }
                };
                return $.each(axes, function(aKey, axis) {
                    return $.each(_this.waypoints[aKey], function(i, waypoint) {
                        var adjustment, elementOffset, oldOffset, _ref, _ref1;
                        adjustment = waypoint.options.offset;
                        oldOffset = waypoint.offset;
                        elementOffset = $.isWindow(waypoint.element) ? 0 : waypoint.$element.offset()[axis.offsetProp];
                        if ($.isFunction(adjustment)) {
                            adjustment = adjustment.apply(waypoint.element);
                        } else if (typeof adjustment === "string") {
                            adjustment = parseFloat(adjustment);
                            if (waypoint.options.offset.indexOf("%") > -1) {
                                adjustment = Math.ceil(axis.contextDimension * adjustment / 100);
                            }
                        }
                        waypoint.offset = elementOffset - axis.contextOffset + axis.contextScroll - adjustment;
                        if (waypoint.options.onlyOnScroll && oldOffset != null || !waypoint.enabled) {
                            return;
                        }
                        if (oldOffset !== null && (oldOffset < (_ref = axis.oldScroll) && _ref <= waypoint.offset)) {
                            return waypoint.trigger([ axis.backward ]);
                        } else if (oldOffset !== null && (oldOffset > (_ref1 = axis.oldScroll) && _ref1 >= waypoint.offset)) {
                            return waypoint.trigger([ axis.forward ]);
                        } else if (oldOffset === null && axis.oldScroll >= waypoint.offset) {
                            return waypoint.trigger([ axis.forward ]);
                        }
                    });
                });
            };
            Context.prototype.checkEmpty = function() {
                if ($.isEmptyObject(this.waypoints.horizontal) && $.isEmptyObject(this.waypoints.vertical)) {
                    this.$element.unbind([ resizeEvent, scrollEvent ].join(" "));
                    return delete contexts[this.id];
                }
            };
            return Context;
        }();
        Waypoint = function() {
            function Waypoint($element, context, options) {
                var idList, _ref;
                if (options.offset === "bottom-in-view") {
                    options.offset = function() {
                        var contextHeight;
                        contextHeight = $[wps]("viewportHeight");
                        if (!$.isWindow(context.element)) {
                            contextHeight = context.$element.height();
                        }
                        return contextHeight - $(this).outerHeight();
                    };
                }
                this.$element = $element;
                this.element = $element[0];
                this.axis = options.horizontal ? "horizontal" : "vertical";
                this.callback = options.handler;
                this.context = context;
                this.enabled = options.enabled;
                this.id = "waypoints" + waypointCounter++;
                this.offset = null;
                this.options = options;
                context.waypoints[this.axis][this.id] = this;
                allWaypoints[this.axis][this.id] = this;
                idList = (_ref = this.element[waypointKey]) != null ? _ref : [];
                idList.push(this.id);
                this.element[waypointKey] = idList;
            }
            Waypoint.prototype.trigger = function(args) {
                if (!this.enabled) {
                    return;
                }
                if (this.callback != null) {
                    this.callback.apply(this.element, args);
                }
                if (this.options.triggerOnce) {
                    return this.destroy();
                }
            };
            Waypoint.prototype.disable = function() {
                return this.enabled = false;
            };
            Waypoint.prototype.enable = function() {
                this.context.refresh();
                return this.enabled = true;
            };
            Waypoint.prototype.destroy = function() {
                delete allWaypoints[this.axis][this.id];
                delete this.context.waypoints[this.axis][this.id];
                return this.context.checkEmpty();
            };
            Waypoint.getWaypointsByElement = function(element) {
                var all, ids;
                ids = element[waypointKey];
                if (!ids) {
                    return [];
                }
                all = $.extend({}, allWaypoints.horizontal, allWaypoints.vertical);
                return $.map(ids, function(id) {
                    return all[id];
                });
            };
            return Waypoint;
        }();
        methods = {
            init: function(f, options) {
                var _ref;
                options = $.extend({}, $.fn[wp].defaults, options);
                if ((_ref = options.handler) == null) {
                    options.handler = f;
                }
                this.each(function() {
                    var $this, context, contextElement, _ref1;
                    $this = $(this);
                    contextElement = (_ref1 = options.context) != null ? _ref1 : $.fn[wp].defaults.context;
                    if (!$.isWindow(contextElement)) {
                        contextElement = $this.closest(contextElement);
                    }
                    contextElement = $(contextElement);
                    context = contexts[contextElement[0][contextKey]];
                    if (!context) {
                        context = new Context(contextElement);
                    }
                    return new Waypoint($this, context, options);
                });
                $[wps]("refresh");
                return this;
            },
            disable: function() {
                return methods._invoke.call(this, "disable");
            },
            enable: function() {
                return methods._invoke.call(this, "enable");
            },
            destroy: function() {
                return methods._invoke.call(this, "destroy");
            },
            prev: function(axis, selector) {
                return methods._traverse.call(this, axis, selector, function(stack, index, waypoints) {
                    if (index > 0) {
                        return stack.push(waypoints[index - 1]);
                    }
                });
            },
            next: function(axis, selector) {
                return methods._traverse.call(this, axis, selector, function(stack, index, waypoints) {
                    if (index < waypoints.length - 1) {
                        return stack.push(waypoints[index + 1]);
                    }
                });
            },
            _traverse: function(axis, selector, push) {
                var stack, waypoints;
                if (axis == null) {
                    axis = "vertical";
                }
                if (selector == null) {
                    selector = window;
                }
                waypoints = jQMethods.aggregate(selector);
                stack = [];
                this.each(function() {
                    var index;
                    index = $.inArray(this, waypoints[axis]);
                    return push(stack, index, waypoints[axis]);
                });
                return this.pushStack(stack);
            },
            _invoke: function(method) {
                this.each(function() {
                    var waypoints;
                    waypoints = Waypoint.getWaypointsByElement(this);
                    return $.each(waypoints, function(i, waypoint) {
                        waypoint[method]();
                        return true;
                    });
                });
                return this;
            }
        };
        $.fn[wp] = function() {
            var args, method;
            method = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            if (methods[method]) {
                return methods[method].apply(this, args);
            } else if ($.isFunction(method)) {
                return methods.init.apply(this, arguments);
            } else if ($.isPlainObject(method)) {
                return methods.init.apply(this, [ null, method ]);
            } else if (!method) {
                return $.error("jQuery Waypoints needs a callback function or handler option.");
            } else {
                return $.error("The " + method + " method does not exist in jQuery Waypoints.");
            }
        };
        $.fn[wp].defaults = {
            context: window,
            continuous: true,
            enabled: true,
            horizontal: false,
            offset: 0,
            triggerOnce: false
        };
        jQMethods = {
            refresh: function() {
                return $.each(contexts, function(i, context) {
                    return context.refresh();
                });
            },
            viewportHeight: function() {
                var _ref;
                return (_ref = window.innerHeight) != null ? _ref : $w.height();
            },
            aggregate: function(contextSelector) {
                var collection, waypoints, _ref;
                collection = allWaypoints;
                if (contextSelector) {
                    collection = (_ref = contexts[$(contextSelector)[0][contextKey]]) != null ? _ref.waypoints : void 0;
                }
                if (!collection) {
                    return [];
                }
                waypoints = {
                    horizontal: [],
                    vertical: []
                };
                $.each(waypoints, function(axis, arr) {
                    $.each(collection[axis], function(key, waypoint) {
                        return arr.push(waypoint);
                    });
                    arr.sort(function(a, b) {
                        return a.offset - b.offset;
                    });
                    waypoints[axis] = $.map(arr, function(waypoint) {
                        return waypoint.element;
                    });
                    return waypoints[axis] = $.unique(waypoints[axis]);
                });
                return waypoints;
            },
            above: function(contextSelector) {
                if (contextSelector == null) {
                    contextSelector = window;
                }
                return jQMethods._filter(contextSelector, "vertical", function(context, waypoint) {
                    return waypoint.offset <= context.oldScroll.y;
                });
            },
            below: function(contextSelector) {
                if (contextSelector == null) {
                    contextSelector = window;
                }
                return jQMethods._filter(contextSelector, "vertical", function(context, waypoint) {
                    return waypoint.offset > context.oldScroll.y;
                });
            },
            left: function(contextSelector) {
                if (contextSelector == null) {
                    contextSelector = window;
                }
                return jQMethods._filter(contextSelector, "horizontal", function(context, waypoint) {
                    return waypoint.offset <= context.oldScroll.x;
                });
            },
            right: function(contextSelector) {
                if (contextSelector == null) {
                    contextSelector = window;
                }
                return jQMethods._filter(contextSelector, "horizontal", function(context, waypoint) {
                    return waypoint.offset > context.oldScroll.x;
                });
            },
            enable: function() {
                return jQMethods._invoke("enable");
            },
            disable: function() {
                return jQMethods._invoke("disable");
            },
            destroy: function() {
                return jQMethods._invoke("destroy");
            },
            extendFn: function(methodName, f) {
                return methods[methodName] = f;
            },
            _invoke: function(method) {
                var waypoints;
                waypoints = $.extend({}, allWaypoints.vertical, allWaypoints.horizontal);
                return $.each(waypoints, function(key, waypoint) {
                    waypoint[method]();
                    return true;
                });
            },
            _filter: function(selector, axis, test) {
                var context, waypoints;
                context = contexts[$(selector)[0][contextKey]];
                if (!context) {
                    return [];
                }
                waypoints = [];
                $.each(context.waypoints[axis], function(i, waypoint) {
                    if (test(context, waypoint)) {
                        return waypoints.push(waypoint);
                    }
                });
                waypoints.sort(function(a, b) {
                    return a.offset - b.offset;
                });
                return $.map(waypoints, function(waypoint) {
                    return waypoint.element;
                });
            }
        };
        $[wps] = function() {
            var args, method;
            method = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            if (jQMethods[method]) {
                return jQMethods[method].apply(null, args);
            } else {
                return jQMethods.aggregate.call(null, method);
            }
        };
        $[wps].settings = {
            resizeThrottle: 100,
            scrollThrottle: 30
        };
        return $w.on("load.waypoints", function() {
            return $[wps]("refresh");
        });
    });
}).call(this);

(function(factory) {
    "use strict";
    if (typeof define === "function" && define.amd) {
        define([ "jquery" ], factory);
    } else if (typeof exports !== "undefined") {
        module.exports = factory(require("jquery"));
    } else {
        factory(jQuery);
    }
})(function($) {
    "use strict";
    var Slick = window.Slick || {};
    Slick = function() {
        var instanceUid = 0;
        function Slick(element, settings) {
            var _ = this, dataSettings;
            _.defaults = {
                accessibility: true,
                adaptiveHeight: false,
                appendArrows: $(element),
                appendDots: $(element),
                arrows: true,
                asNavFor: null,
                prevArrow: '<button type="button" data-role="none" class="slick-prev" aria-label="Previous" tabindex="0" role="button">Previous</button>',
                nextArrow: '<button type="button" data-role="none" class="slick-next" aria-label="Next" tabindex="0" role="button">Next</button>',
                autoplay: false,
                autoplaySpeed: 3e3,
                centerMode: false,
                centerPadding: "50px",
                cssEase: "ease",
                customPaging: function(slider, i) {
                    return '<button type="button" data-role="none" role="button" aria-required="false" tabindex="0">' + (i + 1) + "</button>";
                },
                dots: false,
                dotsClass: "slick-dots",
                draggable: true,
                easing: "linear",
                edgeFriction: .35,
                fade: false,
                focusOnSelect: false,
                infinite: true,
                initialSlide: 0,
                lazyLoad: "ondemand",
                mobileFirst: false,
                pauseOnHover: true,
                pauseOnDotsHover: false,
                respondTo: "window",
                responsive: null,
                rows: 1,
                rtl: false,
                slide: "",
                slidesPerRow: 1,
                slidesToShow: 1,
                slidesToScroll: 1,
                speed: 500,
                swipe: true,
                swipeToSlide: false,
                touchMove: true,
                touchThreshold: 5,
                useCSS: true,
                variableWidth: false,
                vertical: false,
                verticalSwiping: false,
                waitForAnimate: true,
                zIndex: 1e3
            };
            _.initials = {
                animating: false,
                dragging: false,
                autoPlayTimer: null,
                currentDirection: 0,
                currentLeft: null,
                currentSlide: 0,
                direction: 1,
                $dots: null,
                listWidth: null,
                listHeight: null,
                loadIndex: 0,
                $nextArrow: null,
                $prevArrow: null,
                slideCount: null,
                slideWidth: null,
                $slideTrack: null,
                $slides: null,
                sliding: false,
                slideOffset: 0,
                swipeLeft: null,
                $list: null,
                touchObject: {},
                transformsEnabled: false,
                unslicked: false
            };
            $.extend(_, _.initials);
            _.activeBreakpoint = null;
            _.animType = null;
            _.animProp = null;
            _.breakpoints = [];
            _.breakpointSettings = [];
            _.cssTransitions = false;
            _.hidden = "hidden";
            _.paused = false;
            _.positionProp = null;
            _.respondTo = null;
            _.rowCount = 1;
            _.shouldClick = true;
            _.$slider = $(element);
            _.$slidesCache = null;
            _.transformType = null;
            _.transitionType = null;
            _.visibilityChange = "visibilitychange";
            _.windowWidth = 0;
            _.windowTimer = null;
            dataSettings = $(element).data("slick") || {};
            _.options = $.extend({}, _.defaults, dataSettings, settings);
            _.currentSlide = _.options.initialSlide;
            _.originalSettings = _.options;
            if (typeof document.mozHidden !== "undefined") {
                _.hidden = "mozHidden";
                _.visibilityChange = "mozvisibilitychange";
            } else if (typeof document.webkitHidden !== "undefined") {
                _.hidden = "webkitHidden";
                _.visibilityChange = "webkitvisibilitychange";
            }
            _.autoPlay = $.proxy(_.autoPlay, _);
            _.autoPlayClear = $.proxy(_.autoPlayClear, _);
            _.changeSlide = $.proxy(_.changeSlide, _);
            _.clickHandler = $.proxy(_.clickHandler, _);
            _.selectHandler = $.proxy(_.selectHandler, _);
            _.setPosition = $.proxy(_.setPosition, _);
            _.swipeHandler = $.proxy(_.swipeHandler, _);
            _.dragHandler = $.proxy(_.dragHandler, _);
            _.keyHandler = $.proxy(_.keyHandler, _);
            _.autoPlayIterator = $.proxy(_.autoPlayIterator, _);
            _.instanceUid = instanceUid++;
            _.htmlExpr = /^(?:\s*(<[\w\W]+>)[^>]*)$/;
            _.registerBreakpoints();
            _.init(true);
            _.checkResponsive(true);
        }
        return Slick;
    }();
    Slick.prototype.addSlide = Slick.prototype.slickAdd = function(markup, index, addBefore) {
        var _ = this;
        if (typeof index === "boolean") {
            addBefore = index;
            index = null;
        } else if (index < 0 || index >= _.slideCount) {
            return false;
        }
        _.unload();
        if (typeof index === "number") {
            if (index === 0 && _.$slides.length === 0) {
                $(markup).appendTo(_.$slideTrack);
            } else if (addBefore) {
                $(markup).insertBefore(_.$slides.eq(index));
            } else {
                $(markup).insertAfter(_.$slides.eq(index));
            }
        } else {
            if (addBefore === true) {
                $(markup).prependTo(_.$slideTrack);
            } else {
                $(markup).appendTo(_.$slideTrack);
            }
        }
        _.$slides = _.$slideTrack.children(this.options.slide);
        _.$slideTrack.children(this.options.slide).detach();
        _.$slideTrack.append(_.$slides);
        _.$slides.each(function(index, element) {
            $(element).attr("data-slick-index", index);
        });
        _.$slidesCache = _.$slides;
        _.reinit();
    };
    Slick.prototype.animateHeight = function() {
        var _ = this;
        if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
            var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
            _.$list.animate({
                height: targetHeight
            }, _.options.speed);
        }
    };
    Slick.prototype.animateSlide = function(targetLeft, callback) {
        var animProps = {}, _ = this;
        _.animateHeight();
        if (_.options.rtl === true && _.options.vertical === false) {
            targetLeft = -targetLeft;
        }
        if (_.transformsEnabled === false) {
            if (_.options.vertical === false) {
                _.$slideTrack.animate({
                    left: targetLeft
                }, _.options.speed, _.options.easing, callback);
            } else {
                _.$slideTrack.animate({
                    top: targetLeft
                }, _.options.speed, _.options.easing, callback);
            }
        } else {
            if (_.cssTransitions === false) {
                if (_.options.rtl === true) {
                    _.currentLeft = -_.currentLeft;
                }
                $({
                    animStart: _.currentLeft
                }).animate({
                    animStart: targetLeft
                }, {
                    duration: _.options.speed,
                    easing: _.options.easing,
                    step: function(now) {
                        now = Math.ceil(now);
                        if (_.options.vertical === false) {
                            animProps[_.animType] = "translate(" + now + "px, 0px)";
                            _.$slideTrack.css(animProps);
                        } else {
                            animProps[_.animType] = "translate(0px," + now + "px)";
                            _.$slideTrack.css(animProps);
                        }
                    },
                    complete: function() {
                        if (callback) {
                            callback.call();
                        }
                    }
                });
            } else {
                _.applyTransition();
                targetLeft = Math.ceil(targetLeft);
                if (_.options.vertical === false) {
                    animProps[_.animType] = "translate3d(" + targetLeft + "px, 0px, 0px)";
                } else {
                    animProps[_.animType] = "translate3d(0px," + targetLeft + "px, 0px)";
                }
                _.$slideTrack.css(animProps);
                if (callback) {
                    setTimeout(function() {
                        _.disableTransition();
                        callback.call();
                    }, _.options.speed);
                }
            }
        }
    };
    Slick.prototype.asNavFor = function(index) {
        var _ = this, asNavFor = _.options.asNavFor;
        if (asNavFor && asNavFor !== null) {
            asNavFor = $(asNavFor).not(_.$slider);
        }
        if (asNavFor !== null && typeof asNavFor === "object") {
            asNavFor.each(function() {
                var target = $(this).slick("getSlick");
                if (!target.unslicked) {
                    target.slideHandler(index, true);
                }
            });
        }
    };
    Slick.prototype.applyTransition = function(slide) {
        var _ = this, transition = {};
        if (_.options.fade === false) {
            transition[_.transitionType] = _.transformType + " " + _.options.speed + "ms " + _.options.cssEase;
        } else {
            transition[_.transitionType] = "opacity " + _.options.speed + "ms " + _.options.cssEase;
        }
        if (_.options.fade === false) {
            _.$slideTrack.css(transition);
        } else {
            _.$slides.eq(slide).css(transition);
        }
    };
    Slick.prototype.autoPlay = function() {
        var _ = this;
        if (_.autoPlayTimer) {
            clearInterval(_.autoPlayTimer);
        }
        if (_.slideCount > _.options.slidesToShow && _.paused !== true) {
            _.autoPlayTimer = setInterval(_.autoPlayIterator, _.options.autoplaySpeed);
        }
    };
    Slick.prototype.autoPlayClear = function() {
        var _ = this;
        if (_.autoPlayTimer) {
            clearInterval(_.autoPlayTimer);
        }
    };
    Slick.prototype.autoPlayIterator = function() {
        var _ = this;
        if (_.options.infinite === false) {
            if (_.direction === 1) {
                if (_.currentSlide + 1 === _.slideCount - 1) {
                    _.direction = 0;
                }
                _.slideHandler(_.currentSlide + _.options.slidesToScroll);
            } else {
                if (_.currentSlide - 1 === 0) {
                    _.direction = 1;
                }
                _.slideHandler(_.currentSlide - _.options.slidesToScroll);
            }
        } else {
            _.slideHandler(_.currentSlide + _.options.slidesToScroll);
        }
    };
    Slick.prototype.buildArrows = function() {
        var _ = this;
        if (_.options.arrows === true) {
            _.$prevArrow = $(_.options.prevArrow).addClass("slick-arrow");
            _.$nextArrow = $(_.options.nextArrow).addClass("slick-arrow");
            if (_.slideCount > _.options.slidesToShow) {
                _.$prevArrow.removeClass("slick-hidden").removeAttr("aria-hidden tabindex");
                _.$nextArrow.removeClass("slick-hidden").removeAttr("aria-hidden tabindex");
                if (_.htmlExpr.test(_.options.prevArrow)) {
                    _.$prevArrow.prependTo(_.options.appendArrows);
                }
                if (_.htmlExpr.test(_.options.nextArrow)) {
                    _.$nextArrow.appendTo(_.options.appendArrows);
                }
                if (_.options.infinite !== true) {
                    _.$prevArrow.addClass("slick-disabled").attr("aria-disabled", "true");
                }
            } else {
                _.$prevArrow.add(_.$nextArrow).addClass("slick-hidden").attr({
                    "aria-disabled": "true",
                    tabindex: "-1"
                });
            }
        }
    };
    Slick.prototype.buildDots = function() {
        var _ = this, i, dotString;
        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {
            dotString = '<ul class="' + _.options.dotsClass + '">';
            for (i = 0; i <= _.getDotCount(); i += 1) {
                dotString += "<li>" + _.options.customPaging.call(this, _, i) + "</li>";
            }
            dotString += "</ul>";
            _.$dots = $(dotString).appendTo(_.options.appendDots);
            _.$dots.find("li").first().addClass("slick-active").attr("aria-hidden", "false");
        }
    };
    Slick.prototype.buildOut = function() {
        var _ = this;
        _.$slides = _.$slider.children(_.options.slide + ":not(.slick-cloned)").addClass("slick-slide");
        _.slideCount = _.$slides.length;
        _.$slides.each(function(index, element) {
            $(element).attr("data-slick-index", index).data("originalStyling", $(element).attr("style") || "");
        });
        _.$slidesCache = _.$slides;
        _.$slider.addClass("slick-slider");
        _.$slideTrack = _.slideCount === 0 ? $('<div class="slick-track"/>').appendTo(_.$slider) : _.$slides.wrapAll('<div class="slick-track"/>').parent();
        _.$list = _.$slideTrack.wrap('<div aria-live="polite" class="slick-list"/>').parent();
        _.$slideTrack.css("opacity", 0);
        if (_.options.centerMode === true || _.options.swipeToSlide === true) {
            _.options.slidesToScroll = 1;
        }
        $("img[data-lazy]", _.$slider).not("[src]").addClass("slick-loading");
        _.setupInfinite();
        _.buildArrows();
        _.buildDots();
        _.updateDots();
        _.setSlideClasses(typeof _.currentSlide === "number" ? _.currentSlide : 0);
        if (_.options.draggable === true) {
            _.$list.addClass("draggable");
        }
    };
    Slick.prototype.buildRows = function() {
        var _ = this, a, b, c, newSlides, numOfSlides, originalSlides, slidesPerSection;
        newSlides = document.createDocumentFragment();
        originalSlides = _.$slider.children();
        if (_.options.rows > 1) {
            slidesPerSection = _.options.slidesPerRow * _.options.rows;
            numOfSlides = Math.ceil(originalSlides.length / slidesPerSection);
            for (a = 0; a < numOfSlides; a++) {
                var slide = document.createElement("div");
                for (b = 0; b < _.options.rows; b++) {
                    var row = document.createElement("div");
                    for (c = 0; c < _.options.slidesPerRow; c++) {
                        var target = a * slidesPerSection + (b * _.options.slidesPerRow + c);
                        if (originalSlides.get(target)) {
                            row.appendChild(originalSlides.get(target));
                        }
                    }
                    slide.appendChild(row);
                }
                newSlides.appendChild(slide);
            }
            _.$slider.html(newSlides);
            _.$slider.children().children().children().css({
                width: 100 / _.options.slidesPerRow + "%",
                display: "inline-block"
            });
        }
    };
    Slick.prototype.checkResponsive = function(initial, forceUpdate) {
        var _ = this, breakpoint, targetBreakpoint, respondToWidth, triggerBreakpoint = false;
        var sliderWidth = _.$slider.width();
        var windowWidth = window.innerWidth || $(window).width();
        if (_.respondTo === "window") {
            respondToWidth = windowWidth;
        } else if (_.respondTo === "slider") {
            respondToWidth = sliderWidth;
        } else if (_.respondTo === "min") {
            respondToWidth = Math.min(windowWidth, sliderWidth);
        }
        if (_.options.responsive && _.options.responsive.length && _.options.responsive !== null) {
            targetBreakpoint = null;
            for (breakpoint in _.breakpoints) {
                if (_.breakpoints.hasOwnProperty(breakpoint)) {
                    if (_.originalSettings.mobileFirst === false) {
                        if (respondToWidth < _.breakpoints[breakpoint]) {
                            targetBreakpoint = _.breakpoints[breakpoint];
                        }
                    } else {
                        if (respondToWidth > _.breakpoints[breakpoint]) {
                            targetBreakpoint = _.breakpoints[breakpoint];
                        }
                    }
                }
            }
            if (targetBreakpoint !== null) {
                if (_.activeBreakpoint !== null) {
                    if (targetBreakpoint !== _.activeBreakpoint || forceUpdate) {
                        _.activeBreakpoint = targetBreakpoint;
                        if (_.breakpointSettings[targetBreakpoint] === "unslick") {
                            _.unslick(targetBreakpoint);
                        } else {
                            _.options = $.extend({}, _.originalSettings, _.breakpointSettings[targetBreakpoint]);
                            if (initial === true) {
                                _.currentSlide = _.options.initialSlide;
                            }
                            _.refresh(initial);
                        }
                        triggerBreakpoint = targetBreakpoint;
                    }
                } else {
                    _.activeBreakpoint = targetBreakpoint;
                    if (_.breakpointSettings[targetBreakpoint] === "unslick") {
                        _.unslick(targetBreakpoint);
                    } else {
                        _.options = $.extend({}, _.originalSettings, _.breakpointSettings[targetBreakpoint]);
                        if (initial === true) {
                            _.currentSlide = _.options.initialSlide;
                        }
                        _.refresh(initial);
                    }
                    triggerBreakpoint = targetBreakpoint;
                }
            } else {
                if (_.activeBreakpoint !== null) {
                    _.activeBreakpoint = null;
                    _.options = _.originalSettings;
                    if (initial === true) {
                        _.currentSlide = _.options.initialSlide;
                    }
                    _.refresh(initial);
                    triggerBreakpoint = targetBreakpoint;
                }
            }
            if (!initial && triggerBreakpoint !== false) {
                _.$slider.trigger("breakpoint", [ _, triggerBreakpoint ]);
            }
        }
    };
    Slick.prototype.changeSlide = function(event, dontAnimate) {
        var _ = this, $target = $(event.target), indexOffset, slideOffset, unevenOffset;
        if ($target.is("a")) {
            event.preventDefault();
        }
        if (!$target.is("li")) {
            $target = $target.closest("li");
        }
        unevenOffset = _.slideCount % _.options.slidesToScroll !== 0;
        indexOffset = unevenOffset ? 0 : (_.slideCount - _.currentSlide) % _.options.slidesToScroll;
        switch (event.data.message) {
          case "previous":
            slideOffset = indexOffset === 0 ? _.options.slidesToScroll : _.options.slidesToShow - indexOffset;
            if (_.slideCount > _.options.slidesToShow) {
                _.slideHandler(_.currentSlide - slideOffset, false, dontAnimate);
            }
            break;

          case "next":
            slideOffset = indexOffset === 0 ? _.options.slidesToScroll : indexOffset;
            if (_.slideCount > _.options.slidesToShow) {
                _.slideHandler(_.currentSlide + slideOffset, false, dontAnimate);
            }
            break;

          case "index":
            var index = event.data.index === 0 ? 0 : event.data.index || $target.index() * _.options.slidesToScroll;
            _.slideHandler(_.checkNavigable(index), false, dontAnimate);
            $target.children().trigger("focus");
            break;

          default:
            return;
        }
    };
    Slick.prototype.checkNavigable = function(index) {
        var _ = this, navigables, prevNavigable;
        navigables = _.getNavigableIndexes();
        prevNavigable = 0;
        if (index > navigables[navigables.length - 1]) {
            index = navigables[navigables.length - 1];
        } else {
            for (var n in navigables) {
                if (index < navigables[n]) {
                    index = prevNavigable;
                    break;
                }
                prevNavigable = navigables[n];
            }
        }
        return index;
    };
    Slick.prototype.cleanUpEvents = function() {
        var _ = this;
        if (_.options.dots && _.$dots !== null) {
            $("li", _.$dots).off("click.slick", _.changeSlide);
            if (_.options.pauseOnDotsHover === true && _.options.autoplay === true) {
                $("li", _.$dots).off("mouseenter.slick", $.proxy(_.setPaused, _, true)).off("mouseleave.slick", $.proxy(_.setPaused, _, false));
            }
        }
        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow && _.$prevArrow.off("click.slick", _.changeSlide);
            _.$nextArrow && _.$nextArrow.off("click.slick", _.changeSlide);
        }
        _.$list.off("touchstart.slick mousedown.slick", _.swipeHandler);
        _.$list.off("touchmove.slick mousemove.slick", _.swipeHandler);
        _.$list.off("touchend.slick mouseup.slick", _.swipeHandler);
        _.$list.off("touchcancel.slick mouseleave.slick", _.swipeHandler);
        _.$list.off("click.slick", _.clickHandler);
        $(document).off(_.visibilityChange, _.visibility);
        _.$list.off("mouseenter.slick", $.proxy(_.setPaused, _, true));
        _.$list.off("mouseleave.slick", $.proxy(_.setPaused, _, false));
        if (_.options.accessibility === true) {
            _.$list.off("keydown.slick", _.keyHandler);
        }
        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().off("click.slick", _.selectHandler);
        }
        $(window).off("orientationchange.slick.slick-" + _.instanceUid, _.orientationChange);
        $(window).off("resize.slick.slick-" + _.instanceUid, _.resize);
        $("[draggable!=true]", _.$slideTrack).off("dragstart", _.preventDefault);
        $(window).off("load.slick.slick-" + _.instanceUid, _.setPosition);
        $(document).off("ready.slick.slick-" + _.instanceUid, _.setPosition);
    };
    Slick.prototype.cleanUpRows = function() {
        var _ = this, originalSlides;
        if (_.options.rows > 1) {
            originalSlides = _.$slides.children().children();
            originalSlides.removeAttr("style");
            _.$slider.html(originalSlides);
        }
    };
    Slick.prototype.clickHandler = function(event) {
        var _ = this;
        if (_.shouldClick === false) {
            event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();
        }
    };
    Slick.prototype.destroy = function(refresh) {
        var _ = this;
        _.autoPlayClear();
        _.touchObject = {};
        _.cleanUpEvents();
        $(".slick-cloned", _.$slider).detach();
        if (_.$dots) {
            _.$dots.remove();
        }
        if (_.options.arrows === true) {
            if (_.$prevArrow && _.$prevArrow.length) {
                _.$prevArrow.removeClass("slick-disabled slick-arrow slick-hidden").removeAttr("aria-hidden aria-disabled tabindex").css("display", "");
                if (_.htmlExpr.test(_.options.prevArrow)) {
                    _.$prevArrow.remove();
                }
            }
            if (_.$nextArrow && _.$nextArrow.length) {
                _.$nextArrow.removeClass("slick-disabled slick-arrow slick-hidden").removeAttr("aria-hidden aria-disabled tabindex").css("display", "");
                if (_.htmlExpr.test(_.options.nextArrow)) {
                    _.$nextArrow.remove();
                }
            }
        }
        if (_.$slides) {
            _.$slides.removeClass("slick-slide slick-active slick-center slick-visible slick-current").removeAttr("aria-hidden").removeAttr("data-slick-index").each(function() {
                $(this).attr("style", $(this).data("originalStyling"));
            });
            _.$slideTrack.children(this.options.slide).detach();
            _.$slideTrack.detach();
            _.$list.detach();
            _.$slider.append(_.$slides);
        }
        _.cleanUpRows();
        _.$slider.removeClass("slick-slider");
        _.$slider.removeClass("slick-initialized");
        _.unslicked = true;
        if (!refresh) {
            _.$slider.trigger("destroy", [ _ ]);
        }
    };
    Slick.prototype.disableTransition = function(slide) {
        var _ = this, transition = {};
        transition[_.transitionType] = "";
        if (_.options.fade === false) {
            _.$slideTrack.css(transition);
        } else {
            _.$slides.eq(slide).css(transition);
        }
    };
    Slick.prototype.fadeSlide = function(slideIndex, callback) {
        var _ = this;
        if (_.cssTransitions === false) {
            _.$slides.eq(slideIndex).css({
                zIndex: _.options.zIndex
            });
            _.$slides.eq(slideIndex).animate({
                opacity: 1
            }, _.options.speed, _.options.easing, callback);
        } else {
            _.applyTransition(slideIndex);
            _.$slides.eq(slideIndex).css({
                opacity: 1,
                zIndex: _.options.zIndex
            });
            if (callback) {
                setTimeout(function() {
                    _.disableTransition(slideIndex);
                    callback.call();
                }, _.options.speed);
            }
        }
    };
    Slick.prototype.fadeSlideOut = function(slideIndex) {
        var _ = this;
        if (_.cssTransitions === false) {
            _.$slides.eq(slideIndex).animate({
                opacity: 0,
                zIndex: _.options.zIndex - 2
            }, _.options.speed, _.options.easing);
        } else {
            _.applyTransition(slideIndex);
            _.$slides.eq(slideIndex).css({
                opacity: 0,
                zIndex: _.options.zIndex - 2
            });
        }
    };
    Slick.prototype.filterSlides = Slick.prototype.slickFilter = function(filter) {
        var _ = this;
        if (filter !== null) {
            _.unload();
            _.$slideTrack.children(this.options.slide).detach();
            _.$slidesCache.filter(filter).appendTo(_.$slideTrack);
            _.reinit();
        }
    };
    Slick.prototype.getCurrent = Slick.prototype.slickCurrentSlide = function() {
        var _ = this;
        return _.currentSlide;
    };
    Slick.prototype.getDotCount = function() {
        var _ = this;
        var breakPoint = 0;
        var counter = 0;
        var pagerQty = 0;
        if (_.options.infinite === true) {
            while (breakPoint < _.slideCount) {
                ++pagerQty;
                breakPoint = counter + _.options.slidesToShow;
                counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
            }
        } else if (_.options.centerMode === true) {
            pagerQty = _.slideCount;
        } else {
            while (breakPoint < _.slideCount) {
                ++pagerQty;
                breakPoint = counter + _.options.slidesToShow;
                counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
            }
        }
        return pagerQty - 1;
    };
    Slick.prototype.getLeft = function(slideIndex) {
        var _ = this, targetLeft, verticalHeight, verticalOffset = 0, targetSlide;
        _.slideOffset = 0;
        verticalHeight = _.$slides.first().outerHeight(true);
        if (_.options.infinite === true) {
            if (_.slideCount > _.options.slidesToShow) {
                _.slideOffset = _.slideWidth * _.options.slidesToShow * -1;
                verticalOffset = verticalHeight * _.options.slidesToShow * -1;
            }
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                if (slideIndex + _.options.slidesToScroll > _.slideCount && _.slideCount > _.options.slidesToShow) {
                    if (slideIndex > _.slideCount) {
                        _.slideOffset = (_.options.slidesToShow - (slideIndex - _.slideCount)) * _.slideWidth * -1;
                        verticalOffset = (_.options.slidesToShow - (slideIndex - _.slideCount)) * verticalHeight * -1;
                    } else {
                        _.slideOffset = _.slideCount % _.options.slidesToScroll * _.slideWidth * -1;
                        verticalOffset = _.slideCount % _.options.slidesToScroll * verticalHeight * -1;
                    }
                }
            }
        } else {
            if (slideIndex + _.options.slidesToShow > _.slideCount) {
                _.slideOffset = (slideIndex + _.options.slidesToShow - _.slideCount) * _.slideWidth;
                verticalOffset = (slideIndex + _.options.slidesToShow - _.slideCount) * verticalHeight;
            }
        }
        if (_.slideCount <= _.options.slidesToShow) {
            _.slideOffset = 0;
            verticalOffset = 0;
        }
        if (_.options.centerMode === true && _.options.infinite === true) {
            _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2) - _.slideWidth;
        } else if (_.options.centerMode === true) {
            _.slideOffset = 0;
            _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2);
        }
        if (_.options.vertical === false) {
            targetLeft = slideIndex * _.slideWidth * -1 + _.slideOffset;
        } else {
            targetLeft = slideIndex * verticalHeight * -1 + verticalOffset;
        }
        if (_.options.variableWidth === true) {
            if (_.slideCount <= _.options.slidesToShow || _.options.infinite === false) {
                targetSlide = _.$slideTrack.children(".slick-slide").eq(slideIndex);
            } else {
                targetSlide = _.$slideTrack.children(".slick-slide").eq(slideIndex + _.options.slidesToShow);
            }
            targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
            if (_.options.centerMode === true) {
                if (_.options.infinite === false) {
                    targetSlide = _.$slideTrack.children(".slick-slide").eq(slideIndex);
                } else {
                    targetSlide = _.$slideTrack.children(".slick-slide").eq(slideIndex + _.options.slidesToShow + 1);
                }
                targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
                targetLeft += (_.$list.width() - targetSlide.outerWidth()) / 2;
            }
        }
        return targetLeft;
    };
    Slick.prototype.getOption = Slick.prototype.slickGetOption = function(option) {
        var _ = this;
        return _.options[option];
    };
    Slick.prototype.getNavigableIndexes = function() {
        var _ = this, breakPoint = 0, counter = 0, indexes = [], max;
        if (_.options.infinite === false) {
            max = _.slideCount;
        } else {
            breakPoint = _.options.slidesToScroll * -1;
            counter = _.options.slidesToScroll * -1;
            max = _.slideCount * 2;
        }
        while (breakPoint < max) {
            indexes.push(breakPoint);
            breakPoint = counter + _.options.slidesToScroll;
            counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
        }
        return indexes;
    };
    Slick.prototype.getSlick = function() {
        return this;
    };
    Slick.prototype.getSlideCount = function() {
        var _ = this, slidesTraversed, swipedSlide, centerOffset;
        centerOffset = _.options.centerMode === true ? _.slideWidth * Math.floor(_.options.slidesToShow / 2) : 0;
        if (_.options.swipeToSlide === true) {
            _.$slideTrack.find(".slick-slide").each(function(index, slide) {
                if (slide.offsetLeft - centerOffset + $(slide).outerWidth() / 2 > _.swipeLeft * -1) {
                    swipedSlide = slide;
                    return false;
                }
            });
            slidesTraversed = Math.abs($(swipedSlide).attr("data-slick-index") - _.currentSlide) || 1;
            return slidesTraversed;
        } else {
            return _.options.slidesToScroll;
        }
    };
    Slick.prototype.goTo = Slick.prototype.slickGoTo = function(slide, dontAnimate) {
        var _ = this;
        _.changeSlide({
            data: {
                message: "index",
                index: parseInt(slide)
            }
        }, dontAnimate);
    };
    Slick.prototype.init = function(creation) {
        var _ = this;
        if (!$(_.$slider).hasClass("slick-initialized")) {
            $(_.$slider).addClass("slick-initialized");
            _.buildRows();
            _.buildOut();
            _.setProps();
            _.startLoad();
            _.loadSlider();
            _.initializeEvents();
            _.updateArrows();
            _.updateDots();
        }
        if (creation) {
            _.$slider.trigger("init", [ _ ]);
        }
        if (_.options.accessibility === true) {
            _.initADA();
        }
    };
    Slick.prototype.initArrowEvents = function() {
        var _ = this;
        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow.on("click.slick", {
                message: "previous"
            }, _.changeSlide);
            _.$nextArrow.on("click.slick", {
                message: "next"
            }, _.changeSlide);
        }
    };
    Slick.prototype.initDotEvents = function() {
        var _ = this;
        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {
            $("li", _.$dots).on("click.slick", {
                message: "index"
            }, _.changeSlide);
        }
        if (_.options.dots === true && _.options.pauseOnDotsHover === true && _.options.autoplay === true) {
            $("li", _.$dots).on("mouseenter.slick", $.proxy(_.setPaused, _, true)).on("mouseleave.slick", $.proxy(_.setPaused, _, false));
        }
    };
    Slick.prototype.initializeEvents = function() {
        var _ = this;
        _.initArrowEvents();
        _.initDotEvents();
        _.$list.on("touchstart.slick mousedown.slick", {
            action: "start"
        }, _.swipeHandler);
        _.$list.on("touchmove.slick mousemove.slick", {
            action: "move"
        }, _.swipeHandler);
        _.$list.on("touchend.slick mouseup.slick", {
            action: "end"
        }, _.swipeHandler);
        _.$list.on("touchcancel.slick mouseleave.slick", {
            action: "end"
        }, _.swipeHandler);
        _.$list.on("click.slick", _.clickHandler);
        $(document).on(_.visibilityChange, $.proxy(_.visibility, _));
        _.$list.on("mouseenter.slick", $.proxy(_.setPaused, _, true));
        _.$list.on("mouseleave.slick", $.proxy(_.setPaused, _, false));
        if (_.options.accessibility === true) {
            _.$list.on("keydown.slick", _.keyHandler);
        }
        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().on("click.slick", _.selectHandler);
        }
        $(window).on("orientationchange.slick.slick-" + _.instanceUid, $.proxy(_.orientationChange, _));
        $(window).on("resize.slick.slick-" + _.instanceUid, $.proxy(_.resize, _));
        $("[draggable!=true]", _.$slideTrack).on("dragstart", _.preventDefault);
        $(window).on("load.slick.slick-" + _.instanceUid, _.setPosition);
        $(document).on("ready.slick.slick-" + _.instanceUid, _.setPosition);
    };
    Slick.prototype.initUI = function() {
        var _ = this;
        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow.show();
            _.$nextArrow.show();
        }
        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {
            _.$dots.show();
        }
        if (_.options.autoplay === true) {
            _.autoPlay();
        }
    };
    Slick.prototype.keyHandler = function(event) {
        var _ = this;
        if (!event.target.tagName.match("TEXTAREA|INPUT|SELECT")) {
            if (event.keyCode === 37 && _.options.accessibility === true) {
                _.changeSlide({
                    data: {
                        message: "previous"
                    }
                });
            } else if (event.keyCode === 39 && _.options.accessibility === true) {
                _.changeSlide({
                    data: {
                        message: "next"
                    }
                });
            }
        }
    };
    Slick.prototype.lazyLoad = function() {
        var _ = this, loadRange, cloneRange, rangeStart, rangeEnd;
        function loadImages(imagesScope) {
            $("img[data-lazy]", imagesScope).each(function() {
                var image = $(this), imageSource = $(this).attr("data-lazy"), imageToLoad = document.createElement("img");
                imageToLoad.onload = function() {
                    image.animate({
                        opacity: 0
                    }, 100, function() {
                        image.attr("src", imageSource).animate({
                            opacity: 1
                        }, 200, function() {
                            image.removeAttr("data-lazy").removeClass("slick-loading");
                        });
                    });
                };
                imageToLoad.src = imageSource;
            });
        }
        if (_.options.centerMode === true) {
            if (_.options.infinite === true) {
                rangeStart = _.currentSlide + (_.options.slidesToShow / 2 + 1);
                rangeEnd = rangeStart + _.options.slidesToShow + 2;
            } else {
                rangeStart = Math.max(0, _.currentSlide - (_.options.slidesToShow / 2 + 1));
                rangeEnd = 2 + (_.options.slidesToShow / 2 + 1) + _.currentSlide;
            }
        } else {
            rangeStart = _.options.infinite ? _.options.slidesToShow + _.currentSlide : _.currentSlide;
            rangeEnd = rangeStart + _.options.slidesToShow;
            if (_.options.fade === true) {
                if (rangeStart > 0) rangeStart--;
                if (rangeEnd <= _.slideCount) rangeEnd++;
            }
        }
        loadRange = _.$slider.find(".slick-slide").slice(rangeStart, rangeEnd);
        loadImages(loadRange);
        if (_.slideCount <= _.options.slidesToShow) {
            cloneRange = _.$slider.find(".slick-slide");
            loadImages(cloneRange);
        } else if (_.currentSlide >= _.slideCount - _.options.slidesToShow) {
            cloneRange = _.$slider.find(".slick-cloned").slice(0, _.options.slidesToShow);
            loadImages(cloneRange);
        } else if (_.currentSlide === 0) {
            cloneRange = _.$slider.find(".slick-cloned").slice(_.options.slidesToShow * -1);
            loadImages(cloneRange);
        }
    };
    Slick.prototype.loadSlider = function() {
        var _ = this;
        _.setPosition();
        _.$slideTrack.css({
            opacity: 1
        });
        _.$slider.removeClass("slick-loading");
        _.initUI();
        if (_.options.lazyLoad === "progressive") {
            _.progressiveLazyLoad();
        }
    };
    Slick.prototype.next = Slick.prototype.slickNext = function() {
        var _ = this;
        _.changeSlide({
            data: {
                message: "next"
            }
        });
    };
    Slick.prototype.orientationChange = function() {
        var _ = this;
        _.checkResponsive();
        _.setPosition();
    };
    Slick.prototype.pause = Slick.prototype.slickPause = function() {
        var _ = this;
        _.autoPlayClear();
        _.paused = true;
    };
    Slick.prototype.play = Slick.prototype.slickPlay = function() {
        var _ = this;
        _.paused = false;
        _.autoPlay();
    };
    Slick.prototype.postSlide = function(index) {
        var _ = this;
        _.$slider.trigger("afterChange", [ _, index ]);
        _.animating = false;
        _.setPosition();
        _.swipeLeft = null;
        if (_.options.autoplay === true && _.paused === false) {
            _.autoPlay();
        }
        if (_.options.accessibility === true) {
            _.initADA();
        }
    };
    Slick.prototype.prev = Slick.prototype.slickPrev = function() {
        var _ = this;
        _.changeSlide({
            data: {
                message: "previous"
            }
        });
    };
    Slick.prototype.preventDefault = function(e) {
        e.preventDefault();
    };
    Slick.prototype.progressiveLazyLoad = function() {
        var _ = this, imgCount, targetImage;
        imgCount = $("img[data-lazy]", _.$slider).length;
        if (imgCount > 0) {
            targetImage = $("img[data-lazy]", _.$slider).first();
            targetImage.attr("src", targetImage.attr("data-lazy")).removeClass("slick-loading").load(function() {
                targetImage.removeAttr("data-lazy");
                _.progressiveLazyLoad();
                if (_.options.adaptiveHeight === true) {
                    _.setPosition();
                }
            }).error(function() {
                targetImage.removeAttr("data-lazy");
                _.progressiveLazyLoad();
            });
        }
    };
    Slick.prototype.refresh = function(initializing) {
        var _ = this, currentSlide = _.currentSlide;
        _.destroy(true);
        $.extend(_, _.initials, {
            currentSlide: currentSlide
        });
        _.init();
        if (!initializing) {
            _.changeSlide({
                data: {
                    message: "index",
                    index: currentSlide
                }
            }, false);
        }
    };
    Slick.prototype.registerBreakpoints = function() {
        var _ = this, breakpoint, currentBreakpoint, l, responsiveSettings = _.options.responsive || null;
        if ($.type(responsiveSettings) === "array" && responsiveSettings.length) {
            _.respondTo = _.options.respondTo || "window";
            for (breakpoint in responsiveSettings) {
                l = _.breakpoints.length - 1;
                currentBreakpoint = responsiveSettings[breakpoint].breakpoint;
                if (responsiveSettings.hasOwnProperty(breakpoint)) {
                    while (l >= 0) {
                        if (_.breakpoints[l] && _.breakpoints[l] === currentBreakpoint) {
                            _.breakpoints.splice(l, 1);
                        }
                        l--;
                    }
                    _.breakpoints.push(currentBreakpoint);
                    _.breakpointSettings[currentBreakpoint] = responsiveSettings[breakpoint].settings;
                }
            }
            _.breakpoints.sort(function(a, b) {
                return _.options.mobileFirst ? a - b : b - a;
            });
        }
    };
    Slick.prototype.reinit = function() {
        var _ = this;
        _.$slides = _.$slideTrack.children(_.options.slide).addClass("slick-slide");
        _.slideCount = _.$slides.length;
        if (_.currentSlide >= _.slideCount && _.currentSlide !== 0) {
            _.currentSlide = _.currentSlide - _.options.slidesToScroll;
        }
        if (_.slideCount <= _.options.slidesToShow) {
            _.currentSlide = 0;
        }
        _.registerBreakpoints();
        _.setProps();
        _.setupInfinite();
        _.buildArrows();
        _.updateArrows();
        _.initArrowEvents();
        _.buildDots();
        _.updateDots();
        _.initDotEvents();
        _.checkResponsive(false, true);
        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().on("click.slick", _.selectHandler);
        }
        _.setSlideClasses(0);
        _.setPosition();
        _.$slider.trigger("reInit", [ _ ]);
        if (_.options.autoplay === true) {
            _.focusHandler();
        }
    };
    Slick.prototype.resize = function() {
        var _ = this;
        if ($(window).width() !== _.windowWidth) {
            clearTimeout(_.windowDelay);
            _.windowDelay = window.setTimeout(function() {
                _.windowWidth = $(window).width();
                _.checkResponsive();
                if (!_.unslicked) {
                    _.setPosition();
                }
            }, 50);
        }
    };
    Slick.prototype.removeSlide = Slick.prototype.slickRemove = function(index, removeBefore, removeAll) {
        var _ = this;
        if (typeof index === "boolean") {
            removeBefore = index;
            index = removeBefore === true ? 0 : _.slideCount - 1;
        } else {
            index = removeBefore === true ? --index : index;
        }
        if (_.slideCount < 1 || index < 0 || index > _.slideCount - 1) {
            return false;
        }
        _.unload();
        if (removeAll === true) {
            _.$slideTrack.children().remove();
        } else {
            _.$slideTrack.children(this.options.slide).eq(index).remove();
        }
        _.$slides = _.$slideTrack.children(this.options.slide);
        _.$slideTrack.children(this.options.slide).detach();
        _.$slideTrack.append(_.$slides);
        _.$slidesCache = _.$slides;
        _.reinit();
    };
    Slick.prototype.setCSS = function(position) {
        var _ = this, positionProps = {}, x, y;
        if (_.options.rtl === true) {
            position = -position;
        }
        x = _.positionProp == "left" ? Math.ceil(position) + "px" : "0px";
        y = _.positionProp == "top" ? Math.ceil(position) + "px" : "0px";
        positionProps[_.positionProp] = position;
        if (_.transformsEnabled === false) {
            _.$slideTrack.css(positionProps);
        } else {
            positionProps = {};
            if (_.cssTransitions === false) {
                positionProps[_.animType] = "translate(" + x + ", " + y + ")";
                _.$slideTrack.css(positionProps);
            } else {
                positionProps[_.animType] = "translate3d(" + x + ", " + y + ", 0px)";
                _.$slideTrack.css(positionProps);
            }
        }
    };
    Slick.prototype.setDimensions = function() {
        var _ = this;
        if (_.options.vertical === false) {
            if (_.options.centerMode === true) {
                _.$list.css({
                    padding: "0px " + _.options.centerPadding
                });
            }
        } else {
            _.$list.height(_.$slides.first().outerHeight(true) * _.options.slidesToShow);
            if (_.options.centerMode === true) {
                _.$list.css({
                    padding: _.options.centerPadding + " 0px"
                });
            }
        }
        _.listWidth = _.$list.width();
        _.listHeight = _.$list.height();
        if (_.options.vertical === false && _.options.variableWidth === false) {
            _.slideWidth = Math.ceil(_.listWidth / _.options.slidesToShow);
            _.$slideTrack.width(Math.ceil(_.slideWidth * _.$slideTrack.children(".slick-slide").length));
        } else if (_.options.variableWidth === true) {
            _.$slideTrack.width(5e3 * _.slideCount);
        } else {
            _.slideWidth = Math.ceil(_.listWidth);
            _.$slideTrack.height(Math.ceil(_.$slides.first().outerHeight(true) * _.$slideTrack.children(".slick-slide").length));
        }
        var offset = _.$slides.first().outerWidth(true) - _.$slides.first().width();
        if (_.options.variableWidth === false) _.$slideTrack.children(".slick-slide").width(_.slideWidth - offset);
    };
    Slick.prototype.setFade = function() {
        var _ = this, targetLeft;
        _.$slides.each(function(index, element) {
            targetLeft = _.slideWidth * index * -1;
            if (_.options.rtl === true) {
                $(element).css({
                    position: "relative",
                    right: targetLeft,
                    top: 0,
                    zIndex: _.options.zIndex - 2,
                    opacity: 0
                });
            } else {
                $(element).css({
                    position: "relative",
                    left: targetLeft,
                    top: 0,
                    zIndex: _.options.zIndex - 2,
                    opacity: 0
                });
            }
        });
        _.$slides.eq(_.currentSlide).css({
            zIndex: _.options.zIndex - 1,
            opacity: 1
        });
    };
    Slick.prototype.setHeight = function() {
        var _ = this;
        if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
            var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
            _.$list.css("height", targetHeight);
        }
    };
    Slick.prototype.setOption = Slick.prototype.slickSetOption = function(option, value, refresh) {
        var _ = this, l, item;
        if (option === "responsive" && $.type(value) === "array") {
            for (item in value) {
                if ($.type(_.options.responsive) !== "array") {
                    _.options.responsive = [ value[item] ];
                } else {
                    l = _.options.responsive.length - 1;
                    while (l >= 0) {
                        if (_.options.responsive[l].breakpoint === value[item].breakpoint) {
                            _.options.responsive.splice(l, 1);
                        }
                        l--;
                    }
                    _.options.responsive.push(value[item]);
                }
            }
        } else {
            _.options[option] = value;
        }
        if (refresh === true) {
            _.unload();
            _.reinit();
        }
    };
    Slick.prototype.setPosition = function() {
        var _ = this;
        _.setDimensions();
        _.setHeight();
        if (_.options.fade === false) {
            _.setCSS(_.getLeft(_.currentSlide));
        } else {
            _.setFade();
        }
        _.$slider.trigger("setPosition", [ _ ]);
    };
    Slick.prototype.setProps = function() {
        var _ = this, bodyStyle = document.body.style;
        _.positionProp = _.options.vertical === true ? "top" : "left";
        if (_.positionProp === "top") {
            _.$slider.addClass("slick-vertical");
        } else {
            _.$slider.removeClass("slick-vertical");
        }
        if (bodyStyle.WebkitTransition !== undefined || bodyStyle.MozTransition !== undefined || bodyStyle.msTransition !== undefined) {
            if (_.options.useCSS === true) {
                _.cssTransitions = true;
            }
        }
        if (_.options.fade) {
            if (typeof _.options.zIndex === "number") {
                if (_.options.zIndex < 3) {
                    _.options.zIndex = 3;
                }
            } else {
                _.options.zIndex = _.defaults.zIndex;
            }
        }
        if (bodyStyle.OTransform !== undefined) {
            _.animType = "OTransform";
            _.transformType = "-o-transform";
            _.transitionType = "OTransition";
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.MozTransform !== undefined) {
            _.animType = "MozTransform";
            _.transformType = "-moz-transform";
            _.transitionType = "MozTransition";
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.MozPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.webkitTransform !== undefined) {
            _.animType = "webkitTransform";
            _.transformType = "-webkit-transform";
            _.transitionType = "webkitTransition";
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.msTransform !== undefined) {
            _.animType = "msTransform";
            _.transformType = "-ms-transform";
            _.transitionType = "msTransition";
            if (bodyStyle.msTransform === undefined) _.animType = false;
        }
        if (bodyStyle.transform !== undefined && _.animType !== false) {
            _.animType = "transform";
            _.transformType = "transform";
            _.transitionType = "transition";
        }
        _.transformsEnabled = _.animType !== null && _.animType !== false;
    };
    Slick.prototype.setSlideClasses = function(index) {
        var _ = this, centerOffset, allSlides, indexOffset, remainder;
        allSlides = _.$slider.find(".slick-slide").removeClass("slick-active slick-center slick-current").attr("aria-hidden", "true");
        _.$slides.eq(index).addClass("slick-current");
        if (_.options.centerMode === true) {
            centerOffset = Math.floor(_.options.slidesToShow / 2);
            if (_.options.infinite === true) {
                if (index >= centerOffset && index <= _.slideCount - 1 - centerOffset) {
                    _.$slides.slice(index - centerOffset, index + centerOffset + 1).addClass("slick-active").attr("aria-hidden", "false");
                } else {
                    indexOffset = _.options.slidesToShow + index;
                    allSlides.slice(indexOffset - centerOffset + 1, indexOffset + centerOffset + 2).addClass("slick-active").attr("aria-hidden", "false");
                }
                if (index === 0) {
                    allSlides.eq(allSlides.length - 1 - _.options.slidesToShow).addClass("slick-center");
                } else if (index === _.slideCount - 1) {
                    allSlides.eq(_.options.slidesToShow).addClass("slick-center");
                }
            }
            _.$slides.eq(index).addClass("slick-center");
        } else {
            if (index >= 0 && index <= _.slideCount - _.options.slidesToShow) {
                _.$slides.slice(index, index + _.options.slidesToShow).addClass("slick-active").attr("aria-hidden", "false");
            } else if (allSlides.length <= _.options.slidesToShow) {
                allSlides.addClass("slick-active").attr("aria-hidden", "false");
            } else {
                remainder = _.slideCount % _.options.slidesToShow;
                indexOffset = _.options.infinite === true ? _.options.slidesToShow + index : index;
                if (_.options.slidesToShow == _.options.slidesToScroll && _.slideCount - index < _.options.slidesToShow) {
                    allSlides.slice(indexOffset - (_.options.slidesToShow - remainder), indexOffset + remainder).addClass("slick-active").attr("aria-hidden", "false");
                } else {
                    allSlides.slice(indexOffset, indexOffset + _.options.slidesToShow).addClass("slick-active").attr("aria-hidden", "false");
                }
            }
        }
        if (_.options.lazyLoad === "ondemand") {
            _.lazyLoad();
        }
    };
    Slick.prototype.setupInfinite = function() {
        var _ = this, i, slideIndex, infiniteCount;
        if (_.options.fade === true) {
            _.options.centerMode = false;
        }
        if (_.options.infinite === true && _.options.fade === false) {
            slideIndex = null;
            if (_.slideCount > _.options.slidesToShow) {
                if (_.options.centerMode === true) {
                    infiniteCount = _.options.slidesToShow + 1;
                } else {
                    infiniteCount = _.options.slidesToShow;
                }
                for (i = _.slideCount; i > _.slideCount - infiniteCount; i -= 1) {
                    slideIndex = i - 1;
                    $(_.$slides[slideIndex]).clone(true).attr("id", "").attr("data-slick-index", slideIndex - _.slideCount).prependTo(_.$slideTrack).addClass("slick-cloned");
                }
                for (i = 0; i < infiniteCount; i += 1) {
                    slideIndex = i;
                    $(_.$slides[slideIndex]).clone(true).attr("id", "").attr("data-slick-index", slideIndex + _.slideCount).appendTo(_.$slideTrack).addClass("slick-cloned");
                }
                _.$slideTrack.find(".slick-cloned").find("[id]").each(function() {
                    $(this).attr("id", "");
                });
            }
        }
    };
    Slick.prototype.setPaused = function(paused) {
        var _ = this;
        if (_.options.autoplay === true && _.options.pauseOnHover === true) {
            _.paused = paused;
            if (!paused) {
                _.autoPlay();
            } else {
                _.autoPlayClear();
            }
        }
    };
    Slick.prototype.selectHandler = function(event) {
        var _ = this;
        var targetElement = $(event.target).is(".slick-slide") ? $(event.target) : $(event.target).parents(".slick-slide");
        var index = parseInt(targetElement.attr("data-slick-index"));
        if (!index) index = 0;
        if (_.slideCount <= _.options.slidesToShow) {
            _.setSlideClasses(index);
            _.asNavFor(index);
            return;
        }
        _.slideHandler(index);
    };
    Slick.prototype.slideHandler = function(index, sync, dontAnimate) {
        var targetSlide, animSlide, oldSlide, slideLeft, targetLeft = null, _ = this;
        sync = sync || false;
        if (_.animating === true && _.options.waitForAnimate === true) {
            return;
        }
        if (_.options.fade === true && _.currentSlide === index) {
            return;
        }
        if (_.slideCount <= _.options.slidesToShow) {
            return;
        }
        if (sync === false) {
            _.asNavFor(index);
        }
        targetSlide = index;
        targetLeft = _.getLeft(targetSlide);
        slideLeft = _.getLeft(_.currentSlide);
        _.currentLeft = _.swipeLeft === null ? slideLeft : _.swipeLeft;
        if (_.options.infinite === false && _.options.centerMode === false && (index < 0 || index > _.getDotCount() * _.options.slidesToScroll)) {
            if (_.options.fade === false) {
                targetSlide = _.currentSlide;
                if (dontAnimate !== true) {
                    _.animateSlide(slideLeft, function() {
                        _.postSlide(targetSlide);
                    });
                } else {
                    _.postSlide(targetSlide);
                }
            }
            return;
        } else if (_.options.infinite === false && _.options.centerMode === true && (index < 0 || index > _.slideCount - _.options.slidesToScroll)) {
            if (_.options.fade === false) {
                targetSlide = _.currentSlide;
                if (dontAnimate !== true) {
                    _.animateSlide(slideLeft, function() {
                        _.postSlide(targetSlide);
                    });
                } else {
                    _.postSlide(targetSlide);
                }
            }
            return;
        }
        if (_.options.autoplay === true) {
            clearInterval(_.autoPlayTimer);
        }
        if (targetSlide < 0) {
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                animSlide = _.slideCount - _.slideCount % _.options.slidesToScroll;
            } else {
                animSlide = _.slideCount + targetSlide;
            }
        } else if (targetSlide >= _.slideCount) {
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                animSlide = 0;
            } else {
                animSlide = targetSlide - _.slideCount;
            }
        } else {
            animSlide = targetSlide;
        }
        _.animating = true;
        _.$slider.trigger("beforeChange", [ _, _.currentSlide, animSlide ]);
        oldSlide = _.currentSlide;
        _.currentSlide = animSlide;
        _.setSlideClasses(_.currentSlide);
        _.updateDots();
        _.updateArrows();
        if (_.options.fade === true) {
            if (dontAnimate !== true) {
                _.fadeSlideOut(oldSlide);
                _.fadeSlide(animSlide, function() {
                    _.postSlide(animSlide);
                });
            } else {
                _.postSlide(animSlide);
            }
            _.animateHeight();
            return;
        }
        if (dontAnimate !== true) {
            _.animateSlide(targetLeft, function() {
                _.postSlide(animSlide);
            });
        } else {
            _.postSlide(animSlide);
        }
    };
    Slick.prototype.startLoad = function() {
        var _ = this;
        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow.hide();
            _.$nextArrow.hide();
        }
        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {
            _.$dots.hide();
        }
        _.$slider.addClass("slick-loading");
    };
    Slick.prototype.swipeDirection = function() {
        var xDist, yDist, r, swipeAngle, _ = this;
        xDist = _.touchObject.startX - _.touchObject.curX;
        yDist = _.touchObject.startY - _.touchObject.curY;
        r = Math.atan2(yDist, xDist);
        swipeAngle = Math.round(r * 180 / Math.PI);
        if (swipeAngle < 0) {
            swipeAngle = 360 - Math.abs(swipeAngle);
        }
        if (swipeAngle <= 45 && swipeAngle >= 0) {
            return _.options.rtl === false ? "left" : "right";
        }
        if (swipeAngle <= 360 && swipeAngle >= 315) {
            return _.options.rtl === false ? "left" : "right";
        }
        if (swipeAngle >= 135 && swipeAngle <= 225) {
            return _.options.rtl === false ? "right" : "left";
        }
        if (_.options.verticalSwiping === true) {
            if (swipeAngle >= 35 && swipeAngle <= 135) {
                return "left";
            } else {
                return "right";
            }
        }
        return "vertical";
    };
    Slick.prototype.swipeEnd = function(event) {
        var _ = this, slideCount;
        _.dragging = false;
        _.shouldClick = _.touchObject.swipeLength > 10 ? false : true;
        if (_.touchObject.curX === undefined) {
            return false;
        }
        if (_.touchObject.edgeHit === true) {
            _.$slider.trigger("edge", [ _, _.swipeDirection() ]);
        }
        if (_.touchObject.swipeLength >= _.touchObject.minSwipe) {
            switch (_.swipeDirection()) {
              case "left":
                slideCount = _.options.swipeToSlide ? _.checkNavigable(_.currentSlide + _.getSlideCount()) : _.currentSlide + _.getSlideCount();
                _.slideHandler(slideCount);
                _.currentDirection = 0;
                _.touchObject = {};
                _.$slider.trigger("swipe", [ _, "left" ]);
                break;

              case "right":
                slideCount = _.options.swipeToSlide ? _.checkNavigable(_.currentSlide - _.getSlideCount()) : _.currentSlide - _.getSlideCount();
                _.slideHandler(slideCount);
                _.currentDirection = 1;
                _.touchObject = {};
                _.$slider.trigger("swipe", [ _, "right" ]);
                break;
            }
        } else {
            if (_.touchObject.startX !== _.touchObject.curX) {
                _.slideHandler(_.currentSlide);
                _.touchObject = {};
            }
        }
    };
    Slick.prototype.swipeHandler = function(event) {
        var _ = this;
        if (_.options.swipe === false || "ontouchend" in document && _.options.swipe === false) {
            return;
        } else if (_.options.draggable === false && event.type.indexOf("mouse") !== -1) {
            return;
        }
        _.touchObject.fingerCount = event.originalEvent && event.originalEvent.touches !== undefined ? event.originalEvent.touches.length : 1;
        _.touchObject.minSwipe = _.listWidth / _.options.touchThreshold;
        if (_.options.verticalSwiping === true) {
            _.touchObject.minSwipe = _.listHeight / _.options.touchThreshold;
        }
        switch (event.data.action) {
          case "start":
            _.swipeStart(event);
            break;

          case "move":
            _.swipeMove(event);
            break;

          case "end":
            _.swipeEnd(event);
            break;
        }
    };
    Slick.prototype.swipeMove = function(event) {
        var _ = this, edgeWasHit = false, curLeft, swipeDirection, swipeLength, positionOffset, touches;
        touches = event.originalEvent !== undefined ? event.originalEvent.touches : null;
        if (!_.dragging || touches && touches.length !== 1) {
            return false;
        }
        curLeft = _.getLeft(_.currentSlide);
        _.touchObject.curX = touches !== undefined ? touches[0].pageX : event.clientX;
        _.touchObject.curY = touches !== undefined ? touches[0].pageY : event.clientY;
        _.touchObject.swipeLength = Math.round(Math.sqrt(Math.pow(_.touchObject.curX - _.touchObject.startX, 2)));
        if (_.options.verticalSwiping === true) {
            _.touchObject.swipeLength = Math.round(Math.sqrt(Math.pow(_.touchObject.curY - _.touchObject.startY, 2)));
        }
        swipeDirection = _.swipeDirection();
        if (swipeDirection === "vertical") {
            return;
        }
        if (event.originalEvent !== undefined && _.touchObject.swipeLength > 4) {
            event.preventDefault();
        }
        positionOffset = (_.options.rtl === false ? 1 : -1) * (_.touchObject.curX > _.touchObject.startX ? 1 : -1);
        if (_.options.verticalSwiping === true) {
            positionOffset = _.touchObject.curY > _.touchObject.startY ? 1 : -1;
        }
        swipeLength = _.touchObject.swipeLength;
        _.touchObject.edgeHit = false;
        if (_.options.infinite === false) {
            if (_.currentSlide === 0 && swipeDirection === "right" || _.currentSlide >= _.getDotCount() && swipeDirection === "left") {
                swipeLength = _.touchObject.swipeLength * _.options.edgeFriction;
                _.touchObject.edgeHit = true;
            }
        }
        if (_.options.vertical === false) {
            _.swipeLeft = curLeft + swipeLength * positionOffset;
        } else {
            _.swipeLeft = curLeft + swipeLength * (_.$list.height() / _.listWidth) * positionOffset;
        }
        if (_.options.verticalSwiping === true) {
            _.swipeLeft = curLeft + swipeLength * positionOffset;
        }
        if (_.options.fade === true || _.options.touchMove === false) {
            return false;
        }
        if (_.animating === true) {
            _.swipeLeft = null;
            return false;
        }
        _.setCSS(_.swipeLeft);
    };
    Slick.prototype.swipeStart = function(event) {
        var _ = this, touches;
        if (_.touchObject.fingerCount !== 1 || _.slideCount <= _.options.slidesToShow) {
            _.touchObject = {};
            return false;
        }
        if (event.originalEvent !== undefined && event.originalEvent.touches !== undefined) {
            touches = event.originalEvent.touches[0];
        }
        _.touchObject.startX = _.touchObject.curX = touches !== undefined ? touches.pageX : event.clientX;
        _.touchObject.startY = _.touchObject.curY = touches !== undefined ? touches.pageY : event.clientY;
        _.dragging = true;
    };
    Slick.prototype.unfilterSlides = Slick.prototype.slickUnfilter = function() {
        var _ = this;
        if (_.$slidesCache !== null) {
            _.unload();
            _.$slideTrack.children(this.options.slide).detach();
            _.$slidesCache.appendTo(_.$slideTrack);
            _.reinit();
        }
    };
    Slick.prototype.unload = function() {
        var _ = this;
        $(".slick-cloned", _.$slider).remove();
        if (_.$dots) {
            _.$dots.remove();
        }
        if (_.$prevArrow && _.htmlExpr.test(_.options.prevArrow)) {
            _.$prevArrow.remove();
        }
        if (_.$nextArrow && _.htmlExpr.test(_.options.nextArrow)) {
            _.$nextArrow.remove();
        }
        _.$slides.removeClass("slick-slide slick-active slick-visible slick-current").attr("aria-hidden", "true").css("width", "");
    };
    Slick.prototype.unslick = function(fromBreakpoint) {
        var _ = this;
        _.$slider.trigger("unslick", [ _, fromBreakpoint ]);
        _.destroy();
    };
    Slick.prototype.updateArrows = function() {
        var _ = this, centerOffset;
        centerOffset = Math.floor(_.options.slidesToShow / 2);
        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow && !_.options.infinite) {
            _.$prevArrow.removeClass("slick-disabled").attr("aria-disabled", "false");
            _.$nextArrow.removeClass("slick-disabled").attr("aria-disabled", "false");
            if (_.currentSlide === 0) {
                _.$prevArrow.addClass("slick-disabled").attr("aria-disabled", "true");
                _.$nextArrow.removeClass("slick-disabled").attr("aria-disabled", "false");
            } else if (_.currentSlide >= _.slideCount - _.options.slidesToShow && _.options.centerMode === false) {
                _.$nextArrow.addClass("slick-disabled").attr("aria-disabled", "true");
                _.$prevArrow.removeClass("slick-disabled").attr("aria-disabled", "false");
            } else if (_.currentSlide >= _.slideCount - 1 && _.options.centerMode === true) {
                _.$nextArrow.addClass("slick-disabled").attr("aria-disabled", "true");
                _.$prevArrow.removeClass("slick-disabled").attr("aria-disabled", "false");
            }
        }
    };
    Slick.prototype.updateDots = function() {
        var _ = this;
        if (_.$dots !== null) {
            _.$dots.find("li").removeClass("slick-active").attr("aria-hidden", "true");
            _.$dots.find("li").eq(Math.floor(_.currentSlide / _.options.slidesToScroll)).addClass("slick-active").attr("aria-hidden", "false");
        }
    };
    Slick.prototype.visibility = function() {
        var _ = this;
        if (document[_.hidden]) {
            _.paused = true;
            _.autoPlayClear();
        } else {
            if (_.options.autoplay === true) {
                _.paused = false;
                _.autoPlay();
            }
        }
    };
    Slick.prototype.initADA = function() {
        var _ = this;
        _.$slides.add(_.$slideTrack.find(".slick-cloned")).attr({
            "aria-hidden": "true",
            tabindex: "-1"
        }).find("a, input, button, select").attr({
            tabindex: "-1"
        });
        _.$slideTrack.attr("role", "listbox");
        _.$slides.not(_.$slideTrack.find(".slick-cloned")).each(function(i) {
            $(this).attr({
                role: "option",
                "aria-describedby": "slick-slide" + _.instanceUid + i + ""
            });
        });
        if (_.$dots !== null) {
            _.$dots.attr("role", "tablist").find("li").each(function(i) {
                $(this).attr({
                    role: "presentation",
                    "aria-selected": "false",
                    "aria-controls": "navigation" + _.instanceUid + i + "",
                    id: "slick-slide" + _.instanceUid + i + ""
                });
            }).first().attr("aria-selected", "true").end().find("button").attr("role", "button").end().closest("div").attr("role", "toolbar");
        }
        _.activateADA();
    };
    Slick.prototype.activateADA = function() {
        var _ = this, _isSlideOnFocus = _.$slider.find("*").is(":focus");
        _.$slideTrack.find(".slick-active").attr({
            "aria-hidden": "false",
            tabindex: "0"
        }).find("a, input, button, select").attr({
            tabindex: "0"
        });
        _isSlideOnFocus && _.$slideTrack.find(".slick-active").focus();
    };
    Slick.prototype.focusHandler = function() {
        var _ = this;
        _.$slider.on("focus.slick blur.slick", "*", function(event) {
            event.stopImmediatePropagation();
            var sf = $(this);
            setTimeout(function() {
                if (_.isPlay) {
                    if (sf.is(":focus")) {
                        _.autoPlayClear();
                        _.paused = true;
                    } else {
                        _.paused = false;
                        _.autoPlay();
                    }
                }
            }, 0);
        });
    };
    $.fn.slick = function() {
        var _ = this, opt = arguments[0], args = Array.prototype.slice.call(arguments, 1), l = _.length, i = 0, ret;
        for (i; i < l; i++) {
            if (typeof opt == "object" || typeof opt == "undefined") _[i].slick = new Slick(_[i], opt); else ret = _[i].slick[opt].apply(_[i].slick, args);
            if (typeof ret != "undefined") return ret;
        }
        return _;
    };
});

(function($) {
    $.fn.unveil = function(threshold, callback) {
        var $w = $(window), th = threshold || 0, retina = window.devicePixelRatio > 1, attrib = retina ? "data-src-retina" : "data-src", images = this, loaded;
        this.one("unveil", function() {
            var source = this.getAttribute(attrib);
            source = source || this.getAttribute("data-src");
            if (source) {
                if (this.tagName === "IMG") {
                    this.setAttribute("src", source);
                    this.parentElement.classList.add("is-loaded");
                } else {
                    this.style.backgroundImage = "url(" + source + ")";
                    this.parentElement.classList.add("is-loaded");
                }
                if (typeof callback === "function") {
                    callback.call(this);
                }
            }
        });
        function unveil() {
            var inview = images.filter(function() {
                var $e = $(this);
                if ($e.is(":hidden")) return;
                var wt = $w.scrollTop(), wb = wt + $w.height(), et = $e.offset().top, eb = et + $e.height();
                return eb >= wt - th && et <= wb + th;
            });
            loaded = inview.trigger("unveil");
            images = images.not(loaded);
        }
        $w.on("scroll.unveil resize.unveil lookup.unveil", unveil);
        unveil();
        return this;
    };
})(window.jQuery || window.Zepto);

(function($) {
    var addClass = $.fn.addClass;
    $.fn.addClass = function(value) {
        var orig = addClass.apply(this, arguments);
        var elem, i = 0, len = this.length;
        for (;i < len; i++) {
            elem = this[i];
            if (elem instanceof SVGElement) {
                var classes = $(elem).attr("class");
                if (classes) {
                    var index = classes.indexOf(value);
                    if (index === -1) {
                        classes = classes + " " + value;
                        $(elem).attr("class", classes);
                    }
                } else {
                    $(elem).attr("class", value);
                }
            }
        }
        return orig;
    };
    var removeClass = $.fn.removeClass;
    $.fn.removeClass = function(value) {
        var orig = removeClass.apply(this, arguments);
        var elem, i = 0, len = this.length;
        for (;i < len; i++) {
            elem = this[i];
            if (elem instanceof SVGElement) {
                var classes = $(elem).attr("class");
                if (classes) {
                    var index = classes.indexOf(value);
                    if (index !== -1) {
                        classes = classes.substring(0, index) + classes.substring(index + value.length, classes.length);
                        $(elem).attr("class", classes);
                    }
                }
            }
        }
        return orig;
    };
    var hasClass = $.fn.hasClass;
    $.fn.hasClass = function(value) {
        var orig = hasClass.apply(this, arguments);
        var elem, i = 0, len = this.length;
        for (;i < len; i++) {
            elem = this[i];
            if (elem instanceof SVGElement) {
                var classes = $(elem).attr("class");
                if (classes) {
                    if (classes.indexOf(value) === -1) {
                        return false;
                    } else {
                        return true;
                    }
                } else {
                    return false;
                }
            }
        }
        return orig;
    };
})(jQuery);

$.easing.jswing = $.easing.swing;

$.extend($.easing, {
    def: "easeInExpo",
    swing: function(x, t, b, c, d) {
        return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
    },
    easeInSine: function(x, t, b, c, d) {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    },
    easeOutSine: function(x, t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
    },
    easeInOutSine: function(x, t, b, c, d) {
        return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    },
    easeInExpo: function(x, t, b, c, d) {
        return t === 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
    },
    easeOutExpo: function(x, t, b, c, d) {
        return t === d ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    }
});

(function($) {
    var pageTrans = {
        init: function() {
            var siteURL = "https://" + top.location.host.toString();
            var transLinks = $("a[href^='" + siteURL + "'], a[href^='/'], a[href^='./'], a[href^='../']");
            var noTransLinks = transLinks.not(".no-trans");
            setTimeout(function() {
                $("body").removeClass("fade-in-page");
            }, 5100);
            transLinks.click(function(e) {
                if (e.metaKey || e.ctrlKey) return;
                if (e.metaKey || e.shiftKey) return;
                e.preventDefault();
                var linkLocation = this.href;
                function redirectPage() {
                    window.location = linkLocation;
                }
                $("body").addClass("is-exiting");
                $(".site-menu, main").animate({
                    opacity: "0"
                }, {
                    duration: 600,
                    complete: function() {
                        $("body").fadeOut(600, redirectPage);
                    }
                });
            });
            $(window).unload(function() {
                $(window).unbind("unload");
            });
            $(window).bind("pageshow", function(e) {
                if (e.originalEvent.persisted) {
                    window.location.reload();
                }
            });
        }
    };
    pageTrans.init();
})(jQuery);

(function($) {
    scrollDirection = {
        init: function() {
            var didScroll;
            var lastScrollTop = 0;
            var scrollDistance = 15;
            var navbarHeight = $(".header-main").outerHeight();
            $(window).scroll(function() {
                didScroll = true;
            });
            function hasScrolled() {
                var st = $(this).scrollTop();
                if (Math.abs(lastScrollTop - st) <= scrollDistance) {
                    return;
                }
                if (st > lastScrollTop && st > navbarHeight) {
                    $("body").removeClass("at-top close-to-top").removeClass("scrolling-up").addClass("scrolling-down");
                } else if (st + $(window).height() < $(document).height()) {
                    $("body").removeClass("scrolling-down").addClass("scrolling-up");
                }
                if ($("body").hasClass("scrolling-up") && st <= 225) {
                    $("body").addClass("close-to-top");
                }
                if (st <= 0) {
                    $("body").removeClass("scrolling-down scrolling-up close-to-top").addClass("at-top");
                }
                lastScrollTop = st;
            }
            setInterval(function() {
                if (didScroll) {
                    hasScrolled();
                    didScroll = false;
                }
            }, 250);
        }
    };
    scrollDirection.init();
})(jQuery);

(function($) {
    var s, menuNav = {
        settings: {
            body: $("body"),
            menuToggle: $(".js-menu-toggle")
        },
        init: function() {
            s = this.settings;
            this.bindEvents();
        },
        bindEvents: function() {
            s.menuToggle.click(function(e) {
                e.preventDefault();
                menuNav.toggleMenu();
            });
            $(document).keyup(function(e) {
                if ($("body").hasClass("js-menu--is-open") && e.which === 27) {
                    menuNav.toggleMenu();
                }
            });
        },
        toggleMenu: function() {
            s.body.toggleClass("js-menu--is-open");
        },
        closeMenu: function() {
            $(".js-menu--is-open").removeClass("js-menu--is-open");
        }
    };
    menuNav.init();
})(jQuery);

(function($) {
    var ScrollDetect = {
        init: function(trigger) {
            $("[data-scroll]").each(function() {
                var self = $(this);
                var osTrigger = trigger ? trigger : self;
                osTrigger.waypoint(function() {
                    self.addClass("animated");
                }, {
                    triggerOnce: true,
                    offset: "132%"
                });
            });
        }
    };
    ScrollDetect.init();
})(jQuery);

$(".js-network-map").waypoint(function() {
    var children = $(".network-map__layer");
    var idx = 2;
    function addClassToNextChild() {
        if (idx == children.length) return;
        children.eq(idx++).addClass("is-animated");
        window.setTimeout(addClassToNextChild, 800);
    }
    $(".network-map__stats").addClass("is-animated");
    setTimeout(function() {
        addClassToNextChild();
    }, 800);
}, {
    triggerOnce: true,
    offset: "110%"
});

(function($) {
    $.fn.scrollAnchor = function(options, callback) {
        var defualts = $.extend({
            offset: "0"
        }, options);
        return this.each(function() {
            $("[data-scrollto]").click(function(e) {
                e.preventDefault();
                var $this = $(this), offset = options.offset, target = "#" + $(this).data("scrollto"), $target = $(target);
                if (options.addActive) {
                    $("a[data-scrollto]").removeClass("active");
                }
                $("html, body").stop().animate({
                    scrollTop: $target.offset().top - offset
                }, {
                    duration: 600,
                    easing: "easeInExpo",
                    complete: options.complete
                });
                $.isFunction(options.setup);
            });
        });
    };
})(jQuery);

$("html").scrollAnchor({
    offset: "150"
});

(function($) {
    var loadThenScroll = {
        init: function() {
            if (window.location.hash) {
                setTimeout(function() {
                    $("html, body").scrollTop(0).show();
                    $("html, body").animate({
                        scrollTop: $(window.location.hash).offset().top - 60
                    }, 1200, "swing");
                }, 100);
            }
        }
    };
    loadThenScroll.init();
})(jQuery);

(function($) {
    var stickyNav = {
        init: function() {
            var $subNav = $(".js-sticky");
            var stickyStart = ($subNav.offset() || {
                top: -100
            }).top;
            $(document).on("scroll resize", $subNav, function() {
                var pos = $(document).scrollTop();
                if (pos >= stickyStart) {
                    $subNav.addClass("is-sticky");
                } else {
                    $subNav.removeClass("is-sticky");
                }
            });
        }
    };
    if ($(".js-sticky").length) {
        stickyNav.init();
    }
})(jQuery);

var PopItUp = function() {
    var s;
    var settings = {
        autoOpen: $("[data-popup-init]"),
        openLink: $("[data-popup]"),
        closeLink: $(".js-close-popup"),
        body: $(document.body),
        videoHolder: $(".popup__vid"),
        self: null
    };
    return {
        init: function() {
            s = settings;
            this.bindEvents();
        },
        bindEvents: function() {
            if (typeof s.autoOpen.data("popup-init") !== "undefined") {
                PopItUp.autoOpenPopUp();
            }
            s.openLink.on("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                s.self = this;
                PopItUp.openPopUp();
                if ($(this).data("vimeo-id")) {
                    PopItUp.playVideo();
                }
            });
            s.closeLink.on("click", function(e) {
                e.preventDefault();
                PopItUp.closePopUp();
                PopItUp.stopVideo();
            });
            s.body.on("keyup click", function(e) {
                if (s.body.hasClass("popup--is-open") && e.which === 27) {
                    PopItUp.closePopUp();
                    PopItUp.stopVideo();
                }
            });
        },
        autoOpenPopUp: function() {
            s.autoOpen.addClass("is-open");
            s.body.addClass("popup--auto-open");
        },
        openPopUp: function() {
            var popup = $(s.self).data("popup");
            s.autoOpen.removeClass("is-open");
            $("#" + popup).addClass("is-open").attr("aria-hidden", "false");
            s.body.addClass("popup--is-open");
        },
        closePopUp: function() {
            var popup = $(s.self).attr("data-popup");
            $("#" + popup).removeClass("is-open").attr("aria-hidden", "true");
            s.body.removeClass("popup--is-open popup--auto-open");
        },
        playVideo: function() {
            var vimeoID = $(s.self).data("vimeo-id"), vimeoURL = "https://player.vimeo.com/video/", vimeoPath = vimeoURL + vimeoID, vimeoColor = $(s.self).data("vimeo-color");
            $.getJSON("http://www.vimeo.com/api/oembed.json?url=" + encodeURIComponent(vimeoPath) + "&title=0&byline=0&color=" + vimeoColor + "&autoplay=1&callback=?", function(data) {
                s.videoHolder.html(data.html);
            });
        },
        stopVideo: function() {
            $(".popup__vid").empty();
        }
    };
}();

PopItUp.init();

(function($) {
    var $window = $(window);
    var windowHeight = $window.height();
    $window.resize(function() {
        windowHeight = $window.height();
    });
    $.fn.parallax = function(xpos, speedFactor, outerHeight) {
        var $this = $(this);
        var getHeight;
        var firstTop;
        $this.each(function() {
            firstTop = $this.offset().top;
        });
        if (outerHeight) {
            getHeight = function(jqo) {
                return jqo.outerHeight(true);
            };
        } else {
            getHeight = function(jqo) {
                return jqo.height();
            };
        }
        function translate3d(elm, value) {
            var translate3d = "translate3d(0px," + value + "px, 0";
            $this.css({
                "-ms-transform": translate3d,
                "-moz-transform": translate3d,
                "-webkit-transform": translate3d,
                transform: translate3d
            });
        }
        function updatePosition() {
            var plaxElement = $(this);
            var newPos = scrollY / 3;
            translate3d(plaxElement, newPos);
        }
        if (arguments.length < 1 || speedFactor === null) {
            speedFactor = .1;
        }
        function update() {
            var pos = $window.scrollTop();
            $this.each(function() {
                var $element = $(this);
                var top = $element.offset().top;
                var height = getHeight($element);
                if (top + height < pos || top > pos + windowHeight) {
                    return;
                }
                window.requestAnimationFrame(updatePosition);
            });
        }
        $window.bind("scroll", update).resize(update);
        update();
    };
})(jQuery);

var Spanizer = function() {
    var s;
    return {
        settings: {
            letters: $(".js-letters"),
            words: $(".js-words")
        },
        init: function() {
            s = this.settings;
            this.bindEvents();
        },
        bindEvents: function() {
            Spanizer.letters();
            Spanizer.words();
        },
        letters: function() {
            s.letters.html(function(i, el) {
                var spanizer = $.trim(el).split("");
                var spanizing = "<span>" + spanizer.join("</span><span>") + "</span>";
                return spanizing;
            });
        },
        words: function() {
            s.words.html(function(i, el) {
                var spanize = el.split(" ");
                var spanizeArr = [];
                var spanizing = "<span>" + spanize.join("</span> <span>") + "</span>";
                return spanizing;
            });
        }
    };
}();

if ($(".js-letters").length || $(".js-words").length) Spanizer.init();

if ($(".js-locations-map").length) {
    (function($) {
        var styles = [ {
            featureType: "water",
            elementType: "geometry.fill",
            stylers: [ {
                color: "#d3d3d3"
            } ]
        }, {
            featureType: "transit",
            stylers: [ {
                color: "#808080"
            }, {
                visibility: "off"
            } ]
        }, {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [ {
                visibility: "on"
            }, {
                color: "#b3b3b3"
            } ]
        }, {
            featureType: "road.highway",
            elementType: "geometry.fill",
            stylers: [ {
                color: "#ffffff"
            } ]
        }, {
            featureType: "road.local",
            elementType: "geometry.fill",
            stylers: [ {
                visibility: "on"
            }, {
                color: "#ffffff"
            }, {
                weight: 1.8
            } ]
        }, {
            featureType: "road.local",
            elementType: "geometry.stroke",
            stylers: [ {
                color: "#d7d7d7"
            } ]
        }, {
            featureType: "poi",
            elementType: "geometry.fill",
            stylers: [ {
                visibility: "on"
            }, {
                color: "#ebebeb"
            } ]
        }, {
            featureType: "administrative",
            elementType: "geometry",
            stylers: [ {
                color: "#a7a7a7"
            } ]
        }, {
            featureType: "road.arterial",
            elementType: "geometry.fill",
            stylers: [ {
                color: "#ffffff"
            } ]
        }, {
            featureType: "road.arterial",
            elementType: "geometry.fill",
            stylers: [ {
                color: "#ffffff"
            } ]
        }, {
            featureType: "landscape",
            elementType: "geometry.fill",
            stylers: [ {
                visibility: "on"
            }, {
                color: "#efefef"
            } ]
        }, {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [ {
                color: "#696969"
            } ]
        }, {
            featureType: "administrative",
            elementType: "labels.text.fill",
            stylers: [ {
                visibility: "on"
            }, {
                color: "#737373"
            } ]
        }, {
            featureType: "poi",
            elementType: "labels.icon",
            stylers: [ {
                visibility: "off"
            } ]
        }, {
            featureType: "poi",
            elementType: "labels",
            stylers: [ {
                visibility: "off"
            } ]
        }, {
            featureType: "road.arterial",
            elementType: "geometry.stroke",
            stylers: [ {
                color: "#d6d6d6"
            } ]
        }, {
            featureType: "road",
            elementType: "labels.icon",
            stylers: [ {
                visibility: "off"
            } ]
        }, {}, {
            featureType: "poi",
            elementType: "geometry.fill",
            stylers: [ {
                color: "#dadada"
            } ]
        } ];
        function render_map($locationsMap) {
            var $markers = $locationsMap.find(".marker");
            var args = {
                zoom: 16,
                center: new google.maps.LatLng(0, 0),
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                styles: styles,
                scrollwheel: false
            };
            var map = new google.maps.Map($locationsMap[0], args);
            map.markers = [];
            $markers.each(function() {
                add_marker($(this), map);
            });
            center_map(map);
            center_map_resize(map);
        }
        var infowindow = new google.maps.InfoWindow({
            content: ""
        });
        function add_marker($marker, map) {
            var latlng = new google.maps.LatLng($marker.attr("data-lat"), $marker.attr("data-lng"));
            var marker = new google.maps.Marker({
                position: latlng,
                map: map,
                icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABIRJREFUeNqsV0lMZGUQrl5otrBvYUkA2cMWYOAAGJEOnjh7MCbGiyflPpmYaMwYjwYzGuegJ28zp0nsCNixBQFliYEgIDTYgDSEtVm76Qb8vpc8fOnp9Q2VVLrfe//766uqr6r+Z7i9vZVQMjAwIAaDQfx+vxwdHcnFxYWcnZ2Zjo+PH2xvb1tPTk5ew7tmLA1kZGS48vPzfy4oKPgjMTExkJqaKllZWWKxWIT7Dw4OSjgxSwySkJAgHo+nZWFh4Quv12vNzs421dXVKQaurq7k4OBA1tbWPgEwB+4/BKDfCT4WMcdifH19/b2ZmZmnFRUVlo6ODsnNzRWz+f9XA4GAHB4eGqempt6cnp7+DVH7qL29/ZtXBkDjc3Nz78P4d1arVZqamuTm5kaur68Vz1WhtwTV398viJJpaGjo6+TkZGNra+sT7bq4ANDQ5ubmg7GxsW/7+voU4z6fT0JxhvcYBQJraGgQo9EoNpvtK/BgrqioaDQSAGO4ByTdxMTE48rKyoTGxkZB7iUcYbVAuI78qK2tNUxOTn5+enpq1gVgY2PjdZDrLeacnsUjjAbfA3G7wR+rrhSsrKy8kZOTo+Q2GMDu7i5zTXJKeXm51NfXC0rw7jnXo1IEpcl9unDrp7gjsLe3V8pNTCbTS6Gn8eXlZYWI/OV1sJCYdAB9o0hXChgdVkGoeqbnka5VYZ+AmPQC8IVjPcMe6VqVy8tL/vh1cQDls7q/v68QilHQAmHOVc9VDgSHnzzg++CBSxeA6upqu8PhuHK73ZaSkhJlJqhCwmlJFyzkDYmKKrrt6upy6EoBCDRbWFj4fHx8/M6rWITr2IjQQ+j9CwAd0wUgMzNTOjs7P4YnR2goKqGiCtdhHrCPnOH9h9xHFwB6AQ+cvb29bwOAl5ti1EbcjM8xO2R0dDTQ09PzDiL4F/fRPYyY96qqqhEQ6l273f6M3mAiSqgBw5LF7JCRkRHp7u7+AO34RbRBFDECZDGVvb2mpuY5htGnw8PDgt6ukCw47zSGKci1T7D2e16zcqLND2Okaagq6xmj9bOkpKRJTMeXANB7jGw2jrW2trZH5+fnCiBGUFs9cQGg51pFNK5bWloeLS0tyc7Ozt2BhDlmVGZnZ6W5ufkx7nvYwAhAVV0AuIlWcR7kYLJDf6S3KrkIZHFxkVH5G/3iB45xNi+t6gLAMAcrjYJcXzqdTg4Z5R5DPD8/Lzg3PEUqfGretaoLAPMerIxCenr6LzDsRJ0rNc+OhxR4S0tLn5EvJGSwvlIVaJXhRBT86A+21dVVJQIul0vS0tKm4b2LXNHmPhYOmCP1gHDVQR7gHPAh2c7ax7WNhqLlOy4A4XLHSMDjP2HsAt8BKTh2SXFx8a/qofTeANC7CAPHDfZvIvw1AOpJSUlZpPFohIuLA6HYrCqJBQL+u7W1xTLcgh4wNeHW33sESD6A2MfXkOA70M3aJwA9YtbzEr2i1yQqDJ/w4/XeAeTl5YV/Cd0PEdrhkQsT0l1WVqarAiICiHQAIQAQ7x/+x+9SqKN7rPKfAAMAeEr6Wg15E0MAAAAASUVORK5CYII="
            });
            map.markers.push(marker);
            if ($marker.html()) {
                locationsToggle = $(".js-locations-toggle").find("[data-lat='" + $marker.attr("data-lat") + "']");
                locationsLink = $("locations-toc__link");
                $(locationsToggle).click(function() {
                    infowindow.setContent($marker.html());
                    infowindow.open(map, marker);
                    $(".locations-toc__link.active").removeClass("active");
                    $(this).addClass("active");
                });
                google.maps.event.addListener(marker, "click", function() {
                    infowindow.setContent($marker.html());
                    infowindow.open(map, marker);
                });
                google.maps.event.addListener(map, "click", function(event) {
                    if (infowindow) {
                        infowindow.close();
                    }
                });
            }
        }
        function center_map(map) {
            var bounds = new google.maps.LatLngBounds();
            $.each(map.markers, function(i, marker) {
                var latlng = new google.maps.LatLng(marker.position.lat(), marker.position.lng());
                bounds.extend(latlng);
            });
            if (map.markers.length == 1) {
                map.setCenter(bounds.getCenter());
                map.setZoom(16);
            } else {
                map.fitBounds(bounds);
            }
        }
        function center_map_resize(map) {
            google.maps.event.addDomListener(window, "resize", function() {
                var center = map.getCenter();
                google.maps.event.trigger(map, "resize");
                map.setCenter(center);
            });
        }
        $(function() {
            $(".js-locations-map").each(function() {
                render_map($(this));
            });
            $(".js-hq-map").each(function() {
                render_map($(this));
            });
        });
    })(jQuery);
}

(function($) {
    $.everydayImInstagrammin = {
        defaults: {
            clientID: "null",
            accessToken: "null",
            numberPics: "12",
            captions: "false"
        }
    };
    $.fn.extend({
        everydayImInstagrammin: function(options) {
            $.extend($.everydayImInstagrammin.defaults, options);
            return this.each(function() {
                var el = $(this), clientID = options.clientID, accessToken = options.accessToken, numberPics = options.numberPics, instaUrl = "https://api.instagram.com/v1/users/" + clientID + "/media/recent/?access_token=" + accessToken + "&callback=?";
                $.ajax({
                    type: "GET",
                    dataType: "jsonp",
                    cache: false,
                    url: instaUrl
                }).done(function(data) {
                    for (var i = 0; i < options.numberPics; i++) {
                        if (typeof data.data[i] === "undefined") {
                            return false;
                        } else {
                            var caption = "";
                            if (data.data[i].caption !== null) {
                                var caption = data.data[i].caption.text;
                                el.append('<figure class="insta-item"><a class="insta-item__link" target="_blank" href="' + data.data[i].link + '"><img class="insta-item__img" src="' + data.data[i].images.standard_resolution.url + '" /><div class="insta-item__caption"><p>' + caption + "</p></div></a></figure>");
                            } else {
                                el.append('<figure class="insta-item"><a class="insta-item__link" target="_blank" href="' + data.data[i].link + '"><img class="insta-item__img" src="' + data.data[i].images.standard_resolution.url + '"  /></a></figure>');
                            }
                        }
                    }
                }).fail(function(jqXHR, textStatus) {
                    console.log("Nah Burv. Request failed: " + textStatus);
                });
            });
        }
    });
})(jQuery);

$(".js-insta").everydayImInstagrammin({
    clientID: "2254353059",
    accessToken: "2254353059.1677ed0.a0d4058536024f7c9f37f0e3227c1656",
    numberPics: "6",
    captions: "true"
});

!function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define([ "jquery" ], factory);
    } else if (typeof exports === "object") {
        factory(require("jquery"));
    } else {
        factory(root.jQuery);
    }
}(this, function($) {
    "use strict";
    var PLUGIN_NAME = "vide";
    var DEFAULTS = {
        volume: 1,
        playbackRate: 1,
        muted: true,
        loop: true,
        autoplay: true,
        position: "50% 50%",
        posterType: "detect",
        resizing: true,
        bgColor: "transparent",
        className: ""
    };
    var NOT_IMPLEMENTED_MSG = "Not implemented";
    function parseOptions(str) {
        var obj = {};
        var delimiterIndex;
        var option;
        var prop;
        var val;
        var arr;
        var len;
        var i;
        arr = str.replace(/\s*:\s*/g, ":").replace(/\s*,\s*/g, ",").split(",");
        for (i = 0, len = arr.length; i < len; i++) {
            option = arr[i];
            if (option.search(/^(http|https|ftp):\/\//) !== -1 || option.search(":") === -1) {
                break;
            }
            delimiterIndex = option.indexOf(":");
            prop = option.substring(0, delimiterIndex);
            val = option.substring(delimiterIndex + 1);
            if (!val) {
                val = undefined;
            }
            if (typeof val === "string") {
                val = val === "true" || (val === "false" ? false : val);
            }
            if (typeof val === "string") {
                val = !isNaN(val) ? +val : val;
            }
            obj[prop] = val;
        }
        if (prop == null && val == null) {
            return str;
        }
        return obj;
    }
    function parsePosition(str) {
        str = "" + str;
        var args = str.split(/\s+/);
        var x = "50%";
        var y = "50%";
        var len;
        var arg;
        var i;
        for (i = 0, len = args.length; i < len; i++) {
            arg = args[i];
            if (arg === "left") {
                x = "0%";
            } else if (arg === "right") {
                x = "100%";
            } else if (arg === "top") {
                y = "0%";
            } else if (arg === "bottom") {
                y = "100%";
            } else if (arg === "center") {
                if (i === 0) {
                    x = "50%";
                } else {
                    y = "50%";
                }
            } else {
                if (i === 0) {
                    x = arg;
                } else {
                    y = arg;
                }
            }
        }
        return {
            x: x,
            y: y
        };
    }
    function findPoster(path, callback) {
        var onLoad = function() {
            callback(this.src);
        };
        $;
        $('<img src="' + path + '.jpg">').load(onLoad);
    }
    function Vide(element, path, options) {
        this.$element = $(element);
        if (typeof path === "string") {
            path = parseOptions(path);
        }
        if (!options) {
            options = {};
        } else if (typeof options === "string") {
            options = parseOptions(options);
        }
        if (typeof path === "string") {
            path = path.replace(/\.\w*$/, "");
        } else if (typeof path === "object") {
            for (var i in path) {
                if (path.hasOwnProperty(i)) {
                    path[i] = path[i].replace(/\.\w*$/, "");
                }
            }
        }
        this.settings = $.extend({}, DEFAULTS, options);
        this.path = path;
        try {
            this.init();
        } catch (e) {
            if (e.message !== NOT_IMPLEMENTED_MSG) {
                throw e;
            }
        }
    }
    Vide.prototype.init = function() {
        var vide = this;
        var path = vide.path;
        var poster = path;
        var sources = "";
        var $element = vide.$element;
        var settings = vide.settings;
        var position = parsePosition(settings.position);
        var posterType = settings.posterType;
        var $video;
        var $wrapper;
        $wrapper = vide.$wrapper = $("<div>").addClass(settings.className).css({
            position: "absolute",
            "z-index": -1,
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            overflow: "hidden",
            "-webkit-background-size": "cover",
            "-moz-background-size": "cover",
            "-o-background-size": "cover",
            "background-size": "cover",
            "background-color": settings.bgColor,
            "background-repeat": "no-repeat",
            "background-position": position.x + " " + position.y
        });
        if (typeof path === "object") {
            if (path.poster) {
                poster = path.poster;
            } else {
                if (path.mp4) {
                    poster = path.mp4;
                } else if (path.webm) {
                    poster = path.webm;
                } else if (path.ogv) {
                    poster = path.ogv;
                }
            }
        }
        if (posterType === "detect") {
            findPoster(poster, function(url) {
                $wrapper.css("background-image", "url(" + url + ")");
            });
        } else if (posterType !== "none") {
            $wrapper.css("background-image", "url(" + poster + "." + posterType + ")");
        }
        if ($element.css("position") === "static") {
            $element.css("position", "relative");
        }
        $element.prepend($wrapper);
        if (typeof path === "object") {
            if (path.mp4) {
                sources += '<source src="' + path.mp4 + '.mp4" type="video/mp4">';
            }
            if (path.webm) {
                sources += '<source src="' + path.webm + '.webm" type="video/webm">';
            }
            if (path.ogv) {
                sources += '<source src="' + path.ogv + '.ogv" type="video/ogg">';
            }
            $video = vide.$video = $("<video>" + sources + "</video>");
        } else {
            $video = vide.$video = $("<video>" + '<source src="' + path + '.mp4" type="video/mp4">' + '<source src="' + path + '.webm" type="video/webm">' + '<source src="' + path + '.ogv" type="video/ogg">' + "</video>");
        }
        try {
            $video.prop({
                autoplay: settings.autoplay,
                loop: settings.loop,
                volume: settings.volume,
                muted: settings.muted,
                defaultMuted: settings.muted,
                playbackRate: settings.playbackRate,
                defaultPlaybackRate: settings.playbackRate
            });
        } catch (e) {
            throw new Error(NOT_IMPLEMENTED_MSG);
        }
        $video.css({
            margin: "auto",
            position: "absolute",
            "z-index": -1,
            top: position.y,
            left: position.x,
            "-webkit-transform": "translate(-" + position.x + ", -" + position.y + ")",
            "-ms-transform": "translate(-" + position.x + ", -" + position.y + ")",
            "-moz-transform": "translate(-" + position.x + ", -" + position.y + ")",
            transform: "translate(-" + position.x + ", -" + position.y + ")",
            visibility: "hidden",
            opacity: 0
        }).one("canplaythrough." + PLUGIN_NAME, function() {
            vide.resize();
        }).one("playing." + PLUGIN_NAME, function() {
            $video.css({
                visibility: "visible",
                opacity: 1
            });
            $wrapper.css("background-image", "none");
        });
        $element.on("resize." + PLUGIN_NAME, function() {
            if (settings.resizing) {
                vide.resize();
            }
        });
        $wrapper.append($video);
    };
    Vide.prototype.getVideoObject = function() {
        return this.$video[0];
    };
    Vide.prototype.resize = function() {
        if (!this.$video) {
            return;
        }
        var $wrapper = this.$wrapper;
        var $video = this.$video;
        var video = $video[0];
        var videoHeight = video.videoHeight;
        var videoWidth = video.videoWidth;
        var wrapperHeight = $wrapper.height();
        var wrapperWidth = $wrapper.width();
        if (wrapperWidth / videoWidth > wrapperHeight / videoHeight) {
            $video.css({
                width: wrapperWidth + 2,
                height: "auto"
            });
        } else {
            $video.css({
                width: "auto",
                height: wrapperHeight + 2
            });
        }
    };
    Vide.prototype.destroy = function() {
        delete $[PLUGIN_NAME].lookup[this.index];
        this.$video && this.$video.off(PLUGIN_NAME);
        this.$element.off(PLUGIN_NAME).removeData(PLUGIN_NAME);
        this.$wrapper.remove();
    };
    $[PLUGIN_NAME] = {
        lookup: []
    };
    $.fn[PLUGIN_NAME] = function(path, options) {
        var instance;
        this.each(function() {
            instance = $.data(this, PLUGIN_NAME);
            instance && instance.destroy();
            instance = new Vide(this, path, options);
            instance.index = $[PLUGIN_NAME].lookup.push(instance) - 1;
            $.data(this, PLUGIN_NAME, instance);
        });
        return this;
    };
    $(document).ready(function() {
        var $window = $(window);
        $window.on("resize." + PLUGIN_NAME, function() {
            for (var len = $[PLUGIN_NAME].lookup.length, i = 0, instance; i < len; i++) {
                instance = $[PLUGIN_NAME].lookup[i];
                if (instance && instance.settings.resizing) {
                    instance.resize();
                }
            }
        });
        $window.on("unload." + PLUGIN_NAME, function() {
            return false;
        });
        $(document).find("[data-" + PLUGIN_NAME + "-bg]").each(function(i, element) {
            var $element = $(element);
            var options = $element.data(PLUGIN_NAME + "-options");
            var path = $element.data(PLUGIN_NAME + "-bg");
            $element[PLUGIN_NAME](path, options);
        });
    });
});

var MCSignUp = function() {
    var $form = $("#mc-embedded-subscribe-form"), $formSubmit = $("#mc-embedded-subscribe"), $body = $("body"), $signupCheck = $("#signup_check"), $signupCheckLabel = $(".signup__check-label"), $signupNotice = $(".signup-notice"), successOverlayTime = 8150;
    var msg_success = "Thank you for subscribing to S&P Real Estate Corp. We will be in touch shortly.";
    return {
        init: function() {
            this.bind();
        },
        bind: function() {
            $formSubmit.on("click", function(e) {
                if (e) e.preventDefault();
                if ($signupCheck[0].checked === false) {
                    $signupCheckLabel.addClass("has-invalid");
                    return false;
                }
                MCSignUp.registerForm();
            });
        },
        closeNotice: function() {
            console.log("here");
            $(".js-close-notice").click(function(e) {
                e.preventDefault();
                console.log("clicked");
                if ($body.hasClass("signup--error")) {
                    console.log("click to remove ");
                    $body.removeClass("signup--error");
                }
            });
        },
        registerForm: function() {
            $.ajax({
                type: $form.attr("method"),
                url: $form.attr("action"),
                data: $form.serialize(),
                timeout: 5e3,
                cache: false,
                dataType: "jsonp",
                contentType: "application/json; charset=utf-8",
                error: function(err) {
                    $signupNotice.html('<span class="alert">Sorry, please try again.</span>');
                },
                success: function(data) {
                    var message;
                    if (data.result !== "success") {
                        message = data.msg.substring();
                        $body.addClass("signup--error");
                        $signupNotice.html('<span class="signup-notice__message">' + message + '</span><a class="close-x js-close-notice"></a>');
                        $(".signup-form__input").addClass("error");
                        MCSignUp.closeNotice();
                    } else {
                        message = msg_success;
                        $body.addClass("signup--success");
                        $signupNotice.html('<span class="signup-notice__message">' + message + "</span>");
                        $signupCheckLabel.removeClass("has-invalid");
                        setTimeout(function() {
                            $body.removeClass("signup--error signup--success");
                            PopItUp.closePopUp();
                        }, successOverlayTime);
                    }
                }
            });
        }
    };
}();

MCSignUp.init();

var site = {
    featureJS: function() {
        $("html").removeClass("no-js");
        if (!feature.svg) $("html").addClass("no-svg");
        if (!feature.cssFlexbox) $("html").addClass("no-flexbox");
    },
    plax: function() {
        $(".js-parallax").parallax(6, "false");
    },
    mastVids: function() {
        $(".bg_vid video").fadeIn(400);
    },
    sliders: function() {
        $(".js-slider-content").slick({
            infinite: true,
            autoplay: true,
            fade: true,
            autoplaySpeed: 5e3,
            speed: 1e3,
            arrows: true,
            dots: true,
            prevArrow: "<span class='slick-arrow slick-arrow--prev'><i class='icon-left-chev'></i></span>",
            nextArrow: "<span class='slick-arrow slick-arrow--next'><i class='icon-right-chev'></i></span>"
        });
        $(".js-slider-imgs").slick({
            infinite: true,
            autoplay: true,
            fade: false,
            autoplaySpeed: 3e3,
            arrows: true,
            dots: true,
            prevArrow: "<span class='slick-arrow slick-arrow--prev'><i class='icon-left-chev'></i></span>",
            nextArrow: "<span class='slick-arrow slick-arrow--next'><i class='icon-right-chev'></i></span>"
        });
    },
    lazy: function() {
        $(".js-lazy").unveil(10, function() {
            $(this).load(function() {
                $(this).parent().addClass("loaded");
            });
        });
    }
};

$(function() {
    site.featureJS();
    if ($(".js-parallax").length) site.plax();
    if ($(".bg_vid").length) site.mastVids();
    if ($('[class*="js-slider"]').length) site.sliders();
    if ($(".js-lazy").length) site.lazy();
});